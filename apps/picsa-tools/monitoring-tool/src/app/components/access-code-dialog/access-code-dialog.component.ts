import { Component, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { IMonitoringForm } from '../../schema';
import { MonitoringMaterialModule } from '../material.module';

export interface AccessCodeDialogResult {
  success: boolean;
  code?: string;
}

@Component({
  selector: 'monitoring-access-code-dialog',
  templateUrl: './access-code-dialog.component.html',
  styleUrls: ['./access-code-dialog.component.scss'],
  imports: [MonitoringMaterialModule, PicsaTranslateModule],
})
export class AccessCodeDialogComponent {
  accessCode = signal('');
  hidePassword = signal(true);
  showError = signal(false);

  constructor(
    public dialogRef: MatDialogRef<AccessCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public form: IMonitoringForm,
  ) {}
  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  onAccessCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.accessCode.set(target.value.toLowerCase());

    // Clear error when user starts typing
    if (this.showError()) {
      this.showError.set(false);
    }
  }
  validateAndSubmit(): void {
    if (this.accessCode().toLowerCase() === this.form.access_code?.toLowerCase()) {
      // Success - return success result with the code
      this.dialogRef.close({ success: true, code: this.accessCode() });
    } else {
      this.showError.set(true);
    }
  }

  cancel(): void {
    this.dialogRef.close({ success: false });
  }
}
