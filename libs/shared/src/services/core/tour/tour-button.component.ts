import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PicsaTranslateModule } from '../../../modules/translate';
import { TourService } from './tour.service';

/**
 * Help button which, when clicked triggers start of tour with id as provided.
 * NOTE - tourId must first be registered with tour service to be available
 */
@Component({
  selector: 'picsa-tour-button',
  template: ` <button mat-button class="tour-button" color="primary" (click)="startTour()">
    <mat-icon class="tour-icon mat-elevation-z4">question_mark</mat-icon>
    <span>{{ 'Demo' | translate }}</span>
  </button>`,
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PicsaTranslateModule],
  styles: [
    `
      :host {
        display: block;
      }
      .tour-button {
        min-height: 48px;
        padding: 4px;
      }
      .tour-icon {
        border: 1px solid var(--color-primary);
        border-radius: 50%;
        padding: 4px;
      }
    `,
  ],
})
export class PicsaTourButton {
  @Input() tourId: string;
  constructor(private service: TourService) {}

  public startTour() {
    if (!this.tourId) {
      throw new Error(`No tourId provided to component`);
    }
    this.service.startTourById(this.tourId);
  }
}
