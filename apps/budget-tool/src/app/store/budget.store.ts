import {
  IBudget,
  IEnterprise,
  IBudgetCard
} from '../models/budget-tool.models';
import { checkForBudgetUpgrades } from '../utils/budget.upgrade';
import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { TranslationsProvider } from '@picsa/core/services';
import { NEW_BUDGET_TEMPLATE } from './templates';
import { BUDGET_DATA } from './budget.data';

@Injectable({
  providedIn: 'root'
})
export class BudgetStore {
  @observable test = 'hello';
  @observable activeBudget: IBudget;
  @observable enterprises: IEnterprise[];
  @observable filteredEnterprises: IEnterprise[];
  @computed get enterpriseTypes(): IBudgetCard[] {
    return this._getEnterpriseTypes();
  }
  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
    console.log('active budget', this.activeBudget);
  }
  constructor(private translations: TranslationsProvider) {
    this.enterprises = BUDGET_DATA.enterprises;
  }

  createNewBudget() {
    const budget: IBudget = NEW_BUDGET_TEMPLATE;
    this.setActiveBudget(budget);
    // publish event to force card list update
    // this.events.publish("load:budget");
  }
  filterEnterprises(group: string) {
    this.filteredEnterprises = [
      ...this.enterprises.filter(e => e.group === group)
    ];
    console.log('enterprises filtered', group);
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

  // reduce list of enterprises to distinct types and pass back in card format
  private _getEnterpriseTypes(): IBudgetCard[] {
    const distinct = [...new Set(this.enterprises.map(e => e.group))];
    return distinct.map(e => ({
      id: e,
      name: e
    }));
  }
}
