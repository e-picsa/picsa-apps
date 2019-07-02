import { Component, OnInit, Input } from '@angular/core';
import { IBudget } from '../../models/budget-tool.models';

@Component({
  selector: 'budget-list-item',
  templateUrl: './budget-list-item.html',
  styleUrls: ['./budget-list-item.scss']
})
export class BudgetListItemComponent implements OnInit {
  @Input() budget: IBudget;
  ngOnInit() {}
}
