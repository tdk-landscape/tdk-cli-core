# Machine-readable CLI

The supported agent polling loop uses `tdk status --json`; add `--tilt` when live Tilt resources are needed. Use `tdk resources --json` for the discovered manifest view and `tdk networks --json` for routed URLs and reachability. `tdk doctor --json` reports environment readiness and actionable checks.

Every response uses this envelope:

```json
{
  "schemaVersion": 1,
  "data": {},
  "errors": []
}
```

`data` is `null` when a command cannot produce its report. Errors have stable `code` and `message` fields. Diagnostics are written to stderr; stdout contains one JSON document. Exit code 0 means the report succeeded (doctor readiness permits warnings), 1 means a blocking finding or command failure, and 2 means invalid arguments or an unexpected internal error. Consumers should check the exit code and still parse the envelope when one is emitted.

Command data:

- `status`: `tilt.available`, `tilt.resourcesQueried`, optional live `tilt.resources`, discovered manifest `resources` (`name`, `stack`, `type`, `port`), and `stacks` (`name`, `resourceCount`). Without `--tilt`, `tilt.resourcesQueried` is `false` and `tilt.resources` is `null`; the `resources` array is still the manifest inventory and does not report live health. Pass `--tilt` to query Tilt's live resource state. If Tilt is unavailable, `tilt.available` is `false` and no live query is made.
- `resources`: `resources` with stable service name, stack, type, port, and manifest path.
- `networks`: `services` with stable service name, stack, base path, URL, optional Windows loopback URL, service port, and reachability state (`running`, `stopped`, or `unknown`). An empty list means no discovered resource currently has a routable base path.
- `doctor`: `ready`, `inProject`, ordered `checks`, and a `ports` plan with `http`, `https`, and `postgres` entries. Each port entry contains canonical `requested`, selected `chosen`, `explicit`, and `reason` fields. Doctor is read-only and does not persist the plan. Structured `errors` cover usage/internal failures. Check entries preserve `name`, `didPass`, `message`, optional `fix`, `isWarning`, and `isSkipped`.
- `config verify`: `valid`, `errors`, `warnings`, and `diffs`. Drift or missing tracked master outputs exits 1 and includes a unified diff; a valid project exits 0. A missing project exits 1 with a structured command error; invalid project JSON or an unexpected failure exits 2 with a structured internal error. JSON verification does not regenerate files.

`networks --json` previously returned a bare array. It now returns the versioned envelope. During migration, `networks --json-legacy` returns the old array and is scheduled for removal in CLI version 1.5.0; migrate consumers before that release to `data.services`. Existing text and raw output remain available.

Within schema version 1, additive fields are allowed. Clients should ignore unknown fields and reject unsupported major schema versions. Removing or renaming fields, changing their meaning, or changing collection shapes requires a versioned transition and migration notes. Text aliases and plural command aliases remain supported.

Minimal polling example:

```sh
if tdk status --json >status.json; then
  jq -r '.data.stacks[] | [.name, .resourceCount] | @tsv' status.json
else
  jq -r '.errors[]?.message, .data.resources[]? | strings' status.json >&2
fi
```

New resources created by `tdk resource` include a per-file `$schema` reference to the hosted service manifest schema. VS Code's JSON language service uses that reference for completion and validation; the generator leaves `.vscode/settings.json` untouched, so existing project editor settings remain intact. Resource registration adds the reference only when one is absent and preserves a user's existing `$schema` value.
