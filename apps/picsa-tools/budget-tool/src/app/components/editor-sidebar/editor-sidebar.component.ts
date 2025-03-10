import { Component, EventEmitter, Output } from '@angular/core';

import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-editor-sidebar',
  templateUrl: './editor-sidebar.component.html',
  styleUrls: ['./editor-sidebar.component.scss'],
  standalone: false,
})
export class BudgetEditorSidebarComponent {
  constructor(public store: BudgetStore) {}

  @Output() emitClose = new EventEmitter<boolean>();

  public toggleEditorMode() {
    this.store.editorEnabledToggle();
    this.emitClose.next(true);
  }
}
