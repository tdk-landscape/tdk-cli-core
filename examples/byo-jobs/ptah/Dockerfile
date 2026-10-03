# One-shot migration job: Ptah applies migrations/*.sql to TDK's Postgres and exits 0.
FROM stokaro/ptah:0.12.0
# The Ptah image is Alpine with a shell; psql waits for Postgres and creates the database.
RUN apk add --no-cache postgresql-client
COPY migrations /migrations
COPY migrate.sh /migrate.sh
# The image's entrypoint is ptah itself, so replace it with the script.
ENTRYPOINT ["/bin/sh", "/migrate.sh"]
