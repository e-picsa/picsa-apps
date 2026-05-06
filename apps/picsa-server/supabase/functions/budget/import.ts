import { getServiceRoleClient } from '../_shared/client.ts';
import type { BudgetImportResponse } from './types.ts';

export const importBudget = async (code: string | undefined) => {
  // Validate code format
  if (!code || code.length !== 4) {
    return new Response('Invalid share code', { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .schema('budget')
    .from('budgets')
    .select('*')
    .eq('share_code', code)
    .maybeSingle();

  if (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }

  if (!data) {
    return new Response('Budget not found', { status: 404 });
  }
  const res: BudgetImportResponse = data;

  return Response.json(res);
};
