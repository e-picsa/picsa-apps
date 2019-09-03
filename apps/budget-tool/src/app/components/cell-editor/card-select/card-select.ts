import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  IBudgetCardWithValues,
  IBudgetCard
} from '../../../models/budget-tool.models';
import { BudgetStore } from '../../../store/budget.store';
import { FadeInOut, ANIMATION_DELAYED } from '@picsa/animations';

@Component({
  selector: 'budget-cell-editor-card-select',
  templateUrl: './card-select.html',
  styleUrls: ['./card-select.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)]
})
export class BudgetCellEditorCardSelectComponent {
  @Input() set values(values: IBudgetCardWithValues[]) {
    this.setValues(values);
  }
  @Input() set cards(cards: IBudgetCard[]) {
    this.filterCards(cards);
  }
  @Output() onValueChange = new EventEmitter<IBudgetCardWithValues[]>();
  enterpriseCards: IBudgetCard[];
  otherCards: IBudgetCard[];
  enterpriseGroup: string;
  selected: { [id: string]: boolean } = {};
  selectedArray: IBudgetCardWithValues[] = [];
  showAllCards = false;

  constructor(private store: BudgetStore) {}

  ngOnInit(): void {
    this.enterpriseGroup = this.store.enterpriseGroup;
  }
  // split type cards between those matching current enterprise and those not
  filterCards(cards: IBudgetCard[]) {
    const enterpriseCards = [];
    const otherCards = [];
    cards.forEach(c => {
      if (
        c.groupings.includes(this.enterpriseGroup) ||
        c.groupings.includes('*')
      ) {
        enterpriseCards.push(c);
      } else {
        otherCards.push(c);
      }
    });
    this.enterpriseCards = enterpriseCards;
    this.otherCards = otherCards;
  }
  isEnterpriseCard(c: IBudgetCard) {
    console.log('is enterprise card?', c);
    return (
      c.groupings.includes(this.enterpriseGroup) || c.groupings.includes('*')
    );
  }

  setValues(values: IBudgetCardWithValues[] = []) {
    const selected = {};
    values.forEach(card => (selected[card.id] = true));
    this.selected = selected;
    this.selectedArray = values;
  }

  // on click toggle keys on the selected cards property, saving full card data for use later
  onCardClicked(card: IBudgetCard) {
    this.selected[card.id] = !this.selected[card.id];
    // check if card with key already exists in array, if yes remove, if no push
    const arrIndex = this.selectedArray.map(el => el.id).indexOf(card.id);
    if (arrIndex > -1) {
      this.selectedArray.splice(arrIndex, 1);
    } else {
      const defaultValues = { cost: null, quantity: null, total: null };
      this.selectedArray.push({ ...card, values: defaultValues });
    }
    // emit value
    this.onValueChange.emit(this.selectedArray);
  }
}
