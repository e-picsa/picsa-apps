import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-view',
  templateUrl: './budget-view.page.html',
  styleUrls: ['./budget-view.page.scss']
})
export class BudgetViewPage implements OnInit {
  loader: HTMLIonLoadingElement;

  constructor(private route: ActivatedRoute, private store: BudgetStore) {}

  ngOnInit() {
    this.loadBudget();
  }

  async loadBudget() {
    // if (this.loader) {
    //   await this.loader.dismiss();
    // }
    // const loadingTxt = await this.translations.translateText(
    //   'Preparing budget'
    // );
    // const loader = await this.loadingCtrl.create({
    //   message: loadingTxt
    // });
    // await loader.present();
    const budgetKey = this.route.snapshot.params.budgetKey;
    this.store.loadBudgetByKey(budgetKey);
    // // give small timeout to give appearance of smoother rendering
    // setTimeout(async () => {
    //   await loader.dismiss();
    // }, 1000);
  }
}
