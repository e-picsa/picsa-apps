import { Component, Input, OnInit } from '@angular/core';
import { Events } from '@ionic/angular';
import { IBudget, IBudgetPeriodType } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-table',
  templateUrl: 'budget-table.html',
  styleUrls: ['./budget-table.scss']
})
export class BudgetTableComponent implements OnInit {
  @Input() budget: IBudget;
  periodRows = periodRows;
  metaRows = metaRows;
  dotsLegend = [];
  balance: any;

  constructor(public events: Events, private store: BudgetStore) {}
  ngOnInit(): void {
    this.dotsLegend = Object.entries(this.budget.dotValues);
    console.log('dots legend', this.dotsLegend);
  }

  onCellClick(periodIndex: string, type: IBudgetPeriodType, typeLabel: string) {
    this.store.toggleEditor({ periodIndex, type, typeLabel });
  }
}

/********************************************************************************
 *      Interfaces and constants
 *******************************************************************************/
interface IBudgetRow {
  type: string;
  label: string;
}

interface IPeriodRow extends IBudgetRow {
  type: IBudgetPeriodType;
}

const periodRows: IPeriodRow[] = [
  { type: 'activities', label: 'Activities' },
  { type: 'inputs', label: 'Inputs' },
  { type: 'familyLabour', label: 'Family Labour' },
  { type: 'outputs', label: 'Outputs' },
  { type: 'produceConsumed', label: 'Produce Consumed' }
];
const metaRows: IBudgetRow[] = [{ type: 'cashBalance', label: 'Balance' }];
