import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { MONTH_DATA } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';
import { deepClone } from '@picsa/utils';
import { map, Subject, switchMap, takeUntil } from 'rxjs';

import { BudgetToolComponentsModule } from '../../components/budget-tool.components';
import { BudgetMaterialModule } from '../../material.module';
import { IBudgetMeta, IEnterpriseScaleLentgh } from '../../models/budget-tool.models';
import { IBudgetCard, IBudgetCardType } from '../../schema';
import { BudgetStore } from '../../store/budget.store';
import { BudgetCardService } from '../../store/budget-card.service';
import { PERIOD_DATA_TEMPLATE } from '../../store/templates';

@Component({
  selector: 'budget-create',
  templateUrl: './budget-create.page.html',
  styleUrls: ['./budget-create.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BudgetMaterialModule, FormsModule, FormField, BudgetToolComponentsModule, PicsaTranslateModule],
})
export class BudgetCreatePage implements OnInit, OnDestroy {
  store = inject(BudgetStore);
  private cardService = inject(BudgetCardService);
  private dialogRef = inject<MatDialogRef<BudgetCreatePage>>(MatDialogRef);
  private cdr = inject(ChangeDetectorRef);

  // Define the writable signal model initialized with empty defaults
  public readonly budgetModel = signal<IBudgetMeta>({
    title: '',
    description: '',
    lengthScale: 'months',
    lengthTotal: 5,
    monthStart: 9,
    valueScale: 1,
    enterprise: {
      id: '',
      label: '',
      type: null as any,
      groupings: [],
      imgType: 'svg',
    },
  });

  // Define the Signal Form tree with validation
  public readonly budgetForm = form(this.budgetModel, (path) => {
    required(path.title);
    required(path.lengthScale);
    required(path.enterprise);
    required(path.monthStart);
  });

  enterpriseToggle = signal(false);
  enterpriseType = signal<string | undefined>(undefined);
  enterpriseType$ = new Subject<string>();
  filteredEnterprises = signal<IBudgetCard[]>([]);
  periodScaleOptions: IEnterpriseScaleLentgh[] = ['weeks', 'months'];
  periodTotalOptions = new Array(12).fill(0).map((v, i) => i + 1);
  periodLabelOptions = [...MONTH_DATA.map((m) => m.labelShort)];
  enterpriseTypeCards: IBudgetCard[] = [];
  private componentDestroyed$ = new Subject<boolean>();
  @ViewChild('stepper', { static: true }) stepper: MatStepper;

  async ngOnInit() {
    this.store.createNewBudget();
    this.budgetModel.set(deepClone(this.store.activeBudget.meta));
    this.enterpriseTypeCards = this.cardService.enterpriseGroups;
    this.subscribeToEnterpriseChanges();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  /**************************************************************************
   *  Public Helpers
   **************************************************************************/

  async enterpriseTypeClicked(type: string) {
    // reset form on new type selected
    this.enterpriseType.set(type);
    this.enterpriseType$.next(type);

    this.enterpriseToggle.set(false);
    this.budgetModel.update((meta) => ({
      ...meta,
      enterprise: { ...meta.enterprise, type: type as IBudgetCardType },
    }));

    setTimeout(async () => {
      this.enterpriseToggle.set(true);
      this.cdr.markForCheck();
    }, 200);
  }

  setEnterprise(enterprise: IBudgetCard) {
    this.budgetModel.update((meta) => ({
      ...meta,
      enterprise,
    }));
  }

  async customEnterpriseCreated(enterprise: IBudgetCard) {
    this.setEnterprise(enterprise);
  }

  /**
   * Subscribe to enterprise type group select to automatically
   * retrieve cards related to that enterprise grouping
   * Use inner subscription to include live updates from custom cards created
   */
  private async subscribeToEnterpriseChanges() {
    this.enterpriseType$
      .pipe(
        switchMap(() => {
          const ref = this.cardService.dbCollection.find({ selector: { type: 'enterprise' } });
          return ref.$.pipe(map((docs) => docs.map((doc) => doc._data)));
        }),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe((enterprises) => {
        const type = this.enterpriseType();
        this.filteredEnterprises.set(enterprises.filter((e) => e.groupings?.includes(type as any)));
      });
  }

  async save() {
    const meta = this.budgetModel();
    // generate period data
    const data = new Array(meta.lengthTotal).fill(PERIOD_DATA_TEMPLATE);
    await this.store.patchBudget({ data, meta });
    this.dialogRef.close(this.store.activeBudget._key);
  }

  public trackByFn(index: number, item: IBudgetCard) {
    return item.id;
  }
}
