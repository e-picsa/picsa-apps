import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetStore } from '../../store/budget.store';
import {
  IEnterpriseScaleLentgh,
  IBudgetMeta,
  IBudgetCard
} from '../../models/budget-tool.models';
import { MatHorizontalStepper } from '@angular/material/stepper';
import { MONTHS, PERIOD_DATA_TEMPLATE } from '../../store/templates';
import { Router, ActivatedRoute } from '@angular/router';
import { FadeInOut, ANIMATION_DEFAULTS } from '@picsa/animations';

@Component({
  selector: 'budget-create',
  templateUrl: './budget-create.page.html',
  styleUrls: ['./budget-create.page.scss'],
  animations: [
    FadeInOut({
      ...ANIMATION_DEFAULTS,
      ...{ inSpeed: 200, inDelay: 500, outSpeed: 100, outDelay: 0 }
    })
  ]
})
export class BudgetCreatePage implements OnInit {
  budgetMetaForm: FormGroup;
  enterpriseToggle = false;
  selectedType: string;
  filteredEnterprises: IBudgetCard[] = [];
  periodScaleOptions: IEnterpriseScaleLentgh[] = ['weeks', 'months'];
  periodTotalOptions = new Array(12).fill(0).map((v, i) => i + 1);
  periodLabelOptions = [...MONTHS];
  @ViewChild('stepper', { static: true }) stepper: MatHorizontalStepper;
  constructor(
    private fb: FormBuilder,
    public store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.store.createNewBudget();
  }

  ngOnInit() {
    this.generateBudgetForm();
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
      enterprise
    });
  }
  async save() {
    const meta = this.budgetMetaForm.value as IBudgetMeta;
    // generate period data
    const data = new Array(meta.lengthTotal).fill(PERIOD_DATA_TEMPLATE);
    await this.store.patchBudget({ data, meta });
    this.router.navigate(['../', 'view', this.store.activeBudget._key], {
      relativeTo: this.route
    });
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
      'lengthScale'
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
      key =>
        (fieldGroup[key] = [
          v[key],
          requiredFields.includes(key) ? Validators.required : null
        ])
    );
    return this.fb.group(fieldGroup);
  }
}

// need to specify only string keys as technically could be numbers (change in ts 2.9)
type IBudgetMetaKey = Extract<keyof IBudgetMeta, string>;
