import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'picsa-budget-create',
  templateUrl: './budget-create.page.html',
  styleUrls: ['./budget-create.page.scss']
})
export class BudgetCreatePage implements OnInit {
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  constructor(private fb: FormBuilder, public store: BudgetStore) {}

  ngOnInit() {
    this.firstFormGroup = this.fb.group({
      firstCtrl: ['', Validators.required]
    });
    this.secondFormGroup = this.fb.group({
      secondCtrl: ['', Validators.required]
    });
  }
}
