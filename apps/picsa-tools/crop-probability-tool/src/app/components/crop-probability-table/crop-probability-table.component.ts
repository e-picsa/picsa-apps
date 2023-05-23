import { Component, Pipe, PipeTransform } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { CROP_PROBABILITY_ICONS } from '../../data/icons';
import { CROP_MOCK_DATA } from '../../data/mock';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

export interface ICropInformation {
  id: number;
  station_name: string;
  station_data: {
    crop: string;
    data: {
      variety: string;
      days: string;
      water: string[];
      probabilities: string[];
    }[];
  };
  notes: string[];
  dates: string[];
  season_probabilites: string[]
}
@Pipe({
  name: 'filter',
  pure: false,
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], property: string, value: any): any[] {
    if (!items) return [];
    if (!value) return items;
    return items.filter((item) => item[property] === value);
  }
}
@Component({
  selector: 'picsa-crop-probability-table',
  templateUrl: './crop-probability-table.component.html',
  styleUrls: ['./crop-probability-table.component.scss'],
})
export class CropProbabilityTableComponent {
  displayedColumns: string[] = ['crop', 'variety', 'days', 'water', 'probabilities'];
  dataSource = new MatTableDataSource(CROP_MOCK_DATA);
  cropIcons = CROP_PROBABILITY_ICONS;
  stations = CROP_MOCK_DATA;
  stationId = 0;

  filterbyImage(title: string) {
    this.dataSource.filter = title.trim().toLowerCase();
  }
  onSelect(id: number) {
    this.stationId = id;
    this.dataSource.filterPredicate = (data: any, filter: string) => data.id === +this.stationId;
    this.dataSource.filter = this.stationId.toString();
  }
}
