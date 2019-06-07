import {
  IBudget,
  IEnterprise,
  IEnterpriseScale,
  IBudgetPeriodMeta
} from '../models/budget-tool.models';
import { checkForBudgetUpgrades } from '../utils/budget.upgrade';
import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { TranslationsProvider, MONTHS } from '@picsa/core/services';
import { NEW_BUDGET_TEMPLATE } from './templates';
import { BUDGET_DATA } from '../data/budget.data';
import { toJS } from 'mobx';

@Injectable({
  providedIn: 'root'
})
export class BudgetStore {
  @observable enterprises = BUDGET_DATA.enterprises;
  @observable enterpriseTypes = BUDGET_DATA.enterpriseTypes;
  @computed get filteredEnterprises(): IEnterprise[] {
    return this.filterEnterprises();
  }
  @observable enterprisePeriods: IBudgetPeriodMeta;
  @observable activeBudget: IBudget;

  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
    console.log('active budget', toJS(this.activeBudget));
  }
  constructor(private translations: TranslationsProvider) {
    this.createNewBudget();
  }

  /**************************************************************************
   *            Budget Settings
   *
   ***************************************************************************/
  filterEnterprises() {
    return this.enterprises.filter(
      e => e.type === this.activeBudget.enterpriseType
    );
  }
  setBudgetEnterpriseDefaults(enterprise: IEnterprise) {
    const d = enterprise.defaults;
    this.enterprisePeriods = {
      scale: d.scale,
      total: d.total,
      labels: this._generateLabels(d.scale, d.total, d.starting),
      starting: d.starting
    };
    this.patchBudget({ periods: this.enterprisePeriods });
  }
  /**************************************************************************
   *            Budget Values
   *
   ***************************************************************************/
  patchBudget(patch: Partial<IBudget>) {
    this.setActiveBudget({ ...this.activeBudget, ...patch });
  }

  /**************************************************************************
   *            Budget Create/Save/Load
   *
   ***************************************************************************/
  createNewBudget() {
    const budget: IBudget = NEW_BUDGET_TEMPLATE;
    this.setActiveBudget(budget);
    // publish event to force card list update
    // this.events.publish("load:budget");
  }
  async loadBudget(budget: IBudget) {
    const loader = await this.translations.createTranslatedLoader({
      message: 'Preparing budget'
    });
    await loader.present();
    budget = checkForBudgetUpgrades(budget);
    this.setActiveBudget(budget);
    // this.actions.setBudgetView({
    //   component: "overview",
    //   title: budget.title
    // });
    // this.events.publish("calculate:budget");
    // // publish event to force card list update
    // this.events.publish("load:budget");
    // // give small timeout to give appearance of smoother rendering
    setTimeout(async () => {
      await loader.dismiss();
    }, 1000);
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

  // create list of labels depending on scale, total and start, e.g. ['week 1','week 2'] or ['Sep','Oct','Nov']
  _generateLabels(scale: IEnterpriseScale, total: number, starting: number) {
    // duplicate array so that can still slice up to 12 months from dec
    let base = [...MONTHS, ...MONTHS];
    if (scale === 'weeks') {
      base = base.map((v, i) => `Week ${i + 1}`);
    }
    const labels = base.slice(starting - 1, total + starting - 1);
    return labels;
  }
}
