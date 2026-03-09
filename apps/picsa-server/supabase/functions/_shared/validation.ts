import { z } from 'zod';
import { ErrorResponse } from './response.ts';

export async function validateBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;

  try {
    body = await req.json();
  } catch (err) {
    console.error(err);
    throw ErrorResponse('Invalid JSON body');
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    throw ErrorResponse(z.flattenError(result.error), 400);
  }

  return result.data;
}
