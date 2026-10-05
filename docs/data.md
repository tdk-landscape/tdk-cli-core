# Local data: where it lives, how to reset, seed and snapshot

How the shared Postgres behaves under TDK. Every command below was run against a real `postgres:16-alpine` container named the way TDK names it. `tdk up` itself was not run for this page.

## Where the data lives

TDK runs **one** Postgres container for the whole project. Each service that needs a database gets its own logical database inside it.

| Thing | Name | Example for project `my-shop`, service `orders-api` |
| --- | --- | --- |
| Container | `<project>_postgres` | `my_shop_postgres` |
| Superuser | `<project>` | `my_shop` |
| Password | `DB_PASSWORD` in the project `.env` | |
| Database per service | `<project>_<service>` | `my_shop_orders_api` |
| Volume | `database-management_<project>_postgres_data` | `database-management_my_shop_postgres_data` |
| Host port | `15432`, or `TDK_POSTGRES_PORT` | |

`<project>` is `project.name` from `.tdk/project.json` with `-` replaced by `_`. The same rule applies to the service name. The volume name was read from existing volumes on a machine that had run TDK (for example `database-management_auth_user_postgres_data` for project `auth-user`), so check yours with `docker volume ls | grep postgres_data`.

## Does it survive `tdk down`?

Yes. `tdk down` runs `tilt down`, which removes the containers and networks but not named volumes. Checked with a small Compose project run through `tilt down`: the container was removed and the file in the volume was still there afterwards. The next `tdk up` starts Postgres on the same volume.

## Start from a clean state

Everything, all services:

```bash
tdk down
docker volume rm database-management_my_shop_postgres_data
tdk up
```

One service's database (Postgres must be running; `WITH (FORCE)` disconnects the service first):

```bash
docker exec my_shop_postgres psql -U my_shop -d postgres -c "DROP DATABASE my_shop_orders_api WITH (FORCE)"
docker exec my_shop_postgres createdb -U my_shop -O my_shop my_shop_orders_api
```

The database comes back empty. Migrations run again only when your migrator runs again (`tdk up`, or restart the migrator resource in Tilt).

## Seed

Pick one:

- **A SQL file, by hand.** Fast and fine for a pilot:

  ```bash
  docker exec -i my_shop_postgres psql -U my_shop -d my_shop_orders_api -v ON_ERROR_STOP=1 < seed.sql
  ```

- **A one-shot resource.** Run the seed as a bring-your-own job with `--restart no`, the same way as a migration; see [One-shot jobs](byo.md#one-shot-jobs-migrations-seeders). A dbmate job was checked through a real `tdk up`. That a seed job runs after the migrator and before the API is **not checked here**; make the seed idempotent so a different order is harmless.

Keep seed data fake. Do not put production data in the repository.

## Snapshot and restore

```bash
# snapshot one database
docker exec my_shop_postgres pg_dump -U my_shop -Fc my_shop_orders_api > orders.dump

# restore it over the current state
docker exec -i my_shop_postgres pg_restore -U my_shop -d my_shop_orders_api --clean --if-exists --no-owner < orders.dump
```

Both were run: after a restore, a row inserted after the snapshot was gone. A shared team snapshot is just that file; TDK has no command for it, and no tooling to scrub production data. Anonymise a dump before it leaves production.

## Not covered

- Other databases (MySQL, Mongo, Turso): only the shared Postgres was checked.
- A built-in `tdk db reset` or `tdk db seed` command does not exist.
- The start-up order between migrator, seed and API (see [#531](https://github.com/tdk-landscape/tdk-cli-core/issues/531)).
