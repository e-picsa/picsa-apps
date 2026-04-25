import { z } from 'zod';
import { getServiceRoleClient } from '../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../_shared/response.ts';
import { validateBody } from '../_shared/validation.ts';
import { generateShareCode, normalizeShareCode } from './share-code.ts';
import type { BudgetShareResponse } from './types.ts';

const shareRequestSchema = z.object({
  budget: z.unknown(),
  share_code: z.string().trim().optional(),
});

type ShareRequest = z.infer<typeof shareRequestSchema>;

type BudgetRow = {
  share_code: string;
  data: Record<string, unknown>;
};

const MAX_SHARE_CODE_ATTEMPTS = 8;

export const shareBudget = async (req: Request) => {
  try {
    const { budget, share_code }: ShareRequest = await validateBody(req, shareRequestSchema);

    if (!budget || typeof budget !== 'object' || Array.isArray(budget)) {
      return ErrorResponse('Budget payload must be an object', 400);
    }

    const budgetData = budget as Record<string, unknown>;

    const budgetKey = typeof budgetData._key === 'string' ? budgetData._key : undefined;
    if (!budgetKey) {
      return ErrorResponse('Budget _key is required', 400);
    }

    const supabase = getServiceRoleClient();
    const normalizedShareCode = normalizeShareCode(share_code ?? (budget.shareCode as string | undefined));

    if (share_code && !normalizedShareCode) {
      return ErrorResponse('Invalid share code', 400);
    }

    if (normalizedShareCode) {
      const { data: existingRow, error: existingError } = await supabase
        .from('budgets')
        .select('data')
        .eq('share_code', normalizedShareCode)
        .maybeSingle();

      if (existingError) {
        console.error(existingError);
        return ErrorResponse(existingError.message);
      }

      const existingKey = (existingRow?.data as Record<string, unknown> | undefined)?._key as string | undefined;
      if (existingKey && existingKey !== budgetKey) {
        return ErrorResponse('Share code already assigned', 409);
      }

      const payload: BudgetRow = {
        share_code: normalizedShareCode,
        data: { ...budgetData, shareCode: normalizedShareCode },
      };

      const { error } = await supabase.from('budgets').upsert(payload, { onConflict: 'share_code' });
      if (error) {
        console.error(error);
        return ErrorResponse(error.message);
      }

      return JSONResponse<BudgetShareResponse>({ share_code: normalizedShareCode });
    }

    for (let attempt = 0; attempt < MAX_SHARE_CODE_ATTEMPTS; attempt++) {
      const generated = generateShareCode();
      const payload: BudgetRow = {
        share_code: generated,
        data: { ...budgetData, shareCode: generated },
      };

      const { error } = await supabase.from('budgets').insert(payload);

      if (!error) {
        return JSONResponse<BudgetShareResponse>({ share_code: generated }, 201);
      }

      if (error.code !== '23505') {
        console.error(error);
        return ErrorResponse(error.message);
      }
    }

    return ErrorResponse('Unable to generate share code', 500);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error(typeof error, error);
    const e = error as any;
    const msg = typeof e === 'string' ? e : e?.details || e?.error || e.message || e.msg || e;
    return ErrorResponse(msg);
  }
};
