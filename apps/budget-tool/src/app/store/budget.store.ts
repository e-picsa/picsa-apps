import {
  IBudget,
  IEnterprise,
  IBudgetPeriodMeta,
  IEnterpriseType,
  IEnterpriseDefaults
} from '../models/budget-tool.models';
import { checkForBudgetUpgrades } from '../utils/budget.upgrade';
import { Injectable } from '@angular/core';
import { observable, action } from 'mobx-angular';
import { MONTHS, DBService, StorageProvider } from '@picsa/core/services';
import { NEW_BUDGET_TEMPLATE } from './templates';
import { BUDGET_DATA } from '../data/budget.data';
import { toJS } from 'mobx';

@Injectable({
  providedIn: 'root'
})
export class BudgetStore {
  @observable enterprises = BUDGET_DATA.enterprises;
  @observable enterpriseTypes = BUDGET_DATA.enterpriseTypes;
  @observable activeBudget: IBudget;
  @observable savedBudgets: IBudget[];
  get activeBudgetValue() {
    return toJS(this.activeBudget);
  }
  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
    console.log('active budget', toJS(this.activeBudget));
  }

  constructor(private db: DBService, private storage: StorageProvider) {
    this.loadSavedBudgets();
  }

  /**************************************************************************
   *            Enterprise methods
   *
   ***************************************************************************/
  getfilteredEnterprises(type: IEnterpriseType) {
    return this.enterprises.filter(e => e.type === type);
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
    this.saveBudget();
  }

  /**************************************************************************
   *            Budget Create/Save/Load
   *
   ***************************************************************************/

  createNewBudget() {
    const budget: IBudget = {
      ...NEW_BUDGET_TEMPLATE,
      ...this.db.generateDocMeta()
    };
    this.setActiveBudget(budget);
  }
  async saveBudget() {
    const patch = { [this.activeBudgetValue._key]: this.activeBudgetValue };
    await this.storage.patch('budgets', patch);
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
    const stored: { [key: string]: IBudget } = await this.storage.get(
      'budgets'
    );
    this.savedBudgets = Object.values({ ...stored });
    console.log('saved budgets', toJS(this.savedBudgets));
  }

  async archiveBudget(budget: IBudget) {
    this.activeBudget = { ...this.activeBudget, archived: true };
    // const toast = await this.translations.createTranslatedToast({
    //   message: "Budget archived",
    //   duration: 3000
    // });
    // await this.saveBudget(budget);
    // await toast.present();
  }
  async restoreBudget(budget: IBudget) {
    this.activeBudget = { ...this.activeBudget, archived: false };
    // const toast = await this.translations.createTranslatedToast({
    //   message: "Budget restored",
    //   duration: 3000
    // });
    // await this.budgetPrvdr.saveBudget(budget);
    // await toast.present();
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
