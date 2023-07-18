import { Component, ElementRef, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FadeInOut } from '@picsa/shared/animations';
import { _wait } from '@picsa/utils';
import { Subject, takeUntil } from 'rxjs';

import { IBudgetPeriodData, IBudgetPeriodType } from '../../models/budget-tool.models';
import { IBudgetCard, IBudgetCardWithValues } from '../../schema';
import { BudgetStore } from '../../store/budget.store';
import { BudgetCardService } from '../../store/budget-card.service';
import { BUDGET_PERIOD_ROWS } from '../../store/templates';

@Component({
  selector: 'budget-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  animations: [FadeInOut({})],
})
export class BudgetEditorComponent {
  /** View reference to ng-template content shown in dialog */
  @ViewChild('cardsListDialog') cardsListDialog: TemplateRef<any>;
  @ViewChild('cardScroller', { static: false }) cardScroller: ElementRef<HTMLDivElement>;

  public data: IBudgetPeriodData;
  public _activePeriod: number;
  public editorSteps = BUDGET_PERIOD_ROWS;

  public periodType: IBudgetPeriodType;
  private periodType$ = new Subject<IBudgetPeriodType>();

  /** Budget period type to display cards list for */
  public budgetCards: IBudgetCard[] = [];

  @Input() set activeType(activeType: IBudgetPeriodType) {
    this.scrollToType(activeType);
  }
  @Input() set activePeriod(activePeriod: number) {
    this._activePeriod = activePeriod;
    this.loadEditorData();
  }
  @Output() handleNextClick = new EventEmitter();

  constructor(public store: BudgetStore, public cardService: BudgetCardService, private dialog: MatDialog) {}

  public showCardsList(type: IBudgetPeriodType) {
    this.periodType = type;
    this.periodType$.next(type);

    // subscribe to db cards for type until next card type change
    const ref = this.cardService.dbCollection.find({ selector: { type } });
    ref.$.pipe(takeUntil(this.periodType$)).subscribe((docs) => {
      this.budgetCards = docs.map((d) => d._data);
    });

    this.dialog.open(this.cardsListDialog, {
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'no-padding',
    });
    // scroll existing dialog to top if exists as dialog opens
    setTimeout(() => {
      this.cardScroller?.nativeElement?.scrollTo(0, 0);
    }, 200);
  }

  private async scrollToType(type: IBudgetPeriodType) {
    const scrollContainer = document.getElementById('editorContainer');
    const scrollTarget = document.getElementById(`edit-${type}`);
    // provide delay whilst editor flying in
    await _wait(200);
    if (scrollContainer && scrollTarget) {
      // calculate relative element offset instead of using scrollIntoView
      // as seems to perform more consistently whilst flyInOut animation occuring
      // include additional offset just to keep obvious there's scrollable content above
      const elementPosition = Math.max(scrollTarget.offsetTop - 16, 0);
      scrollContainer.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
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

  public updateCardValue(type: IBudgetPeriodType, index: number, card: IBudgetCardWithValues) {
    const values = [...this.data[type]];
    values[index] = card;
    this.onEditorChange(values, type);
    this.loadEditorData();
  }

  // the store already knows what period and type it is, so just pass the updated values to save
  onEditorChange(values: IBudgetCardWithValues[], type: IBudgetPeriodType) {
    this.store.saveEditor(values, type);
    // HACK - fix change detection issue for produceConsumed cards
    if (type === 'produceConsumed') {
      this.data.produceConsumed = values;
    }
  }
}
