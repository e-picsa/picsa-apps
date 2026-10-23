import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaDrawingComponent } from '@picsa/shared/features/drawing';

import { ICalendarCard } from '../../schema/cards';
import { SeasonalCalendarMaterialModule } from '../material.module';

export interface ICardNewDialogData {
  type: ICalendarCard['type'];
}

/** Dialog to draw an icon and label for a new custom crop or activity card */
@Component({
  selector: 'seasonal-calendar-card-new-dialog',
  templateUrl: './card-new-dialog.component.html',
  styleUrls: ['./card-new-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SeasonalCalendarMaterialModule,
    MatFormFieldModule,
    FormsModule,
    PicsaDrawingComponent,
    PicsaTranslateModule,
  ],
})
export class SeasonalCalendarCardNewDialogComponent {
  private dialogRef = inject<MatDialogRef<SeasonalCalendarCardNewDialogComponent>>(MatDialogRef);
  private data = inject<ICardNewDialogData>(MAT_DIALOG_DATA);

  public label = '';
  private imgData = '';

  public setDrawing(svgData: string) {
    if (svgData) {
      this.imgData = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }
  }

  public get canSave() {
    return !!this.label && !!this.imgData;
  }

  public save() {
    const card: ICalendarCard = {
      id: `custom_${this.label.trim().replace(/\s+/g, '-').toLowerCase()}`,
      label: this.label,
      type: this.data.type,
      imgType: 'svg',
      customMeta: {
        imgData: this.imgData,
        dateCreated: new Date().toISOString(),
        createdBy: '',
      },
    };
    this.dialogRef.close(card);
  }
}
