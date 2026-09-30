# TDK product example

A small working landscape with a Hono API, PostgreSQL, a NATS worker, a Vite UI, and Traefik routes.

```sh
tdk doctor
tdk project --yes
tdk up
```

Open `http://app.tdk-example.localhost/orders-app/` and create an order, or use the routed API:

```sh
curl -fsS -X POST http://api.tdk-example.localhost/api/orders \
  -H 'content-type: application/json' -d '{"item":"coffee"}'
```

The API stores each order in PostgreSQL and publishes its id to NATS. The worker consumes the
event, reads the stored row, and marks it observed. Poll `GET /api/orders/<id>` through the API
route until `workerSeenAt` is set. `tdk config verify` checks generated output. Stop the landscape
with `tdk down`.
