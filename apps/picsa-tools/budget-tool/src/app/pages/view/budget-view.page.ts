import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { FadeInOut, OpenClosed } from '@picsa/shared/animations';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { Subject, takeUntil } from 'rxjs';

import { BudgetShareDialogComponent } from '../../components/share-dialog/share-dialog.component';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-view',
  templateUrl: './budget-view.page.html',
  styleUrls: ['./budget-view.page.scss'],
  animations: [FadeInOut({ inDelay: 200 }), OpenClosed],
  standalone: false,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class BudgetViewPage implements OnInit, OnDestroy {
  isEditorOpen = false;
  periodLabel: string;
  componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    public store: BudgetStore,
    private componentsService: PicsaCommonComponentsService,
    private dialog: MatDialog,
    private translateService: PicsaTranslateService
  ) {}

  async ngOnInit() {
    await this.loadBudget();
    this.addRouterSubscription();
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
    this.store.unloadActiveBudget();
  }

  async showShareDialog() {
    this.dialog.open(BudgetShareDialogComponent, { disableClose: true });
  }

  async loadBudget() {
    const budgetKey = this.route.snapshot.params.budgetKey;
    await this.store.loadBudgetByKey(budgetKey);
  }

  public async handleEditorNext() {
    // use back-navigation to return to budget view without editor open
    // use component back method to avoid issues on android with location.back
    this.componentsService.back();
  }

  /** Subscribe to query param changes and update headers as required */
  private addRouterSubscription() {
    this.route.queryParams.pipe(takeUntil(this.componentDestroyed$)).subscribe(async (params) => {
      const { edit, period, label, type } = params;
      if (period) {
        this.store.setActivePeriod(Number(period));
      }
      if (type) {
        this.store.setActiveType(type);
      }
      this.isEditorOpen = !!edit;
      this.periodLabel = label;
      if (this.store.activeBudget) {
        const { meta } = this.store.activeBudget;
        let title = meta.title;
        if (this.isEditorOpen) {
          title = await this.translateService.translateText(label);
        }
        this.componentsService.patchHeader({ title });
      }
    });
  }
}
