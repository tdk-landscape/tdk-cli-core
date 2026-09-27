# Changelog

Notable changes to the `tdk` CLI. Versions match [npm](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core?activeTab=versions) and the [binary releases](https://github.com/tdk-landscape/tdk-cli-releases/releases).

## Unreleased

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
