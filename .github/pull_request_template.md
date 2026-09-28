## What changed and why

## How it was tested

<!-- Paste real before/after output and the steps to reproduce it. See CONTRIBUTING.md#test-evidence -->

- [ ] `npm run typecheck`, `npm run lint`, and `npm test` pass in `cli/`

## Frontend framework providers (if applicable)

- [ ] Link the issue or explain the framework use case and provider id.
- [ ] Add one Vite-based SPA provider, registered in the CLI and Starlark Vite generator; keep React as the default.
- [ ] Add generated output tests for the new provider and React compatibility, including legacy and unknown framework cases.
- [ ] Update [the framework guide](../docs/frontend-framework-providers.md) and `cli/README.md`.
- [ ] Keep shared Docker, nginx, Traefik, Tilt orchestration, and API-client behavior common to all providers.
