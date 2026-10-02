# Bring-your-own examples

Each folder is a small app plus a `Dockerfile` that meets the container contract in
[docs/byo.md](../../docs/byo.md): read `PORT`, bind `0.0.0.0`, answer a health route.
Register one in a TDK project with:

```bash
tdk resource orders-api --type bring-your-own --stack shop --dockerfile ./Dockerfile --yes
```

Check one (needs Docker; builds the image, runs it with `PORT=4000`, expects HTTP 200):

```bash
scripts/verify-byo-example.sh fastify          # health path /health
scripts/verify-byo-example.sh create-vue /     # Vite apps answer on /
```

| Folder | Stack | Notes |
| --- | --- | --- |
| `fastify` | Node, Fastify 5 | |
| `hono` | Node, Hono + `@hono/node-server` | |
| `feathers` | Node, Feathers 5 (Koa) | |
| `nestjs` | Node, NestJS 10 | multi-stage build with `tsc` |
| `nitro` | Node, Nitro 2 | builds `.output`, sets `HOST=0.0.0.0` |
| `litestar` | Python 3.12, Litestar + uvicorn | |
| `fiber` | Go 1.23, Fiber 2 | multi-stage, static binary |
| `create-vue` | a real `create-vue` app | scaffolder runs at build time; Vite `--host 0.0.0.0` |
| `rsbuild` | a real `create-rsbuild` app | scaffolder runs at build time; `rsbuild dev --host 0.0.0.0` |
| `ember` | a real `ember new` app (`@ember/app-blueprint`, Vite) | scaffolder runs at build time with `--skip-npm`; Vite `--host 0.0.0.0` |
| `create-refine` | a real `create-refine-app` project (Vite) | scaffolder only reads answers from a terminal, so the Dockerfile pipes Enter presses to accept defaults; Vite `--host 0.0.0.0` |
| `create-bati` | a real `create-bati` app (React + Hono) | scaffolder runs at build time; production build, server reads `PORT`; health path `/` |
| `create-analog` | a real `create-analog` app (Angular) | scaffolder runs at build time; upgrades npm to 11 because the template's `$vite`/`$vitest` overrides fail on npm 10; Vite `--host 0.0.0.0` |

These check the container only. Through `tdk up`, a bring-your-own service is routed at
`http://api.<project>.localhost/api/<name without -api>/...` with the prefix stripped, so a
frontend served under that path needs its `base` set. Resource names must be unique across
TDK projects that share one Docker daemon: Traefik watches every container.
