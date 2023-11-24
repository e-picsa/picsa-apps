import { Component, Inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';

interface IUserNotificationData {
  matIcon: string;
  message: string;
  buttonText?: string;
}

@Injectable({ providedIn: 'root' })
export class PicsaNotificationService {
  constructor(private snackBar: MatSnackBar) {}

  /** Present a dismissable notification snack bar */
  showUserNotification(data: IUserNotificationData, config: MatSnackBarConfig = {}) {
    const snackBarRef = this.snackBar.openFromComponent(SnackBarWithIconComponent, { data, ...config });
    return snackBarRef;
  }
}

@Component({
  selector: 'picsa-snack-bar-with-icon-component',
  template: ` <div class="message-container">
    <mat-icon>{{ data.matIcon }}</mat-icon>
    <span style="margin:0 16px; flex:1">{{ data.message }}</span>
    <button mat-stroked-button color="accent" (click)="snackRef.dismiss()">{{ data.buttonText || 'dismiss' }}</button>
  </div>`,
  styles: [
    `
      .message-container {
        display: flex;
        align-items: center;
      }
    `,
  ],
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
})
export class SnackBarWithIconComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: IUserNotificationData,
    public snackRef: MatSnackBarRef<SnackBarWithIconComponent>
  ) {}
}
