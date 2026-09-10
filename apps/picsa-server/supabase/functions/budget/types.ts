import type { Database } from '../../types/db.types.ts';

export type BudgetDB = Database['budget']['Tables']['budgets'];

export type BudgetShareResponse = {
  share_code: string;
};

export type BudgetImportResponse = BudgetDB['Row'];

export type BudgetFirebaseMigrationResult = {
  share_code?: string;
  status: 'migrated' | 'existing' | 'missing' | 'invalid' | 'error';
  source_id?: string;
  error?: string;
  warnings?: string[];
};

export type BudgetFirebaseMigrationResponse = {
  migrated_count: number;
  existing_count: number;
  missing_count: number;
  invalid_count: number;
  error_count: number;
  results: BudgetFirebaseMigrationResult[];
};
