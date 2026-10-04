# Design: agent-host runtime contract

## Context

TDK generates a Docker + Tilt stack from service.json. Dev Containers (`devcontainer.json`) are the open spec IDEs and agent hosts use. WebContainers are a browser Node isolate with a virtual FS; they have no Docker daemon, Compose, or Tilt.

Existing: `tdk doctor --json`, `tdk status --json`, `tdk resources --json`, WSL2 and native-Windows checks in `cli/src/commands/doctor.ts`, and `up --dry-run`.

## Goals / non-goals

- Goals: one host story for laptop, Dev Container, Codespaces, WSL2; one JSON API for agent harnesses; `doctor` that fails closed when Docker is unreachable.
- Non-goals: running the stack in WebContainers; replacing Tilt; a VS Code extension; remote cluster deploy.

## Decisions

1. **Dev Container is a host, not a service runtime.** Services stay sibling containers on the host Docker engine. Default reference uses docker-outside-of-docker (socket mount). Docker-in-docker is unsupported in v1 because Tilt bind mounts and layer cache break; to be confirmed by a spike before the docs claim it.
2. **WebContainers are unsupported.** Detected via `process.versions.webcontainer`; `doctor --json` reports `canUp: false` and `up` exits non-zero without spawning Tilt. A website demo may show topology only.
3. **CLI + MCP, not per-IDE plugins.** Harnesses launch agents that call `tdk`. `tdk mcp` exposes `doctor`, `up`, `down`, `status`, `logs`, `resource_list`, calling the same functions as the commands (no shelling out to itself).
4. **Port contract.** `status --json` lists service, container port, host port, and `*.localhost` URL so `forwardPorts` can be derived without scraping Tilt.
5. **Additive JSON.** New fields are added to the existing versioned doctor/status reports; no field is renamed or removed.

## Risks

- Socket-mounted Docker gives the Dev Container root-equivalent access to the host; docs must say so.
- Agent Host Dev Container support is experimental; laptop `tdk up` must never depend on it.
- Host detection by env var can misfire; `canUp` is decided by an actual Docker reachability check, host kind is informational.

## Open questions

- Does `up --only` need Tilt `--resource` semantics or a generated subset? Spike before implementing task 3.2.
