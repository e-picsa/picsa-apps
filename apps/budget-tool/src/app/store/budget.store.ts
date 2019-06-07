import {
  IBudget,
  IEnterprise,
  IBudgetCard,
  IEnterpriseType
} from '../models/budget-tool.models';
import { checkForBudgetUpgrades } from '../utils/budget.upgrade';
import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { TranslationsProvider } from '@picsa/core/services';
import { NEW_BUDGET_TEMPLATE } from './templates';
import { BUDGET_DATA } from './budget.data';
import { toJS } from 'mobx';

@Injectable({
  providedIn: 'root'
})
export class BudgetStore {
  @observable enterprises = BUDGET_DATA.enterprises;
  @observable enterpriseTypes = BUDGET_DATA.enterpriseTypes;
  @observable activeBudget: IBudget;
  @observable filteredEnterprises: IEnterprise[];
  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
    console.log('active budget', toJS(this.activeBudget));
  }
  constructor(private translations: TranslationsProvider) {
    this.createNewBudget();
  }

  createNewBudget() {
    const budget: IBudget = NEW_BUDGET_TEMPLATE;
    this.setActiveBudget(budget);
    // publish event to force card list update
    // this.events.publish("load:budget");
  }
  setEnterpriseType(type: IEnterpriseType) {
    this.filteredEnterprises = [
      ...this.enterprises.filter(e => e.type === type)
    ];
    this.setActiveBudget({ ...this.activeBudget, enterpriseType: type });
  }

  patchBudget(patch: Partial<IBudget>) {
    this.setActiveBudget({ ...this.activeBudget, ...patch });
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
}
