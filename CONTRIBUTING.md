# Contributing

Thanks for helping make the 1976 election simulator more accurate, playable, and accessible.

## Before you begin

Open an issue for substantial mechanics, scenario, or historical-data changes. Small fixes can go straight to a focused pull request. Keep each pull request narrow, explain the player-facing result, and include tests for changed simulation behavior.

## Development checks

Run these before requesting review:

```bash
npm test
npm run build
npm run lint
```

Do not bundle generated build output, local settings, test artifacts, or unrelated formatting changes.

## Historical and scenario contributions

Scenario definitions live in `src/scenarios/` and should not require an edit to `GameEngine.ts`. Every factual claim or state override needs a primary or clearly identified archival source URL, a short explanatory note, and a test that validates the scenario against the state catalog. See [the scenario guide](docs/scenarios.md).

Historical content should distinguish documented fact from a gameplay effect. A decision card may model a plausible tradeoff, but it must not present its numerical game effect as a measured historical fact.

## Simulation changes

Keep simulation logic deterministic. Pass a seeded random source into new resolution code instead of calling `Math.random()`. Add focused tests for bounds, replay behavior, and resource legality. Explain calibration assumptions in the pull request.

## Accessibility and interface work

Preserve keyboard operation, visible focus, semantic controls, reduced-motion behavior, and non-color-only state information. Test narrow screens as well as a full desktop layout.

## Pull request checklist

- The change has one clear purpose.
- Tests cover the changed behavior.
- `npm test` and `npm run build` pass.
- Historical sources and assumptions are linked where relevant.
- Screens or interaction notes are included for visible interface changes.
