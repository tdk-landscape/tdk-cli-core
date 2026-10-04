## ADDED Requirements

### Requirement: Snapshot commands emit one JSON object
`tdk doctor`, `status`, and `down` SHALL accept `--json` and print exactly one JSON object `{schemaVersion, data, errors}` on stdout, with human logs on stderr. When a preflight check exits the process, a failure object SHALL still be printed. Existing `doctor --json` and `status --json` fields SHALL remain unchanged.

#### Scenario: Down fails preflight
- **WHEN** `tdk down --json` runs without Docker or Tilt
- **THEN** stdout is one failure object and the exit code is non-zero

### Requirement: Up reports readiness once
`tdk up <stack> --json` SHALL print exactly one JSON object: `ok: true` once every non-deferred Tilt resource is built and running, or `ok: false` with an error code when a resource fails, readiness times out, a smoke check fails, or Tilt exits first. Tilt SHALL keep running after a success object, so callers background the command. Human output is suppressed.

#### Scenario: UI port opens before services are ready
- **WHEN** the Tilt UI is reachable but a resource is still building
- **THEN** no success object is printed until that resource is running

### Requirement: Logs are a bounded snapshot
`tdk logs --json` SHALL return a bounded snapshot selected by `--service`, `--tail <n>` and `--since <duration>`, in one JSON object, and SHALL exit. Following logs is not part of the JSON contract; it streams as plain text on stderr or is a later tool.

#### Scenario: Agent reads recent logs
- **WHEN** `tdk logs --json --service api --tail 100` runs
- **THEN** one object with at most 100 lines for `api` is printed and the command exits

### Requirement: Selective start semantics follow the spike
`tdk up <stack> --only <service...>` SHALL start the named services. Whether declared dependencies start with them SHALL be decided by the Tilt-resource-selection spike (design.md, open questions) and recorded here before implementation; no dependency behavior is required until `service.json` has a dependency field to read. Unknown names SHALL fail without starting anything and list valid names.

#### Scenario: Unknown service name
- **WHEN** `--only` names a service not in the stack
- **THEN** the command exits non-zero without starting anything and lists valid names

### Requirement: Status separates ingress, service and stack ports
`tdk status --json` SHALL report, per service: `url` (the ingress address, for example `http://api.shop.localhost/...`), `containerPort` (the in-container listen port), and `hostPort` (a direct host mapping, or `null` when the service is only reachable through the ingress). It SHALL also report a separate stack-level list of ports (ingress HTTP and HTTPS, Tilt UI, published datastores).

#### Scenario: Service behind the ingress
- **WHEN** a service has no published host port
- **THEN** its `hostPort` is `null` and its `url` is the ingress address

### Requirement: MCP server shares the implementation
`tdk mcp` SHALL expose `doctor`, `up`, `down`, `status`, `logs`, and `resource_list` tools backed by the same functions as the CLI. The `up` tool SHALL start Tilt detached and return once started; callers poll the `status` tool for readiness, so a blocked call cannot time out. The tool SHALL refuse when `canUp` is false.

#### Scenario: MCP up on an unsupported host
- **WHEN** the `up` tool is called in a WebContainer
- **THEN** it returns an error result and starts nothing
