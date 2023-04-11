import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { MatInput } from '@angular/material/input';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IBudgetCardWithValues } from '../../../../models/budget-tool.models';

const LABELS: { [id: string]: string } = {
  adultMale: translateMarker('Male Family Member'),
  adultFemale: translateMarker('Female Family Member'),
};
const MEMBERS = Object.entries(LABELS).map(([id, label]) => ({
  id,
  label,
}));

@Component({
  selector: 'budget-cell-editor-family-labour',
  templateUrl: './family-labour.html',
  styleUrls: ['./family-labour.scss'],
})
export class BudgetCellEditorFamilyLabourComponent {
  @Input() values: IBudgetCardWithValues[];
  @Output() valueChanged = new EventEmitter<IBudgetCardWithValues[]>();
  @ViewChildren(MatInput) childInputs: QueryList<MatInput>;
  totalPeople: number;

  memberTypes = MEMBERS;

  addMemberCards: IBudgetCardWithValues[] = [];

  constructor() {
    for (const { id } of MEMBERS) {
      const memberCard = this.createFamilyCard(id);
      this.addMemberCards.push(memberCard);
    }
  }

  addMember(memberType: string) {
    // take a copy of the
    const valueCard = this.createFamilyCard(memberType);
    this.values.push(valueCard);
    this.valueChanged.emit(this.values);
    // Focus input after render
    setTimeout(() => {
      const lastEl = this.childInputs.get(this.values.length - 1);
      if (lastEl) {
        lastEl.focus();
      }
    }, 200);
  }
  removeMember(i: number) {
    this.values.splice(i, 1);
    this.valueChanged.emit(this.values);
  }

  // NOTE - to maintain array format family labour simply populates a basic card for every member
  // of family labour indicated. In future this might contain more meta info
  setValue(e: Event, cardIndex: number) {
    const target = e.target as HTMLInputElement;
    this.values[cardIndex].values.quantity = Number(target.value);
    this.valueChanged.emit(this.values);
  }

  createFamilyCard(memberType: string) {
    const label = LABELS[memberType];
    const card: IBudgetCardWithValues = {
      id: memberType,
      label: label,
      type: 'familyLabour',
      imgId: `family-labour_${memberType}`,
      imgType: 'svg',
      values: {
        quantity: null as any,
        cost: 0,
        total: 0,
      },
    };
    return card;
  }
}
