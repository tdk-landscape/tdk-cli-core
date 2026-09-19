# manifest-field-migration Specification

## Purpose
TBD - created by archiving change rename-domain-to-stack-service-to-resource. Update Purpose after archive.
## Requirements
### Requirement: Manifest field migration from domain to stack
All manifest field access patterns SHALL remove fallback support for the deprecated `domain` field.

#### Scenario: No domain field fallback
- **WHEN** code retrieves the stack field from a manifest
- **THEN** it SHALL NOT use fallback patterns like `manifest.get('stack') or manifest.get('domain')`

#### Scenario: Stack field with default only
- **WHEN** a default value is needed for the stack field
- **THEN** code SHALL use `manifest.get('stack', default_value)` and NOT check for domain

#### Scenario: Domain field references removed
- **WHEN** searching the codebase for domain field access
- **THEN** no `manifest.get('domain')` patterns SHALL exist except in legacy parser code

#### Scenario: Filtering uses stack field only
- **WHEN** filtering manifests by logical group
- **THEN** code SHALL filter by `stack` field only and NOT check `domain` as fallback

