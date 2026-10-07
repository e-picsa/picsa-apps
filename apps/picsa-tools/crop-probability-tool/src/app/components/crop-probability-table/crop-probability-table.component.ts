import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { CROPS_DATA_HASHMAP, ICropData, ICropName } from '@picsa/data';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PrintProvider } from '@picsa/shared/services/native/print';
import { _wait } from '@picsa/utils';

import { IProbabilityTableMeta, IStationCropData, IStationCropDataItem } from '../../models';
import { groupAndSortCropDataItems } from '../../utils/probability-table.utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STRINGS = {
  Share: translateMarker('Share'),
  PreparingImage: translateMarker('Preparing image....'),
  UnableToShare: translateMarker('Unable to share'),
};

export type IProbabilityTableRow = IStationCropDataItem & {
  crop: ICropName;
  cropNameRowspan: number;
  [key: `prob_${number}`]: number | null | undefined;
};

@Component({
  selector: 'crop-probability-table',
  templateUrl: './crop-probability-table.component.html',
  styleUrls: ['./crop-probability-table.component.scss'],
  imports: [FormsModule, MatTableModule, PicsaFormsModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityTableComponent {
  private printProvider = inject(PrintProvider);

  public cropDataHashmap = CROPS_DATA_HASHMAP;

  public stationData = input.required<IStationCropData[]>();

  public tableMeta = input.required<IProbabilityTableMeta>();

  public filterCrop = input<string>();

  public selectedCropName = model<string>();

  public dataSource = new MatTableDataSource<IProbabilityTableRow>();

  /** Dynamic columns definition derived from dateHeadings */
  public probabilityColumns = computed(() => {
    const headings = this.tableMeta()?.dateHeadings || [];
    return headings.map((label, index) => ({
      name: `prob_${index}`,
      label,
    }));
  });

  public probabilityHeaderDefs = computed(() => {
    const cols = this.probabilityColumns();
    return {
      dates: cols.map((_, i) => `prob-date-${i}`),
      values: cols.map((_, i) => `prob-value-${i}`),
    };
  });

  public get displayedColumns(): string[] {
    return ['crop', 'variety', 'days', 'water', ...this.probabilityColumns().map((c) => c.name)];
  }

  public cropFilterFn = computed(() => {
    const data = this.stationData();
    if (!data) return undefined;
    const cropNames = new Set(data.map((d) => d.crop));
    return (crop: ICropData) => cropNames.has(crop.id as ICropName) || cropNames.has(crop.name as ICropName);
  });

  /** Track image sharing state */
  public shareStatus = signal<'Share' | 'Preparing image....' | string>('Share');

  public shareDisabled = computed(() => this.shareStatus() !== 'Share');

  constructor() {
    this.dataSource.filterPredicate = (row: IProbabilityTableRow, filter: string) => {
      return !filter || row.crop === filter;
    };

    effect(() => {
      const initial = this.filterCrop();
      if (initial && !this.selectedCropName()) {
        this.selectedCropName.set(initial);
      }
    });

    effect(() => {
      const selected = this.selectedCropName();
      this.dataSource.filter = selected || '';
    });

    effect(() => {
      const stationData = this.stationData();
      if (!stationData) {
        this.dataSource.data = [];
        return;
      }
      const rows: IProbabilityTableRow[] = [];
      for (const cropGroup of stationData) {
        const sortedGroupItems = groupAndSortCropDataItems(cropGroup.data);
        sortedGroupItems.forEach((item, index) => {
          const row: IProbabilityTableRow = {
            ...item,
            crop: cropGroup.crop,
            cropNameRowspan: index === 0 ? sortedGroupItems.length : 0,
          };
          item.probabilities?.forEach((prob, probIndex) => {
            row[`prob_${probIndex}`] = prob;
          });
          rows.push(row);
        });
      }
      this.dataSource.data = rows;
    });
  }

  public formatProbability(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '';
    return `${Math.round(value * 10)}/10`;
  }

  /** Export rendered table to image and invoke system share sheet */
  public async sharePicture() {
    this.shareStatus.set('Preparing image....');
    try {
      await _wait(200);
      const crop = this.selectedCropName();
      const cropLabel = crop ? CROPS_DATA_HASHMAP[crop]?.label || crop.charAt(0).toUpperCase() + crop.slice(1) : '';
      const stationLabel = this.tableMeta().label;
      const title = ['Crop Probability', stationLabel, cropLabel].filter(Boolean).join(' - ');
      await this.printProvider.shareHtmlDom('#cropProbabilityTable', title);
      this.shareStatus.set('Share');
    } catch (error: unknown) {
      console.error('Failed to share crop probability table:', error);
      const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
      this.shareStatus.set(errorMessage || 'Unable to share');
    } finally {
      if (this.shareStatus() !== 'Share') {
        setTimeout(() => {
          this.shareStatus.set('Share');
        }, 2000);
      }
    }
  }
}
