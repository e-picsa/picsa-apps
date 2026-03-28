import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CommunicationService } from '../../services/promptToHomePageService.service';
import { GooglePlayBadgeComponent } from './google-play-badge.component';

/**
 * Show a banner to encourage users to install the native app from Play Store.
 * Note: We only show this on mobile web because if the app was installed,
 * App Links would have automatically opened the native app instead.
 */
@Component({
  selector: 'picsa-app-open-prompt',
  imports: [MatIconModule, MatBottomSheetModule, MatButtonModule, GooglePlayBadgeComponent],
  template: `
    <h2>Get the PICSA App</h2>
    <p class="subtitle">For the best experience, download from the Play Store</p>

    <a href="https://play.google.com/store/apps/details?id=io.picsa.extension" target="_blank" rel="noopener">
      <google-play-badge class="play-badge"></google-play-badge>
    </a>

    <button matButton class="continue-button" (click)="dismiss()">
      <mat-icon class="open-icon">language</mat-icon>
      Continue in Browser
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 1rem;
        text-align: center;
      }
      h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 500;
      }
      .play-badge {
        height: 56px;
      }
      .subtitle {
        margin: 0 0 1.5rem 0;
        color: #666;
        font-size: 0.875rem;
      }
      .continue-button {
        margin-top: 1rem;
        margin-bottom: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppOpenPromptComponent {
  private bottomSheet = inject(MatBottomSheet);
  private communicationService = inject(CommunicationService);

  triggerTour() {
    this.communicationService.triggerUserEvent();
  }

  dismiss() {
    this.bottomSheet.dismiss();
    this.triggerTour();
  }
}
