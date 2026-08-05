import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { IBudgetPeriodData, IBudgetPeriodType } from '../../models/budget-tool.models';
import { BudgetService } from '../../store/budget.service';
import { BudgetStore } from '../../store/budget.store';
import { BUDGET_PERIOD_ROWS, IBudgetPeriodRow } from '../../store/templates';

@Component({
  selector: 'budget-table',
  templateUrl: 'budget-table.html',
  styleUrls: ['./budget-table.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetTableComponent {
  store = inject(BudgetStore);
  service = inject(BudgetService);

  data = input.required<IBudgetPeriodData[]>();
  rows = BUDGET_PERIOD_ROWS;

  cellClicked = output<{ activePeriod: number; activeType: IBudgetPeriodType }>();

  public emitCellClicked(columnIndex: number, row: IBudgetPeriodRow) {
    this.cellClicked.emit({ activePeriod: columnIndex, activeType: row.type });
  }
}
