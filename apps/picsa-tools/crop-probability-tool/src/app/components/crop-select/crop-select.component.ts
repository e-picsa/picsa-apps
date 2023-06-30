import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ICropData } from '../../data/crops';

@Component({
  selector: 'crop-probability-crop-select',
  templateUrl: './crop-select.component.html',
  styleUrls: ['./crop-select.component.scss'],
})
export class CropSelectComponent {
  @Input() crops: ICropData[];

  @Input() set stationId(stationId: string) {
    // Whenever new station loaded reset data
    this.selected = '';
  }

  @Output() cropSelected = new EventEmitter<string>();

  /** Name of selected crop */
  public selected = '';

  public handleCropSelected(name: string) {
    this.selected = name;
    this.cropSelected.next(name);
  }
}
