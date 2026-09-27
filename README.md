<div align="center">

# TDK — Tilt Development Kit

**Run 100 microservices on a 16 GB laptop. No Kubernetes.**

One CLI that scaffolds your services and runs the whole landscape locally with hot reload, health checks, a proxy, and Postgres, all built on [Tilt](https://tilt.dev).

[![npm version](https://img.shields.io/npm/v/@tdk-landscape/tdk-cli-core.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core)
[![npm downloads](https://img.shields.io/npm/dm/@tdk-landscape/tdk-cli-core.svg?style=flat)](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core)
[![CI](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/tdk-landscape/tdk-cli-core/badge.svg)](https://snyk.io/test/github/tdk-landscape/tdk-cli-core)
[![Socket Badge](https://badge.socket.dev/npm/package/@tdk-landscape/tdk-cli-core/latest)](https://socket.dev/npm/package/@tdk-landscape/tdk-cli-core/overview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/tdk-landscape/tdk-cli-core?style=flat&logo=github)](https://github.com/tdk-landscape/tdk-cli-core/stargazers)

[Website](https://tdk-landscape.github.io/tdk-website) · [Quickstart](https://tdk-landscape.github.io/tdk-website/docs/quickstart/) · [Examples](https://tdk-landscape.github.io/tdk-website/docs/examples/) · [Demo](https://tdk-landscape.github.io/tdk-demo-animation/) · [Report a bug](https://github.com/tdk-landscape/tdk-cli-core/issues/new/choose)

</div>

```bash
npm install -g @tdk-landscape/tdk-cli-core
tdk project --yes                                       # set up the project
tdk resource orders-api --type backend --stack shop     # scaffold a service
tdk up shop                                             # run it with hot reload
```

![tdk scaffolding a backend and a frontend, then listing the stack](docs/demo.svg)

> ⭐ **If TDK saves you from writing another `docker-compose.yml`, please [star the repo](https://github.com/tdk-landscape/tdk-cli-core/stargazers).** Stars help other developers find it.

This is the core monorepo for TDK: the `tdk` CLI, the Starlark-based Tilt orchestration engine that powers it, and the discovery system that turns a directory of services into a running local landscape.

## Why TDK?

| | docker-compose | Local Kubernetes (kind, minikube) | Plain Tilt | **TDK** |
|---|---|---|---|---|
| Scaffold a new service in one command | ❌ | ❌ | ❌ | ✅ `tdk resource` |
| Hot reload on file change | ⚠️ `compose watch` config | ⚠️ extra tooling | ✅ | ✅ |
| Health-checked startup order | ⚠️ `depends_on` only | ✅ | ⚠️ write it yourself | ✅ |
| Proxy, Postgres, monitoring included | ❌ | ❌ | ❌ | ✅ |
| Needs a cluster | No | Yes | Optional | **No** |
| Start only one stack of a large system | ⚠️ profiles | ⚠️ | ⚠️ | ✅ `tdk up <stack>` |

## Benchmark: 100 services on one laptop

Measured with [`scripts/benchmark/container-scale.ts`](scripts/benchmark/README.md) against the 100-service [ERP example](https://github.com/tdk-landscape/tdk-erp-system) on a 16 GB machine (Docker VM: 7.75 GiB). Raw results are in [`benchmarks/results/`](benchmarks/results).

| Services | All healthy after | Total memory | Avg memory / service | Crashes / OOM kills |
|---:|---:|---:|---:|---:|
| 10 | 8 s | 161 MiB | 16 MiB | 0 / 0 |
| 50 | 24 s | 829 MiB | 17 MiB | 0 / 0 |
| 100 | 112 s | 1.6 GiB | 17 MiB | 0 / 0 |

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

## Community

- **Questions and ideas:** [open an issue](https://github.com/tdk-landscape/tdk-cli-core/issues/new/choose).
- **Contributing:** see [CONTRIBUTING.md](CONTRIBUTING.md). Issues labeled [`good first issue`](https://github.com/tdk-landscape/tdk-cli-core/labels/good%20first%20issue) are a good place to start.
- **Security:** see [SECURITY.md](SECURITY.md). Please don't report vulnerabilities in public issues.
- **Examples:** [ERP system (100 services)](https://github.com/tdk-landscape/tdk-erp-system), [SaaS starter](https://github.com/tdk-landscape/tdk-saas-starter), [restaurant](https://github.com/tdk-landscape/tdk-restaurant-example).

If TDK is useful to you, a ⭐ helps more than you'd think.

## License

[MIT](LICENSE) © [TDK Landscape](https://github.com/tdk-landscape)
