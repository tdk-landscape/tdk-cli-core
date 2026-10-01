import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();
app.get('/health', (c) => c.json({ status: 'ok' }));
app.get('/orders', (c) => c.json([{ id: 1, item: 'tea' }]));

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000), hostname: '0.0.0.0' });
