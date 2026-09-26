# Spec Delta

## Purpose

Lets a resource opt out of `tdk up`'s normal sequential bring-up and instead start on its own first request, so one request against a large landscape doesn't wait behind every other resource's startup.

## ADDED Requirements

### Requirement: Deferred Start Opt-In

A resource with a `sablier` manifest block SHALL be able to mark itself deferred for the current `tdk up` run. A deferred resource's image SHALL still be built during `tdk up`, but its container SHALL NOT be started as part of `tdk up`'s normal bring-up sequence.

#### Scenario: Deferred resource is not started during tdk up

- **WHEN** `tdk up` runs a landscape containing a resource with deferred start enabled
- **THEN** that resource's image build completes during the run
- **AND** the resource's container is not started, and `tdk up` does not wait on it to become healthy before finishing bring-up of the rest of the landscape

#### Scenario: Non-opted-in resource is unaffected

- **WHEN** `tdk up` runs a landscape containing a resource with no `sablier` block, or a `sablier` block without deferred start enabled
- **THEN** that resource is built and started as part of `tdk up`'s normal dependency-graph sequencing, exactly as before this change

### Requirement: Deferred Resource Stays Discoverable Before Its First Start

A deferred resource's Traefik route SHALL be registered and routable regardless of whether its container has ever been created, so the first request to it can be received and acted on rather than returning "no route" or a connection error.

#### Scenario: Route exists before first start

- **WHEN** `tdk up` finishes bring-up of a landscape containing a deferred resource that has never been started this session
- **THEN** a request to that resource's route reaches Traefik and is recognized as targeting a known, deferred resource, rather than returning "no route" or a connection error

#### Scenario: Route still resolves after the resource has run and stopped

- **WHEN** a deferred resource has run at least once this session and its container is now stopped
- **THEN** a request to that resource's route still reaches Traefik and is recognized as targeting that resource, using the same or an equivalent route as before it ever ran

### Requirement: First Request Triggers And Prioritizes Startup

The first request to a deferred resource's route SHALL start that resource's container and SHALL cause the resource to be prioritized ahead of the landscape's normal remaining bring-up order, rather than waiting for that order to reach it naturally.

#### Scenario: Request during a large, in-progress tdk up

- **WHEN** a request is made to a deferred resource's route while `tdk up` is still bringing up other, unrelated resources elsewhere in the landscape
- **THEN** the deferred resource is started and reaches a healthy state without waiting for the rest of the landscape's bring-up to complete first

#### Scenario: Request after tdk up has finished

- **WHEN** a request is made to a deferred resource's route after `tdk up` has finished bringing up the rest of the landscape
- **THEN** the deferred resource starts immediately in response to that request

### Requirement: Waking A Resource Also Wakes Its Dependency Chain

Waking a deferred resource SHALL also wake any of its own declared dependencies that are themselves deferred and not yet running, unless a dependency explicitly declares a different wake group.

#### Scenario: Deferred resource depends on a cold database

- **WHEN** a request wakes a deferred resource whose declared dependencies include another deferred, not-yet-started resource
- **THEN** that dependency is also started as part of the same wake, and the requesting resource's health checks are not evaluated against a still-cold dependency

#### Scenario: Dependency explicitly opts out of the shared wake

- **WHEN** a deferred resource's dependency declares its own, different wake group
- **THEN** waking the resource does not also start that dependency

### Requirement: A Waking Request Waits For Health, Not Just Start

A request that triggers a deferred resource's startup SHALL be held until the resource passes its health check or until a bounded timeout elapses, rather than being answered as soon as the container process starts.

#### Scenario: Client receives the real response

- **WHEN** a request wakes a deferred resource
- **THEN** the client's request is held and then answered by the resource once it is healthy, rather than receiving an immediate "starting" response with no real answer

#### Scenario: Startup exceeds the timeout

- **WHEN** a deferred resource does not become healthy within its configured wake timeout
- **THEN** the held request fails with a clear timeout error rather than hanging indefinitely

### Requirement: Deferred Status Is Reported Distinctly From Failure

`tdk up` and `tdk doctor` SHALL report a deferred, not-yet-started resource as intentionally deferred, and SHALL NOT report it the same way as a stalled or failed resource.

#### Scenario: tdk up summary

- **WHEN** `tdk up` finishes bring-up of a landscape containing deferred resources that have not yet received a request
- **THEN** the summary output lists those resources as deferred rather than omitting them or listing them as pending/stalled

#### Scenario: tdk doctor

- **WHEN** `tdk doctor` runs against a landscape containing a deferred, not-yet-started resource
- **THEN** it does not flag that resource as unhealthy or stuck solely because it has not started
