import { corsHeaders } from './cors.ts';

/**
 * Return an erorr response
 *
 * Note - if reading from js-client need to await error context body for message
 * https://github.com/supabase/functions-js/issues/45
 *
 * @example
 * ```ts
 * const {dat, error} = await invokeFunction(...)
 * if (error && error instanceof FunctionsHttpError) {
 *  const errorMessage = await error.context.json();
 *  const errorJson = JSON.parse(errorMessage)
 *  console.error(errorJson)
 * }
 * ```
 */
export function ErrorResponse(msg: any, status = 400) {
  return new Response(JSON.stringify(msg), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function JSONResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
