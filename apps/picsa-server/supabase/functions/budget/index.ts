import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { shareBudget } from './share.ts';
import { importBudget } from './import.ts';

const app = new Hono().basePath('/budget');

// Apply the built-in CORS middleware globally to all routes under /budget
app.use(
  '*',
  cors({
    origin: '*', // api restriction handled at supabase function invocation layer
    allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
);

// GET /budget/import/:code
app.get('/import/:code', async (c) => {
  const code = c.req.param('code');
  return importBudget(code);
});

// POST /budget/share
app.post('/share', async (c) => {
  return shareBudget(c.req.raw);
});

export default app;
