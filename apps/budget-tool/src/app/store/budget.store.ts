import {
  IBudget,
  IEnterprise,
  IBudgetPeriodMeta,
  IEnterpriseDefaults,
  IBudgetPeriodData,
  IBudgetCard,
  IBudgetActiveCell,
  IBudgetMeta
} from '../models/budget-tool.models';
import { checkForBudgetUpgrades } from '../utils/budget.upgrade';
import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { NEW_BUDGET_TEMPLATE, MONTHS } from './templates';
import BUDGET_DATA from '../data';
import { toJS } from 'mobx';
import { PicsaDbService } from '@picsa/services/core/';
import { IAppMeta, IDBEndpoint } from '@picsa/models/db.models';
import { APP_VERSION } from '@picsa/environments/version';

@Injectable({
  providedIn: 'root'
})
export class BudgetStore {
  @observable budgetMeta: IBudgetMeta;
  @observable activeBudget: IBudget;
  @observable activeCell: IBudgetActiveCell;
  @observable isEditorOpen = false;
  @observable savedBudgets: IBudget[];
  get activeBudgetValue() {
    return toJS(this.activeBudget);
  }
  // get unique list of types in enterprise cards
  @computed get enterpriseTypes() {
    return this.budgetMeta
      ? [...new Set(this.budgetMeta.enterprises.map(e => e.type))].sort()
      : [];
  }
  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
    console.log('active budget', toJS(this.activeBudget));
  }

  constructor(private db: PicsaDbService) {
    this.init();
  }

  /**************************************************************************
   *            Initialisation
   *
   ***************************************************************************/
  async init() {
    this.loadSavedBudgets();
    await this.checkForUpdates();
    await this.preloadData();
  }

  // load the corresponding values into the budgetMeta observable
  @action()
  private async preloadData() {
    const budgetMeta: any = {};
    for (let key of Object.keys(BUDGET_DATA)) {
      const endpoint = `budgetTool/_all/${key}` as IDBEndpoint;
      budgetMeta[key] = await this.db.getCollection(endpoint);
    }
    this.budgetMeta = budgetMeta;
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
    for (let key of Object.keys(BUDGET_DATA)) {
      const endpoint = `budgetTool/_all/${key}` as IDBEndpoint;
      const docs = BUDGET_DATA[key].map(d => {
        return {
          ...d,
          // add doc metadata - this would be auto populated however want to keep
          // reference of app version date so can be overwritten by db if desired
          _created: new Date(APP_VERSION.date).toISOString(),
          _modified: new Date(APP_VERSION.date).toISOString(),
          _key: d.id
        };
      });
      await this.db.setDocs(endpoint, docs);
    }
  }

  /**************************************************************************
   *            Enterprise methods
   *
   ***************************************************************************/
  getfilteredEnterprises(type: string) {
    return this.budgetMeta.enterprises.filter(e => e.type === type);
  }
  getBudgetEnterpriseDefaults(enterprise: IEnterprise): IBudgetPeriodMeta {
    const d = enterprise.defaults;
    return {
      scale: d.scale,
      total: d.total,
      labels: this.generateLabels(d),
      starting: d.starting
    };
  }
  /**************************************************************************
   *            Budget Values
   *
   ***************************************************************************/
  patchBudget(patch: Partial<IBudget>) {
    this.setActiveBudget({ ...this.activeBudget, ...patch });
    return this.saveBudget();
  }
  @action()
  toggleEditor(cell?: IBudgetActiveCell) {
    if (cell) {
      const periodData = this.activeBudget.data[cell.periodIndex];
      const value = periodData ? periodData[cell.type] : {};
      this.activeCell = { ...cell, value };
      console.log('cell', toJS(this.activeCell));
    }
    this.isEditorOpen = !this.isEditorOpen;
  }

  /**************************************************************************
   *            Budget Create/Save/Load
   *
   ***************************************************************************/

  createNewBudget() {
    const budget: IBudget = {
      ...NEW_BUDGET_TEMPLATE,
      ...this.db.generateMeta()
    };
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
      const budget = this.savedBudgets.find(b => b._key === key);
      this.loadBudget(toJS(budget));
    }
  }
  async loadBudget(budget: IBudget) {
    budget = checkForBudgetUpgrades(budget);
    this.setActiveBudget(budget);
    // this.events.publish("calculate:budget");
    // // publish event to force card list update
    // this.events.publish("load:budget");
  }

  private async loadSavedBudgets(): Promise<void> {
    this.savedBudgets = await this.db.getCollection<IBudget>(
      'budgetTool/${GROUP}/budgets'
    );
  }

  async deleteBudget(budget: IBudget) {
    console.log('archiving budget', budget, budget._key);
    await this.db.deleteDocs('budgetTool/${GROUP}/budgets', [budget._key]);
    this.loadSavedBudgets();
    console.log('budget deleted');
  }

  /**************************************************************************
   *            Calculation Methods
   *
   ***************************************************************************/

  private calculateBalance() {
    // total for current period
    // const data = this.store.activeBudget.data;
    // const totals = {};
    // let runningTotal = 0;
    // for (const key in data) {
    //   if (data.hasOwnProperty(key)) {
    //     const periodTotal = this._calculatePeriodTotal(data[key]);
    //     runningTotal = runningTotal + periodTotal;
    //     totals[key] = {
    //       period: periodTotal,
    //       running: runningTotal
    //     };
    //   }
    // }
    // this.balance = totals;
  }
  private _calculatePeriodTotal(period: IBudgetPeriodData) {
    let balance = 0;
    if (period) {
      const inputCards = Object.values(period.inputs);
      const inputsBalance = this._calculatePeriodCardTotals(inputCards);
      const outputCards = Object.values(period.outputs);
      const outputsBalance = this._calculatePeriodCardTotals(outputCards);
      balance = inputsBalance + outputsBalance;
    }
    return balance;
  }
  private _calculatePeriodCardTotals(cards: IBudgetCard[]) {
    let total = 0;
    if (cards && cards.length > 0) {
      cards.forEach(card => {
        if (card.quantity && card.cost) {
          const quantity = card.consumed
            ? card.quantity - card.consumed
            : card.quantity;
          total = total + quantity * card.cost;
        }
      });
    }
    return total;
  }

  /**************************************************************************
   *           Helper Methods
   *
   ***************************************************************************/

  // create list of labels depending on scale, total and start, e.g. ['week 1','week 2'] or ['Sep','Oct','Nov']
  generateLabels(d: IEnterpriseDefaults): string[] {
    // duplicate array so that can still slice up to 12 months from dec
    let base = [...MONTHS, ...MONTHS];
    if (d.scale === 'weeks') {
      base = base.map((v, i) => `Week ${i + 1}`);
    }
    const labels = base.slice(d.starting - 1, d.total + d.starting - 1);
    return labels;
  }
}

/**************************************************************************
 *          Interfaces
 *
 ***************************************************************************/
