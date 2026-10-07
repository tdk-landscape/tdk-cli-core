# Spec Delta

## Purpose

`tdk up`, `tdk status`, and `tdk ui` agree on whether a service is ready.

## ADDED Requirements

### Requirement: Status and UI agree
`tdk status` and `tdk ui` SHALL use the same readiness result for a service. If one reports a service as not ready, the other SHALL NOT report that service as ready.

#### Scenario: Database is not ready
- **WHEN** postgres is not ready and api depends on it
- **THEN** `tdk status` and `tdk ui` both show postgres not ready

### Requirement: Process up is not ready
A service whose process is up but whose configured dependency is not ready SHALL NOT be shown as ready.

#### Scenario: API is up and database is down
- **WHEN** the api process is running and its database dependency is failed
- **THEN** `tdk status` and `tdk ui` do not label api ready and name the database failure
