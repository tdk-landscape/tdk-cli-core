## ADDED Requirements

### Requirement: Lifecycle commands emit one JSON object
`tdk doctor`, `status`, `up`, `down`, and `logs` SHALL accept `--json` and print exactly one JSON object on stdout with a version field, keeping human logs on stderr. Existing `doctor --json` and `status --json` fields SHALL remain unchanged.

#### Scenario: Agent parses up output
- **WHEN** `tdk up shop --json` completes or fails
- **THEN** stdout parses as a single JSON object and the exit code reflects success

### Requirement: Selective start
`tdk up <stack>` SHALL accept `--only <service...>` to start only the named services and their declared dependencies, and SHALL fail with a listing of valid names for unknown services.

#### Scenario: Unknown service name
- **WHEN** `--only` names a service not in the stack
- **THEN** the command exits non-zero without starting anything and lists valid names

### Requirement: Status exposes ports
`tdk status --json` SHALL list each service with container port, host port, and URL.

#### Scenario: Running stack
- **WHEN** a stack is running
- **THEN** each service entry includes `containerPort`, `hostPort`, and `url`

### Requirement: MCP server shares the implementation
`tdk mcp` SHALL expose `doctor`, `up`, `down`, `status`, `logs`, and `resource_list` tools backed by the same functions as the CLI commands, and SHALL refuse `up` when doctor reports `canUp: false`.

#### Scenario: MCP up on an unsupported host
- **WHEN** the `up` tool is called in a WebContainer
- **THEN** it returns an error result and starts nothing
