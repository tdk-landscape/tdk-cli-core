import { feathers } from '@feathersjs/feathers';
import { koa, rest, bodyParser, errorHandler } from '@feathersjs/koa';

const app = koa(feathers());
app.use(errorHandler());
app.use(bodyParser());
app.configure(rest());
app.use('health', { async find() { return { status: 'ok' }; } });
app.use('orders', { async find() { return [{ id: 1, item: 'tea' }]; } });

await app.listen(Number(process.env.PORT ?? 3000));
