import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { NavigationStackService } from '../services/navStack.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'back-button',
  template: `
    @if (variant === 'primary') {
      <button mat-button color="primary" (click)="navStackService.back()">
        <mat-icon>arrow_back</mat-icon>{{ 'Back' | translate }}
      </button>
    }
    @if (variant === 'white') {
      <button mat-button style="color:white" (click)="navStackService.back()">
        <mat-icon>arrow_back</mat-icon>{{ 'Back' | translate }}
      </button>
    }
  `,
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class BackButton {
  @Input() variant: 'white' | 'primary' = 'white';

  public navStackService = inject(NavigationStackService);
}
