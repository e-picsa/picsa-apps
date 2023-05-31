import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { CROP_PROBABILITY_ICONS } from '../../data/icons';
import { CROP_MOCK_DATA } from '../../data/mock';
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
  public stations = CROP_MOCK_DATA;
  public dataSource: MatTableDataSource<IStationCropData>;
  public selectedStation?: IStationCropInformation;
  public selectedCropName?: string;

  cropIcons = CROP_PROBABILITY_ICONS;

  filterData(cropName: string = '') {
    this.selectedCropName = cropName;
    if (this.selectedStation) {
      const dataSource = new MatTableDataSource(this.selectedStation.station_data);
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
}
