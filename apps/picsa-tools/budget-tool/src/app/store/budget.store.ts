import { Injectable, OnDestroy } from '@angular/core';
import { toJS } from 'mobx';
import { observable, action, computed } from 'mobx-angular';
import merge from 'deepmerge';

import {
  IBudget,
  IBudgetPeriodData,
  IBudgetCard,
  IBudgetMeta,
  IBudgetCardDB,
  IBudgetCardWithValues,
  IBudgetValueScale,
  IBudgetValueCounters,
  IBudgetBalance,
  IBudgetQueryParams,
  IBudgetPeriodType,
} from '../models/budget-tool.models';
import { checkForBudgetUpgrades } from '../utils/budget.upgrade';
import { NEW_BUDGET_TEMPLATE, MONTHS } from './templates';
import CARDS from '../data/cards';
import { PicsaDbService, generateDBMeta } from '@picsa/shared/services/core/db';
import { IAppMeta } from '@picsa/models';
import { APP_VERSION, ENVIRONMENT } from '@picsa/environments';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class BudgetStore implements OnDestroy {
  changes = new BehaviorSubject<[number, string]>([null, null] as any);
  @observable budgetCards: IBudgetCard[] = [];
  @observable activeBudget: IBudget = undefined as any;
  @observable activePeriod = 0;
  @observable activeType: IBudgetPeriodType = 'activities';
  @observable savedBudgets: IBudget[] = [];
  @observable valueCounters: IBudgetValueCounters = [[], []];
  @observable balance: IBudgetBalance = [];
  // get unique list of types in enterprise cards
  @computed get enterpriseTypeCards(): IBudgetCardDB[] {
    const enterpriseCards = this.budgetCards.filter(
      (c) => c.type === 'enterprise'
    );
    return this._createCardGroupCards(enterpriseCards);
  }
  @computed get budgetCardsByType() {
    console.log('getting budget cards by type');
    const typeCards: {
      [key in IBudgetPeriodType | 'enterprise' | 'other']: IBudgetCard[];
    } = {
      activities: [],
      familyLabour: [],
      inputs: [],
      outputs: [],
      produceConsumed: [],
      enterprise: [],
      other: [],
    };
    this.budgetCards.forEach((card) => {
      if (!typeCards[card.type]) {
        typeCards[card.type] = [];
      }
      typeCards[card.type].push(card);
    });
    return typeCards;
  }
  @computed get budgetPeriodLabels(): string[] {
    return this._generateLabels(this.activeBudget.meta);
  }
  @computed get budgetPeriodData() {
    return this.activeBudget.data[this.activePeriod];
  }

  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
  }
  @action calculateBalance() {
    this.balance = this._calculateBalance(this.activeBudget);
    console.log('balance', toJS(this.balance));
  }
  get activeBudgetValue() {
    return toJS(this.activeBudget);
  }
  // enterprises only have a single group which is used during card filtering
  get enterpriseGroup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.activeBudget.meta.enterprise.groupings![0];
  }

  constructor(private db: PicsaDbService, private route: ActivatedRoute) {}
  ngOnDestroy(): void {
    console.log('TODO - REMOVE SUBSCRIPTIONS');
  }

  /**************************************************************************
   *            Enterprise methods
   *
   ***************************************************************************/
  getfilteredEnterprises(grouping: string) {
    return this.budgetCards.filter(
      (e) => e.type === 'enterprise' && e.groupings?.includes(grouping)
    );
  }
  /**************************************************************************
   *            Budget Values
   *
   ***************************************************************************/
  // merge current budget with added data, optionally can merge deep to include
  // nested properties
  patchBudget(patch: Partial<IBudget>, deepMerge = false) {
    const budget = deepMerge
      ? merge(this.activeBudget, patch)
      : { ...this.activeBudget, ...patch };
    this.setActiveBudget(budget);
    this.saveBudget();
  }
  // populate correct budget data based on editor data and current active cell
  saveEditor(data: IBudgetCardWithValues[], type: IBudgetPeriodType) {
    const d = this.activeBudget.data;
    d[this.activePeriod][type] = data;
    this.patchBudget({ data: d });
    // use behaviour subject to provide better change detection binding on changes
    console.log('emit change', this.activePeriod, type);
    this.changes.next([this.activePeriod, type]);
    this.calculateBalance();
  }

  @action
  scaleValueCounters(scale: IBudgetValueScale) {
    const oldScale = this.activeBudget.meta.valueScale;
    const newScale = scale * oldScale;
    this.patchBudget({
      meta: { ...this.activeBudget.meta, valueScale: newScale },
    });
    this.valueCounters = this._generateValueCounters(this.activeBudget);
  }

  async saveCustomCard(card: IBudgetCard) {
    await this.db.setDoc('budgetTool/_all/cards', card);
    // re-populate budget cards
    console.log('card saved', card);
    await this.preloadData();
  }
  deleteCustomCard(card: IBudgetCardDB) {
    return this.db.deleteDocs('budgetTool/_all/cards', [card._key]);
  }

  /**************************************************************************
   *            Budget Create/Save/Load
   *
   ***************************************************************************/

  createNewBudget() {
    const budget: IBudget = {
      ...NEW_BUDGET_TEMPLATE,
      ...generateDBMeta(),
    };
    this.valueCounters = this._generateValueCounters(budget);
    this.setActiveBudget(budget);
  }
  async saveBudget() {
    await this.db.setDoc(
      'budgetTool/${GROUP}/budgets',
      this.activeBudgetValue,
      true
    );
    await this.loadSavedBudgets();
  }
  async loadBudgetByKey(key: string) {
    if (!this.activeBudget || this.activeBudget._key !== key) {
      await this.loadSavedBudgets();
      const budget = this.savedBudgets.find((b) => b._key === key);
      if (budget) {
        this.loadBudget(toJS(budget));
      }
    }
  }
  async loadBudget(budget: IBudget) {
    console.log('loading budget', budget);
    budget = checkForBudgetUpgrades(budget);
    this.valueCounters = this._generateValueCounters(budget);
    this.balance = this._calculateBalance(budget);
    this.setActiveBudget(budget);
  }

  private async loadSavedBudgets(): Promise<void> {
    const budgets = await this.db.getCollection<IBudget>(
      'budgetTool/${GROUP}/budgets'
    );
    this.savedBudgets = budgets.sort((a, b) =>
      b._modified > a._modified ? 1 : -1
    );
  }

  async deleteBudget(budget: IBudget) {
    await this.db.deleteDocs('budgetTool/${GROUP}/budgets', [budget._key]);
    this.loadSavedBudgets();
  }

  /**************************************************************************
   *            Initialisation
   *
   ***************************************************************************/
  public async init() {
    this.loadSavedBudgets();
    await this.checkForUpdates();
    await this.preloadData();
    this._subscribeToRouteChanges();
  }
  _subscribeToRouteChanges() {
    this.route.queryParams.subscribe((params) =>
      this.routeParamsChanged(params as IBudgetQueryParams)
    );
  }
  @action
  private routeParamsChanged(params: IBudgetQueryParams) {
    if (params.period && params.type) {
      this.activePeriod = Number(params.period);
      this.activeType = params.type;
    }
    console.log('active period', toJS(this.activePeriod));
  }

  // load the corresponding values into the budgetMeta observable
  @action
  private async preloadData() {
    const endpoint = 'budgetTool/_all/cards';
    this.budgetCards = await this.db.getCollection<IBudgetCard>(endpoint);
  }
  // check for latest app version initialised. If this one is different then
  // attempt to reload any hardcoded data present in the app
  private async checkForUpdates() {
    const version = await this.db.getDoc<IAppMeta>('_appMeta', 'VERSION');
    const updateRequired = !version || version.value !== APP_VERSION.number;
    if (updateRequired) {
      await this.setHardcodedData();
      const update: IAppMeta = { _key: 'VERSION', value: APP_VERSION.number };
      this.db.setDoc('_appMeta', update);
    }
  }

  private async setHardcodedData() {
    const endpoint = 'budgetTool/_all/cards';
    const docs: IBudgetCardDB[] = CARDS.map((card) => {
      return {
        ...card,
        // add doc metadata - this would be auto populated however want to keep
        // reference of app version date so can be overwritten by db if desired
        _created: new Date(APP_VERSION.date).toISOString(),
        _modified: new Date(APP_VERSION.date).toISOString(),
        _key: `${card.type}_${card.id}`,
      };
    });
    await this.db.setDocs(endpoint, docs);
  }

  /**************************************************************************
   *            Calculation Methods
   *
   ***************************************************************************/

  private _calculateBalance(budget: IBudget): IBudgetBalance {
    // total for current period
    const totals: { period: number; running: number }[] = [];
    let runningTotal = 0;
    budget.data.forEach((period, i) => {
      const periodTotal = this._calculatePeriodTotal(period);
      runningTotal = runningTotal + periodTotal;
      totals[i] = {
        period: periodTotal,
        running: runningTotal,
      };
    });
    return totals;
  }
  private _calculatePeriodTotal(period: IBudgetPeriodData) {
    let balance = 0;
    const inputCards = Object.values(period.inputs);
    const inputsBalance = this._calculatePeriodCardTotals(inputCards);
    const outputCards = Object.values(period.outputs);
    const outputsBalance = this._calculatePeriodCardTotals(outputCards);
    balance = outputsBalance - inputsBalance;
    return balance;
  }
  private _calculatePeriodCardTotals(cards: IBudgetCard[]) {
    let total = 0;
    cards.forEach((card) => {
      const t = card.values?.total ? card.values.total : 0;
      total = total + t;
    });
    return total;
  }

  /**************************************************************************
   *           Helper Methods
   *
   ***************************************************************************/

  // create list of labels depending on scale, total and start, e.g. ['week 1','week 2'] or ['Sep','Oct','Nov']
  private _generateLabels(meta: IBudgetMeta): string[] {
    const { lengthScale, lengthTotal, monthStart = 1 } = meta;
    if (lengthScale === 'weeks') {
      return new Array(lengthTotal).fill(0).map((_, i) => 'Week ' + (i + 1));
    }
    if (lengthScale === 'days') {
      return new Array(lengthTotal).fill(0).map((_, i) => 'Day ' + (i + 1));
    }
    if (lengthScale === 'months') {
      // duplicate array so that can still slice up to 12 months from dec
      const base = [...MONTHS, ...MONTHS];
      return base.slice(monthStart - 1, lengthTotal + monthStart - 1);
    }
    return [];
  }
  // group all enterprise cards and create new parent card that will be used to reveal group
  private _createCardGroupCards(cards: IBudgetCard[]): IBudgetCardDB[] {
    const allGroupings: string[][] = cards.map(
      (e) => toJS(e.groupings) as string[]
    );
    // eslint-disable-next-line prefer-spread
    const mergedGroupings: string[] = ([] as any).concat.apply(
      [],
      allGroupings
    );
    // NOTE - technically Array.from shouldn't be required but current issue with typescript
    // see https://stackoverflow.com/questions/33464504/using-spread-syntax-and-new-set-with-typescript/33464709
    const uniqueGroups = [...Array.from(new Set(mergedGroupings))].sort();
    const enterpriseTypeCards: IBudgetCardDB[] = uniqueGroups.map((group) => {
      return {
        id: group,
        label: group,
        type: 'enterprise',
        imgType: 'svg',
        _key: `_group_${group}`,
        _created: new Date().toISOString(),
        _modified: new Date().toISOString(),
      };
    });
    return enterpriseTypeCards;
  }
  // each currency has a base unit (e.g. MK 1000) which is used to generate
  // counter representations in orders of 10 (i.e. 100, 1000, 10000) and half values.
  // These can additionaly be scaled up or down by magnitudes of 10.
  private _generateValueCounters(budget: IBudget) {
    const scale = budget.meta.valueScale;
    // use rounding to avoid annoying precious errors
    const b = Math.round(ENVIRONMENT.region.currencyBaseValue * scale);
    // return as arrays to ensure order retained if iterating over
    const counters: IBudgetValueCounters = [
      ['large', 'large-half', 'medium', 'medium-half', 'small', 'small-half'],
      [10 * b, 5 * b, b, b / 2, b / 10, b / 20],
    ];
    return counters;
  }
}
