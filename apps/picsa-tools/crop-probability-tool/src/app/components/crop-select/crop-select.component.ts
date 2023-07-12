import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ICropData } from '../../data/crops';

@Component({
  selector: 'crop-probability-crop-select',
  templateUrl: './crop-select.component.html',
  styleUrls: ['./crop-select.component.scss'],
})
export class CropSelectComponent implements OnInit {
  @Input() crops: ICropData[];

  /** Default crop to select on init */
  @Input() selectDefault: string;

  @Input() set stationId(stationId: string) {
    // Prompt refilter by same crop when station id changes
    this.handleCropSelected(this.selected);
  }

  @Output() cropSelected = new EventEmitter<string>();

  /** Name of selected crop */
  public selected = '';

  ngOnInit(): void {
    console.log('hello crop select', this.selectDefault);
    if (this.selectDefault) {
      this.handleCropSelected(this.selectDefault);
    }
  }

  public handleCropSelected(name: string) {
    this.selected = name;
    this.cropSelected.next(name);
  }
}
