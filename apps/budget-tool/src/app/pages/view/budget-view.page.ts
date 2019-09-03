import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BudgetStore } from '../../store/budget.store';
import {
  FadeInOut,
  OpenClosed,
  FlyInOut,
  ANIMATION_DELAYED,
  ANIMATION_DEFAULTS_Y
} from '@picsa/animations';

@Component({
  selector: 'budget-view',
  templateUrl: './budget-view.page.html',
  styleUrls: ['./budget-view.page.scss'],
  animations: [
    FadeInOut(ANIMATION_DELAYED),
    OpenClosed,
    FlyInOut(ANIMATION_DEFAULTS_Y)
  ]
})
export class BudgetViewPage implements OnInit, OnDestroy {
  loader: HTMLIonLoadingElement;
  isEditorOpen = false;
  periodLabel: string;

  constructor(
    private route: ActivatedRoute,
    private store: BudgetStore,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBudget();
    this._addRouterSubscription();
  }
  ngOnDestroy() {
    console.log('Budget DESTROYED - TODO - REMOVE SUBSCRIPTIONS');
  }
  private _addRouterSubscription() {
    this.route.queryParams.subscribe(params => {
      this.isEditorOpen = params.edit;
      this.periodLabel = params.label;
    });
  }

  closeEditor() {
    this.router.navigate([], { relativeTo: this.route, replaceUrl: true });
  }

  async loadBudget() {
    const budgetKey = this.route.snapshot.params.budgetKey;
    this.store.loadBudgetByKey(budgetKey);
  }
}
