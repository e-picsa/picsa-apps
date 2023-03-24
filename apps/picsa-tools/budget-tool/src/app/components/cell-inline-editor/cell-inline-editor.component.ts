import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FadeInOut, ANIMATION_DELAYED } from '@picsa/shared/animations';
import {
  IBudgetCard,
  IBudgetCardWithValues,
  IBudgetPeriodData,
  IBudgetPeriodType,
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { MatDialog } from '@angular/material/dialog';
import { _wait } from '@picsa/utils';

const EDITOR_STEPS: { type: IBudgetPeriodType; label: string }[] = [
  { type: 'activities', label: 'Activities' },
  { type: 'inputs', label: 'Inputs' },
  { type: 'familyLabour', label: 'Family Labour' },
  { type: 'outputs', label: 'Outputs' },
  { type: 'produceConsumed', label: 'Produce Consumed' },
];

@Component({
  selector: 'budget-cell-inline-editor',
  templateUrl: './cell-inline-editor.component.html',
  styleUrls: ['./cell-inline-editor.component.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)],
})
export class BudgetCellInlineEditorComponent {
  /** View reference to ng-template content shown in dialog */
  @ViewChild('cardsListDialog') cardsListDialog: TemplateRef<any>;

  public data: IBudgetPeriodData;
  public _activePeriod: number;
  public editorSteps = EDITOR_STEPS;

  /** Budget period type to display cards list for */
  public cardsListType: IBudgetPeriodType;

  @Input() set activeType(activeType: IBudgetPeriodType) {
    this.scrollToType(activeType);
  }
  @Input() set activePeriod(activePeriod: number) {
    this._activePeriod = activePeriod;
    this.loadEditorData();
  }
  @Output() handleNextClick = new EventEmitter();

  constructor(public store: BudgetStore, private dialog: MatDialog) {}

  public showCardsList(type: IBudgetPeriodType) {
    this.cardsListType = type;
    this.dialog.open(this.cardsListDialog, {
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'no-padding',
    });
  }

  private async scrollToType(type: IBudgetPeriodType) {
    const scrollContainer = document.getElementById('editorContainer');
    const scrollTarget = document.getElementById(`edit-${type}`);
    await _wait(100);
    if (scrollContainer && scrollTarget) {
      scrollTarget?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private loadEditorData() {
    if (this._activePeriod !== undefined) {
      const activeData = this.store.activeBudget.data[this._activePeriod];
      if (activeData) {
        // create copy of data to avoid first input populating multiple activities
        this.data = JSON.parse(JSON.stringify(activeData));
      }
    }
  }

  public trackByFn(index: number, item: IBudgetCard) {
    return item.id;
  }

  public removeSelectedCard(type: IBudgetPeriodType, index: number) {
    if (this.data[type][index]) {
      const values = [...this.data[type]];
      values.splice(index, 1);

      this.onEditorChange(values, type);
      this.loadEditorData();
    }
  }

  // the store already knows what period and type it is, so just pass the updated values
  // back up to save
  onEditorChange(values: IBudgetCardWithValues[], type: IBudgetPeriodType) {
    this.store.saveEditor(values, type);
  }
}
