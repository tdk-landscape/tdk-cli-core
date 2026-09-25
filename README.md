# TDK CLI Core

> **T**ilt **D**evelopment **K**it — an all-in-one local development platform for microservices, built on [Tilt](https://tilt.dev).

[![npm version](https://img.shields.io/npm/v/@tdk-landscape/tdk-cli-core.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is the core monorepo for TDK: the `tdk` CLI, the Starlark-based Tilt orchestration engine that powers it, and the discovery system that turns a directory of services into a running local landscape.

- Website & docs: https://tdk-landscape.github.io/tdk-website

## What is TDK?

TDK organizes microservices using a **Project → Stack → Resource** hierarchy, then uses Tilt to build, run, and hot-reload them locally:

```
📁 Project (1 per repo)
├── TILT_RESOURCE_DEFAULTS.star   # Ports, health checks, memory
├── TILT_TECH_STACK.star          # Bun, Vite, Prisma, NATS
│
└── 📦 Stacks (deployment groups)
    ├── api-stack
    │   ├── api-backend      # Resource
    │   └── web-frontend     # Resource
    │
    └── worker-stack
        ├── worker-backend
        └── web-frontend
```

Running `tdk resource` scaffolds a service (Dockerfile, TypeScript config, starter code, tests); `tdk up` hands the whole landscape to Tilt for orchestration, live-reload, and health checking — sized to fit dozens of services on a single laptop.

## Install

```bash
npm install -g @tdk-landscape/tdk-cli-core
# or
bun install -g @tdk-landscape/tdk-cli-core
```

Or via the installer script:

```bash
curl -fsSL https://raw.githubusercontent.com/tdk-landscape/tdk-cli-core/main/install.sh | bash
```

## Quick start

```bash
cd my-project
tdk project                                          # initialize master configs
tdk resource api-api --type backend --stack api      # scaffold a backend
tdk resource api-app --type frontend --stack api     # scaffold a frontend
tdk up api                                            # start the stack via Tilt
tdk status                                            # check what's running
```

See the [CLI reference](cli/README.md) for the full command set (`stack`, `resources`, `doctor`, `ui`, and more).

## Repository layout

This is a monorepo — most day-to-day CLI work happens under `cli/`, while `engine/` and `discovery/` implement the Tilt-side orchestration that the CLI drives.

| Path | What it is |
|------|------------|
| [`cli/`](cli) | The `tdk` CLI source (TypeScript/Bun) — commands, UI, templates. See [cli/README.md](cli/README.md). |
| [`engine/`](engine) | The Starlark Tilt framework: topology modules for Docker, networking, database virtualization, secrets, observability. See [engine/README.md](engine/README.md). |
| [`discovery/`](discovery) | Manifest-driven service discovery — scans `service.json` files and builds the resource/dependency graph consumed by the engine. |
| [`ext/`](ext) | Tilt extension (`ext://tdk-cli`) plus IDE/UI enhancement components. |
| [`scripts/`](scripts) | Release, benchmarking, and dev-environment scripts (git hooks, pre-commit, idle-footprint measurement). |
| [`benchmarks/`](benchmarks) | Container/landscape scale benchmarks. |
| [`docs/`](docs) | Reference docs, including [FEATURES.md](docs/FEATURES.md) for project- and resource-level feature flags. |
| [`Tiltfile`](Tiltfile) | Entry point that wires the engine into `tilt up`. |
| [`install.sh`](install.sh) | Standalone installer used by the `curl \| bash` flow above. |

## Features

TDK ships a set of always-on infrastructure services (Traefik proxy, PostgreSQL) plus opt-in features — monitoring, ELK, Debezium CDC, a local npm registry, and more. Enable/disable them per-project via `.tdk/project.json`, or per-resource via each service's `service.json`. Full reference: [docs/FEATURES.md](docs/FEATURES.md).

## Development

```bash
make help          # list all make targets
make test          # run the full test suite
make test-fast      # fast unit tests, no external deps
make pre-commit-run # run pre-commit hooks on all files
```

`npm run typecheck` / `npm run lint` / `npm run test` delegate to the `cli/` workspace. See [cli/AGENTS.md](cli/AGENTS.md) for coding conventions if you're contributing to the CLI, and [engine/AGENTS.md](engine/AGENTS.md) for the Starlark topology framework.

## Environment check

```bash
tdk doctor
```

Verifies Docker, Bun, Tilt, required ports, and master config files are all in place before you run `tdk up`.

## License

MIT © [TDK Landscape](https://github.com/tdk-landscape)
