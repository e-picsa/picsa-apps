import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PicsaDialogService } from '@picsa/shared/features';

import {
  IBudgetCardDB,
  IBudgetCardWithValues,
} from '../../../models/budget-tool.models';
import { BudgetStore } from '../../../store/budget.store';

@Component({
  selector: 'budget-card-editor',
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.scss'],
})
export class BudgetCardEditorComponent {
  currency: string;
  @Input() card: IBudgetCardWithValues;
  @Output() deleteClicked = new EventEmitter<IBudgetCardWithValues>();
  @Output() valueChanged = new EventEmitter<IBudgetCardWithValues>();

  constructor(private dialog: PicsaDialogService, public store: BudgetStore) {
    this.currency = store.settings.currency;
  }

  // using manual bindings instead of ngmodel as nested ngfor-ngmodel with matInput tricky
  setValue(e: Event, key: 'quantity' | 'cost') {
    const target = e.target as HTMLInputElement;
    this.card.values[key] = Number(target.value);
    if (this.card.values.quantity && this.card.values.cost) {
      this.card.values.total =
        this.card.values.quantity * this.card.values.cost;
    }
    this.valueChanged.emit(this.card);
  }

  async promptCustomDelete(e: Event) {
    e.stopPropagation();
    const dialogRef = await this.dialog.open('delete');
    dialogRef.afterClosed().subscribe((v) => {
      if (v) {
        this.store.deleteCustomCard(this.card as IBudgetCardDB);
        // HACK - instead of refreshing from store just mark
        // as deleted to hide (will be gone next refresh)
        this.card['_deleted'] = true;
      }
    });
  }
}
