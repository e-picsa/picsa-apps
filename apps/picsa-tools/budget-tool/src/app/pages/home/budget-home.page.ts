import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaDialogService } from '@picsa/shared/features';

import { BudgetImportDialogComponent } from '../../components/import-dialog/import-dialog.component';
import { IBudget } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { BudgetCreatePage } from '../create/budget-create.page';
@Component({
  selector: 'budget-home',
  templateUrl: './budget-home.page.html',
  styleUrls: ['./budget-home.page.scss'],
  standalone: false,
})
export class BudgetHomePage {
  sharedDisabled: boolean;
  budgetDownloadMessage: string;
  constructor(
    public store: BudgetStore,
    private dialog: PicsaDialogService,
    private matDialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  public async promptDelete(budget: IBudget) {
    const dialog = await this.dialog.open('delete');
    dialog.afterClosed().subscribe((v) => {
      if (v) {
        this.deleteBudget(budget);
      }
    });
  }
  public importBudgetCode() {
    this.matDialog.open(BudgetImportDialogComponent);
  }
  public showBudgetCreate() {
    const dialog = this.matDialog.open(BudgetCreatePage, { panelClass: 'no-padding' });
    dialog.afterClosed().subscribe((budgetKey) => {
      if (budgetKey) {
        this.router.navigate([budgetKey], { relativeTo: this.route });
      }
    });
  }

  async deleteBudget(budget: IBudget) {
    this.store.deleteBudget(budget);
  }
}
