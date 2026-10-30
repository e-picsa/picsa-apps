import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IStationMeta } from '@picsa/models';
import type { IDataTableOptions } from '@picsa/shared/features/data-table/data-table.component';
import { PicsaDataTableComponent } from '@picsa/shared/features/data-table/data-table.component';

export interface IAllStationsDialogData {
  data: unknown[];
  options: IDataTableOptions;
}

const STRINGS = {
  allStations: translateMarker('All Stations'),
  close: translateMarker('Close'),
};

@Component({
  selector: 'climate-all-stations-dialog',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    PicsaTranslateModule,
    PicsaDataTableComponent,
  ],
  template: `
    <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
      <div class="flex items-center gap-2 min-w-0">
        <h2 mat-dialog-title class="!m-0 !p-0 text-base font-bold text-gray-900 truncate">
          {{ strings.allStations | translate }}
        </h2>
      </div>
      <button
        matIconButton
        mat-dialog-close
        class="text-gray-500 shrink-0"
        [attr.aria-label]="strings.close | translate"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="!m-0 !p-2 sm:!p-4 overflow-y-auto max-h-[75vh]">
      <picsa-data-table [options]="data.options" [data]="data.data" (rowClick)="onRowClick($event)"></picsa-data-table>
    </mat-dialog-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllStationsDialogComponent {
  public readonly data: IAllStationsDialogData = inject(MAT_DIALOG_DATA);
  public readonly dialogRef: MatDialogRef<AllStationsDialogComponent, IStationMeta> = inject(MatDialogRef);
  public readonly strings = STRINGS;

  public onRowClick(station: unknown) {
    if (station) {
      this.dialogRef.close(station as IStationMeta);
    }
  }
}
