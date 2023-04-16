import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { IBudgetValueCounters } from '../../../models/budget-tool.models';
import { BudgetStore } from '../../../store/budget.store';

@Component({
  selector: 'budget-balance-legend',
  templateUrl: './balance-legend.html',
  styleUrls: ['./balance-legend.scss'],
})
export class BudgetBalanceLegendComponent {
  labels: string[] = [];
  values: number[] = [];
  constructor(public store: BudgetStore, public dialog: MatDialog) {}
  @Input() set valueCounters(valueCounters: IBudgetValueCounters) {
    if (valueCounters) {
      // only keep the even items (non-half values)
      this.labels = valueCounters[0].filter((v, i) => i % 2 === 0);
      this.values = valueCounters[1].filter((v, i) => i % 2 === 0);
    }
  }

  scaleValues(scaleFactor: 0.1 | 10) {
    this.store.scaleValueCounters(scaleFactor);
  }

  showScaleEdit() {
    const dialogRef = this.dialog.open(BudgetBalanceEditorComponent, {
      width: '250px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.scaleValues(result);
      }
    });
  }
}

// Dialog popup component
@Component({
  selector: 'budget-balance-editor',
  template: `
    <div style="width:24px">
      <button mat-button class="balance-button" (click)="scaleValues(10)">
        <mat-icon>arrow_upward</mat-icon>
        {{ 'Increase Scale' | translate }}
      </button>
      <button mat-button class="balance-button" (click)="scaleValues(0.1)">
        <mat-icon>arrow_downward</mat-icon>
        {{ 'Decrease Scale' | translate }}
      </button>
    </div>
  `,
})
export class BudgetBalanceEditorComponent {
  constructor(public dialogRef: MatDialogRef<BudgetBalanceEditorComponent>) {}
  scaleValues(scaleFactor: 0.1 | 10) {
    this.dialogRef.close(scaleFactor);
  }
}
