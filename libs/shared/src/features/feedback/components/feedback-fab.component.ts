import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';
import { SafeAreaService } from '@picsa/shared/services/native/safe-area';

import { FeedbackDialogComponent } from './feedback-dialog.component';

@Component({
  selector: 'picsa-feedback-fab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './feedback-fab.component.html',
  styleUrl: './feedback-fab.component.scss',
})
export class FeedbackFabComponent {
  private readonly dialog = inject(MatDialog);
  private readonly safeAreaService = inject(SafeAreaService);

  public bottomInset = signal(16);

  constructor() {
    this.safeAreaService.getInsets().then((insets) => {
      this.bottomInset.set(Math.max(16, insets.bottom + 16));
    });
  }

  openFeedback() {
    this.dialog.open(FeedbackDialogComponent, {
      data: { screenPath: location.pathname },
      panelClass: 'feedback-dialog-panel',
      maxWidth: '420px',
      width: 'min(100vw - 24px, 420px)',
      maxHeight: 'calc(100dvh - 24px)',
    });
  }
}
