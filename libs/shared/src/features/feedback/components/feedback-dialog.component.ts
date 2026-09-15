import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FeedbackService } from '../../../services/core/feedback/feedback.service';
import { ICapturedScreenshot, ScreenshotService } from '../../../services/core/feedback/screenshot.service';
import { FeedbackPreferenceService } from '../services/feedback-preference.service';

interface IFeedbackDialogData {
  screenPath: string;
}

type FeedbackType = 'feedback' | 'bug_report';

export type FeedbackDialogStatus =
  | 'idle'
  | 'capturing'
  | 'attaching'
  | 'submitting'
  | 'submitted'
  | 'queued'
  | 'retrying'
  | 'error';

export interface IFeedbackDialogState {
  status: FeedbackDialogStatus;
  errorMessage?: string;
}

@Component({
  selector: 'picsa-feedback-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    PicsaTranslateModule,
  ],
  templateUrl: './feedback-dialog.component.html',
  styleUrl: './feedback-dialog.component.scss',
})
export class FeedbackDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<FeedbackDialogComponent>>(MatDialogRef);
  private readonly screenshotService = inject(ScreenshotService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly preferenceService = inject(FeedbackPreferenceService);
  private readonly data = inject<IFeedbackDialogData>(MAT_DIALOG_DATA);

  public fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  public type = signal<FeedbackType>('feedback');
  public comment = signal('');
  public screenshot = signal<ICapturedScreenshot | null>(null);

  // Single state machine replacing 8 boolean flags
  public readonly state = signal<IFeedbackDialogState>({ status: 'idle' });

  // Floating FAB preference toggle
  public showFabSetting = signal(this.preferenceService.showFloatingFab());

  public screenPath = this.data.screenPath;
  public commentValid = computed(() => this.comment().trim().length > 0 && this.comment().length <= 2000);

  // Backward-compatible computed accessors for templates and specs
  public submitting = computed(() => this.state().status === 'submitting');
  public submitted = computed(() => this.state().status === 'submitted');
  public queued = computed(() => this.state().status === 'queued');
  public retrying = computed(() => this.state().status === 'retrying');
  public capturing = computed(() => this.state().status === 'capturing');
  public attaching = computed(() => this.state().status === 'attaching');
  public error = computed(() => (this.state().status === 'error' ? (this.state().errorMessage ?? '') : ''));

  public canSubmit = computed(() => this.commentValid() && ['idle', 'error'].includes(this.state().status));

  setType(value: FeedbackType) {
    this.type.set(value);
  }

  toggleShowFab(show: boolean) {
    this.showFabSetting.set(show);
    this.preferenceService.setShowFloatingFab(show);
  }

  async captureScreenshot() {
    this.state.set({ status: 'capturing' });
    try {
      await this.showCaptureFeedback();
      const shot = await this.screenshotService.capture();
      if (shot) {
        const downscaled = await this.screenshotService.downscaleBase64(shot.base64, shot.type);
        this.screenshot.set(downscaled);
      }
      this.state.set({ status: 'idle' });
    } catch (err: any) {
      console.error('[Feedback] screenshot capture failed', err);
      const msg =
        err?.message === 'WEB_SCREENSHOT_SECURITY_ERROR'
          ? 'Web screen capture is not supported in this browser. Please attach an image instead.'
          : 'Screen capture failed. Please try again, or attach an image instead.';
      this.state.set({ status: 'error', errorMessage: msg });
    }
  }

  /** Let the capturing state paint and remain visible briefly before the dialog is hidden for capture. */
  private async showCaptureFeedback(): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    await new Promise<void>((resolve) => setTimeout(resolve, 250));
  }

  async attachFromGallery() {
    this.state.set({ status: 'attaching' });
    try {
      const inputEl = this.fileInput()?.nativeElement;
      const result = await this.screenshotService.attachFromGallery(inputEl);
      if (result.status === 'ok') {
        const downscaled = await this.screenshotService.downscaleBase64(
          result.screenshot.base64,
          result.screenshot.type,
        );
        this.screenshot.set(downscaled);
        this.state.set({ status: 'idle' });
      } else if (result.status === 'error') {
        this.state.set({ status: 'error', errorMessage: result.message });
      } else {
        // cancelled (dismiss / timeout / no file)
        this.state.set({ status: 'error', errorMessage: 'No image was selected.' });
      }
    } catch (err) {
      console.error('[Feedback] attach from gallery failed', err);
      this.state.set({
        status: 'error',
        errorMessage: "That image couldn't be attached. Please try another one.",
      });
    }
  }

  removeScreenshot() {
    this.screenshot.set(null);
  }

  async submit() {
    if (!this.canSubmit()) return;
    this.state.set({ status: 'submitting' });
    try {
      const result = await this.feedbackService.submit({
        type: this.type(),
        comment: this.comment(),
        screen_path: this.screenPath,
        screenshot_base64: this.screenshot()?.base64,
        screenshot_type: this.screenshot()?.type,
      });
      if (result === 'submitted') {
        this.state.set({ status: 'submitted' });
        this.closeAfter(1500);
      } else if (result === 'pending') {
        this.state.set({ status: 'queued' });
      } else {
        this.state.set({ status: 'retrying' });
      }
    } catch (err: any) {
      console.error('[Feedback] submit error', err);
      // Surface real server messages; keep generic text for network/offline failures
      const msg = err?.__picsaServerError && err.message ? err.message : 'Something went wrong. Please try again.';
      this.state.set({ status: 'error', errorMessage: msg });
    }
  }

  /** Close the dialog after a short delay so the outcome message stays readable. */
  private closeAfter(delayMs: number) {
    setTimeout(() => this.dialogRef.close(true), delayMs);
  }

  close() {
    this.dialogRef.close(false);
  }
}
