import { PB_MOCK_API_2 } from '../mocks/budget.api2.mock';
import { PB_MOCK_API_3 } from '../mocks/budget.api3.mock';
import { BUDGET_API_VERSION, checkForBudgetUpgrades } from './budget.upgrade';

describe('checkForBudgetUpgrades', () => {
  it('normalizes legacy v3 budgets into the current structure', () => {
    const budget = checkForBudgetUpgrades(PB_MOCK_API_3 as any);

    expect(budget.apiVersion).toBe(BUDGET_API_VERSION);
    expect(budget.meta.title).toBe('Maize Demo (v3)');
    expect(budget.meta.enterprise.id).toBe('maize');
    expect(budget.meta.enterprise.groupings?.[0]).toBe('crop');
    expect(budget.meta.lengthScale).toBe('months');
    expect(budget.meta.lengthTotal).toBe(6);
    expect(budget.meta.monthStart).toBe(10);
    expect(budget.data).toHaveLength(6);
    expect(budget.data[0].familyLabour[0].values.quantity).toBe(3);
    expect(budget.data[5].outputs[0].values.total).toBe(15000);
    expect(budget.data[5].produceConsumed[0].values.quantity).toBe(2);
  });

  it('keeps sparse legacy periods aligned by index', () => {
    const budget = checkForBudgetUpgrades({
      apiVersion: 3,
      _key: 'gap-demo',
      periods: {
        total: 3,
        scale: 'months',
      },
      meta: {
        title: 'Gap Demo',
      },
      data: {
        0: {
          familyLabour: {
            labour0: {
              id: 'family-labour',
              name: 'Family labour',
              days: 3,
            },
          },
        },
        2: {
          familyLabour: {
            labour2: {
              id: 'family-labour',
              name: 'Family labour',
              days: 5,
            },
          },
        },
      },
    } as any);

    expect(budget.data).toHaveLength(3);
    expect(budget.data[1].familyLabour).toHaveLength(0);
    expect(budget.data[2].familyLabour).toHaveLength(1);
    expect(budget.data[2].familyLabour[0].values.quantity).toBe(5);
  });

  it('normalizes legacy v2 budgets into the current structure', () => {
    const budget = checkForBudgetUpgrades(PB_MOCK_API_2 as any);

    expect(budget.apiVersion).toBe(BUDGET_API_VERSION);
    expect(budget.meta.title).toBe('Maize Demo (v2)');
    expect(budget.meta.enterprise.id).toBe('maize');
    expect(budget.meta.lengthScale).toBe('months');
    expect(budget.data).toHaveLength(6);
    expect(budget.data[5].familyLabour[0].values.quantity).toBe(5);
    expect(budget.data[5].outputs[0].values.total).toBe(15000);
    expect(budget.data[5].produceConsumed).toHaveLength(0);
  });
});
