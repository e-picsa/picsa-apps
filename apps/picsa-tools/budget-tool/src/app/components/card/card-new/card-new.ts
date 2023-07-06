import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { generateDBMeta } from '@picsa/shared/services/core/db';
import { toJS } from 'mobx';

import { IBudgetCard, IBudgetCardGrouping, IBudgetCardType } from '../../../models/budget-tool.models';
import { BudgetStore } from '../../../store/budget.store';
import { BudgetCardNewDialog } from './card-new-dialog';

@Component({
  selector: 'budget-card-new',
  templateUrl: './card-new.html',
  styleUrls: ['./card-new.scss', '../budget-card.scss'],
})
export class BudgetCardNew {
  @Input() type: IBudgetCardType;
  @Input() groupings: string[];
  @Output() cardSaved = new EventEmitter<IBudgetCard>();
  card = PLACEHOLDER_CARD;

  constructor(public dialog: MatDialog, public store: BudgetStore) {}

  showCardDialog() {
    // groupings should match the current enterprise unless otherwise specified
    const groupings = this.groupings ? this.groupings : toJS(this.store.activeBudget.meta.enterprise.groupings);
    const card: IBudgetCard = {
      ...NEW_CARD,
      type: this.type,
      groupings: groupings as IBudgetCardGrouping[],
    };
    console.log('card', card);
    const dialogRef = this.dialog.open(BudgetCardNewDialog, {
      width: '250px',
      data: card,
    });

    dialogRef.afterClosed().subscribe(async (data) => {
      await this.store.saveCustomCard(data);
      this.cardSaved.emit(data);
    });
  }
}

/***********************************************************************
 *      Constants
 ***********************************************************************/
const PLACEHOLDER_CARD: IBudgetCard = {
  id: 'add-custom',
  label: 'add other',
  type: 'other',
  imgType: 'svg',
  groupings: ['*'],
};
const NEW_CARD: IBudgetCard = {
  id: generateDBMeta()._key,
  label: '',
  type: 'other',
};
