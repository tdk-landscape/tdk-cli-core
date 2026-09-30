# TDK and your existing tools

## TDK and Helm

TDK generates and runs the local Docker + Tilt development loop. Helm (including bjw-s app-template), Kustomize, Flux, and Argo keep rendering and deploying your cluster configuration. The same application source or image can flow through both paths; local routes and startup order do not configure production ingress or workload policy. See [TDK + Helm](with-helm.md).

## Keep your existing local setup when

- Your Compose or Tilt setup already works for you.
- The apps are not containers
- You need TDK to generate Go/Java/Python apps (use bring-your-own)

## vs docker compose

TDK generates compose-like Docker + Tilt live update. Compose is simpler for 2–3 services you already wrote.

## vs raw Tilt

TDK writes the Tiltfile for you. If you already maintain a Tiltfile, stay on Tilt.

## Known limits

- Community is small
- Generators are TypeScript-first
- 100-service ERP-named benchmark is a fixture bench of tiny `/health` stubs, not a real ERP product or real application workload
