import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaDialogService } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { generateDBMeta } from '@picsa/shared/services/core/db';

import { BudgetImportDialogComponent } from '../../components/import-dialog/import-dialog.component';
import { BudgetMaterialModule } from '../../material.module';
import { IBudget } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { BudgetCreatePage } from '../create/budget-create.page';
import { BudgetListItemComponent } from './list-item/budget-list-item';
@Component({
  selector: 'budget-home',
  templateUrl: './budget-home.page.html',
  styleUrls: ['./budget-home.page.scss'],
  standalone: true,
  imports: [MatButton, PicsaTranslateModule, BudgetMaterialModule, BudgetListItemComponent, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetHomePage implements OnInit {
  sharedDisabled: boolean;
  budgetDownloadMessage: string;

  public savedBudgets = signal<IBudget[]>([]);

  constructor(
    private store: BudgetStore,
    private dialog: PicsaDialogService,
    private matDialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.loadBudgets();
  }

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

  public async handleBudgetCopy(budget: IBudget, { title, description }) {
    const updatedBudget: IBudget = { ...budget, meta: { ...budget.meta, title, description }, ...generateDBMeta() };
    this.store.setActiveBudget(updatedBudget);
    await this.store.saveBudget();
    await this.loadBudgets();
  }

  public async handleBudgetRename(budget: IBudget, { title, description }) {
    const updatedBudget: IBudget = { ...budget, meta: { ...budget.meta, title, description } };
    this.store.setActiveBudget(updatedBudget);
    await this.store.saveBudget();
    await this.loadBudgets();
  }

  async deleteBudget(budget: IBudget) {
    await this.store.deleteBudget(budget);
    await this.loadBudgets();
  }

  private async loadBudgets() {
    const budgets = await this.store.loadSavedBudgets();
    this.savedBudgets.set(budgets);
  }
}
