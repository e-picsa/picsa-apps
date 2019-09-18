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
import { Subscription } from 'rxjs';
import { PrintProvider } from '@picsa/services/native/print';

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
  param$: Subscription;

  constructor(
    private route: ActivatedRoute,
    public store: BudgetStore,
    private router: Router,
    private printPrvdr: PrintProvider
  ) {}

  ngOnInit() {
    this.loadBudget();
    this._addRouterSubscription();
  }
  ngOnDestroy() {
    this.param$.unsubscribe();
  }
  closeEditor() {
    this.isEditorOpen = false;
    this.router.navigate([], { relativeTo: this.route, replaceUrl: true });
  }
  async showShareDialog() {
    try {
      await this.printPrvdr.socialShareBudget(
        '#budget',
        this.store.activeBudget.meta.title
      );
    } catch (error) {
      console.error(error);
    }
  }

  async loadBudget() {
    const budgetKey = this.route.snapshot.params.budgetKey;
    this.store.loadBudgetByKey(budgetKey);
  }

  private _addRouterSubscription() {
    this.param$ = this.route.queryParams.subscribe(params => {
      this.isEditorOpen = params.edit;
      this.periodLabel = params.label;
    });
  }
}
