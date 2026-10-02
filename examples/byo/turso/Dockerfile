# Turso's open-source server (libSQL "sqld") as a TDK resource.
# The upstream image listens on 8080 and ignores PORT; TDK assigns the port, so bind sqld to $PORT instead.
# The image's own entrypoint (it creates the data directory and drops to the sqld user) is kept; only the command changes.
FROM ghcr.io/tursodatabase/libsql-server:latest
CMD ["sh", "-c", "SQLD_HTTP_LISTEN_ADDR=0.0.0.0:${PORT:-8080} exec sqld"]
