import { Component, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { select } from '@angular-redux/store';
import { IBudget, IBudgetView } from '../../models/budget-tool.models';
import { TranslationsProvider, PrintProvider } from '@picsa/core/services';
import { BudgetToolActions } from '../../store/budget-tool.actions';
import { Events } from '@ionic/angular';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'picsa-budget-home',
  templateUrl: './budget-home.page.html',
  styleUrls: ['./budget-home.page.scss']
})
export class BudgetHomePage implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  // @select(['budget', 'active'])
  // readonly budget$: Observable<IBudget>;
  // @select(['budget', 'view', 'component'])
  // readonly viewComponent$: Observable<string>;
  // @select(['budget', 'view', 'title'])
  // readonly title$: Observable<string>;
  budget: IBudget;
  views: IBudgetView[] = [
    { component: 'overview', title: null, icon: 'apps' },
    { component: 'settings', title: 'Settings', icon: 'settings' }
    // { component: "export", title: "Share Budget", icon: "share" }
  ];
  sharedDisabled: boolean;
  budgetDownloadMessage: string;
  constructor(
    private translations: TranslationsProvider,
    private actions: BudgetToolActions,
    private events: Events,
    private printPrvdr: PrintProvider
  ) {
    // show load screen when first opened
    this.actions.setBudgetView({ component: 'load', title: 'Budget Tool' });
    this.actions.setActiveBudget(null);
    // this.budget$
    //   .pipe(takeUntil(this.componentDestroyed))
    //   .subscribe(budget => (this.budget = budget));
  }
  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }

  async setView(view: IBudgetView) {
    console.log('setting view', view);
    const title = view.title
      ? await this.translations.translateText(view.title)
      : this.budget.title;
    this.actions.setBudgetView({
      component: view.component,
      title: title,
      meta: null
    });
    if (view.component === 'overview') {
      this.events.publish('calculate:budget');
    }
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
