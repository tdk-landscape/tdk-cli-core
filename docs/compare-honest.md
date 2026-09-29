# TDK vs Compose vs raw Tilt

## Use TDK

Use TDK when a team wants a generated local landscape with service discovery, stack commands, health checks, and a shared Tilt UI. TDK is a local development tool and does not deploy or validate production infrastructure.

## Do not use TDK

Use another tool when the project needs Kubernetes APIs, production parity, or direct ownership of every orchestration file. A small, stable set of containers may be simpler to maintain in Compose directly.

## vs Compose

Docker Compose runs a set of containers from YAML you maintain. TDK generates Compose configuration from service manifests and adds stack-level lifecycle controls through Tilt. Compose gives direct control; TDK reduces repeated setup and adds conventions.

## vs Tilt

Tilt provides the development loop and UI. TDK generates a Tiltfile and service configuration around it. Using raw Tilt gives more control and requires maintaining that configuration yourself.

## Known limits

- Generated defaults may not fit unusual ports, health checks, build contexts, or networking; inspect generated files when needed.
- The 100-service benchmark uses generated stubs with a small `/health` endpoint, not production applications.
- Cold startup depends on image and package downloads, disk speed, and available memory. TDK cannot make a cold machine boot as fast as a warm cache.
