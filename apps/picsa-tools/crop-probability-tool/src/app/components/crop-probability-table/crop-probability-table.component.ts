import { Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { arrayToHashmap } from '@picsa/utils';

import { CROPS_DATA, ICropData } from '../../data/crops';
import { IStationCropData, IStationCropInformation } from '../../models';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

@Component({
  selector: 'crop-probability-table',
  templateUrl: './crop-probability-table.component.html',
  styleUrls: ['./crop-probability-table.component.scss'],
})
export class CropProbabilityTableComponent {
  displayedColumns: string[] = ['crop', 'variety', 'days', 'water', 'probabilities'];

  public dataSource: MatTableDataSource<IStationCropData>;
  public station: IStationCropInformation;
  public selectedCropName?: string;

  @Input() set activeStation(activeStation: IStationCropInformation) {
    this.station = activeStation;
    this.filterData('');
  }

  cropIcons: ICropData[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {}

  public handleStationChange() {
    this.router.navigate([], { relativeTo: this.route, queryParams: { stationId: this.station?.id } });
  }

  filterData(cropName: string = '') {
    this.selectedCropName = cropName;
    const dataSource = new MatTableDataSource(this.station.station_data);
    this.cropIcons = this.generateCropFilters(this.station.station_data);
    if (cropName) {
      dataSource.filter = cropName;
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
}
