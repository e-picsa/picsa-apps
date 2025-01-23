import { corsHeaders } from './cors.ts';

export function ErrorResponse(msg: string, status = 400) {
  return new Response(JSON.stringify({ msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function JSONResponse(data: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
