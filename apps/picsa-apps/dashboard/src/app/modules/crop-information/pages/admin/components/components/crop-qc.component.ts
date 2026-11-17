import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';

import { DashboardMaterialModule } from '../../../../../../material.module';
import type { IAnnualRainfallSummariesData, ICropSuccessEntry } from '../../../../../climate/types';
import { CropInformationService } from '../../../../services';
import {
  buildCropVarietyQcRows,
  CropVarietyQcStatus,
  extractStationLookupBounds,
  extractStationSeasonBounds,
  ICropVarietyQcAggregateRow,
} from '../../../../utils/crop-qc.utils';
import { CropDuplicateCropsComponent } from './duplicate-crops.component';
import { buildCropVarietyPairs, groupDuplicateVarieties } from './duplicate-crops.utils';

@Component({
  selector: 'dashboard-crop-qc',
  imports: [CropDuplicateCropsComponent, DashboardMaterialModule, PicsaDataTableComponent],
  templateUrl: './crop-qc.component.html',
  styleUrl: './crop-qc.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Per-variety quality control summary showing varieties with exclusions or
 * warnings, integrated duplicate inspection, and row-click threshold modals.
 */
export class CropQcComponent {
  private service = inject(CropInformationService);
  private dialog = inject(MatDialog);

  private daysTemplate =
    viewChild<TemplateRef<{ $implicit: unknown; row: ICropVarietyQcAggregateRow }>>('daysTemplate');
  private waterTemplate =
    viewChild<TemplateRef<{ $implicit: unknown; row: ICropVarietyQcAggregateRow }>>('waterTemplate');
  private statusTemplate =
    viewChild<TemplateRef<{ $implicit: unknown; row: ICropVarietyQcAggregateRow }>>('statusTemplate');
  private varietyDialogTemplate = viewChild.required<TemplateRef<unknown>>('varietyDialogTemplate');

  public valueTemplates = computed(() => {
    const days = this.daysTemplate();
    const water = this.waterTemplate();
    const status = this.statusTemplate();
    const map: Record<string, TemplateRef<{ $implicit: unknown; row: ICropVarietyQcAggregateRow }>> = {};
    if (days) map['days_lower'] = days;
    if (water) map['water_min'] = water;
    if (status) map['status_rank'] = status;
    return map;
  });

  public tableFilter = signal<'all' | 'issues' | 'duplicates'>('all');
  public selectedRow = signal<ICropVarietyQcAggregateRow | null>(null);

  public allRows = computed<ICropVarietyQcAggregateRow[]>(() => {
    const stationBoundsById: Record<
      string,
      {
        lookupBounds: ReturnType<typeof extractStationLookupBounds>;
        seasonBounds: ReturnType<typeof extractStationSeasonBounds>;
      }
    > = {};
    for (const s of this.service.stationData()) {
      stationBoundsById[s.station_id] = {
        lookupBounds: extractStationLookupBounds(s.crop_probability_data as ICropSuccessEntry[]),
        seasonBounds: extractStationSeasonBounds(s.annual_rainfall_data as IAnnualRainfallSummariesData[]),
      };
    }

    return buildCropVarietyQcRows({
      cropData: this.service.cropData(),
      downscaledData: this.service.downscaledData(),
      stationBoundsById,
    });
  });

  public duplicateCount = computed(() => {
    const pairs = buildCropVarietyPairs(this.service.cropData(), this.service.downscaledData());
    return groupDuplicateVarieties(pairs).length;
  });

  private hasIssues(row: ICropVarietyQcAggregateRow): boolean {
    return row.locations_excluded > 0 || row.warnings_count > 0 || row.status === 'Missing Definition';
  }

  public stats = computed(() => {
    const rows = this.allRows();
    return {
      total: rows.length,
      issues: rows.filter((r) => this.hasIssues(r)).length,
    };
  });

  public displayedRows = computed(() => {
    const rows = this.allRows();
    if (this.tableFilter() === 'issues') {
      return rows.filter((r) => this.hasIssues(r));
    }
    return rows;
  });

  public openVarietyDialog(row: ICropVarietyQcAggregateRow) {
    this.selectedRow.set(row);
    this.dialog.open(this.varietyDialogTemplate(), {
      width: '800px',
      maxWidth: '95vw',
    });
  }

  public statusChipClass(status: CropVarietyQcStatus): string {
    const map: Record<CropVarietyQcStatus, string> = {
      OK: '',
      'All Excluded': 'qc-chip-red',
      'Partial Exclusion': 'qc-chip-orange',
      'Missing Definition': 'qc-chip-purple',
      'Season / >360d Warning': 'qc-chip-amber',
      Unused: 'qc-chip-neutral',
    };
    return map[status] ?? 'qc-chip-neutral';
  }

  public tableOptions: IDataTableOptions = {
    displayColumns: [
      'crop',
      'variety',
      'days_lower',
      'water_min',
      'locations_excluded',
      'warnings_count',
      'status_rank',
    ],
    paginatorSizes: [50, 100],
    search: true,
    sort: { id: 'crop', start: 'asc' },
    formatHeader: (v) => {
      const headerMap: Record<string, string> = {
        crop: 'Crop',
        variety: 'Variety',
        days_lower: 'Days',
        water_min: 'Water Req',
        locations_excluded: 'Excluded',
        warnings_count: 'Warnings',
        status_rank: 'QC Status',
      };
      return headerMap[v] || formatHeaderDefault(v);
    },
    exportFilename: 'crop-varieties-qc.csv',
  };
}
