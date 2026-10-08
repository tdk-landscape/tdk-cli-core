# Security Policy

## Supported versions

Security fixes go into the latest release published on [npm](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core). Please upgrade before reporting.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report them privately through [GitHub security advisories](https://github.com/tdk-landscape/tdk-cli-core/security/advisories/new). Include:

- the TDK version (`tdk --version`) and your OS
- steps to reproduce
- what an attacker could do with it

## What happens next

We follow coordinated disclosure:

1. **Acknowledgement** within 3 business days of your report.
2. **Assessment**: we confirm whether it is a vulnerability and tell you our severity estimate within 10 days.
3. **Fix**: we aim to publish a fixed release within 30 days of confirming it. Critical issues are handled first. If a fix needs longer, we tell you why and agree a new date with you.
4. **Disclosure**: once a fixed version is on npm, we publish a GitHub security advisory (with a CVE where one applies) and credit you unless you prefer otherwise. Please keep the details private until then, and until at most 90 days after your report.

If you do not hear back within 5 business days, please send the report again through the same advisory form.

## Scope

In scope: the `tdk` CLI, the Tilt engine and generated local runtime files in this repository, and the published npm package `@tdk-landscape/tdk-cli-core`. TDK is a local development tool; issues in third-party services it starts (Docker, Tilt, databases) should go to those projects.

## What TDK sends and how secrets are handled

See [docs/security.md](docs/security.md).
