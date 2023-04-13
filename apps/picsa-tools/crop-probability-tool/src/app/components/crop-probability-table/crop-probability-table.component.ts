import { Component } from '@angular/core';
import { CROP_MOCK_DATA } from '../../data/mock';
import { MatTableDataSource } from '@angular/material/table';

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
  displayedColumns: string[] = [
    'crop',
    'variety',
    'days',
    'water',
    'probabilities',
  ];
  dataSource = new MatTableDataSource(CROP_MOCK_DATA);
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
