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

  /** Show a user notification with an error icon (dismiss after 2s) */
  public showErrorNotification(message: string, config: MatSnackBarConfig = { duration: 3000 }) {
    console.error(message);
    return this.showUserNotification({ message, matIcon: 'error' }, config);
  }

  /** Show a user notification with a success icon (dismiss after 2s) */
  public showSuccessNotification(message: string, config: MatSnackBarConfig = { duration: 2000 }) {
    return this.showUserNotification({ message, matIcon: 'success' }, config);
  }

  /** Present a dismissable notification snack bar */
  public showUserNotification(data: IUserNotificationData, config: MatSnackBarConfig = {}) {
    const snackBarRef = this.snackBar.openFromComponent(SnackBarWithIconComponent, { data, ...config });
    return snackBarRef;
  }
}

@Component({
  selector: 'picsa-snack-bar-with-icon-component',
  template: ` <div class="message-container">
    <mat-icon>{{ data.matIcon }}</mat-icon>
    <span style="margin:0 16px; flex:1; overflow-wrap: anywhere;">{{ data.message }}</span>
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
  imports: [MatIconModule, MatButtonModule],
})
export class SnackBarWithIconComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: IUserNotificationData,
    public snackRef: MatSnackBarRef<SnackBarWithIconComponent>
  ) {}
}
