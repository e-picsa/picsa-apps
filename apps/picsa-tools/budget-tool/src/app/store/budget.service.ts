import { computed, Injectable, signal } from '@angular/core';
import { isEqual } from '@picsa/utils/object.utils';

import { IBudgetPeriodData, IBudgetPeriodType } from '../models/budget-tool.models';
import { IBudgetCardWithValues } from '../schema';

@Injectable({ providedIn: 'root' })
/**
 * WiP service to slowly migrate from mobx bindings to signals
 */
export class BudgetService {
  public editMode = signal(false);

  public activePeriod = signal(0);
  public activeType = signal<IBudgetPeriodType>('activities');

  public budgetData = signal<IBudgetPeriodData[]>([]);

  private budgetInputs = computed(() => this.budgetData().map((v) => v.inputs), { equal: isEqual });

  private budgetOutputs = computed(() => this.budgetData().map((v) => v.outputs), { equal: isEqual });

  /** Array of monthly cash balance */
  public cashBalances = computed(() => {
    // only recalculate when inputs or outputs change
    const inputs = this.budgetInputs();
    const outputs = this.budgetOutputs();
    return this.calcCashBalances(inputs, outputs);
  });

  /** Total budget cash balance */
  public cashBalanceTotal = computed(() => this.cashBalances()[this.calcCashBalances.length - 1].cumulative);

  /** Calculate cash balance for each time period, calculate balance between inputs and outputs, track cumulative total */
  private calcCashBalances(inputPeriods: IBudgetCardWithValues[][], outputPeriods: IBudgetCardWithValues[][]) {
    const balances: { input: number; output: number; balance: number; cumulative: number }[] = [];
    const totalPeriods = inputPeriods.length;
    for (let i = 0; i < totalPeriods; i++) {
      const input = inputPeriods[i].reduce((previous, v) => previous + v?.values?.total || 0, 0);
      const output = outputPeriods[i].reduce((previous, v) => previous + v?.values?.total || 0, 0);
      const balance = output - input;
      const cumulativePrevious = balances[i - 1]?.cumulative || 0;
      balances[i] = { input, output, balance, cumulative: cumulativePrevious + balance };
    }
    return balances;
  }
}
