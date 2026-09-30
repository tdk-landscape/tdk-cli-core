# TDK vs Compose vs raw Tilt

## Use TDK when

- New TypeScript/Bun services
- You want one `service.json` per service
- You do not want Kubernetes locally

## Do not use TDK when

- You already have a Compose or Tilt setup you like
- The apps are not containers
- You need native Windows
- You need TDK to generate Go/Java/Python apps (use bring-your-own)

## vs docker compose

TDK generates compose-like Docker + Tilt live update. Compose is simpler for 2–3 services you already wrote.

## vs raw Tilt

TDK writes the Tiltfile for you. If you already maintain a Tiltfile, stay on Tilt.

## Known limits

- Community is small
- Generators are TypeScript-first
- 100-service ERP-named benchmark is a fixture bench of tiny `/health` stubs, not a real ERP product or real application workload
