# TDK vs Compose vs raw Tilt

## Use TDK when

Use TDK when a team wants a generated local development landscape with service discovery, stack commands, health checks, and the Tilt UI. TDK is for local development; it does not deploy or validate production infrastructure.

## Do not use TDK when

Do not use TDK when the project needs Kubernetes APIs, production parity, or direct ownership of every orchestration file. A small, stable set of containers may be simpler to maintain directly in Compose.

## vs docker compose

Compose runs containers from YAML that you maintain. TDK generates Compose configuration from service manifests and adds stack-level lifecycle controls through Tilt. Choose Compose for direct control over that YAML; choose TDK when generated conventions and stack lifecycle commands save work.

## vs raw Tilt

Raw Tilt provides the development loop and UI with direct control over the Tiltfile. TDK generates a Tiltfile and service configuration around it. Choose raw Tilt when you want to maintain orchestration yourself; choose TDK when you want TDK to generate it.

## Known limits

- Generated defaults may not fit unusual ports, health checks, build contexts, or networking; inspect generated files when needed.
- The 100-service benchmark uses tiny `/health` stubs, not real apps.
- Cold startup depends on image and package downloads, disk speed, and available memory. TDK cannot make a cold machine boot as fast as a warm cache.
