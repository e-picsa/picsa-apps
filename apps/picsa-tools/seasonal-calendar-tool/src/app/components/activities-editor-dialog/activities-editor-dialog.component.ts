import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

interface ICropActivity {
  name: string;
  label: string;
}

@Component({
  selector: 'seasonal-calendar-editor-dialog',
  templateUrl: './activities-editor-dialog.component.html',
  styleUrls: ['./activities-editor-dialog.component.scss'],
})
export class ActivitiesEditorDialogComponent {
  activities: ICropActivity[] = [
    { name: 'preparation', label: translateMarker('Preparation') },
    { name: 'weeding', label: translateMarker('Weeding') },
    { name: 'harvesting', label: translateMarker('Harvesting') },
    { name: 'drying', label: translateMarker('Drying') },
    { name: 'other', label: translateMarker('Other') },
  ];
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
