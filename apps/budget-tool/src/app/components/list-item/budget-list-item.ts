import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IBudget } from '../../models/budget-tool.models';

@Component({
  selector: 'budget-list-item',
  templateUrl: './budget-list-item.html',
  styleUrls: ['./budget-list-item.scss']
})
export class BudgetListItemComponent implements OnInit {
  @Input() budget: IBudget;
  @Output() onDeleteClicked = new EventEmitter<void>();
  ngOnInit() {}

  deleteClicked(e: Event) {
    e.stopPropagation();
    this.onDeleteClicked.emit();
  }
}
