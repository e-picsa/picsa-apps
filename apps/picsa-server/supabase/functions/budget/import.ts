import { z } from 'zod';
import { getServiceRoleClient } from '../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../_shared/response.ts';
import { validateBody } from '../_shared/validation.ts';
import { normalizeShareCode } from './share-code.ts';
import type { BudgetImportResponse } from './types.ts';

const importRequestSchema = z
  .object({
    share_code: z.string().trim().optional(),
    budget_key: z.string().trim().optional(),
  })
  .refine((payload) => payload.share_code || payload.budget_key, {
    message: 'share_code or budget_key is required',
  });

type ImportRequest = z.infer<typeof importRequestSchema>;

export const importBudget = async (req: Request) => {
  try {
    const { share_code, budget_key }: ImportRequest = await validateBody(req, importRequestSchema);

    const shareCode = normalizeShareCode(share_code);
    if (share_code && !shareCode) {
      return ErrorResponse('Invalid share code', 400);
    }

    const supabase = getServiceRoleClient();

    let query = supabase.from('budgets').select('data, share_code');

    if (shareCode) {
      query = query.eq('share_code', shareCode).limit(1);
    } else if (budget_key) {
      query = query.eq('data->>_key', budget_key).order('updated_at', { ascending: false }).limit(1);
    }

    const { data: rows, error } = await query;
    const row = Array.isArray(rows) ? rows[0] : undefined;

    if (error) {
      console.error(error);
      return ErrorResponse('Internal Server Error', 500);
    }

    if (!row?.data) {
      const notFoundMessage = shareCode ? 'Share code not found' : 'Budget not found';
      return ErrorResponse(notFoundMessage, 404);
    }

    return JSONResponse<BudgetImportResponse>({ budget: row.data });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error(error);
    return ErrorResponse('Internal Server Error', 500);
  }
};
