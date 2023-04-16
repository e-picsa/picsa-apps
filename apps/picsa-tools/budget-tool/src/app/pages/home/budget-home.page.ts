import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute,Router } from '@angular/router';
import { PicsaDialogService } from '@picsa/shared/features';

import { BudgetImportDialogComponent } from '../../components/import-dialog/import-dialog.component';
import { IBudget } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
@Component({
  selector: 'budget-home',
  templateUrl: './budget-home.page.html',
  styleUrls: ['./budget-home.page.scss'],
})
export class BudgetHomePage {
  sharedDisabled: boolean;
  budgetDownloadMessage: string;
  constructor(
    public store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: PicsaDialogService,
    private matDialog: MatDialog
  ) {}

  createClicked() {
    this.router.navigate(['create'], { relativeTo: this.route });
  }
  async promptDelete(budget: IBudget) {
    const dialog = await this.dialog.open('delete');
    await dialog.afterClosed().subscribe((v) => {
      if (v) {
        this.deleteBudget(budget);
      }
    });
  }
  public importBudgetCode() {
    this.matDialog.open(BudgetImportDialogComponent);
  }

  async deleteBudget(budget: IBudget) {
    this.store.deleteBudget(budget);
  }
}
