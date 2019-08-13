import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  IBudgetCardWithValues,
  IBudgetCard
} from '../../../models/budget-tool.models';

@Component({
  selector: 'budget-cell-editor-family-labour',
  templateUrl: './family-labour.html',
  styleUrls: ['./family-labour.scss']
})
export class BudgetCellEditorFamilyLabourComponent {
  @Input() values: IBudgetCardWithValues[];
  @Output() onValueChange = new EventEmitter<IBudgetCardWithValues[]>();
  totalPeople: number;

  ngOnInit(): void {
    this.totalPeople = this.values.length > 0 ? this.values.length : null;
  }

  // NOTE - to maintain array format family labour simply populates a basic card for every member
  // of family labour indicated. In future this might contain more meta info
  setValue(e: Event) {
    const target = e.target as HTMLInputElement;
    this.totalPeople = Number(target.value);
    this.onValueChange.emit(
      new Array(this.totalPeople).fill(FAMILY_MEMBER_CARD)
    );
  }
}
const FAMILY_MEMBER_CARD: IBudgetCard = {
  id: 'family-member',
  label: 'family member',
  type: 'familyLabour',
  imgType: 'svg'
};
