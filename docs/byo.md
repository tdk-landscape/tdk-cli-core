# Bring-Your-Own Resources

Wrap an existing service with TDK orchestration without generating application code.

## Command

```bash
tdk resource <name> --type bring-your-own --stack <stack>
```

Aliases: `byo`, `bring-your-own`

## service.json Example

```json
{
  "appName": "legacy",
  "appType": "bring-your-own",
  "stack": "shop",
  "port": 4500,
  "healthCheckPath": "/health",
  "dockerfile": "./Dockerfile"
}
```

## Notes

- TDK does not generate application code for this type
- Provide your own Dockerfile or use `--image <name>` to use an existing image
- Default port range: 4000-5999 (next free port)
- If Dockerfile exists, it will not be overwritten
- BYO resources receive the standard Traefik route by default. Use `--no-proxy` to disable it;
  this writes `exposeViaProxy: false` to the service manifest
- Use `--yes` in scripts to skip the create confirmation
- `--port` accepts an unused integer from 4000 through 5999
- By default, TDK writes an Nginx Dockerfile and health endpoint that listen on the assigned
  service port
- Pass `--dockerfile <path>` to select a custom Dockerfile, or `--image <image>` to use an
  existing image without creating a Dockerfile

## Bringing a framework app (Node, Go, Rust, ...)

Any app that fits the contract below can run as a bring-your-own resource. Fastify is the worked example because it needs nothing beyond the framework.

### What TDK needs from the container

1. **Listen on the port in `service.json`.** The generated Compose service sets `PORT` to that value, and also sets `DATABASE_URL`, so read the port from the environment instead of hard-coding it.
2. **Bind to `0.0.0.0`.** Traefik reaches the container over the Docker network, so a server that only binds `127.0.0.1` is unreachable.
3. **Answer HTTP 200 on `healthCheckPath`** (default `/health`; change it with `--health-path`). Traefik uses this check. TDK does not add a Compose `curl` health check for bring-your-own services, so the image does not need `curl`.
4. **Provide the image.** Either a `Dockerfile` or `--image`. The Docker build context is the resource directory, so `COPY` paths are relative to it.

### Worked example: Fastify

```text
services/shop/orders-api/
  Dockerfile
  package.json
  server.js
```

```js
// server.js
import Fastify from 'fastify';
const app = Fastify({ logger: true });
app.get('/health', async () => ({ status: 'ok' }));
app.get('/orders', async () => [{ id: 1, item: 'tea' }]);
await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
```

```dockerfile
# Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
CMD ["node", "server.js"]
```

```bash
tdk resource orders-api --type bring-your-own --stack shop \
  --dockerfile ./Dockerfile --health-path /health \
  --path services/shop/orders-api --yes
tdk up shop
```

The existing `Dockerfile` is kept, and the resource gets a `service.json` like the one at the top of this page (`appType: bring-your-own`, a port from 4000-5999, `healthCheckPath`, `dockerfile`).

### Limits

- **No live reload.** TDK does not sync source into a bring-your-own container, and only the manifest is watched. After changing source, rebuild the image from the Tilt UI or restart `tdk up`.
- **Ports.** 4000-5999 for this type, shared with backends.
- **No generated code.** TDK will not add a health route, a `PORT` read or a Dockerfile for you.

### What this recipe has and has not been checked against

Checked: the Fastify image built from the files above, run with `PORT=4000`, returns `200 {"status":"ok"}` on `/health` and the JSON list on `/orders`, and listens on the container's network interface. `tdk resource ... --type bring-your-own` writes the `service.json` shown, keeps the existing `Dockerfile`, and `tdk up shop --dry-run` lists the service.

Not checked: a full `tdk up` run of this service through Traefik, and any framework other than Fastify. The Go, Rust, Nest, Adonis and similar variants differ only in their Dockerfile and dev command; if you get one working, add it here.
