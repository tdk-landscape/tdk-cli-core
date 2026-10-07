# Tasks

This change ships the command boundaries. Sections 4 and 5 are not this change.

## 1. Regenerate

- [ ] 1.1 `tdk config regenerate` rewrites generated files and leaves every `service.json` byte-identical
- [ ] 1.2 `tdk config regenerate --dry-run` writes nothing
- [ ] 1.3 A second regenerate on unchanged `.tdk/project.json` is byte-identical
- [ ] 1.4 `tdk config verify` exits 0 on that output and still says `tdk config regenerate`

## 2. Migrate

- [ ] 2.1 A missing `schemaVersion` is written only by `tdk config migrate`
- [ ] 2.2 Migrate does not rewrite generated Docker or Tilt files
- [ ] 2.3 An unsupported `schemaVersion` fails and writes nothing
- [ ] 2.4 A file that is already current is left byte-identical

## 3. Import and doctor

- [ ] 3.1 `tdk import` does not call regenerate or migrate
- [ ] 3.2 Import npx failure stays exit 127
- [ ] 3.3 Doctor JSON stays `{ schemaVersion, data.ready, data.checks, errors }` and exit codes stay 0/1/2

## 4. Not this change

- [ ] 4.1 Do not add a command, alias, or flag
- [ ] 4.2 Do not make `tdk up` idempotent here
- [ ] 4.3 Do not add port-owner detection, Ctrl+C recovery, or a lock file here
- [ ] 4.4 Do not add a golden suite or platform-matrix CI here
