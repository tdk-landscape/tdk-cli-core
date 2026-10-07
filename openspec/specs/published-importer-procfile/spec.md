# published-importer-procfile Specification

## Purpose
Verify the released importer package and documentation meet the published contract for published-importer-procfile.

## Requirements

### Requirement: Node is written, other runtimes are skipped
A command that starts with `node`, `npm`, `pnpm`, `yarn`, or `bun` is eligible.
Any other command is skipped unless that process already has a Dockerfile or image.
A mixed Procfile MUST write the eligible services, print each skip, and exit 0.
Exit 2 only when every process was skipped.

#### Scenario: Python and Node
- GIVEN a Procfile with `web: python app.py` and `worker: node worker.js`, and no Dockerfile
- WHEN the user runs the published 0.1.1 package with `--yes`
- THEN a service.json is written for worker
- AND no service.json is written for web
- AND the output says to add a Dockerfile or image for web
- AND the command exits 0
