## 1. Scope Review and Repository Setup

- [ ] 1.1 Create `/private/var/www/2025/ollamar1/tdk-vscode-extension` as the new VS Code-only extension package location.
- [ ] 1.2 Add `docs/spec-critique.md` documenting MVP creep risks, unsafe repair risks, missing CLI contract risks, and how this implementation constrains each one.
- [ ] 1.3 Scaffold a TypeScript VS Code extension package with activation, command registration, test harness, lint/typecheck scripts, packaging metadata, and README.
- [ ] 1.4 Add extension configuration settings for TDK CLI path, polling behavior, notification categories, and safe repair confirmation behavior.
- [ ] 1.5 Add a verification checklist document that maps each spec requirement to implementation and test evidence.

## 2. TDK CLI Integration Layer

- [ ] 2.1 Implement a command runner that captures command, cwd, stdout, stderr, exit code, duration, cancellation, and timestamp.
- [ ] 2.2 Implement TDK CLI discovery with support for configured binary path, workspace-local binary, and PATH fallback.
- [ ] 2.3 Implement workspace detection for TDK project roots and disabled empty-state behavior for non-TDK workspaces.
- [ ] 2.4 Implement typed adapters for `tdk doctor`, `tdk status`, `tdk stacks`, `tdk resources`, `tdk up`, and `tdk down`.
- [ ] 2.5 Add conservative raw-output parsing for adapters where structured JSON is unavailable.
- [ ] 2.6 Document missing structured-output needs in `docs/cli-contract-gaps.md` without modifying the TDK CLI.

## 3. VS Code Orchestration UI

- [ ] 3.1 Add a TDK Explorer tree view for detected project, stacks, resources, and last known status.
- [ ] 3.2 Add commands for refresh status, run doctor, start stack/resource, stop stack/resource, and stop all services.
- [ ] 3.3 Add cancellation support for long-running refresh/doctor/orchestration commands.
- [ ] 3.4 Add a TDK output channel and append every executed command plus raw stdout/stderr.
- [ ] 3.5 Preserve raw command output and surface it from the relevant project, stack, resource, or command result.

## 4. Troubleshooter

- [ ] 4.1 Define diagnostic issue types, severity levels, confidence levels, fingerprints, evidence records, and recommended next-action models.
- [ ] 4.2 Implement deterministic classifiers for missing TDK CLI, unsupported CLI version, non-TDK workspace, Docker unavailable, Tilt unavailable, Bun unavailable, occupied ports, missing/invalid master config, invalid service manifest, failed health endpoint, duplicate daemon, and Tilt startup failure.
- [ ] 4.3 Add a Troubleshooter view that shows issue list, severity, likely cause, confidence, evidence, raw output, and next actions.
- [ ] 4.4 Implement safe repair actions with explicit confirmation and exact command/operation preview for any state-changing action.
- [ ] 4.5 Ensure unknown failures retain raw command evidence and recommend a safe diagnostic next step.
- [ ] 4.6 Keep actionable issues available in the Troubleshooter view after native VS Code notifications are dismissed.

## 5. Notification Management

- [ ] 5.1 Implement quiet-by-default background polling with no notifications for successful checks or unchanged non-actionable states.
- [ ] 5.2 Implement notification deduplication by issue fingerprint, workspace, resource, severity, and state transition.
- [ ] 5.3 Implement notifications for new critical issues, escalations, and completed user-triggered repair actions.
- [ ] 5.4 Route notification actions to the relevant troubleshooting detail, command output, stack, or resource.
- [ ] 5.5 Honor user settings for notification categories and quiet behavior.
- [ ] 5.6 Add tests proving dismissed native notifications do not remove issues from Troubleshooter history.

## 6. Tests and Manual Validation

- [ ] 6.1 Add unit tests for command runner success, failure, cancellation, and output capture.
- [ ] 6.2 Add unit tests for TDK workspace detection and CLI discovery fallbacks.
- [ ] 6.3 Add unit tests for every deterministic diagnostic classifier and unknown-failure fallback.
- [ ] 6.4 Add tests for notification deduplication, escalation, and category suppression.
- [ ] 6.5 Add VS Code extension integration tests for activation, command registration, disabled non-TDK workspace state, and at least one orchestration command using a mocked CLI.
- [ ] 6.6 Add mocked CLI fixtures for success, failure, missing prerequisites, port conflict, invalid config, Tilt startup failure, and unknown failure.
- [ ] 6.7 Run lint, typecheck, unit tests, and VS Code extension tests.
- [ ] 6.8 Package or dry-run package the extension to prove the MVP can be installed locally.

## 7. Documentation and Final Review

- [ ] 7.1 Document MVP usage, settings, supported commands, troubleshooting behavior, notification policy, and safe repair guarantees.
- [ ] 7.2 Document known limitations and follow-up candidates such as richer Tilt links, marketplace publishing, and optional AI-assisted troubleshooting.
- [ ] 7.3 Complete the verification checklist mapping every scenario in the three spec files to source code and test evidence.
- [ ] 7.4 Perform a final critical review of the specs and implementation for overreach, missed failure modes, notification noise, unsafe repair actions, and any gap that blocks one-shot MVP acceptance.
- [ ] 7.5 Record final commands run and results in the verification notes.
