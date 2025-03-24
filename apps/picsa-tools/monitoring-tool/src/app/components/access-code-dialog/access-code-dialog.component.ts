import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PicsaTranslateModule } from '@picsa/shared/modules';

export interface AccessCodeDialogData {
  formTitle: string;
}

@Component({
  selector: 'monitoring-access-code-dialog',
  template: `
    <h2 mat-dialog-title>{{ 'Restricted Form' | translate }}</h2>
    <div mat-dialog-content>
      <p>
        {{ 'This form requires an access code to unlock' | translate }}: <strong>{{ data.formTitle }}</strong>
      </p>
      <mat-form-field style="width: 100%">
        <mat-label>{{ 'Access Code' | translate }}</mat-label>
        <input matInput [(ngModel)]="accessCode" />
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'Cancel' | translate }}</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="accessCode">
        {{ 'Unlock' | translate }}
      </button>
    </div>
  `,
  styles: [],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    PicsaTranslateModule,
  ],
})
export class AccessCodeDialogComponent {
  accessCode = '';

  constructor(
    public dialogRef: MatDialogRef<AccessCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccessCodeDialogData
  ) {}
}
