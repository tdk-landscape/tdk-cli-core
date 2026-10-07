# TDK MCP quick guide

When the TDK MCP is connected to Codex, ask for an operation in plain language, for example: **“Run TDK doctor and summarize anything blocking startup.”** The connector exposes tools for host checks, project services, stack lifecycle, and recent logs.

## Start with Doctor

Doctor checks whether the machine can run TDK. It reports prerequisites such as Docker, Tilt, Docker Compose, available host ports, and whether the current host can start a stack. It can run outside a TDK project.

```js
await tools.mcp__tdk__doctor({});
```

The response includes `data.ready`, `data.host.canUp`, and individual checks with messages and suggested fixes. A passing host check does not mean an application service is already healthy; inspect project status for that.

## Inspect a TDK project

Project operations need to run from a project root containing `.tdk/project.json`. From that directory, list services and check stack readiness:

```js
await tools.mcp__tdk__resource_list({});
await tools.mcp__tdk__status({});
```

The tools return an error such as `Could not find project root` if no TDK project is available. Open the project directory and retry.

## Start, inspect logs, and stop

Doctor should be run before startup. `up` starts the stack detached and returns without waiting for full readiness; use `status` to check Tilt readiness afterward.

```js
await tools.mcp__tdk__doctor({});
await tools.mcp__tdk__up({});
await tools.mcp__tdk__status({});
await tools.mcp__tdk__logs({ tail: 200 });
```

To start selected services, include their names in `only`; TDK includes their dependencies and shared infrastructure. `up` also accepts a `stack`, a `waitSeconds` window for early failures, and `force` to replace an existing Tilt process. For log snapshots, `logs` accepts `services`, `since` (such as `5m`), and `tail` (maximum 10,000 lines). Stop the stack with:

```js
await tools.mcp__tdk__down({});
```

## Ask in outcomes

Useful requests describe the check or result you want:

- “Run TDK doctor and tell me what needs fixing before startup.”
- “List this project’s TDK services and show which are ready.”
- “Start only the web service and its dependencies, then check status.”
- “Show the latest five minutes of API logs.”

The MCP manages TDK stack operations. For generated project configuration, CLI exit codes, and JSON contracts, see the [machine-readable CLI reference](../reference/machine-readable-cli.md).
