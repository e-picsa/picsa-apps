import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  output,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FadeInOut } from '@picsa/shared/animations';
import { _wait } from '@picsa/utils';
import { Subscription } from 'rxjs';

import { IBudgetPeriodData, IBudgetPeriodType } from '../../models/budget-tool.models';
import { IBudgetCard, IBudgetCardWithValues } from '../../schema';
import { BudgetService } from '../../store/budget.service';
import { BudgetStore } from '../../store/budget.store';
import { BudgetCardService } from '../../store/budget-card.service';
import { BUDGET_PERIOD_ROWS } from '../../store/templates';

@Component({
  selector: 'budget-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  animations: [FadeInOut({})],
  standalone: false,
  // TODO - need full table detection on push to track propertly changes
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetEditorComponent implements OnDestroy {
  service = inject(BudgetService);
  store = inject(BudgetStore);
  cardService = inject(BudgetCardService);
  private dialog = inject(MatDialog);

  /** View reference to ng-template content shown in dialog */
  @ViewChild('cardsListDialog') cardsListDialog: TemplateRef<any>;
  @ViewChild('cardScroller', { static: false }) cardScroller: ElementRef<HTMLDivElement>;

  nextClicked = output();

  public data = signal<IBudgetPeriodData | undefined>(undefined);
  public editorSteps = BUDGET_PERIOD_ROWS;

  /** Budget period type to display cards list for */
  public budgetCards = signal<IBudgetCard[]>([]);

  public periodLabel = computed(() => {
    const period = this.service.activePeriod();
    return this.store.periodLabels[period];
  });

  private cardSubscription: Subscription;

  constructor() {
    const service = this.service;

    effect(() => {
      const type = service.activeType();
      if (type) {
        this.loadBudgetCards(type);
        this.scrollToType(type);
      }
    });
    effect(() => {
      const period = service.activePeriod();
      if (period !== undefined) {
        this.loadEditorData();
      }
    });
  }

  ngOnDestroy(): void {
    this.cardSubscription?.unsubscribe();
  }

  private async loadBudgetCards(type: IBudgetPeriodType) {
    await this.cardService.ready();
    // HACK - load output cards when using produce consumed
    // TODO - ideally should have own set of cards (without money) and migrate existing budgets
    // TODO - will also have to update custom card generator
    if (type === 'produceConsumed') {
      type = 'outputs';
    }
    if (this.cardSubscription) {
      this.cardSubscription.unsubscribe();
    }
    this.cardSubscription = this.cardService.dbCollection.find({ selector: { type } }).$.subscribe((docs) => {
      this.budgetCards.set(docs.map((d) => d._data));
    });
  }

  public showCardsList(type: IBudgetPeriodType) {
    this.service.activeType.set(type);

    this.dialog.open(this.cardsListDialog, {
      panelClass: 'budget-dialog',
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
    const period = this.service.activePeriod();
    if (period !== undefined) {
      const activeData = this.store.activeBudget.data[period];
      if (activeData) {
        // create copy of data to avoid first input populating multiple activities
        this.data.set(JSON.parse(JSON.stringify(activeData)));
      }
    }
  }

  public removeSelectedCard(type: IBudgetPeriodType, index: number) {
    if (this.data()![type][index]) {
      const values = [...this.data()![type]];
      values.splice(index, 1);
      this.onEditorChange(values, type);
    }
  }

  public updateCardValue(type: IBudgetPeriodType, index: number, card: IBudgetCardWithValues) {
    const values = [...this.data()![type]];
    values[index] = card;
    this.onEditorChange(values, type);
  }

  // the store already knows what period and type it is, so just pass the updated values to save
  onEditorChange(values: IBudgetCardWithValues[], type: IBudgetPeriodType) {
    this.store.saveEditor(values, type);
    this.loadEditorData();
  }
}
