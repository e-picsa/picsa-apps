import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetStore } from '../../store/budget.store';
import {
  IEnterprise,
  IEnterpriseScale,
  IBudget
} from '../../models/budget-tool.models';
import { MatHorizontalStepper } from '@angular/material/stepper';
import { MONTHS } from '../../store/templates';
import { Router } from '@angular/router';
import { FadeInOut } from '@picsa/animations';

@Component({
  selector: 'budget-create',
  templateUrl: './budget-create.page.html',
  styleUrls: ['./budget-create.page.scss'],
  animations: [FadeInOut()]
})
export class BudgetCreatePage implements OnInit {
  budgetForm: FormGroup;
  periodForm: FormGroup;
  enterpriseToggle = false;
  filteredEnterprises: IEnterprise[] = [];
  periodScaleOptions: IEnterpriseScale[] = ['weeks', 'months'];
  periodTotalOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  periodLabelOptions = [...MONTHS];
  @ViewChild('stepper', { static: true }) stepper: MatHorizontalStepper;
  constructor(
    private fb: FormBuilder,
    public store: BudgetStore,
    private router: Router
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
    this.enterpriseToggle = false;
    this.budgetForm.patchValue({ enterprise: '', enterpriseType: type });
    setTimeout(() => {
      this.filteredEnterprises = this.store.getfilteredEnterprises(type);
      this.enterpriseToggle = true;
    }, 200);
  }

  enterpriseClicked(enterprise: IEnterprise) {
    const enterpriseDefaultPeriods = this.store.getBudgetEnterpriseDefaults(
      enterprise
    );
    this.budgetForm.patchValue({
      enterprise: enterprise.id,
      periods: enterpriseDefaultPeriods
    });
  }
  async save() {
    // generate period labels before saving
    this.periodForm.patchValue({
      labels: this.store.generateLabels(this.periodForm.value)
    });
    await this.store.patchBudget(this.budgetForm.value);
    this.router.navigate(['view', this.store.activeBudget._key]);
  }

  /**************************************************************************
   *  Private Generators & Helpers
   **************************************************************************/

  // create general form with formgroups for all budget fields
  // add required vaildation for fields which must be completed in this page
  private generateBudgetForm() {
    const requiredFields: IBudgetKey[] = [
      'enterprise',
      'enterpriseType',
      'title'
    ];
    console.log('active budget value', this.store.activeBudgetValue);
    this.budgetForm = this._generateFormFromValues(
      this.store.activeBudgetValue,
      requiredFields
    );
    this.periodForm = this._generateFormFromValues(
      this.store.activeBudgetValue.periods
    );
    this.budgetForm.setControl('periods', this.periodForm);
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
type IBudgetKey = Extract<keyof IBudget, string>;
