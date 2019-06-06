import REGIONAL_SETTINGS from "src/environments/region";
import { IBudget } from "../models/budget-tool.models";
import {
  BUDGET_API_VERSION,
  checkForBudgetUpgrades
} from "../utils/budget.upgrade";
import { defaults } from "./data";
import { Injectable } from "@angular/core";
import { observable, action } from "mobx-angular";
import { TranslationsProvider } from "src/providers/translations";

@Injectable({
  providedIn: "root"
})
export class BudgetStore {
  @observable activeBudget: IBudget;
  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
    console.log("active budget", this.activeBudget);
  }
  constructor(private translations: TranslationsProvider) {}

  createNewBudget() {
    const budget: IBudget = {
      apiVersion: BUDGET_API_VERSION,
      archived: false,
      created: new Date().toISOString(),
      data: {},
      description: null,
      enterprise: null,
      _key: null,
      periods: defaults.periods.days,
      title: null,
      scale: null,
      enterpriseType: null,
      dotValues: REGIONAL_SETTINGS.currencyCounters
    };
    this.setActiveBudget(budget);
    // this.actions.setBudgetView({
    //   component: "settings",
    //   title: "Settings"
    // });
    // publish event to force card list update
    // this.events.publish("load:budget");
  }

  async loadBudget(budget: IBudget) {
    const loader = await this.translations.createTranslatedLoader({
      message: "Preparing budget"
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
