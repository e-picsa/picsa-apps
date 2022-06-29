import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IBudgetCardWithValues } from '../../../models/budget-tool.models';

@Component({
  selector: 'budget-cell-editor-family-labour',
  templateUrl: './family-labour.html',
  styleUrls: ['./family-labour.scss'],
})
export class BudgetCellEditorFamilyLabourComponent {
  @Input() values: IBudgetCardWithValues[];
  @Output() valueChanged = new EventEmitter<IBudgetCardWithValues[]>();
  totalPeople: number;
  familyCard = FAMILY_MEMBER_CARD;
  ngOnInit(): void {}

  addMember() {
    this.values.push(FAMILY_MEMBER_CARD);
    this.valueChanged.emit(this.values);
  }
  removeMember(i: number) {
    this.values.splice(i, 1);
    this.valueChanged.emit(this.values);
  }

  // NOTE - to maintain array format family labour simply populates a basic card for every member
  // of family labour indicated. In future this might contain more meta info
  setValue(e: Event, cardIndex: number) {
    console.log('set card', cardIndex);
    const target = e.target as HTMLInputElement;
    this.values[cardIndex].values.quantity = Number(target.value);
    this.valueChanged.emit(this.values);
  }
}
const FAMILY_MEMBER_CARD: IBudgetCardWithValues = {
  id: 'family-member',
  label: 'family member',
  type: 'familyLabour',
  imgType: 'svg',
  values: {
    quantity: null as any,
    cost: 0,
    total: 0,
  },
};
