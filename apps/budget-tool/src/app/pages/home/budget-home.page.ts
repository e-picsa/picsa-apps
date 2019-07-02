import { Component, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { select } from '@angular-redux/store';
import { IBudget, IBudgetView } from '../../models/budget-tool.models';
import { TranslationsProvider, PrintProvider } from '@picsa/core/services';
import { BudgetToolActions } from '../../store/budget-tool.actions';
import { Events } from '@ionic/angular';
import { takeUntil } from 'rxjs/operators';
import { BudgetStore } from '../../store/budget.store';
import { Router } from '@angular/router';
@Component({
  selector: 'budget-home',
  templateUrl: './budget-home.page.html',
  styleUrls: ['./budget-home.page.scss']
})
export class BudgetHomePage implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  @select(['budget', 'active'])
  readonly budget$: Observable<IBudget>;
  @select(['budget', 'view', 'component'])
  readonly viewComponent$: Observable<string>;
  @select(['budget', 'view', 'title'])
  readonly title$: Observable<string>;
  budget: IBudget;
  views: IBudgetView[] = [
    { component: 'overview', title: null, icon: 'apps' },
    { component: 'settings', title: 'Settings', icon: 'settings' },
    { component: 'export', title: 'Share Budget', icon: 'share' }
  ];
  sharedDisabled: boolean;
  budgetDownloadMessage: string;
  constructor(
    private translations: TranslationsProvider,
    private printPrvdr: PrintProvider,
    public store: BudgetStore,
    private router: Router
  ) {}
  createClicked() {
    this.router.navigate(['create']);
  }
  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }

  async shareBudget() {
    this.sharedDisabled = true;
    try {
      this.budgetDownloadMessage = 'preparing';
      await this.printPrvdr.socialShareBudget('#budget', this.budget.title);
      this.budgetDownloadMessage = null;
    } catch (error) {
      console.error(error);
      this.budgetDownloadMessage = 'error';
    }
    this.sharedDisabled = false;
  }
}
