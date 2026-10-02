# One-shot migration job: Atlas applies schema.hcl to TDK's Postgres and exits 0.
FROM alpine:3.20
RUN apk add --no-cache postgresql-client
COPY --from=arigaio/atlas:latest /atlas /usr/local/bin/atlas
COPY schema.hcl migrate.sh /
CMD ["sh", "/migrate.sh"]
