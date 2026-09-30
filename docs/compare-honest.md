# Choosing TDK alongside your existing tools

## TDK and Helm

- Helm packages and releases applications into a Kubernetes cluster.
- TDK generates services and runs them on your laptop.
- Typical split: TDK locally, Helm in CI or production.
- Do not migrate charts into TDK.

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
