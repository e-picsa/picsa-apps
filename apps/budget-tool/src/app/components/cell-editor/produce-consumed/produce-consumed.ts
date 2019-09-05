import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IBudgetCardWithValues } from '../../../models/budget-tool.models';

@Component({
  selector: 'budget-cell-editor-produce-consumed',
  templateUrl: './produce-consumed.html',
  styleUrls: ['./produce-consumed.scss']
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorProduceConsumedComponent {
  @Input() cards: IBudgetCardWithValues[] = [];
  @Output() onValueChange = new EventEmitter<IBudgetCardWithValues[]>();

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    console.log('cards', this.cards);
  }

  // using manual bindings instead of ngmodel as nested ngfor-ngmodel with matInput tricky
  setValue(e: Event, key: 'quantity' | 'cost', cardIndex: number) {
    const card = this.cards[cardIndex];
    const target = e.target as HTMLInputElement;
    card.values[key] = Number(target.value);
    this.cards[cardIndex] = card;
    this.onValueChange.emit(this.cards);
  }
}
