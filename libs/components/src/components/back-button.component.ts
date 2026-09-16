import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';

import { NavigationStackService } from '../services/navStack.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'picsa-back-button',
  template: `
    @switch (variant) {
      @case ('white') {
        <button matButton style="color:white" (click)="navStackService.back()">
          <mat-icon>arrow_back</mat-icon><span class="back-label">{{ 'Back' | translate }}</span>
        </button>
      }
      @default {
        <button matButton color="primary" (click)="navStackService.back()">
          <mat-icon>arrow_back</mat-icon><span class="back-label">{{ 'Back' | translate }}</span>
        </button>
      }
    }
  `,
  styles: `
    // Hide text label on narrow screens to preserve room for central header content
    .back-label {
      display: none;
    }
    @media (min-width: 600px) {
      .back-label {
        display: inline;
      }
    }
    // When icon-only the button keeps mat-button min-width (64px), unbalancing
    // the header start slot against the 40px icon-button end slot and shifting
    // centered content off-center. Collapse to icon-button sizing instead.
    @media (max-width: 600px) {
      button {
        min-width: 40px;
        padding-left: 8px;
        padding-right: 8px;
      }
    }
  `,
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
})
export class PicsaBackButtonComponent {
  @Input() variant: 'white' | 'primary' = 'white';

  public navStackService = inject(NavigationStackService);
}
