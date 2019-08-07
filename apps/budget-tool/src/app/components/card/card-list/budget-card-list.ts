import { select } from '@angular-redux/store';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import {
  IBudget,
  IBudgetCard,
  IBudgetPeriodData
} from '../../../models/budget-tool.models';
import { BudgetStore } from '../../../store/budget.store';

@Component({
  selector: 'budget-card-list',
  templateUrl: 'budget-card-list.html'
})
export class BudgetCardListComponent implements OnDestroy, OnInit {
  private componentDestroyed: Subject<any> = new Subject();
  @select(['budget', 'view', 'meta'])
  cards: IBudgetCard[];
  periodData: IBudgetPeriodData;
  type: string;
  cardSubscriber$: Subscription;

  constructor(
    // private NgRedux: NgRedux<AppState>,
    public store: BudgetStore
  ) {}
  // *** reviewed all this in a rush, need to work on
  ngOnInit() {
    this._addSubscribers();
  }
  ngOnDestroy() {
    console.log('card list destroyed');
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }

  // check if the given time period index exists on budget data and card type within period
  // if not intialise values
  _checkBudgetDataPath(periodIndex, type) {
    // const budget: IBudget = this.store.activeBudget;
    // let dispatchUpdate;
    // if (!budget.data[periodIndex]) {
    //   budget.data[periodIndex] = {};
    //   dispatchUpdate = true;
    // }
    // if (!budget.data[periodIndex][type]) {
    //   budget.data[periodIndex][type] = {};
    //   dispatchUpdate = true;
    // }
    // // only trigger update if things have changed
    // if (dispatchUpdate) {
    //   this.actions.setActiveBudget(budget);
    // }
  }

  // every time view changed recalculate what should be shown
  // *** could be optimised better but multiple subscribers proves difficult
  _generateCardList(type: string, periodIndex: string) {
    this.type = type;
    try {
      const periodData = this.store.activeBudget.data[periodIndex][type];
      this.periodData = periodData;
    } catch (error) {
      // no data for period
    }
    this.updateCardList();
  }

  // watch for updates to custom cards and add to list accordingly
  // triggered from events as the new card builder is launched as a model and doens't update state
  _addSubscribers() {
    // this.events.subscribe("load:budget", () => {
    //   this._generateCardList("enterprises", null);
    // });
    // console.log("adding custom cards subscriber");
    // this.events.subscribe("customCards:updated", customCards => {
    //   console.log("custom cards updated");
    //   this.updateCardList(customCards);
    // });
    // // when view changes (e.g. activity list -> outputs list) want to check path exists to populate data
    // // and update cards list
    // // use events redux alone fails to trigger uipdate when period index changed
    // // but type remains (e.g. activity 1 => activity 2)
    // this.events.subscribe("cell:selected", meta => {
    //   this.viewMeta = meta;
    //   console.log("cell selected", meta);
    //   this.cards = [];
    //   this._checkBudgetDataPath(meta.periodIndex, meta.type);
    //   // when type specified add subscriber to the list of cards (including updates to custom)
    //   // to generate list on update
    //   console.log("building cards subscriber", meta.type);
    //   this.NgRedux.select(["budget", "meta", meta.type])
    //     .pipe(takeUntil(this.componentDestroyed))
    //     .subscribe(cards => {
    //       console.log("cards updated", cards);
    //       this._generateCardList(meta.type, meta.periodIndex);
    //     });
    //   // set view after path checked
    //   this.actions.setBudgetView({
    //     component: "cell-edit",
    //     title: meta.title,
    //     meta: {
    //       type: meta.type,
    //       periodIndex: meta.periodIndex
    //     }
    //   });
    // });
  }

  // when the related budget period is updated want to filter all cards by type and update which
  // are already selected and any other meta data (e.g. input quantities)
  updateCardList(customCards?) {
    // const type = this.type;
    // const data = this.periodData;
    // console.log("updating card list", type, data);
    // const typeCards = this.NgRedux.getState().budget.meta[type];
    // let allTypeCards = this.mergeCustomCards(typeCards, customCards);
    // if (
    //   type != "produceConsumed" &&
    //   data &&
    //   Object.keys(data).length > 0 &&
    //   allTypeCards
    // ) {
    //   // update cards according to what is saved
    //   allTypeCards = allTypeCards.map(c => {
    //     return data[c.id] ? data[c.id] : c;
    //   });
    // }
    // // consumed should simply list outputs that have been produced
    // if (type == "produceConsumed") {
    //   allTypeCards = this.getListOfPeriodOutputs();
    // }
    // // use timeout so that cards can be properly destroyed and not repopulated if same field selected in different time period
    // this.cards = null;
    // setTimeout(() => {
    //   this.cards = allTypeCards;
    // }, 100);
  }

  // return list of outputs for current period (used for produce consumed)
  getListOfPeriodOutputs() {
    // try {
    //   const outputsJson = this.store.activeBudget.data[
    //     this.viewMeta.periodIndex
    //   ].outputs;
    //   return Object.values(outputsJson);
    // } catch (error) {
    //   return [];
    // }
  }

  // iterate over all budget periods and reduce any outputs to a single array
  getListOfAllOutputs() {
    // try {
    //   const budgetData: IBudgetPeriodData = this.NgRedux.getState().budget
    //     .active.data;
    //   console.log("values", Object.values(budgetData));
    //   const outputs = Object.values(budgetData).map(v => {
    //     return v.outputs ? Object.values(v.outputs) : [];
    //   });
    //   const list = [].concat.apply([], outputs);
    //   console.log("list", list);
    //   return [];
    // } catch (error) {
    //   return [];
    // }
  }

  // merge custom type cards with hard-coded type cards
  mergeCustomCards(typeCards, customCards?) {
    // if (typeCards) {
    //   if (!customCards) {
    //     try {
    //       customCards = this.NgRedux.getState().user.budgetCustomCards[
    //         this.type
    //       ];
    //       if (!customCards) {
    //         customCards = {};
    //       }
    //     } catch (error) {
    //       customCards = {};
    //     }
    //   }
    //   console.log("custom cards", customCards);
    //   Object.keys(customCards).forEach(key => {
    //     typeCards.push(customCards[key]);
    //   });
    // }
    // return typeCards;
  }
}
