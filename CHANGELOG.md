# Changelog

Notable changes to the `tdk` CLI. Versions match [npm](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core?activeTab=versions) and the [binary releases](https://github.com/tdk-landscape/tdk-cli-releases/releases).

## Unreleased

- `tdk up` no longer leaves `nats` (and any other service in `services/platform/messaging/docker-compose.yml`, e.g. a local mail catcher) disabled in Tilt. The pre-alpha default always goes through a focus-filter path that only re-enabled `init-networks`/`postgres`/`traefik`/`golden-layers-build`, so a resource with the `nats` feature retried its broker connection forever until you ran `tilt enable nats` by hand. Fixes #155.

- `tdk doctor` now catches wiring mistakes that used to surface minutes into `tdk up`: a resource with no `package.json` (the image build stops at "COPY ... not found"), a `params` URL such as `http://auth-emulator:4000` whose port is not the one the target listens on (its `service.json` `port`), a frontend calling a backend through `localhost:<port>` (TDK publishes no backend ports on localhost; use the Traefik route), the `nats` feature without `services/platform/messaging/docker-compose.yml` (TDK does not generate it, so no NATS server starts), two Tilt processes running for one project, and Docker having no address pool left for the networks a project needs. Found while building [tdk-ecommerce-example](https://github.com/tdk-landscape/tdk-ecommerce-example) and a queue/auth example.

- `tdk project ecommerce` clones [tdk-ecommerce-example](https://github.com/tdk-landscape/tdk-ecommerce-example), a Vue 3 storefront and Hono catalog API. Before, only restaurant, saas, erp, user-management and example were accepted.

## 1.3.73 (2026-09-28)

- Free-tier projects no longer start the `sablier` and `wake-gateway` containers, and Traefik no longer downloads the Sablier plugin from GitHub on every start. They were always launched (the `sablier` one with a read-write Docker socket) even though the license only gated the per-service labels, so nothing could use them. They are now generated only when a license grants Sablier. Fewer containers, one image build less, and no network fetch at Traefik boot. Spotted in the ERP CI run log.

## 1.3.72 (2026-09-28)

- `tdk doctor` no longer fails with "Verdaccio is not reachable" when the project config enables Verdaccio but no Premium license grants it. TDK does not start Verdaccio in that case, so the check could never pass; it is now skipped with a note. A registry your own `.npmrc` points at (`:4873`) is still checked. Found by the ERP CI workflow.

## 1.3.71 (2026-09-28)

- `tdk project` in a freshly cloned repo (one that already has `.tdk/project.json`) now creates the missing `.env` with working defaults. Before, it regenerated the configs but left no `.env`, and `tdk doctor` then failed with "set VERDACCIO_URL_DOCKER=<value>". Doctor now says to run `tdk project` when there is no `.env` at all. Found by the ERP CI workflow.

## 1.3.70 (2026-09-28)

- **Fix for 1.3.69:** `tdk doctor` no longer reports "Environment not ready" for the ERP example. The new check for missing `@types/*` packages flagged its 7 frontends, but they build with `vite build`, which never type-checks, so `types: ["node"]` cannot fail their build. It now only flags a service whose `build` script runs `tsc` (following `bun|npm|pnpm|yarn run` hops). Found by the new ERP CI workflow on its first run.

- New CI workflow that boots the public 100-service ERP example on a clean GitHub-hosted runner with the published CLI and waits for every backend to answer `/health` through Traefik, then writes the time to healthy and the resource use to the job summary. Manual (`full` or `one-stack`) and weekly.

## 1.3.69 (2026-09-28)

- `tdk resource --type backend` adds `@types/node` to the new service. The Docker build uses a tsconfig with `"types": ["node"]`, so without it the image failed at `bun run build` with `TS2688: Cannot find type definition file for 'node'`. This was the next blocker on a clean machine, after the base-image race and the default Prisma feature.
- `tdk doctor` now checks **every** entry in the Docker tsconfig's `types` list against the service's dependencies. It only looked at `"bun"`, so a missing `@types/node` passed. It names the service, the entry and the package to add, and handles subpath (`vitest/globals`) and scoped entries.

## 1.3.67 (2026-09-28)

- The clean-machine quickstart run (`tdk project`, `tdk resource`, `tdk up`, wait for `/health`) now starts by itself after every successful release and tests exactly the version just published. It also still runs nightly and on demand.
- **`tdk resource --type backend` now produces a service whose image builds.** It set `featuresEnabled: ["prisma"]` by default but never created `prisma/schema.prisma` or the `prisma` dependency, so the generated Dockerfile failed on `COPY services/<stack>/<name>/prisma` and no scaffolded service could start. Prisma is now opt-in, like in the ERP and restaurant examples that boot, and `docs/FEATURES.md` says what it needs. Found by the clean-machine quickstart run, one step after the base-image race.

## 1.3.66 (2026-09-28)

- **`tdk up` on a machine with no base images no longer leaves every service stuck on a 404.** The generated Tiltfile dropped the golden-layers resource name, so app and migrator resources never waited for `golden-layers-build`. Their image builds started at once, failed with "pull access denied" because the base images did not exist yet, and Tilt never retried. Machines that had built the layers before (any second run) were unaffected, which hid it. Found by the clean-machine quickstart run.
- `tdk doctor` now names a missing golden base image for any project name (`shop-l4-backend`, ...). The hint was hard-coded to the `tdk-project-` prefix, so a real project got the raw BuildKit error.

## 1.3.64 (2026-09-28)

- `traefik.healthCheck` in service.json (the path Traefik's load balancer probes, documented in the schema) is now honored. It was read by discovery but never used, so Traefik always probed `healthCheckPath`. It defaults to `healthCheckPath`, so manifests that only set that generate the same output as before.
- `tdk doctor` checks that every backend defines the health routes it is probed on (`healthCheckPath` for the container, `traefik.healthCheck` for Traefik, both defaulting to `/health`) somewhere in `src/`. A backend without them never turns healthy, so Traefik returns 404, which used to surface only after a slow image build.

## 1.3.62 (2026-09-28)

- `tdk doctor` no longer skips the service health check when Traefik answers with an error. A 404 (no route yet) or 502/503/504 (route found, container not answering) is reported as a failure that names the service and URL, instead of being read as "Traefik never bound :80". It is skipped only when every probe fails to connect.

## 1.3.61 (2026-09-28)

- `tdk doctor` and `tdk up` no longer report free host ports (80, 443, 5432) as "taken" on Linux. The port check bound `0.0.0.0` and `127.0.0.1` at the same time, and on Linux the second bind collided with our own first probe. It now probes them one after the other, which still catches a loopback-only Postgres on macOS. Found by the nightly clean-machine quickstart run.

## 1.3.60 (2026-09-27)

- Backends and workers scaffolded by `tdk resource` get a `start` script, and `@types/bun` is pinned instead of `latest`. Before, `tdk doctor` failed on every new service. Found by the clean-machine quickstart run.

## 1.3.59 (2026-09-27)

- `tdk doctor` no longer fails every fresh project with "Generated Dockerfiles reference missing project runtime assets: prisma-runtime-relink.sh, migrate.sh". Those two scripts were never shipped or used by generated Dockerfiles; doctor now checks the scripts TDK ships plus whatever generated Dockerfiles actually copy. Found by the new clean-machine quickstart run.

## 1.3.58 (2026-09-27)

- Dropped the `ink-select-input` dependency in favor of a small built-in list in `tdk ui` (same keys: arrows or j/k, 1-9, Enter). Removes 4 packages: ink-select-input, figures, to-rotated and is-unicode-supported.

## 1.3.57 (2026-09-27)

- Binary installs (`tdk-landscape.github.io/install.sh`) ship the Docker helper scripts generated Dockerfiles run. Before, `tdk project` warned "TDK runtime assets not found" and image builds could fail. The release script now smoke-tests the built binary.

## 1.3.56 (2026-09-27)

- `tdk project` adds `.env`, `.tdk/.tdk-out/`, `.tdk/.project-id` and `node_modules/` to `.gitignore`. `.env` holds a generated database password and was easy to commit by accident.
- `tdk doctor` checks that host ports 80, 443 and 5432 are free and names what holds them (usually a local Postgres). `tdk up` prints the same warning before starting Tilt.
- `tdk project` no longer tells you to edit `.env` first: the defaults work, and the Verdaccio variables are marked as belonging to the paid registry.
## 1.3.55 (2026-09-27)

- Dropped the `ora` dependency (only `tdk upgrade` used it) in favor of a small built-in spinner: 50 installed packages instead of 61, and no more duplicate versions of cli-cursor, restore-cursor, onetime and signal-exit.
- `tdk doctor` outside a project checks only Docker, Compose and Tilt, and reports "This machine is ready for TDK". Before, running it right after installing (as the installer suggests) failed with "Master configs missing … Environment not ready".

## 1.3.54 (2026-09-27)

- The npm package ships only what the CLI needs at runtime: 294 files and 458 kB, down from 678 files and 888 kB. Repo tooling, tests, source maps, CI config and the openspec docs are no longer included.

## 1.3.53 (2026-09-27)

- The "requires a license key" errors link to the working request form (`tdk-landscape.github.io/tdk-website/#waitlist`); the old link pointed at a page without it.
- New issue template for Premium license requests.

## 1.3.52 (2026-09-27)

- `tdk up` works in a fresh project. The Tiltfile no longer aborts when a stack listed in `project.json` has no directory yet, and stacks created after `tdk project` are added to the `pre_alpha` phase so they actually start.
- Prompts fail with an error and exit 1 when there's no input to read (CI, `< /dev/null`). Before, `tdk resource` printed its summary, exited 0 and created nothing.
- `tdk help`: one-line header with the version, instead of a misaligned ASCII box and doubled icons.
- One installer: `install.sh` in this repo hands off to `https://tdk-landscape.github.io/install.sh`, which verifies release checksums. `tdk upgrade` verifies checksums too.

## 1.3.51 (2026-09-27)

- Cold start on first request (`sablier.deferStart`, paid): an opted-in resource skips the normal bring-up and starts when it first gets a request, through a generated Traefik route and a wake gateway.
- The wake gateway starts already-built images with `docker compose up --no-build` instead of waiting in Tilt's build queue, which could time out with a 504 under load.
- The generated wake route strips the same API path prefix as the real route.

## 1.3.50 (2026-09-27)

- Fixed the npm package: 1.3.49 shipped without the compiled CLI and its runtime dependencies, so `tdk` failed to start after `npm install -g`.
- Requires Node.js 22.12+.
- `tdk up <stack>` starts only that stack instead of every stack.

## 1.3.39 (2026-09-23)

- `tdk doctor` and `tdk up` time out after 10 s when the Docker daemon is unresponsive, instead of hanging.

## 1.3.37 (2026-09-22)

- Fixed the Vite base path for frontends routed under a path prefix.

## 1.3.36 (2026-09-22)

- Service URL helpers, `BASEPATH` routing and health-check targets.

## 1.3.35 (2026-09-22)

- `tdk doctor` checks that each service's `package.json` has the scripts the generated containers run.

## 1.3.34 (2026-09-22)

- Fixed resource filtering in focus mode and the frontend Docker `tsconfig`.

## 1.3.33 (2026-09-22)

- Core infrastructure (Traefik, Postgres) is always on. Fixed `tdk upgrade` self-repair.

## Earlier

Releases before 1.3.33 are listed in the [git history](https://github.com/tdk-landscape/tdk-cli-core/commits/main).
