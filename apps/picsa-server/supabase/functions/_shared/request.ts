import { Form, multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts';

export const getFormData = async (req: Request): Promise<Form> => {
  if (req.headers.has('content-type') && req.headers.get('content-type')?.startsWith('multipart/form-data')) {
    const form = await multiParser(req);
    if (form) return form;
  }
  console.error('Request does not contain form-data', req.body);
  return { fields: {}, files: {} };
};

export const getJsonData = async <T = Record<string, any>>(req: Request): Promise<T> => {
  if (req.headers.has('content-type') && req.headers.get('content-type')?.startsWith('application/json')) {
    const json = await req.json();
    return json as T;
  }
  console.error('Request does not contain json body');
  return {} as T;
};
