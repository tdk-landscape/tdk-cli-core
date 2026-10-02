# Configuration and editor schemas

TDK has two JSON files with different jobs: each service's `service.json` describes that service, and `.tdk/project.json` configures the local project and its stack phases. The schemas help editors provide completion; TDK's CLI behavior remains authoritative.

## `service.json`

Here is valid JSON; the explanations are outside the file so it remains parseable:

```json
{
  "$schema": "https://tdk-landscape.github.io/schema.service.json",
  "schemaVersion": 1,
  "appName": "api-backend",
  "appType": "backend",
  "stack": "shop",
  "port": 4000,
  "healthCheckPath": "/health",
  "dependsOn": []
}
```

`appName`, `appType`, `stack`, and `schemaVersion` are required. A backend also needs a port in the supported backend range. See the [authoritative service schema](../engine/schemas/service-schema.json). The `$schema` property is supported by the schema. `tdk doctor` checks local environment readiness and discovered service issues.

## `.tdk/project.json`

For VS Code, associate both filenames with their schema in workspace settings. The project schema provides editor assistance for the current project configuration shape; it does not add or change CLI validation.

```json
{
  "json.schemas": [
    {
      "fileMatch": ["/services/**/service.json"],
      "url": "https://tdk-landscape.github.io/schema.service.json"
    },
    {
      "fileMatch": ["/.tdk/project.json"],
      "url": "https://raw.githubusercontent.com/tdk-landscape/tdk-cli-core/main/engine/schemas/project-schema.json"
    }
  ]
}
```

The service schema is also in [`engine/schemas/service-schema.json`](../engine/schemas/service-schema.json), and the current project configuration schema is [`engine/schemas/project-schema.json`](../engine/schemas/project-schema.json). Run `tdk config verify` to check that generated project files match `.tdk/project.json`; it does not validate the service manifest or Helm values. `tdk doctor` checks local readiness and service concerns.

### The service schema and how it is published

`engine/schemas/service-schema.json` is the source of truth; the copy at `https://tdk-landscape.github.io/schema.service.json` is a
deploy artifact for editors. It is only an editor hint. The CLI provider registries are the contract: the CLI rejects an unknown
`framework` or `language` id before it writes a resource. So `framework` and `language` are open strings with an id pattern, their
`examples` are a short hint rather than a list of every provider, and adding a provider never changes the schema.

- **On a pull request**, CI validates the schema offline (`scripts/check-published-service-schema.mjs`). It never fetches the live
  copy, because a PR that changes the schema could never match it before merge.
- **After a change to the schema lands on `main`**, the *Publish service schema* workflow copies it to the Pages repository and then
  reports in its run summary whether the live copy matches. It needs a repository secret named `PAGES_SYNC_TOKEN` (a fine-grained
  token with `contents: write` on `tdk-landscape/tdk-landscape.github.io`). Without it the copy is skipped with a warning and the live
  copy falls behind `main`; the summary says so.

