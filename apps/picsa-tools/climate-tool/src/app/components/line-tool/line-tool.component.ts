import { Component, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-line-tool',
  templateUrl: './line-tool.component.html',
  styleUrls: ['./line-tool.component.scss'],
})
export class LineToolComponent {
  public value?: number;

  /** Set value display type as number of date */
  @Input() display: 'number' | 'date';
  /** Set min and max values to display in range */
  @Input() ranges: { yMin: number; yMax: number };
  /** */
  @Input() step: number;

  @Output() valueChange = new EventEmitter<number | undefined>();

  public formatThumbValue(v: number) {
    return this.display === 'number' ? v : '';
  }

  public setLineToolValue(value: number) {
    if (value < this.ranges.yMin) {
      this.value = undefined;
    }
    this.valueChange.next(value);
  }
}
