import { Component } from '@angular/core';

@Component({
  selector: 'budget-cell-editor',
  templateUrl: './cell-editor.html',
  styleUrls: ['./cell-editor.scss']
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorComponent {
  isOpen = false;
  constructor() {
    console.log('budget cell editor');
  }
}
