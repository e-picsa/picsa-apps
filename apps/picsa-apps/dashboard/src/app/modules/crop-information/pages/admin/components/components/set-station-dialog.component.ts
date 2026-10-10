import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { CropInformationService, ICropDataDownscaled } from '../../../../services';
import { CropLinkedStationSelectComponent } from '../../../probability/downscaled/components/linked-station-select/linked-station-select.component';

export interface ISetStationDialogData {
  locationId: string;
  downscaledRow: ICropDataDownscaled['Row'];
}

@Component({
  selector: 'dashboard-crop-set-station-dialog',
  imports: [MatButtonModule, MatDialogModule, CropLinkedStationSelectComponent],
  templateUrl: './set-station-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Dialog hosting the shared climate station picker to view or update the
 * station linked to a downscaled location record.
 */
export class CropSetStationDialogComponent {
  private service = inject(CropInformationService);
  private dialogRef = inject(MatDialogRef<CropSetStationDialogComponent>);
  public data = inject<ISetStationDialogData>(MAT_DIALOG_DATA);

  public async handleStationSelected(station_id: string | undefined) {
    // undefined is emitted by the picker's own Cancel action
    if (station_id === undefined) {
      this.dialogRef.close();
      return;
    }
    await this.service.setDownscaledStation(this.data.downscaledRow.id, station_id);
    this.dialogRef.close(true);
  }

  public close() {
    this.dialogRef.close();
  }
}
