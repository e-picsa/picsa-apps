export type BudgetShareResponse = {
  share_code: string;
};

export type BudgetImportResponse = {
  budget: Record<string, unknown> | null;
};

export type BudgetUnshareResponse = {
  deleted: boolean;
};
