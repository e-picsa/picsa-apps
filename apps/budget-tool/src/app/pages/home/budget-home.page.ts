import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { select } from '@angular-redux/store';
import { IBudget, IBudgetView } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { Router } from '@angular/router';
import { PrintProvider } from '@picsa/services/native/print';
@Component({
  selector: 'budget-home',
  templateUrl: './budget-home.page.html',
  styleUrls: ['./budget-home.page.scss']
})
export class BudgetHomePage {
  sharedDisabled: boolean;
  budgetDownloadMessage: string;
  constructor(
    private printPrvdr: PrintProvider,
    public store: BudgetStore,
    private router: Router
  ) {}

  createClicked() {
    this.router.navigate(['budget/create']);
  }

  async shareBudget() {
    // this.sharedDisabled = true;
    // try {
    //   this.budgetDownloadMessage = 'preparing';
    //   await this.printPrvdr.socialShareBudget('#budget', this.budget.title);
    //   this.budgetDownloadMessage = null;
    // } catch (error) {
    //   console.error(error);
    //   this.budgetDownloadMessage = 'error';
    // }
    // this.sharedDisabled = false;
  }
}
