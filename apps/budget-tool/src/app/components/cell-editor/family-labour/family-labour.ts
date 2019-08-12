import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IBudgetCardValues } from '../../../models/budget-tool.models';
import { ENVIRONMENT } from '@picsa/environments';

@Component({
  selector: 'budget-cell-editor-family-labour',
  templateUrl: './family-labour.html',
  styleUrls: ['./family-labour.scss']
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorFamilyLabourComponent {
  @Input() values: IBudgetCardValues;
  @Output() onValueChange = new EventEmitter<IBudgetCardValues>();
  currency = ENVIRONMENT.region.currency;

  // using manual bindings instead of ngmodel as nested ngfor-ngmodel with matInput tricky
  setValue(e: Event, key: 'quantity' | 'cost') {
    const target = e.target as HTMLInputElement;
    this.values[key] = Number(target.value);
    if (this.values.quantity && this.values.cost) {
      this.values.total = this.values.quantity * this.values.cost;
    }
    this.onValueChange.emit(this.values);
  }
}
