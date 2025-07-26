import { Component, EventEmitter, Output } from '@angular/core';

import { BudgetService } from '../../store/budget.service';
import { BudgetStore } from '../../store/budget.store';

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
  ) {}

  @Output() emitClose = new EventEmitter<boolean>();

  public toggleEditorMode() {
    this.service.editMode.set(!this.service.editMode());
    this.emitClose.next(true);
  }
}
