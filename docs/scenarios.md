# Scenario and mod guide

Scenarios are typed campaign definitions in `src/scenarios/`. They provide a stable place for tickets, starting resources, a seed, sparse state overrides, historical notes, and source links.

## Add a scenario

1. Copy the structure in `src/scenarios/historical1976.ts` into a new file.
2. Choose a lowercase, hyphenated id and a fixed integer seed.
3. Define both tickets and keep state overrides sparse. An omitted state uses the base state catalog.
4. Give every override a note and at least one source URL.
5. Add the definition to `src/scenarios/registry.ts`.
6. Add a test in `src/scenarios/__tests__/` that calls `validateScenario` with the state catalog.

## Editing a state override

`stateOverrides` use postal abbreviations. Each override may set starting polling, turnout, and starting momentum. Poll support must remain between 0 and 100 in total, turnout must be between 0 and 100, and margin of error must be between 0 and 20.

The values are gameplay starting conditions. State the historical evidence behind the direction of the override, then describe the balancing choice separately in `note` or the pull request.

## Events

Use `eventTimelineId: '1976'` to identify the current curated event deck. The current implementation has a 25-week historical timeline in `src/data/events1976.ts`. A future scenario-specific deck should use the same decision-card structure, include sources, and be registered independently.

## Current limitation

Scenario definitions validate and can create deterministic `ScenarioSession` objects today, but `GameEngine` does not yet receive a scenario at construction. Do not work around that limitation by importing or mutating engine internals from a scenario file. Follow the integration direction in [architecture.md](architecture.md).
