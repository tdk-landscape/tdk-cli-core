## 1. Isolate React frontend generation

- [ ] 1.1 Define frontend provider types and a registry in the shipped CLI package.
- [ ] 1.2 Move React dependencies, Vite integration, entry files, and starter component out of the generic frontend resource command into the React provider.
- [ ] 1.3 Resolve omitted framework values to React, persist `framework: "react"` in new frontend `service.json`, and preserve existing React generated output.
- [ ] 1.4 Add an explicit framework selection path and fail before file writes when the provider id is unknown.
- [ ] 1.5 Add CLI tests for React default output, explicit provider resolution, and unknown-provider failure.
- [ ] 1.6 Verify frontend manifests without a framework field remain valid under existing discovery and shared runtime behavior.

## 2. Document framework contributions

- [ ] 2.1 Add a frontend framework contribution guide describing the shared contract, provider layout, registration, and framework-specific files.
- [ ] 2.2 Link the guide from `CONTRIBUTING.md` and document how contributors can add React-compatible and lightweight Vite-based frameworks.
- [ ] 2.3 Add or update a framework pull request checklist with issue/context, default compatibility, generated output tests, and documentation requirements.
- [ ] 2.4 Document supported framework selection and the shared TDK frontend runtime contract in the CLI resource documentation.

## 3. Add Vue provider and CI checks

- [ ] 3.1 Implement and register the Vue 3 + Vite + TypeScript provider with Vue SFC entry and starter component files.
- [ ] 3.2 Add generated output checks for Vue dependencies, configuration, entry files, and persisted framework metadata.
- [ ] 3.3 Add provider tests to the existing CLI test suite run by CI; retain the standard typecheck and lint jobs without adding a separate provider workflow.
- [ ] 3.4 Verify React and Vue providers share the existing TDK frontend service and runtime integration without framework-specific engine files.
