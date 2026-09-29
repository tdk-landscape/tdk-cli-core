## Context

The resource command supports BYO resources and a caller-supplied `--port`. The acceptance case is port 4500, within the existing 4000–5999 range. The CLI must carry that value through to the generated `services/<stack>/<resource>/service.json` manifest and the printed port line.

## Goals / Non-Goals

### Goals
- Persist the explicitly requested valid BYO port.
- Report the same port that is written to the manifest.
- Keep current validation behavior and error strings.

### Non-Goals
- Alter port allocation for calls that omit `--port`.
- Modify boot scripts, health-check behavior, or generated Tilt configuration.

## Decisions

### Use the command's parsed port as the BYO service port

Inspect the current command and tests, then make the smallest change so the BYO creation path uses its validated `--port` value instead of a default. Keep validation centralized in the existing path and avoid changing the manifest shape.

### Test observable command results

Extend the existing BYO command tests to assert both the printed port and the `.port` value in the generated manifest for 4500. Retain assertions for current out-of-range and invalid input errors.

## Risks / Trade-offs

- The resource command may have shared port-selection logic with other resource types. Keep the change confined to the BYO path so existing defaults remain stable.
- The filesystem or command harness may mock manifest output; assert through the existing test conventions rather than introducing a new test framework.

## Migration Plan

No migration is required. Existing manifests remain valid. Newly created BYO manifests use the requested port when one is provided.

## Open Questions

- Confirm the exact point where the parsed port is lost while inspecting `resource.ts`; preserve any existing shared behavior outside BYO.
