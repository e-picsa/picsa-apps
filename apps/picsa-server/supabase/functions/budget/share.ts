import { z } from 'zod';
import { getServiceRoleClient } from '../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../_shared/response.ts';
import { validateBody } from '../_shared/validation.ts';
import type { BudgetShareResponse, BudgetDB } from './types.ts';

const shareRequestSchema = z.object<BudgetDB['Insert']>();

const MAX_SHARE_CODE_ATTEMPTS = 10;

export const shareBudget = async (req: Request) => {
  try {
    const budget = await validateBody(req, shareRequestSchema);

    const { share_code } = budget;

    // Update existing share, or generate new share code for first share
    if (!share_code) {
      budget.share_code = await generateUniqueShareCode();
    }

    const supabase = getServiceRoleClient();
    const table = supabase.schema('budget').from('budgets');

    const { error } = await table.upsert(budget as BudgetDB['Insert'], { onConflict: 'share_code' });
    if (error) {
      console.error(error);
      return ErrorResponse('Internal Server Error', 500);
    }

    return JSONResponse<BudgetShareResponse>({ share_code: budget.share_code as string });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error(error);
    return ErrorResponse('Internal Server Error', 500);
  }
};

/**
 * Generate a share code that doesn't collide with any existing budget.
 * Retries up to MAX_SHARE_CODE_ATTEMPTS times before giving up.
 */
async function generateUniqueShareCode(): Promise<string> {
  const supabase = getServiceRoleClient();
  for (let attempt = 0; attempt < MAX_SHARE_CODE_ATTEMPTS; attempt++) {
    const code = generateShareCode();
    const table = supabase.schema('budget').from('budgets');
    const { data, error } = await table.select('id').eq('share_code', code).maybeSingle();
    if (error) {
      throw new Error(`Failed to check share code uniqueness: ${error.message}`);
    }
    if (!data) {
      return code;
    }
  }
  throw new Error(`Could not generate unique share code after ${MAX_SHARE_CODE_ATTEMPTS} attempts`);
}

const SHARE_CODE_CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
const SHARE_CODE_LENGTH = 4;

/**
 * Generate a 4-character alpha-numeric code for sharing
 *
 * This avoids characters commonly confused (e.g. 0/O), and should still generate a sufficiently
 * unique code given the relatively small number of budgets that are actively shared
 */
function generateShareCode() {
  return Array.from(crypto.getRandomValues(new Uint32Array(SHARE_CODE_LENGTH)), (value) => {
    return SHARE_CODE_CHARS.charAt(value % SHARE_CODE_CHARS.length);
  }).join('');
}
