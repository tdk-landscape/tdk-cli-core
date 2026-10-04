# Tasks

## 1. Host probe
- [ ] 1.1 Detect Dev Container, Codespaces, and WebContainer in `cli/src/commands/doctor.ts` (WSL2 exists); add host kind and `canUp` to the doctor JSON report
- [ ] 1.2 Check JSON fixtures for doctor/status additions
- [ ] 1.3 `tdk up` fails closed when `canUp` is false, with host-specific remediation

## 2. Reference Dev Container
- [ ] 2.1 Contributor `.devcontainer` with `tdk` on PATH and docker-outside-of-docker
- [ ] 2.2 Opt-in template from `tdk project` (flag, default off)
- [ ] 2.3 Docs: Agent Host, Codespaces, T3-style servers; WebContainers non-goal

## 3. Harness API
- [ ] 3.1 `--json` on `up`, `down`; new `logs` command with `--json`
- [ ] 3.2 `up --only` (spike Tilt resource selection first)
- [ ] 3.3 Host/container ports and URL in `status --json`
- [ ] 3.4 `tdk mcp` sharing command implementations
- [ ] 3.5 Follow-up PR in tdk-skills to call the JSON/MCP contract

## 4. Verify
- [ ] 4.1 `openspec validate agent-host-runtime --strict`
- [ ] 4.2 Test: doctor with a fake devcontainer env
- [ ] 4.3 Test: webcontainer env does not spawn Tilt
