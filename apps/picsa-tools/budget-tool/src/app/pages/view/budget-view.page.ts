/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { FadeInOut, OpenClosed } from '@picsa/shared/animations';

import { BudgetShareDialogComponent } from '../../components/share-dialog/share-dialog.component';
import { BudgetService } from '../../store/budget.service';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-view',
  templateUrl: './budget-view.page.html',
  styleUrls: ['./budget-view.page.scss'],
  animations: [FadeInOut({ inDelay: 200 }), OpenClosed],
  standalone: false,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class BudgetViewPage implements OnInit, OnDestroy {
  public editorOpen = signal(false);

  constructor(
    private route: ActivatedRoute,
    public store: BudgetStore,
    public service: BudgetService,
    private dialog: MatDialog,
  ) {}

  async ngOnInit() {
    await this.loadBudget();
  }

  ngOnDestroy() {
    this.store.unloadActiveBudget();
  }

  async showShareDialog() {
    this.dialog.open(BudgetShareDialogComponent, { disableClose: true });
  }

  async loadBudget() {
    const budgetKey = this.route.snapshot.params.budgetKey;
    await this.store.loadBudgetByKey(budgetKey);
  }
}
