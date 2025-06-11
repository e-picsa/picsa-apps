import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

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
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    PicsaTranslateModule,
  ],
})
export class AccessCodeDialogComponent {
  accessCode = signal('');
  hidePassword = signal(true);
  showError = signal(false);

  constructor(
    public dialogRef: MatDialogRef<AccessCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccessCodeDialogData,
  ) {}
  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  onAccessCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.accessCode.set(target.value);

    // Clear error when user starts typing
    if (this.showError()) {
      this.showError.set(false);
    }
  }
  validateAndSubmit(): void {
    if (this.accessCode() === this.data.accessCode) {
      // Success - return success result with the code
      this.dialogRef.close({ success: true, code: this.accessCode() });
    } else {
      this.showError.set(true);
      this.focusInput();
    }
  }

  cancel(): void {
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
}
