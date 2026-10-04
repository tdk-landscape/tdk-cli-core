## ADDED Requirements

### Requirement: One page to operate it
Docs MUST state, in one place:
- install: macOS, Linux, and WSL2 Ubuntu for `tdk up`; native Windows is inspect-only
- the minimum Docker and Tilt versions `tdk doctor` checks
- how a release binary and `checksums.txt` are published
- that a missing or expired `TDK_LICENSE_KEY` still runs `tdk up`

#### Scenario: No license key
- **WHEN** the user runs `tdk up` on a free stack with `TDK_LICENSE_KEY` unset
- **THEN** startup proceeds
- **AND** premium-only commands print that they need a key
