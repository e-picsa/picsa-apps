import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IBudgetCardValues } from '../../../models/budget-tool.models';

@Component({
  selector: 'budget-cell-editor-produce-consumed',
  templateUrl: './produce-consumed.html',
  styleUrls: ['./produce-consumed.scss']
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorProduceConsumedComponent {
  @Input() values: IBudgetCardValues;
  @Output() onValueChange = new EventEmitter<IBudgetCardValues>();

  // using manual bindings instead of ngmodel as nested ngfor-ngmodel with matInput tricky
  setValue(e: Event, key: 'quantity' | 'cost') {
    const target = e.target as HTMLInputElement;
    this.values[key] = Number(target.value);
    this.onValueChange.emit(this.values);
  }
}
