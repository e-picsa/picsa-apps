import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA,MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'seasonal-calendar-editor-dialog',
  templateUrl: './activities-editor-dialog.component.html',
  styleUrls: ['./activities-editor-dialog.component.scss'],
})
export class ActivitiesEditorDialogComponent {
  activities: string[] = ['Preparation', 'Weeding', 'Havesting', 'Drying', 'Other']; 
  selectedActivity = '';
  customActivity = '';


  constructor(
    public dialogRef: MatDialogRef<ActivitiesEditorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onSave(): void {
    let result: string | null = this.selectedActivity;
    if (this.selectedActivity === 'Other') {
      const trimmedCustomActivity = this.customActivity.trim();
      if (trimmedCustomActivity !== '') {
        result = trimmedCustomActivity;
      } else {
        result = null;  
      }
    }
    this.dialogRef.close(result);
  }
  onClose(): void {
    this.dialogRef.close();
  }


}
