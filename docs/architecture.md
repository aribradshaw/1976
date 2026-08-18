# Architecture boundary

The game currently has two layers:

- `src/components/` renders the campaign interface and calls engine methods.
- `src/game/GameEngine.ts` owns the live mutable campaign state, turn resolution, opponent behavior, polling, and final result resolution.

`GameEngine` currently constructs its state catalog internally. It does not yet accept a scenario object in its constructor. That means files in `src/scenarios/` are a typed, validated content boundary and registry today, but they are not automatically selected by the start screen yet.

## Scenario integration direction

The next engine integration should accept a `ScenarioSession` at game creation and apply it before the first week:

1. Resolve a scenario from `src/scenarios/registry.ts`.
2. Validate it against `getAllStates()`.
3. Pass `scenario.seed`, starting resources, total weeks, state overrides, tickets, and event timeline id into the engine initialization path.
4. Preserve a scenario id and seed in saves and game logs.

This keeps historical content reviewable without coupling contributors to live engine mutation. Scenario files should remain data and pure validation helpers; mechanics continue to belong in the simulation and engine layers.
