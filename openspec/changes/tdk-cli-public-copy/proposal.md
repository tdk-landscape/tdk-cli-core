# Proposal: TDK CLI public copy

status: proposed

## Why

The first read of TDK CLI's public surfaces can leave engineers unsure whether it starts services locally, deploys production, or replaces a Compose file. The product name also needs to remain distinct from TDK Corporation and the unrelated expansion “Tilt Development Kit.”

## Goals

- State that TDK CLI starts services on a laptop before describing its engine.
- Reject the deploy-tool and Compose-file misread in the opening copy.
- Use “TDK CLI” as the public product name; do not call it “Tilt Development Kit” or bare “TDK”.
- Address engineers and tech leads already working with several services.
- Keep performance figures paired with their fixture and hardware caveats.

## Non-Goals

- Renaming GitHub repositories or the npm package.
- Creating landing pages, logos, testimonials, or case studies.
- Changing CLI behavior, Premium pricing, or the Helm production boundary.
- Explaining Tilt, Starlark, or PSR above the How it works section.

## Decisions

- Buyer: an engineer or tech lead who already works with several services. The payroll calculator stays on `/waiting` only.
- Name: qualify the public product as “TDK CLI.” Keep the package name `@tdk-landscape/tdk-cli-core`.
- Engine: explain it in one sentence under How it works: Docker runs containers, Tilt runs the dev loop, and TDK CLI writes that configuration.
- Premium: keep it out of the hero; pricing should say most teams should stay on free.

## What Changes

**Homepage opening**
- H1: “Start your services on your laptop.”
- Subhead: “Not a deploy. Not a Compose file. One service.json, then tdk up. No Kubernetes on the machine.”
- Proof: “14 services healthy in 4.6s on a 16 GB M1 once images exist.”
- Reason: describe the job before the implementation engine.

**Public names**
- Use “TDK CLI” in the GitHub organization profile, npm page title, and primary public copy.
- Keep repository names and the npm package name unchanged.

**Proof and placement**
- Call the 100-service demonstration a generated `/health` fixture in the same sentence as the number.
- Keep ROI sliders on `/waiting`; do not lead the homepage with payroll or Premium.

## Impact

Public website copy, npm README/title copy, GitHub repository About fields, organization profile, and example-repository About copy. No runtime change.
