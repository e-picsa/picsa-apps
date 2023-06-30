import { Component, Input } from '@angular/core';

@Component({
  selector: 'crop-probability-table-header',
  templateUrl: './crop-probability-table-header.component.html',
  styleUrls: ['./crop-probability-table-header.component.scss'],
})
export class CropProbabilityTableHeaderComponent {
  @Input() stationName: string;
  @Input() seasonDates;
  @Input() seasonProbabilities;
}
