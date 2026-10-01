import Fastify from 'fastify';
const app = Fastify({ logger: true });
app.get('/health', async () => ({ status: 'ok' }));
app.get('/orders', async () => [{ id: 1, item: 'tea' }]);
await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
