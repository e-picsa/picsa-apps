import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BudgetStore } from '../../store/budget.store';
import {
  FadeInOut,
  OpenClosed,
  FlyInOut,
  ANIMATION_DELAYED,
  ANIMATION_DEFAULTS_Y,
} from '@picsa/shared/animations';
import { Subject, takeUntil } from 'rxjs';
import { PrintProvider } from '@picsa/shared/services/native/print';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { IBudgetPeriodData } from '../../models/budget-tool.models';

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
  componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    public store: BudgetStore,
    private printPrvdr: PrintProvider,
    private componentsService: PicsaCommonComponentsService
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
  }

  /** Subscribe to query param changes and update headers as required */
  private addRouterSubscription() {
    this.route.queryParams
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((params) => {
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
            title = label;
            if (type) {
              const typeLabel = this.store.typeLabels[type];
              title = `${typeLabel} - ${title}`;
            }
          }
          this.componentsService.setHeader({ title });
        }
      });
  }
}
