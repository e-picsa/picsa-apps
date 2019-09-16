import { Component } from '@angular/core';
import { IBudget } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { Router, ActivatedRoute } from '@angular/router';
import { PrintProvider } from '@picsa/services/native/print';
import { PicsaDialogService } from '@picsa/features';
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
    private router: Router,
    private route: ActivatedRoute,
    private dialog: PicsaDialogService
  ) {}

  createClicked() {
    this.router.navigate(['create'], { relativeTo: this.route });
  }
  async promptDelete(budget: IBudget) {
    const dialog = await this.dialog.open('delete');
    await dialog.afterClosed().subscribe(v => {
      if (v) {
        this.deleteBudget(budget);
      }
    });
  }

  async deleteBudget(budget: IBudget) {
    this.store.deleteBudget(budget);
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
