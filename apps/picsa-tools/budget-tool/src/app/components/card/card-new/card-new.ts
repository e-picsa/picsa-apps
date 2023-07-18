import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { toJS } from 'mobx';

import { IBudgetCard, IBudgetCardGrouping, IBudgetCardType } from '../../../schema';
import { BudgetStore } from '../../../store/budget.store';
import { BudgetCardService } from '../../../store/budget-card.service';
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

  constructor(public dialog: MatDialog, public store: BudgetStore, private cardService: BudgetCardService) {}

  showCardDialog() {
    // groupings should match the current enterprise unless otherwise specified
    const groupings = this.groupings ? this.groupings : toJS(this.store.activeBudget.meta.enterprise.groupings);
    const card: IBudgetCard = {
      id: generateID(),
      label: '',
      type: this.type,
      groupings: groupings as IBudgetCardGrouping[],
    };
    console.log('card', card);
    const dialogRef = this.dialog.open(BudgetCardNewDialog, {
      width: '250px',
      data: card,
    });

    dialogRef.afterClosed().subscribe(async (data) => {
      await this.cardService.saveCustomCard(data);
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
