import { Component, Input, Inject, Output, EventEmitter } from '@angular/core';
import {
  IBudgetCard,
  IBudgetCardType
} from '../../../models/budget-tool.models';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { generateDBMeta } from '@picsa/services/core/db';
import { BudgetStore } from '../../../store/budget.store';
import { toJS } from 'mobx';

@Component({
  selector: 'budget-card-new',
  templateUrl: './card-new.html',
  styleUrls: ['./card-new.scss', '../budget-card.scss']
})
export class BudgetCardNew {
  @Input() type: IBudgetCardType;
  @Input() groupings: string[];
  @Output() cardSaved = new EventEmitter<IBudgetCard>();
  card = PLACEHOLDER_CARD;

  constructor(public dialog: MatDialog, private store: BudgetStore) {}

  showCardDialog() {
    // type passed for enterprise select but otherwise can pick from store
    const type = this.type ? this.type : this.store.activeType;
    // groupings should match the current enterprise unless otherwise specified
    const groupings = this.groupings
      ? this.groupings
      : toJS(this.store.activeBudget.meta.enterprise.groupings);
    const card: IBudgetCard = {
      ...NEW_CARD,
      type,
      groupings
    };
    console.log('card', card);
    const dialogRef = this.dialog.open(BudgetCardNewDialog, {
      width: '250px',
      data: card
    });

    dialogRef.afterClosed().subscribe(async data => {
      await this.store.saveCustomCard(data);
      console.log('card saved', data);
      this.cardSaved.emit(data);
    });
  }
}

// Dialog
@Component({
  selector: 'budget-card-new-dialog',
  templateUrl: './card-new-dialog.html',
  styleUrls: ['./card-new.scss', '../budget-card.scss']
})
export class BudgetCardNewDialog {
  public card: IBudgetCard;
  constructor(
    public dialogRef: MatDialogRef<BudgetCardNewDialog>,
    @Inject(MAT_DIALOG_DATA) card: IBudgetCard
  ) {
    this.card = card;
  }
  save() {
    this.card.id = this.card.label.replace(/\s+/g, '-').toLowerCase();
    this.card.customMeta = {
      imgData: this.generateImage(this.card.label),
      dateCreated: new Date().toISOString(),
      createdBy: ''
    };
    this.dialogRef.close(this.card);
  }

  // return an svg circle with text in the middle
  // text is either first 2 initials (if multiple words) or first 2 letters (if one word)
  generateImage(text: string) {
    const byWord = text.split(' ');
    const abbr =
      byWord.length > 1
        ? `${byWord[0].charAt(0)}.${byWord[1].charAt(0)}`
        : text.substr(0, 2);
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
    viewBox="0 0 100 100">
      <g id="UrTavla">
        <circle style="fill:url(#toning);stroke:#adadad;stroke-width:3;stroke-miterlimit:10;" cx="50" cy="50" r="40">
        </circle>
        <text font-family="Super Sans" letter-spacing="2" x="50%" y="50%" text-anchor="middle" stroke="#adadad" fill="#adadad" font-size="35" stroke-width="2px" dy=".3em">
        ${abbr}
        </text>
      </g>
    </svg>
    `;
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
  groupings: ['*']
};
const NEW_CARD: IBudgetCard = {
  id: generateDBMeta()._key,
  label: '',
  type: 'other'
};

// @ViewChild('canvasWhiteboard', { static: false })
// canvasWhiteboard: CanvasWhiteboardComponent;

//   saveCard() {
//     // *** TODO - get type from query params
//     // const type = 'TODO';
//     // const id = `TODO`;
//     // // *** should add check for uniqueness and possibly strip any other special characters
//     // // *** need createdBy but won't be populated if firebase never initialised (could use a second local id)
//     // const card: ICustomBudgetCard = {
//     //   group: 'other',
//     //   name: this.cardName,
//     //   id: id,
//     //   type: type,
//     //   custom: true,
//     //   customImg: this.saveCanvasImage(),
//     //   created: new Date().toString(),
//     //   createdBy: '*** get by redux ***'
//     // };
//     // console.log('custom budget card created', card);
//     // const allCustomCards = Object.assign(
//     //   {},
//     //   this.ngRedux.getState().user.budgetCustomCards
//     // );
//     // if (!allCustomCards[type]) {
//     //   allCustomCards[type] = [];
//     // }
//     // allCustomCards[type].push(card);
//     // this.userActions.updateUser({ budgetCustomCards: allCustomCards });
//     // // publish notification for budget card list to repopulate with new cards
//     // this.events.publish('customCards:updated', allCustomCards);
//     // this.modalCtrl.dismiss();
//   }

//   // saveCanvasImage() {
//   //   const img = this.canvasWhiteboard.generateCanvasDataUrl('image/png', 0.3);
//   //   return img;
//   // }
