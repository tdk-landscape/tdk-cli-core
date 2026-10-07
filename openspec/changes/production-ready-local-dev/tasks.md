# Tasks

## 1. Lock the current contract

- [ ] 1.1 Record current doctor human lines, exit codes, and JSON envelope on a fixture
- [ ] 1.2 Record current `tdk logs` flags and exit codes
- [ ] 1.3 Do not add a command or a flag to fill a gap

## 2. Doctor

- [ ] 2.1 Keep exit 0 / 1 / 2 as `getDoctorExitCode` defines them
- [ ] 2.2 Keep `schemaVersion`, `data.ready`, `data.checks`, and `errors` stable
- [ ] 2.3 Keep `Doctor passed. Next: tdk up` and `Doctor failed. Fix the items above, then run: tdk doctor`
- [ ] 2.4 Doctor and `tdk config verify` name the same generated drift

## 3. Generation

- [ ] 3.1 Remove timestamps, random ids, and machine-absolute paths from generated output
- [ ] 3.2 A second `tdk config regenerate` on unchanged inputs is byte-identical
- [ ] 3.3 `tdk config verify` exits 0 only when that output matches

## 4. Up, status, ui, logs

- [ ] 4.1 `tdk status` and `tdk ui` agree when a service is not ready
- [ ] 4.2 A second `tdk up` does not create a second environment
- [ ] 4.3 A partial start names the failed dependency
- [ ] 4.4 Human port output matches `data.ports.chosen` in doctor JSON
- [ ] 4.5 `tdk logs` still prints the service error text and exits 2 on a bad flag or unknown service
- [ ] 4.6 Ctrl+C during generate, up, and down leaves no partial generated file

## 5. Proof

- [ ] 5.1 Fixtures for doctor JSON, verify, logs usage, and `tdk up --dry-run`
- [ ] 5.2 Golden generated output
- [ ] 5.3 Do not add a command, a lock file, or native Windows runtime
