import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { IBudgetCard } from '../../../schema';

// Dialog
@Component({
  selector: 'budget-card-new-dialog',
  templateUrl: './card-new-dialog.html',
  styleUrls: ['./card-new-dialog.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class BudgetCardNewDialog {
  public card: IBudgetCard;
  constructor(public dialogRef: MatDialogRef<BudgetCardNewDialog>, @Inject(MAT_DIALOG_DATA) card: IBudgetCard) {
    this.card = card;
  }
  save() {
    this.card.id = this.card.label.replace(/\s+/g, '-').toLowerCase();
    this.card.customMeta = {
      imgData: this.generateImage(this.card.label),
      dateCreated: new Date().toISOString(),
      createdBy: '',
    };
    this.dialogRef.close(this.card);
  }

  // return an svg circle with text in the middle
  // text is either first 2 initials (if multiple words) or first 2 letters (if one word)
  generateImage(text: string) {
    const byWord = text.split(' ');
    const abbr = byWord.length > 1 ? `${byWord[0].charAt(0)}.${byWord[1].charAt(0)}` : text.substring(0, 2);
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
