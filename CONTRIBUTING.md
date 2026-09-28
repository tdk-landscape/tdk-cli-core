# Contributing to TDK

Thanks for helping. Bug reports, docs fixes, and code changes are all welcome.

## Ways to help

- **Report a bug or ask a question:** [open an issue](https://github.com/tdk-landscape/tdk-cli-core/issues/new/choose). Include the output of `tdk doctor`.
- **Pick up an issue:** look for [`good first issue`](https://github.com/tdk-landscape/tdk-cli-core/labels/good%20first%20issue) or [`help wanted`](https://github.com/tdk-landscape/tdk-cli-core/labels/help%20wanted). Comment on it so nobody duplicates your work.
- **Share what you built:** an example project or a blog post helps other people find TDK.

## Development setup

You need [Bun](https://bun.sh), Node.js 22.12+, Docker, and [Tilt](https://docs.tilt.dev/install.html).

```bash
git clone https://github.com/tdk-landscape/tdk-cli-core.git
cd tdk-cli-core/cli
bun install
npm run typecheck
npm run lint
npm test
```

From the repo root, `make help` lists more targets (`make test-fast`, `make pre-commit-run`).

## Where things live

- `cli/` is the `tdk` CLI (TypeScript). Conventions are in [cli/AGENTS.md](cli/AGENTS.md).
- `engine/` is the Starlark Tilt framework. Conventions are in [engine/AGENTS.md](engine/AGENTS.md).
- `discovery/` builds the resource and dependency graph from `service.json` files.

To add a Vite-based frontend framework, start with the React provider and follow the [frontend framework provider guide](docs/frontend-framework-providers.md). Submit one framework per pull request.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Keep the change focused. One fix or feature per PR.
3. Add or update tests for behavior changes.
4. Make sure `npm run typecheck`, `npm run lint`, and `npm test` pass in `cli/`. CI runs the same checks.
5. Describe what changed and why in the PR description.

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By taking part you agree to follow it.
