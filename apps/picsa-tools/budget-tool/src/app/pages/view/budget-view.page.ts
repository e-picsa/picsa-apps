import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BudgetStore } from '../../store/budget.store';
import {
  FadeInOut,
  OpenClosed,
  FlyInOut,
  ANIMATION_DELAYED,
  ANIMATION_DEFAULTS_Y,
} from '@picsa/shared/animations';
import { Subscription } from 'rxjs';
import { PrintProvider } from '@picsa/shared/services/native/print';
import { PicsaCommonComponentsService } from '@picsa/components/src';

@Component({
  selector: 'budget-view',
  templateUrl: './budget-view.page.html',
  styleUrls: ['./budget-view.page.scss'],
  animations: [
    FadeInOut(ANIMATION_DELAYED),
    OpenClosed,
    FlyInOut(ANIMATION_DEFAULTS_Y),
  ],
})
export class BudgetViewPage implements OnInit, OnDestroy {
  loader: HTMLIonLoadingElement;
  isEditorOpen = false;
  isSharing = false;
  periodLabel: string;
  param$: Subscription;

  constructor(
    private route: ActivatedRoute,
    public store: BudgetStore,
    private router: Router,
    private printPrvdr: PrintProvider,
    private componentsService: PicsaCommonComponentsService
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
      this.isSharing = true;
      await this.printPrvdr.socialShareBudget(
        '#budget',
        this.store.activeBudget.meta.title
      );
      this.isSharing = false;
    } catch (error) {
      console.error(error);
      this.isSharing = false;
    }
  }

  async loadBudget() {
    const budgetKey = this.route.snapshot.params.budgetKey;
    await this.store.loadBudgetByKey(budgetKey);
    this.componentsService.setHeader({
      title: this.store.activeBudget.meta.title,
    });
  }

  private _addRouterSubscription() {
    this.param$ = this.route.queryParams.subscribe((params) => {
      this.isEditorOpen = params.edit;
      this.periodLabel = params.label;
      const { meta } = this.store.activeBudget;
      const title = this.isEditorOpen ? `${params.label}` : meta.title;
      this.componentsService.setHeader({ title });
    });
  }
}
