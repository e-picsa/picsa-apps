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
  imports: [FormsModule, MatTableModule, PicsaFormsModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityTableComponent implements OnInit {
  private printProvider = inject(PrintProvider);

  public displayedColumns: string[] = [];

  /** Tracking columns for individual probabilities */
  public probabilityKeys: string[] = [];

  /** Unique crops available in the table */
  public tableCrops = signal<ICropData[]>([]);

  public selectedCropName = model<string>();

  public stationData = input.required<IStationCropData>();

  public tableMeta = input.required<IProbabilityTableMeta>();

  public filterCrop = input<string>();

  public dataSource = new MatTableDataSource<IStationCropDataItem>();

  /** Dynamic width of table determined by number of columns */
  public tableWidth = computed(() => {
    const defaultColCount = 4;
    const probabilityColCount = this.tableMeta().columns?.length || 0;
    const colCount = defaultColCount + probabilityColCount;
    return `${colCount * 120}px`;
  });

  public cropFilterFn = computed(() => {
    const crops = this.tableCrops();
    if (!crops) return;
    const keys = crops.map((crop) => crop.name);
    return (entry: ICropData) => keys.includes(entry.name);
  });

  /** Track image sharing state */
  public shareStatus = signal<'Share' | 'Preparing image....' | string>('Share');

  public shareDisabled = computed(() => this.shareStatus() !== 'Share');

  constructor() {
    effect(() => {
      const selected = this.selectedCropName();
      this.dataSource.filter = selected;
    });
  }

  ngOnInit() {
    this.initTable();
  }

  /** Export rendered table to image and invoke system share sheet */
  public async sharePicture() {
    this.shareStatus.set('Preparing image....');
    try {
      // DOM elements might not render properly if print is called synchronously
      await _wait(200);
      await this.printProvider.shareElementAsImage('cropProbabilityTable', {
        title: this.tableMeta().label || 'Crop Probability',
      });
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

  private initTable() {
    const { crops, columns } = this.stationData();
    const sortedData = groupAndSortCropDataItems(crops);
    this.dataSource.data = sortedData;

    this.probabilityKeys = columns.map((col) => col.key);
    this.displayedColumns = ['crop', 'variety', 'daysToMaturity', 'cropWaterRequirement', ...this.probabilityKeys];
    // setup crops select
    const uniqueCropNames = [...new Set(sortedData.map((d) => d.crop))];
    const cropHashMap = arrayToHashmap(CROPS_DATA_HASHMAP, 'name');
    this.tableCrops.set(uniqueCropNames.map((name) => cropHashMap[name]));
    // initial filter
    const initialFilter = this.filterCrop();
    if (initialFilter) {
      this.selectedCropName.set(initialFilter);
    }
  }
}
