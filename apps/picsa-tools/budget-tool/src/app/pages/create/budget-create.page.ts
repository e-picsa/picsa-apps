import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { MONTH_DATA } from '@picsa/data';
import { ANIMATION_DELAYED, FadeInOut } from '@picsa/shared/animations';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { map, Subject, switchMap, takeUntil } from 'rxjs';

import { BudgetToolComponentsModule } from '../../components/budget-tool.components';
import { BudgetMaterialModule } from '../../material.module';
import { IBudgetMeta, IEnterpriseScaleLentgh } from '../../models/budget-tool.models';
import { IBudgetCard } from '../../schema';
import { BudgetStore } from '../../store/budget.store';
import { BudgetCardService } from '../../store/budget-card.service';
import { PERIOD_DATA_TEMPLATE } from '../../store/templates';

@Component({
  selector: 'budget-create',
  templateUrl: './budget-create.page.html',
  styleUrls: ['./budget-create.page.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [BudgetMaterialModule, FormsModule, ReactiveFormsModule, BudgetToolComponentsModule, PicsaTranslateModule],
})
export class BudgetCreatePage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  store = inject(BudgetStore);
  private cardService = inject(BudgetCardService);
  private dialogRef = inject<MatDialogRef<BudgetCreatePage>>(MatDialogRef);
  private cdr = inject(ChangeDetectorRef);

  budgetMetaForm: FormGroup;
  enterpriseToggle = false;
  enterpriseType: string;
  enterpriseType$ = new Subject<string>();
  filteredEnterprises: IBudgetCard[] = [];
  periodScaleOptions: IEnterpriseScaleLentgh[] = ['weeks', 'months'];
  periodTotalOptions = new Array(12).fill(0).map((v, i) => i + 1);
  periodLabelOptions = [...MONTH_DATA.map((m) => m.labelShort)];
  enterpriseTypeCards: IBudgetCard[] = [];
  private componentDestroyed$ = new Subject<boolean>();
  @ViewChild('stepper', { static: true }) stepper: MatStepper;

  async ngOnInit() {
    this.store.createNewBudget();
    this.generateBudgetForm();
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
    this.enterpriseType = type;
    this.enterpriseType$.next(type);

    this.enterpriseToggle = false;
    this.budgetMetaForm.patchValue({ enterprise: { type } });

    setTimeout(async () => {
      this.enterpriseToggle = true;
    }, 200);
  }

  setEnterprise(enterprise: IBudgetCard) {
    // TODO - defaults no longer set for each enterprise,
    // possibly find a way to store somewhere and lookup
    this.budgetMetaForm.patchValue({
      enterprise: enterprise,
    });
  }

  async customEnterpriseCreated(enterprise: IBudgetCard) {
    this.setEnterprise(enterprise);
    this.cdr.markForCheck();
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
        this.filteredEnterprises = enterprises.filter((e) => e.groupings?.includes(this.enterpriseType as any));
        this.cdr.markForCheck();
      });
  }
  async save() {
    const meta = this.budgetMetaForm.value as IBudgetMeta;
    // generate period data
    const data = new Array(meta.lengthTotal).fill(PERIOD_DATA_TEMPLATE);
    await this.store.patchBudget({ data, meta });
    this.dialogRef.close(this.store.activeBudget._key);
  }

  public trackByFn(index: number, item: IBudgetCard) {
    return item.id;
  }

  /**************************************************************************
   *  Private Generators & Helpers
   **************************************************************************/

  // create general form with formgroups for all budget fields
  // add required vaildation for fields which must be completed in this page
  private generateBudgetForm() {
    const requiredFields1: IBudgetMetaKey[] = ['enterprise', 'title', 'lengthScale'];
    this.budgetMetaForm = this._generateFormFromValues(this.store.activeBudget.meta, requiredFields1);
  }

  // custom method to generate simple form from json object and populate with provided initial values
  // accepts array of fields to add required validators too
  private _generateFormFromValues(v: any, requiredFields: string[] = []) {
    const fieldGroup = {};
    Object.keys(v).forEach(
      (key) => (fieldGroup[key] = [v[key], requiredFields.includes(key) ? Validators.required : null]),
    );
    return this.fb.group(fieldGroup);
  }
}

// need to specify only string keys as technically could be numbers (change in ts 2.9)
type IBudgetMetaKey = Extract<keyof IBudgetMeta, string>;
