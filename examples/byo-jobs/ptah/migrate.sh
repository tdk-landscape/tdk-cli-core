#!/bin/sh
# TDK gives a bring-your-own job DATABASE_URL but does not create the database, so create it if missing.
set -eu
url="${DATABASE_URL%%\?*}"   # drop the Prisma-style ?schema=public that Postgres refuses as a parameter
db="${url##*/}"
server="${url%/*}"
until psql "$server/postgres" -tAc "select 1" >/dev/null 2>&1; do sleep 1; done
psql "$server/postgres" -tAc "select 1 from pg_database where datname = '$db'" | grep -q 1 \
  || psql "$server/postgres" -c "create database \"$db\""
exec ptah migrations up --db-url "$url" --migrations-dir /migrations
