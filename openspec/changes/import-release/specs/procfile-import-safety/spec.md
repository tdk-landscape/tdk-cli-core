## ADDED Requirements

### Requirement: no Dockerfile means skipped, not started
A Procfile process MUST be considered Node-supported only when its command starts with `node`, `npm`, `pnpm`, `yarn`, or `bun`, followed by whitespace or the end of the command. The importer MUST NOT infer support from other command forms. A process whose command is not Node-supported MUST be listed as skipped unless a Dockerfile or image is associated with that process. A skipped process MUST NOT produce a `service.json`. Importable processes in the same Procfile MUST still be imported. The importer MUST exit 0 when it imports at least one process, including a partial import, and MUST exit 2 when every valid process is skipped.

#### Scenario: Python Procfile process is skipped
- **GIVEN** a Procfile with `web: python app.py` and no Dockerfile
- **WHEN** the user runs the importer
- **THEN** that process is skipped
- **AND** no `service.json` is written for `web`
- **AND** the output says to add a Dockerfile or an image
- **AND** the command exits 2

#### Scenario: Mixed Procfile imports only buildable process
- **GIVEN** a Procfile with `web: python app.py` and `worker: node worker.js`, with no Dockerfile or image for `web`
- **WHEN** the user runs the importer
- **THEN** `worker` is imported and receives a `service.json`
- **AND** `web` is skipped and receives no `service.json`
- **AND** the output names the skipped `web` process and says to add a Dockerfile or image
- **AND** the command exits 0

#### Scenario: Other non-Node commands are skipped without guessing
- **GIVEN** Procfile processes whose commands start with `ruby`, `gunicorn`, and `poetry`, with no Dockerfile or image for them
- **WHEN** the user runs the importer
- **THEN** all three processes are skipped
- **AND** no `service.json` is written for them
- **AND** the command exits 2

#### Scenario: Non-Node process with an image is importable
- **GIVEN** a Procfile with `web: python app.py` and a matching Compose service that declares an image for `web`
- **WHEN** the user runs the importer
- **THEN** `web` is imported using that image
- **AND** the process is not listed as skipped
- **AND** the command exits 0
