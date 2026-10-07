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

## 3. Regenerate, migrate, and import

- [ ] 3.1 `tdk config regenerate` rewrites generated files and leaves every `service.json` byte-identical
- [ ] 3.2 `tdk config regenerate --dry-run` writes nothing
- [ ] 3.3 `tdk config migrate` sets a missing `schemaVersion` and does not rewrite generated files
- [ ] 3.4 An unsupported `schemaVersion` fails migrate with no write
- [ ] 3.5 `tdk import` does not call regenerate or migrate
- [ ] 3.6 A second regenerate on unchanged inputs is byte-identical, and verify exits 0

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
