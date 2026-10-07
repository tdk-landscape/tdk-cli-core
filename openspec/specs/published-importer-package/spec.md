# published-importer-package Specification

## Purpose
Verify the released importer package and documentation meet the published contract for published-importer-package.

## Requirements

### Requirement: 0.1.1 is the safeguard release
`npm view @tdk-landscape/tdk-import version` MUST report `0.1.1` after publish.
The tarball MUST be built from the commit that contains tdk-import#9 and #10.
The publish workflow MUST run with `dry_run` off.

#### Scenario: latest is not 0.1.0
- GIVEN the publish workflow succeeded
- WHEN a clean machine runs `npx -y @tdk-landscape/tdk-import@0.1.1 --version`
- THEN it prints 0.1.1
- AND it does not install 0.1.0
