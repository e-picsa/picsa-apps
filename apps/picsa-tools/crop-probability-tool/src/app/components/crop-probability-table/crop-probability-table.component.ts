import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { CROPS_DATA_HASHMAP, ICropData } from '@picsa/data';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PrintProvider } from '@picsa/shared/services/native/print';
import { _wait, arrayToHashmap } from '@picsa/utils';

import { IProbabilityTableMeta, IStationCropData, IStationCropDataItem } from '../../models';
import { groupAndSortCropDataItems } from '../../utils/probability-table.utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STRINGS = {
  Share: translateMarker('Share'),
  PreparingImage: translateMarker('Preparing image....'),
  UnableToShare: translateMarker('Unable to share'),
};

@Component({
  selector: 'crop-probability-table',
  templateUrl: './crop-probability-table.component.html',
  styleUrls: ['./crop-probability-table.component.scss'],
  imports: [FormsModule, MatButtonModule, MatIcon, MatTableModule, PicsaFormsModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityTableComponent implements OnInit {
  private printProvider = inject(PrintProvider);

  public displayedColumns: string[] = [];

  /** Tracking columns for individual probabilities */
  public probabilityColumns = signal<{ name: string; label: string; index: number }[]>([]);

  /**
   * Generate placeholders to populate an ng-container column for each probability date and value
   * These only generate placeholders for the RHS columns as left rowspan merges first 4 columns to left
   **/
  public probabilityHeaderDefs = computed(() => {
    const columns = this.probabilityColumns();
    return {
      dates: columns.map((v, i) => `prob-date-${i}`),
      values: columns.map((v, i) => `prob-value-${i}`),
    };
  });

  public dataSource: MatTableDataSource<ITableRow>;
  public selectedCropName = model('');

  public stationData = input.required<IStationCropData[]>();
  public tableMeta = input.required<IProbabilityTableMeta>();

  /** Specify crop to use with initial filter */
  public filterCrop = input<string>('');

  public shareStatus = signal<'Share' | string>('Share');
  public shareDisabled = signal(false);

  private tableData: ITableRow[] = [];

  public cropDataHashmap = CROPS_DATA_HASHMAP;

  constructor() {
    // Load data and apply any initial filters
    effect(() => {
      const stationData = this.stationData();
      this.tableData = this.prepareTableRows(stationData);
    });
    effect(() => {
      // Filter when selected crop name changes
      this.selectedCropName();
      this.filterData();
    });
  }

  ngOnInit() {
    // Set the initial value from the input signal
    this.selectedCropName.set(this.filterCrop());
  }

  public cropFilterFn = signal<((option: ICropData) => boolean) | undefined>(undefined);

  /** Export the crop probability table as an image and trigger native/web share */
  public async sharePicture(): Promise<void> {
    this.shareDisabled.set(true);
    this.shareStatus.set('Preparing image....');
    await _wait(200);
    try {
      await this.shareAsImage();
      this.shareStatus.set('Share');
    } catch (error: unknown) {
      console.error('Failed to share crop probability table:', error);
      const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
      this.shareStatus.set(errorMessage || 'Unable to share');
    } finally {
      this.shareDisabled.set(false);
    }
  }

  /** Internal image generation and share via PrintProvider */
  public async shareAsImage(): Promise<void> {
    const stationLabel = this.tableMeta().label || 'Crop Probability';
    const crop = this.selectedCropName();
    const cropLabel = crop ? this.cropDataHashmap[crop]?.label || crop : '';
    const filename = ['Crop Probability', stationLabel, cropLabel].filter(Boolean).join(' - ');
    await this.printProvider.shareHtmlDom('#cropProbabilityTable', filename);
  }

  private filterData() {
    const cropName = this.selectedCropName();
    // flatten data rows which are grouped by crop
    const dataSource = new MatTableDataSource(this.tableData);
    // apply custom filter to avoid partial matches (e.g. soya-beans matching beans)
    dataSource.filterPredicate = (data, filter) => data.crop.toLowerCase() === filter;
    this.generateCropFilters(this.stationData());
    if (cropName) {
      dataSource.filter = cropName.toLowerCase();
    }
    this.dataSource = dataSource;
  }

  /** Generate list of crops for filtering that exist in the data */
  private generateCropFilters(stationData: IStationCropData[]) {
    const availableCrops = arrayToHashmap(stationData, 'crop');
    this.cropFilterFn.set(({ name }) => name in availableCrops);
  }

  /**
   * Flatten grouped station data for easier use in table rows
   * Split probabilities into individual columns
   */
  private prepareTableRows(stationData: IStationCropData[]) {
    const { dateHeadings } = this.tableMeta();
    const probabilityColumns = dateHeadings.map((label, index) => ({
      label,
      name: `probability_${index}`,
      index,
    }));
    this.probabilityColumns.set(probabilityColumns);
    const displayColumns = ['crop', 'variety', 'days', 'water', ...this.probabilityColumns().map((c) => c.name)];
    this.displayedColumns = displayColumns;

    const entries: ITableRow[] = [];
    for (const { crop, data } of stationData) {
      const groupedData = groupAndSortCropDataItems(data || []);
      groupedData.forEach((item, index) => {
        const { probabilities, ...rest } = item;
        for (const { index, name } of this.probabilityColumns()) {
          const val = probabilities?.[index];
          rest[name] = val !== undefined ? val : null;
        }
        // set first row of each to span all crop rows (other rows set to 0 to omit)
        const cropNameRowspan = index === 0 ? groupedData.length : 0;
        entries.push({ ...rest, crop, cropNameRowspan });
      });
    }
    return entries;
  }

  public formatProbability(val: number | string | null | undefined): string {
    if (val === undefined || val === null || val === '') return '';
    // already formated / 10
    if (typeof val === 'string' && val.includes('/')) return val;
    const num = Number(val);
    if (Number.isNaN(num)) return '';
    const outOfTen = Math.round(num * 10);
    return `${outOfTen}/10`;
  }
}

interface ITableRow extends IStationCropDataItem {
  crop: string;
  /** Number of rows the crop name should merge to take up */
  cropNameRowspan: number;
}
