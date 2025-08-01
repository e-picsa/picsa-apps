import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CROPS_DATA_HASHMAP, ICropData } from '@picsa/data';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { arrayToHashmap } from '@picsa/utils';

import { IProbabilityTableStationMeta, IStationCropData, IStationCropDataItem } from '../../models';

@Component({
  selector: 'crop-probability-table',
  templateUrl: './crop-probability-table.component.html',
  styleUrls: ['./crop-probability-table.component.scss'],
  imports: [CommonModule, FormsModule, MatTableModule, PicsaFormsModule, PicsaTranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityTableComponent {
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
  public selectedCropName = 'maize';

  public stationData = input.required<IStationCropData[]>();
  public stationMeta = input.required<IProbabilityTableStationMeta>();

  private tableData: ITableRow[] = [];

  public cropDataHashmap = CROPS_DATA_HASHMAP;

  constructor() {
    effect(() => {
      const stationData = this.stationData();
      this.tableData = this.prepareTableRows(stationData);
      this.filterData(this.selectedCropName);
    });
  }

  public cropFilterFn: (option: ICropData) => boolean;

  filterData(cropName = '') {
    this.selectedCropName = cropName;
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
    this.cropFilterFn = ({ name }) => name in availableCrops;
  }

  /**
   * Flatten grouped station data for easier use in table rows
   * Split probabilities into individual columns
   * */
  private prepareTableRows(stationData: IStationCropData[]) {
    const { dateHeadings } = this.stationMeta();
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
      data.forEach((item, index) => {
        const { probabilities, ...rest } = item;
        for (const { index, name } of this.probabilityColumns()) {
          rest[name] = probabilities?.[index] || '';
        }
        // set first row of each to span all crop rows (other rows set to 0 to omit)
        const cropNameRowspan = index === 0 ? data.length : 0;
        entries.push({ ...rest, crop, cropNameRowspan });
      });
    }
    return entries;
  }
}

interface ITableRow extends IStationCropDataItem {
  crop: string;
  /** Number of rows the crop name should merge to take up */
  cropNameRowspan: number;
}
