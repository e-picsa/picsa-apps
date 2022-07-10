import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetStore } from '../../store/budget.store';
import {
  IEnterpriseScaleLentgh,
  IBudgetMeta,
  IBudgetCard,
  IBudgetCardDB,
} from '../../models/budget-tool.models';
import { MatStepper } from '@angular/material/stepper';
import { MONTHS, PERIOD_DATA_TEMPLATE } from '../../store/templates';
import { Router, ActivatedRoute } from '@angular/router';
import { FadeInOut, ANIMATION_DELAYED } from '@picsa/shared/animations';

@Component({
  selector: 'budget-create',
  templateUrl: './budget-create.page.html',
  styleUrls: ['./budget-create.page.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetCreatePage implements OnInit {
  budgetMetaForm: FormGroup;
  enterpriseToggle = false;
  selectedType: string;
  filteredEnterprises: IBudgetCard[] = [];
  periodScaleOptions: IEnterpriseScaleLentgh[] = ['weeks', 'months'];
  periodTotalOptions = new Array(12).fill(0).map((v, i) => i + 1);
  periodLabelOptions = [...MONTHS];
  enterpriseTypeCards: IBudgetCardDB[] = [];
  @ViewChild('stepper', { static: true }) stepper: MatStepper;
  constructor(
    private fb: FormBuilder,
    public store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.store.createNewBudget();
    this.generateBudgetForm();
    this.enterpriseTypeCards = this.store.enterpriseTypeCards;
  }

  /**************************************************************************
   *  Public Helpers
   **************************************************************************/

  enterpriseTypeClicked(type: string) {
    // reset form on new type selected
    this.selectedType = type;
    this.enterpriseToggle = false;
    this.budgetMetaForm.patchValue({ enterprise: { type } });
    setTimeout(() => {
      this.filteredEnterprises = this.store.getfilteredEnterprises(type);
      this.enterpriseToggle = true;
    }, 200);
  }

  enterpriseClicked(enterprise: IBudgetCard) {
    // TODO - defaults no longer set for each enterprise,
    // possibly find a way to store somewhere and lookup
    this.budgetMetaForm.patchValue({
      enterprise: enterprise,
    });
  }

  customEnterpriseCreated(enterprise: IBudgetCard) {
    this.filteredEnterprises = this.store.getfilteredEnterprises(
      this.selectedType
    );
    this.enterpriseClicked(enterprise);
  }
  async save() {
    const meta = this.budgetMetaForm.value as IBudgetMeta;
    // generate period data
    const data = new Array(meta.lengthTotal).fill(PERIOD_DATA_TEMPLATE);
    await this.store.patchBudget({ data, meta });
    this.router.navigate(['../', 'view', this.store.activeBudget._key], {
      relativeTo: this.route,
    });
  }

  public trackByFn(index: number, item: IBudgetCardDB) {
    return item.id;
  }

  /**************************************************************************
   *  Private Generators & Helpers
   **************************************************************************/

  // create general form with formgroups for all budget fields
  // add required vaildation for fields which must be completed in this page
  private generateBudgetForm() {
    const requiredFields1: IBudgetMetaKey[] = [
      'enterprise',
      'title',
      'lengthScale',
    ];
    this.budgetMetaForm = this._generateFormFromValues(
      this.store.activeBudget.meta,
      requiredFields1
    );
  }

  // custom method to generate simple form from json object and populate with provided initial values
  // accepts array of fields to add required validators too
  private _generateFormFromValues(v: any, requiredFields: string[] = []) {
    const fieldGroup = {};
    Object.keys(v).forEach(
      (key) =>
        (fieldGroup[key] = [
          v[key],
          requiredFields.includes(key) ? Validators.required : null,
        ])
    );
    return this.fb.group(fieldGroup);
  }
}

// need to specify only string keys as technically could be numbers (change in ts 2.9)
type IBudgetMetaKey = Extract<keyof IBudgetMeta, string>;
