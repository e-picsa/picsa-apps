import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { IBudget } from '../../models/budget-tool.models';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialog as MatDialog,
} from '@angular/material/legacy-dialog';
import { BudgetStore } from '../../store/budget.store';
import { generateDBMeta } from '@picsa/shared/services/core/db';
import { toJS } from 'mobx';

@Component({
  selector: 'budget-list-item',
  templateUrl: './budget-list-item.html',
  styleUrls: ['./budget-list-item.scss'],
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
      <input
        matInput
        placeholder="title"
        [(ngModel)]="editableBudget.meta.title"
      />
    </mat-form-field>
    <mat-form-field>
      <textarea
        matInput
        placeholder="description"
        [(ngModel)]="editableBudget.meta.description"
      ></textarea>
    </mat-form-field>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button [mat-dialog-close]="editableBudget">Save</button>
    </div>
  `,
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
