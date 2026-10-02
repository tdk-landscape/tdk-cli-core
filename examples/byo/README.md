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

An app that needs a database cannot run alone. Check it through a real `tdk up` and Traefik instead, which gives it TDK's
Postgres and `DATABASE_URL`:

```bash
scripts/verify-byo-tdk.sh full-stack-fastapi-template /api/v1/utils/health-check/
```

Every folder has its own `README.md` with its stack, notes and the exact check command, so adding an
example only adds a folder and never edits a shared table.

These check the container only. Through `tdk up`, a bring-your-own service is routed at
`http://api.<project>.localhost/api/<name without -api>/...` with the prefix stripped, so a
frontend served under that path needs its `base` set. Resource names must be unique across
TDK projects that share one Docker daemon: Traefik watches every container.
