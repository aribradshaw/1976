# 1976 DevLog

Production-style releases use the same Arizona-calendar versioning policy as Campaign Baby, PeterMD, and Saguaro Signal.

- Every live push increments the patch number.
- The first live push in a new month advances the minor number and resets patch to `1`.
- The first live push in a new year advances the major number, sets minor to the Arizona calendar month minus one, and resets patch to `1`.
- Rebuilds of the same commit do not create another release.

## 2.7.5, August 18, 2026

Flagship launch and contributor foundation

- Replaced arbitrary randomized opening support with a calibrated board that preserves the certified 1976 state-winner map and models uncertainty separately.
- Added a typed, validated scenario registry and a documented historical scenario example so new content can be reviewed without editing the core engine.
- Split the title screen, campaign engine, and full strategy interface into on-demand production chunks, eliminating the oversized-bundle warning and reducing initial JavaScript.
- Added GitHub Pages deployment, launch screenshots, a rebuilt project presentation, contributor guidance, architecture and scenario documentation, and focused issue templates.
- Removed generated debug output and local development traces from source control, expanded ignore rules, upgraded the build and test toolchain, and brought the complete dependency audit to zero known advisories.
- Added a conservative asset-rights inventory and deferred a blanket code license until the bundled audio can be replaced or its redistribution rights verified.
- Expanded automated coverage to 31 deterministic and unit tests plus seven Chromium browser journeys.

## 2.7.4, August 18, 2026

Accessible strategy board and full-campaign quality gate

- Added a keyboard-operable state table ordered by race competitiveness as an alternative to the color map.
- Added persisted Reduce Motion and CRT Effects settings, system reduced-motion defaults, global animation control, visible focus, and an accessible focus-trapped settings dialog.
- Rebuilt tablet and mobile layout behavior so the map, campaign desk, state table, and action planner remain usable without page overflow.
- Made electoral forecast controls semantic buttons and improved keyboard navigation throughout setup and strategy views.
- Made historical coalition choices affect distinct voter groups rather than collapsing their tradeoffs into one generic national adjustment.
- Added Playwright Chromium infrastructure and a GitHub Actions quality workflow.
- Added 7 browser journeys covering setup, the complete weekly loop, autosave/resume, keyboard control, persisted accessibility settings, a 390px mobile campaign, and all 25 weeks through a fully called 538-EV election night.
- Expanded deterministic and unit coverage to 26 tests, with the full local quality gate now covering 33 automated checks.

## 2.7.3, August 18, 2026

Campaign continuity and election night

- Added automatic local campaign saves with versioned validation and an immediate Resume Campaign path from the title screen.
- Preserved dates, maps, actions, resources, historical decisions, final results, and the exact random stream so a restored campaign continues deterministically.
- Replaced the abrupt deterministic ending with a seeded election-night model that resolves every state from its live probability and always awards all 538 EV.
- Added an accessible live election desk that reveals state calls in batches, tracks the 270 threshold, honors reduced motion, and announces the final outcome.
- Stopped automatically downloading a large debug log when a campaign ends.
- Removed the front-loaded Spotify connection interruption and clarified candidate strengths and difficulty behavior on the start screen.
- Expanded automated coverage to 25 tests, including save round trips, malformed-save rejection, RNG continuation, insolvency safety, full election resolution, and replayed results.

## 2.7.2, August 18, 2026

Historical campaign decisions and the road to 270

- Added a sourced, curated decision for every week of the 1976 campaign, including all three presidential debates and the vice-presidential debate.
- Made decision costs, coalition effects, credibility changes, and strategic tradeoffs visible before the player commits.
- Added campaign energy and credibility as live resources affected by weekly choices.
- Replaced false-precision projections with state win probabilities, expected EV, likely EV, race ratings, and poll confidence.
- Added a Road to 270 campaign desk with battlegrounds, must-holds, best flips, and deterministic routes to victory.
- Added a newspaper-style weekly recap showing net EV movement, cash flow, resolved actions, and the states that moved most.
- Made weekly interview selection deterministic and streamlined the platform-choice experience.
- Expanded automated coverage to 18 tests, including all 25 historical events, debate timing, event replay, and route-to-270 strategy.

## 2.7.1, August 18, 2026

Deterministic campaign foundation

- Rebuilt weekly actions as a truthful plan-then-resolve flow and closed the remove-action exploit.
- Allowed players to end a week without filling all six action slots.
- Moved player interviews into the week they affect and preserved the final-week decision.
- Gave the opponent the same six-action ceiling and removed invisible catch-up boosts.
- Added replayable simulation seeds, canonical action quotes, bounded electoral forecasts, and 10 automated tests.
- Corrected Maine's electoral votes and restored the national total to 538.
- Removed continuous menu static audio so core setup is calm and immediately usable.
