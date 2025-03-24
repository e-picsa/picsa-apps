import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PicsaTranslateModule } from '@picsa/shared/modules';

export interface AccessCodeDialogData {
  formTitle: string;
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
    PicsaTranslateModule,
  ],
})
export class AccessCodeDialogComponent {
  accessCode = '';
  hidePassword = true;

  constructor(
    public dialogRef: MatDialogRef<AccessCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccessCodeDialogData
  ) {}

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
