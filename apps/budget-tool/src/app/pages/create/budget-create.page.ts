import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetStore } from '../../store/budget.store';
import {
  IEnterprise,
  IEnterpriseType,
  IEnterpriseScale
} from '../../models/budget-tool.models';
import { MatHorizontalStepper } from '@angular/material';
import { FadeInOut } from '../../animations/animations';
import { MONTHS } from '../../store/templates';

@Component({
  selector: 'budget-create',
  templateUrl: './budget-create.page.html',
  styleUrls: ['./budget-create.page.scss'],
  animations: [FadeInOut]
})
export class BudgetCreatePage implements OnInit {
  enterpriseForm: FormGroup;
  periodForm: FormGroup;
  enterpriseToggle = false;
  periodScaleOptions: IEnterpriseScale[] = ['weeks', 'months'];
  periodTotalOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  periodLabelOptions = [...MONTHS];
  @ViewChild('stepper', { static: true }) stepper: MatHorizontalStepper;
  constructor(private fb: FormBuilder, public store: BudgetStore) {}

  ngOnInit() {
    const b = this.store.activeBudget;

    // initiate values from active budget
    // NOTE - currently no easy way to add typings, but possible workarounds:
    // https://github.com/angular/angular/issues/13721
    this.enterpriseForm = this.fb.group({
      enterprise: [b.enterprise, Validators.required],
      enterpriseType: [b.enterpriseType, Validators.required]
    });
    this.periodForm = this.fb.group({
      scale: [b.periods.scale, Validators.required],
      starting: [b.periods.starting],
      total: [b.periods.total, Validators.required]
    });
    this.periodForm.valueChanges.subscribe(v => console.log(v));
  }

  enterpriseTypeClicked(type: IEnterpriseType) {
    // reset form on new type selected
    this.enterpriseForm.patchValue({ enterprise: '', enterpriseType: type });
    // toggle animation in line with setting values
    if (!this.enterpriseToggle) {
      this.store.patchBudget(this.enterpriseForm.value);
      this.enterpriseToggle = true;
    } else {
      this.enterpriseToggle = false;
      setTimeout(() => {
        this.store.patchBudget(this.enterpriseForm.value);
        this.enterpriseToggle = true;
      }, 300);
    }
  }

  enterpriseClicked(enterprise: IEnterprise) {
    this.store.setBudgetEnterpriseDefaults(enterprise);
    this.enterpriseForm.patchValue({ enterprise: enterprise.id });
    this.store.patchBudget(this.enterpriseForm.value);
    setTimeout(() => {
      this.stepper.next();
    }, 800);
  }
}
