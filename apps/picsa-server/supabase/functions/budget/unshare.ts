import { z } from 'zod';
import { getServiceRoleClient } from '../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../_shared/response.ts';
import { validateBody } from '../_shared/validation.ts';
import { normalizeShareCode } from './share-code.ts';
import type { BudgetUnshareResponse } from './types.ts';

const unshareRequestSchema = z.object({
  share_code: z.string().trim(),
});

type UnshareRequest = z.infer<typeof unshareRequestSchema>;

type BudgetRow = {
  share_code: string;
};

export const unshareBudget = async (req: Request) => {
  try {
    const { share_code }: UnshareRequest = await validateBody(req, unshareRequestSchema);

    const shareCode = normalizeShareCode(share_code);
    if (!shareCode) {
      return ErrorResponse('Invalid share code', 400);
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.from('budgets').delete().eq('share_code', shareCode).select('share_code');

    if (error) {
      console.error(error);
      return ErrorResponse(error.message);
    }

    const deleted = Array.isArray(data) && data.length > 0;
    return JSONResponse<BudgetUnshareResponse>({ deleted });
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
