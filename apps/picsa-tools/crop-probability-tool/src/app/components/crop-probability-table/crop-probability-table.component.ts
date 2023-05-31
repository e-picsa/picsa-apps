import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { arrayToHashmap } from '@picsa/utils';

import { CROPS_DATA, ICropData } from '../../data/crops';
import { STATION_CROP_DATA } from '../../data/mock';
import { IStationCropData, IStationCropInformation } from '../../models';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

@Component({
  selector: 'picsa-crop-probability-table',
  templateUrl: './crop-probability-table.component.html',
  styleUrls: ['./crop-probability-table.component.scss'],
})
export class CropProbabilityTableComponent {
  displayedColumns: string[] = ['crop', 'variety', 'days', 'water', 'probabilities'];
  public stations = STATION_CROP_DATA;
  public dataSource: MatTableDataSource<IStationCropData>;
  public selectedStation?: IStationCropInformation;
  public selectedCropName?: string;

  cropIcons: ICropData[] = [];

  filterData(cropName: string = '') {
    this.selectedCropName = cropName;
    if (this.selectedStation) {
      const dataSource = new MatTableDataSource(this.selectedStation.station_data);
      this.cropIcons = this.generateCropFilters(this.selectedStation.station_data);
      if (cropName) {
        dataSource.filter = cropName;
      }
      this.dataSource = dataSource;
    }
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
