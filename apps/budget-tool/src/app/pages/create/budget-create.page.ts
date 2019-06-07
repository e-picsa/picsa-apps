import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetStore } from '../../store/budget.store';
import { IEnterprise, IEnterpriseType } from '../../models/budget-tool.models';
import { MatHorizontalStepper } from '@angular/material';
import { OpenClose } from '../../animations/animations';

@Component({
  selector: 'budget-create',
  templateUrl: './budget-create.page.html',
  styleUrls: ['./budget-create.page.scss'],
  animations: [OpenClose]
})
export class BudgetCreatePage implements OnInit {
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  enterpriseToggle = false;
  @ViewChild('stepper', { static: true }) stepper: MatHorizontalStepper;
  constructor(private fb: FormBuilder, public store: BudgetStore) {}

  ngOnInit() {
    this.firstFormGroup = this.fb.group({
      enterprise: ['', Validators.required],
      enterpriseType: ['', Validators.required]
    });
    this.secondFormGroup = this.fb.group({
      secondCtrl: ['', Validators.required]
    });
  }

  enterpriseTypeClicked(type: IEnterpriseType) {
    // reset form on new type selected
    this.firstFormGroup.patchValue({ enterprise: '', enterpriseType: type });
    // toggle animation in line with setting values
    if (!this.enterpriseToggle) {
      this.store.setEnterpriseType(type);
      this.enterpriseToggle = true;
    } else {
      this.enterpriseToggle = false;
      setTimeout(() => {
        this.store.setEnterpriseType(type);
        this.enterpriseToggle = true;
      }, 300);
    }
  }

  enterpriseClicked(enterprise: IEnterprise) {
    this.store.patchBudget(this.firstFormGroup.value);
    this.firstFormGroup.patchValue({ enterprise: enterprise });
    setTimeout(() => {
      this.stepper.next();
    }, 800);
  }
}
