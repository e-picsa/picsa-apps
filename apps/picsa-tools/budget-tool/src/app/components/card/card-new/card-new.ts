import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { toJS } from 'mobx';

import { IEnterpriseGroupType } from '../../../data';
import { IBudgetCard, IBudgetCardType } from '../../../schema';
import { BudgetStore } from '../../../store/budget.store';
import { BudgetCardService } from '../../../store/budget-card.service';
import { BudgetCardNewDialog } from './card-new-dialog';

@Component({
  selector: 'budget-card-new',
  templateUrl: './card-new.html',
  styleUrls: ['./card-new.scss', '../budget-card.scss'],
  standalone: false,
})
export class BudgetCardNew {
  @Input() type: IBudgetCardType;
  @Input() groupings: string[];
  @Output() cardSaved = new EventEmitter<IBudgetCard>();
  card = PLACEHOLDER_CARD;

  constructor(
    public dialog: MatDialog,
    public store: BudgetStore,
    private cardService: BudgetCardService,
  ) {}

  showCardDialog() {
    // groupings should match the current enterprise unless otherwise specified
    const groupings = this.groupings ? this.groupings : toJS(this.store.activeBudget.meta.enterprise.groupings);
    // HACK - when generating produce consumed cards create as an output card type
    let type = this.type;
    if (type === 'produceConsumed') {
      type = 'outputs';
    }
    const card: IBudgetCard = {
      id: generateID(),
      label: '',
      type,
      groupings: groupings as IEnterpriseGroupType[],
      imgType: 'svg',
    };
    const dialogRef = this.dialog.open(BudgetCardNewDialog, {
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
  label: translateMarker('Add Card'),
  type: 'other',
  imgType: 'svg',
  groupings: ['*'],
};
