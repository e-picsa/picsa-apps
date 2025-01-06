import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { generateDBMeta } from '@picsa/shared/services/core/db';
import { toJS } from 'mobx';

import { IBudget } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-list-item',
  templateUrl: './budget-list-item.html',
  styleUrls: ['./budget-list-item.scss'],
  standalone: false,
})
export class BudgetListItemComponent {
  @Input() budget: IBudget;
  @Output() deleteClicked = new EventEmitter<void>();
  constructor(private dialog: MatDialog, public store: BudgetStore) {}

  handleDeleteClicked(e: Event) {
    e.stopPropagation();
    this.deleteClicked.emit();
  }

  menuClick(e: Event) {
    e.stopPropagation();
  }

  showCopyDialog() {
    // use toJS as otherwise weird data binding bug (shows edit on original)
    const editableCopy = { ...toJS(this.budget), ...generateDBMeta() };
    const dialogRef = this.dialog.open(BudgetListItemRenameDialog, {
      width: '250px',
      data: editableCopy,
    });
    dialogRef.afterClosed().subscribe((budget) => {
      if (budget) {
        this.store.setActiveBudget(budget);
        this.store.saveBudget();
      }
    });
  }
  showRenameDialog() {
    const editableBudget = { ...toJS(this.budget) };
    const dialogRef = this.dialog.open(BudgetListItemRenameDialog, {
      width: '250px',
      data: editableBudget,
    });

    dialogRef.afterClosed().subscribe((budget) => {
      if (budget) {
        this.store.setActiveBudget(budget);
        this.store.saveBudget();
      }
    });
  }
}

/******************************************************
 *  Dialogs
 ******************************************************/
@Component({
  selector: 'budget-list-item-rename-dialog',
  template: `
    <mat-form-field>
      <mat-label>{{ 'title' | translate }}</mat-label>
      <input matInput [(ngModel)]="editableBudget.meta.title" />
    </mat-form-field>
    <mat-form-field>
      <mat-label>{{ 'description' | translate }}</mat-label>
      <textarea matInput [(ngModel)]="editableBudget.meta.description"></textarea>
    </mat-form-field>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button [mat-dialog-close]="editableBudget">Save</button>
    </div>
  `,
  standalone: false,
})
export class BudgetListItemRenameDialog {
  constructor(
    public dialogRef: MatDialogRef<BudgetListItemRenameDialog>,
    @Inject(MAT_DIALOG_DATA) public editableBudget: IBudget
  ) {
    console.log('budget', editableBudget);
  }

  close(data?: IBudget): void {
    this.dialogRef.close(data);
  }
}
