import type { Database } from '../../types/db.types.ts';

export type BudgetDB = Database['budget']['Tables']['budgets'];

export type BudgetShareResponse = {
  share_code: string;
};

export type BudgetImportResponse = {
  budget: Record<string, unknown> | null;
};

export type BudgetUnshareResponse = {
  deleted: boolean;
};
