import { Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { arrayToHashmap } from '@picsa/utils';

import { CROPS_DATA, ICropData } from '../../data/crops';
import { IStationCropData, IStationCropDataItem, IStationCropInformation } from '../../models';

@Component({
  selector: 'crop-probability-table',
  templateUrl: './crop-probability-table.component.html',
  styleUrls: ['./crop-probability-table.component.scss'],
})
export class CropProbabilityTableComponent {
  public displayedColumns: string[] = [];

  /** Tracking columns for individual probabilities */
  public probabilityColumns: { name: string; label: string; index: number }[] = [];

  public dataSource: MatTableDataSource<ITableRow>;
  public station: IStationCropInformation;
  public selectedCropName?: string;
  public cropIcons: ICropData[] = [];

  private tableData: ITableRow[] = [];

  @Input() set activeStation(activeStation: IStationCropInformation) {
    this.station = activeStation;
    this.tableData = this.prepareTableRows(activeStation);
    this.filterData('');
  }

  constructor(private router: Router, private route: ActivatedRoute) {}

  public handleStationChange() {
    this.router.navigate([], { relativeTo: this.route, queryParams: { stationId: this.station?.id } });
  }

  filterData(cropName: string = '') {
    this.selectedCropName = cropName;
    // flatten data rows which are grouped by crop
    const dataSource = new MatTableDataSource(this.tableData);
    // apply custom filter to avoid partial matches (e.g. soya-beans matching beans)
    dataSource.filterPredicate = (data, filter) => data.crop.toLowerCase() === filter;
    this.cropIcons = this.generateCropFilters(this.station.station_data);
    if (cropName) {
      dataSource.filter = cropName.toLowerCase();
    }
    this.dataSource = dataSource;
  }

  /** Utility function used in mat-select to compare whether the selected station option matches */
  public isStationSelected(a: IStationCropInformation, b: IStationCropInformation): boolean {
    return a && b && a.id === b.id;
  }

  /** Generate list of crops for filtering that exist in the data */
  private generateCropFilters(stationData: IStationCropData[]) {
    const availableCrops = arrayToHashmap(stationData, 'crop');
    return CROPS_DATA.filter(({ name }) => name in availableCrops);
  }

  /**
   * Flatten grouped station data for easier use in table rows
   * Split probabilities into individual columns
   * */
  private prepareTableRows(station: IStationCropInformation) {
    const stationCropData = station.station_data;

    this.probabilityColumns = station.dates.map((label, index) => ({ label, name: `probability_${index}`, index }));
    const displayColumns = ['crop', 'variety', 'days', 'water', ...this.probabilityColumns.map((c) => c.name)];
    this.displayedColumns = displayColumns;

    const entries: ITableRow[] = [];
    for (const { crop, data } of stationCropData) {
      for (const item of data) {
        const { probabilities, ...rest } = item;
        for (const { index, name } of this.probabilityColumns) {
          rest[name] = probabilities?.[index] || '';
        }
        entries.push({ ...rest, crop });
      }
    }
    return entries;
  }
}

interface ITableRow extends IStationCropDataItem {
  crop: string;
}
