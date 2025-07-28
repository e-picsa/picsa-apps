import { Component, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { BudgetService } from '../../store/budget.service';
import { BudgetStore } from '../../store/budget.store';
import { BudgetShareDialogComponent } from '../share-dialog/share-dialog.component';

@Component({
  selector: 'budget-editor-sidebar',
  templateUrl: './editor-sidebar.component.html',
  styleUrls: ['./editor-sidebar.component.scss'],
  standalone: false,
})
export class BudgetEditorSidebarComponent {
  constructor(
    public store: BudgetStore,
    public service: BudgetService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  @Output() emitClose = new EventEmitter<boolean>();

  public toggleEditorMode() {
    this.service.editMode.set(!this.service.editMode());
    this.emitClose.next(true);
  }

  public goToBudgetHome() {
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }

  async showShareDialog() {
    this.dialog.open(BudgetShareDialogComponent, { disableClose: true });
  }
}
