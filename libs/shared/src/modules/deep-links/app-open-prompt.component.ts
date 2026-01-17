import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { CommunicationService } from '../../services/promptToHomePageService.service';
import { DeepLinksService } from './deep-links.service';

/**
 * Show a link to open the app in native platform version, using dynamic app link
 */
@Component({
  selector: 'picsa-app-open-prompt',
  template: `
    <div>
      <h2>Open With...</h2>
      <a [href]="appDynamicLink" target="_blank" rel="noopener">
        <div class="open-option">
          <div class="picsa-app-icon">PICSA</div>
          <h3>PICSA App</h3>
          <button mat-raised-button color="primary" (click)="triggerTour()">Open</button>
        </div>
      </a>
      <div class="open-option" (click)="dismiss()">
        <mat-icon class="open-icon">language</mat-icon>
        <h3>Browser</h3>
        <button mat-stroked-button>Continue</button>
      </div>
      <div class="spacer"></div>
    </div>
  `,
  styles: [
    `
      .picsa-app-icon {
        background: #8a2644;
        border-radius: 10px;
        color: white;
        padding: 4px;
        line-height: 48px;
        height: 48px;
        width: 48px;
        text-align: center;
        font-size: 16px;
      }
      .open-option {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
      }
      h3 {
        flex: 1;
        text-align: left;
        margin-left: 1rem;
      }
      a {
        text-decoration: none;
        color: unset;
      }
      button {
        width: 90px;
      }
      .open-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        padding: 4px;
      }
      .spacer {
        height: 1rem;
      }
    `,
  ],
  standalone: false,
})
export class AppOpenPromptComponent {
  appDynamicLink: string;
  constructor(
    deepLinksService: DeepLinksService,
    private bottomSheet: MatBottomSheet,
    private communicationService: CommunicationService,
  ) {
    this.appDynamicLink = deepLinksService.config.appDynamicLink;
  }

  triggerTour() {
    this.communicationService.triggerUserEvent();
  }

  dismiss() {
    this.bottomSheet.dismiss();
    // trigger homepage tour
    this.triggerTour();
  }
}
