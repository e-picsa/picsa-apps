import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PicsaTranslateModule } from '@picsa/shared/modules';

export interface AccessCodeDialogData {
  formTitle: string;
  accessCode: string;
}

export interface AccessCodeDialogResult {
  success: boolean;
  code?: string;
}

@Component({
  selector: 'monitoring-access-code-dialog',
  templateUrl: './access-code-dialog.component.html',
  styleUrls: ['./access-code-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    PicsaTranslateModule,
  ],
})
export class AccessCodeDialogComponent implements OnDestroy {
  accessCode = '';
  hidePassword = signal(true);
  showError = signal(false);

  private errorTimer: any;

  // Configurable properties
  private errorDuration = 3000; // this is 3 seconds

  constructor(
    public dialogRef: MatDialogRef<AccessCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccessCodeDialogData
  ) {}

  ngOnDestroy(): void {
    this.clearErrorTimer();
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  validateAndSubmit(): void {
    if (this.accessCode === this.data.accessCode) {
      // Success - return success result with the code
      this.clearErrorTimer();
      this.dialogRef.close({ success: true, code: this.accessCode });
    } else {
      this.showError.set(true);

      this.clearErrorTimer();

      // Set timer to hide error message after 3 seconds
      this.errorTimer = setTimeout(() => {
        this.showError.set(false);
      }, this.errorDuration);

      this.focusInput();
    }
  }

  cancel(): void {
    this.clearErrorTimer();
    this.dialogRef.close({ success: false });
  }

  private focusInput(): void {
    setTimeout(() => {
      const inputElement = document.querySelector('input[matInput]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
    }, 100);
  }

  private clearErrorTimer(): void {
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }
  }
}
