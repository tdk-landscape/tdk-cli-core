# A real loco app (no database, async background workers, no assets): the scaffolder runs at build time.
FROM rust:1-slim-bookworm AS build
RUN apt-get update -qq && apt-get install -y -qq pkg-config libssl-dev git && rm -rf /var/lib/apt/lists/*
RUN cargo install loco
WORKDIR /work
RUN loco new --name app --path /work --db none --bg async --assets none --allow-in-git-repo
WORKDIR /work/app
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update -qq && apt-get install -y -qq libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /work/app/target/release/app-cli /app/app-cli
COPY --from=build /work/app/config /app/config
# loco reads PORT and BINDING from the environment (see config/development.yaml); bind beyond loopback.
ENV BINDING=0.0.0.0
CMD ["./app-cli", "start"]
