import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FeedbackService } from '../../../services/core/feedback/feedback.service';
import { ScreenshotService } from '../../../services/core/feedback/screenshot.service';

interface IFeedbackDialogData {
  screenPath: string;
}

type FeedbackType = 'feedback' | 'bug_report';

interface IScreenshotPreview {
  base64: string;
  type: string;
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
    PicsaTranslateModule,
  ],
  templateUrl: './feedback-dialog.component.html',
  styleUrl: './feedback-dialog.component.scss',
})
export class FeedbackDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<FeedbackDialogComponent>>(MatDialogRef);
  private readonly screenshotService = inject(ScreenshotService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly data = inject<IFeedbackDialogData>(MAT_DIALOG_DATA);

  public fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  public type = signal<FeedbackType>('feedback');
  public comment = signal('');
  public screenshot = signal<IScreenshotPreview | null>(null);
  public submitting = signal(false);
  public submitted = signal(false);
  public queued = signal(false);
  public error = signal('');
  public capturing = signal(false);
  public attaching = signal(false);

  public screenPath = this.data.screenPath;
  public commentValid = computed(() => this.comment().trim().length > 0 && this.comment().length <= 2000);
  public canSubmit = computed(
    () => this.commentValid() && !this.submitting() && !this.submitted() && !this.capturing() && !this.attaching(),
  );

  setType(value: FeedbackType) {
    this.type.set(value);
  }

  async captureScreenshot() {
    this.capturing.set(true);
    this.error.set('');
    try {
      const shot = await this.screenshotService.capture();
      if (shot) {
        const downscaled = await this.screenshotService.downscaleBase64(shot.base64, shot.type);
        this.screenshot.set(downscaled);
      }
    } catch (err) {
      console.error('[Feedback] screenshot capture failed', err);
      this.error.set("We couldn't take a screenshot. You can attach an image instead.");
    } finally {
      this.capturing.set(false);
    }
  }

  async attachFromGallery() {
    this.attaching.set(true);
    this.error.set('');
    try {
      const inputEl = this.fileInput()?.nativeElement;
      const result = await this.screenshotService.attachFromGallery(inputEl);
      if (result.status === 'ok') {
        const downscaled = await this.screenshotService.downscaleBase64(
          result.screenshot.base64,
          result.screenshot.type,
        );
        this.screenshot.set(downscaled);
      } else if (result.status === 'error') {
        this.error.set(result.message);
      } else {
        // cancelled (dismiss / timeout / no file)
        this.error.set('No image was selected. You can continue without one.');
      }
    } catch (err) {
      console.error('[Feedback] attach from gallery failed', err);
      this.error.set("We couldn't attach that image. Please try again.");
    } finally {
      this.attaching.set(false);
    }
  }

  removeScreenshot() {
    this.screenshot.set(null);
  }

  async submit() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const result = await this.feedbackService.submit({
        type: this.type(),
        comment: this.comment(),
        screen_path: this.screenPath,
        screenshot_base64: this.screenshot()?.base64,
        screenshot_type: this.screenshot()?.type,
      });
      if (result === 'submitted') {
        this.submitted.set(true);
        this.submitting.set(false);
        setTimeout(() => this.dialogRef.close(true), 1200);
      } else if (result === 'pending') {
        this.queued.set(true);
        this.submitting.set(false);
      } else {
        this.error.set("We couldn't send your feedback right now. It will be retried automatically.");
        this.submitting.set(false);
      }
    } catch (err: any) {
      console.error('[Feedback] submit error', err);
      // Surface real server messages; keep generic text for network/offline failures
      if (err?.__picsaServerError && err.message) {
        this.error.set(err.message);
      } else {
        this.error.set("We couldn't send your feedback right now. It will be retried automatically.");
      }
      this.submitting.set(false);
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
