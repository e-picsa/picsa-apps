import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { ANIMATION_DEFAULTS_Y, FadeInOut, FlyInOut, OpenClosed } from '@picsa/shared/animations';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { Subject, takeUntil } from 'rxjs';

import { BudgetShareDialogComponent } from '../../components/share-dialog/share-dialog.component';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-view',
  templateUrl: './budget-view.page.html',
  styleUrls: ['./budget-view.page.scss'],
  animations: [FadeInOut({ inDelay: 200 }), OpenClosed, FlyInOut(ANIMATION_DEFAULTS_Y)],
})
export class BudgetViewPage implements OnInit, OnDestroy {
  loader: HTMLIonLoadingElement;
  isEditorOpen = false;
  periodLabel: string;
  componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private location: Location,
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
    this.store.activeBudget = undefined as any;
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
    this.location.back();
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
        this.componentsService.setHeader({ title });
      }
    });
  }
}
