import { computed, inject, Injectable, signal } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration';
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

  private configurationService = inject(ConfigurationService);
  public settings = computed(() => {
    return this.configurationService.deploymentSettings().budgetTool;
  });

  /*********************************************************************************************************************
   *                        Budget Data
   *********************************************************************************************************************/
  public budgetData = signal<IBudgetPeriodData[]>([]);

  private inputs = computed(() => this.budgetData().map((v) => v.inputs), { equal: isEqual });
  private outputs = computed(() => this.budgetData().map((v) => v.outputs), { equal: isEqual });
  private familyLabour = computed(() => this.budgetData().map((v) => v.familyLabour), { equal: isEqual });
  private produceConsumed = computed(() => this.budgetData().map((v) => v.produceConsumed), { equal: isEqual });

  /*********************************************************************************************************************
   *                        Data Summaries
   *********************************************************************************************************************/

  /** Array of monthly cash balance */
  public cashBalances = computed(() => {
    // only recalculate when inputs or outputs change
    const inputs = this.inputs();
    const outputs = this.outputs();
    return this.calcCashBalances(inputs, outputs);
  });

  /** Total budget cash balance */
  public cashBalanceTotal = computed(() => {
    const balances = this.cashBalances();
    return balances[balances.length - 1].cumulative;
  });

  public familyLaborTotal = computed(() => this.calcTotalFamilyLabor(this.familyLabour()));

  public produceConsumedTotal = computed(() => this.calcTotalProduceConsumed(this.produceConsumed()));

  /*********************************************************************************************************************
   *                        Utility Methods
   *********************************************************************************************************************/

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

  private calcTotalFamilyLabor(periods: IBudgetCardWithValues[][]) {
    let male = 0;
    let female = 0;
    let total = 0;
    for (const period of periods) {
      for (const card of period) {
        const quantity = card.values?.quantity || 0;
        total += card.values?.quantity || 0;
        if (card.id === 'adultFemale') {
          female += quantity;
        }
        if (card.id === 'adultMale') {
          male += quantity;
        }
      }
    }
    return { male, female, total };
  }

  /** Calculate total produce consumed by crop over all time periods. Includes path to image for easier summary display */
  private calcTotalProduceConsumed(periods: IBudgetCardWithValues[][]) {
    const totalConsumed: Record<string, { id: string; image: string; total: number }> = {};
    for (const period of periods) {
      for (const card of period) {
        const { values, id, imgType } = card;
        totalConsumed[card.id] ??= { id, image: `assets/budget-cards/${id}.${imgType}`, total: 0 };
        totalConsumed[card.id].total += values?.quantity || 0;
      }
    }
    return Object.values(totalConsumed);
  }
}
