## ADDED Requirements

### Requirement: VS Code extension detects TDK workspaces
The extension SHALL detect whether the active VS Code workspace contains a TDK project before enabling orchestration actions.

#### Scenario: TDK project detected
- **WHEN** a workspace contains TDK project configuration or a valid TDK CLI project root
- **THEN** the extension enables TDK views and commands for that workspace

#### Scenario: Non-TDK workspace
- **WHEN** a workspace does not contain a TDK project
- **THEN** the extension shows a non-blocking empty state and keeps orchestration actions disabled

### Requirement: Extension is delivered as a new package
The extension SHALL be implemented as a new VS Code extension package at `/private/var/www/2025/ollamar1/tdk-vscode-extension`.

#### Scenario: One-shot implementation starts
- **WHEN** implementation begins
- **THEN** the extension package is scaffolded outside `tdk-cli-core` at `/private/var/www/2025/ollamar1/tdk-vscode-extension`

#### Scenario: Extension package is verified
- **WHEN** the MVP is complete
- **THEN** the package contains source code, package metadata, tests, documentation, and verification notes

### Requirement: Extension runs orchestration through TDK CLI
The extension SHALL execute project, stack, resource, doctor, status, up, and down actions through the TDK CLI instead of duplicating orchestration logic.

#### Scenario: User starts a stack
- **WHEN** the user starts a stack from VS Code
- **THEN** the extension runs the corresponding TDK CLI stack lifecycle command in the workspace root and captures the command result

#### Scenario: CLI command fails
- **WHEN** a TDK CLI orchestration command exits with a non-zero status
- **THEN** the extension preserves stdout, stderr, exit code, command, workspace, and duration for troubleshooting

### Requirement: Extension exposes project, stack, and resource status
The extension SHALL show project, stack, and resource status inside VS Code using TDK CLI status data.

#### Scenario: Status refresh succeeds
- **WHEN** the user refreshes TDK status
- **THEN** the extension updates the visible project, stack, and resource state from the latest CLI result

#### Scenario: Status refresh is cancelled
- **WHEN** the user cancels an in-progress status refresh
- **THEN** the extension stops the command and leaves the previous known status visible with a cancellation indication

### Requirement: Extension provides required MVP surfaces
The extension SHALL provide a TDK Explorer view, a Troubleshooter view, and a TDK output channel.

#### Scenario: Extension activates in a TDK workspace
- **WHEN** the extension activates in a detected TDK workspace
- **THEN** the TDK Explorer, Troubleshooter view, and TDK output channel are available

#### Scenario: Command output is produced
- **WHEN** a TDK command runs through the extension
- **THEN** the raw command output is appended to the TDK output channel

### Requirement: MVP is VS Code only
The IDE plugin SHALL support VS Code only for the MVP.

#### Scenario: Non-VS Code IDE support requested
- **WHEN** implementation scope is reviewed for the MVP
- **THEN** JetBrains, Vim, browser IDE, and standalone Electron support are excluded from required delivery
