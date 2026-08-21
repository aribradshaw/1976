# 1976 DevLog

Production-style releases use the same Arizona-calendar versioning policy as Campaign Baby, PeterMD, and Saguaro Signal.

- Every live push increments the patch number.
- The first live push in a new month advances the minor number and resets patch to `1`.
- The first live push in a new year advances the major number, sets minor to the Arizona calendar month minus one, and resets patch to `1`.
- Rebuilds of the same commit do not create another release.

## 2.7.13, August 20, 2026

Playable HTML5 release guard

- Repaired the itch.io browser build by promoting the complete Butler upload and hiding the obsolete manual ZIP whose hashed assets were missing.
- Added a static-package verifier that rejects missing entrypoint assets, empty files, directory escapes, and root-relative paths that break inside hosted subdirectories.
- Added the package-integrity check to both the GitHub quality gate and GitHub Pages deployment before anything is published.
- Documented the one-browser-upload rule and exact public iframe verification step for future itch.io releases.

## 2.7.12, August 19, 2026

Keep release history verifiable

- Moved shared release metadata onto the open-source DevLog package without changing gameplay or the election-broadcast presentation.
- Blocked future DevLog package updates unless the game version and public release record advance together.

## 2.7.11, August 18, 2026

Readable decisions and the election-night desk

- Brought campaign day labels, historical decision effects, and source links to WCAG AA contrast on dark broadcast panels and warm editorial paper.
- Contained election night in a two-column desktop spread that keeps the scoreboard, outcome, and latest state calls inside the results desk.
- Added a native public DevLog with the full release history, playable return path, GitHub star prompt, and contributor entry point.
- Expanded automated contrast coverage across setup, planning, reports, forecasts, decisions, interviews, recaps, election night, and the DevLog.
- Added a deterministic 50-second trailer capture workflow.

## 2.7.10, August 18, 2026

Mobile campaign tour and state drill-in

- Added a first-campaign guided tour that dims the board, spotlights live controls, and moves a connected briefing card through the campaign header, map controls, action desk, and End Week button.
- Made the tour responsive from 320px phones through desktop, with automatic target scrolling, Back, Next, Skip, Escape, persistent completion, manual replay, 44px controls, and reduced-motion behavior.
- Fixed State Table `Open` so it scrolls to and focuses the selected state's campaign desk instead of appearing to do nothing on a stacked mobile layout.
- Reworked narrow-screen modal overflow, historical choices, state-detail grids, and primary touch targets so the full decision and weekly-resolution loop remains reachable.
- Expanded quality coverage to 33 deterministic and unit tests plus 17 shipped Chromium journeys, including complete 25-week campaigns at five phone and tablet viewports.

## 2.7.9, August 18, 2026

Two-family broadcast typography

- Replaced the competing display, body, monospace, and editorial stacks with exactly two bundled families: Source Sans 3 for the interface and Source Serif 4 for historical storytelling.
- Replaced monospace data styling with Source Sans 3 tabular numerals so scoreboards stay aligned without introducing a third visual voice.
- Established and applied a shared 4, 8, 12, 16, 24, 32, and 48 pixel spacing rhythm across the title slate, campaign board, action planner, scoreboards, and dialogs.
- Rebalanced candidate-card text size, line height, padding, and image proportions for clearer names and less cramped campaign summaries.
- Documented the typeface licenses and added browser assertions that reject a third interface family or missing spacing tokens.

## 2.7.8, August 18, 2026

Responsive title receiver polish

- Restored the full `1976: As Seen on TV!` product name while retaining the network-election visual system as the art direction.
- Rebuilt candidate choices as responsive broadcast profiles with portrait-aware focal points so faces and names remain intact at every supported width.
- Made the opening receiver fit short desktop, compact desktop, and mobile viewports without relying on page scrolling.
- Moved the version to a persistent bottom-left link that opens the full DevLog.
- Removed decorative television controls before they can crowd or clip the title receiver at compact desktop and tablet widths.
- Added browser coverage for short-wide, 911px, and 390px viewport edge cases discovered during live deployment verification.

## 2.7.7, August 18, 2026

Network election desk

- Established a documented 1976 network television style guide with a restrained broadcast palette, typography roles, geometry, motion, modal, responsive, and accessibility rules.
- Rebuilt the title screen as an election-special opening slate while preserving the physical receiver as purposeful framing.
- Reframed the campaign board as a sharp election control room with a dominant map, tabular scoreboards, production-rundown action slots, and a network wire.
- Unified state reports, planning dialogs, historical decisions, weekly recaps, settings, forecasts, and election night under one broadcast and editorial system.
- Removed the gameplay-wide CRT veil, modern gradients, colored glows, pill-heavy cards, decorative hover motion, and anachronistic web typography.
- Added browser coverage that protects the design tokens and campaign masthead from visual-system regressions.

## 2.7.6, August 18, 2026

First-party audio only

- Removed the third-party music account connection from the title screen, campaign board, and settings.
- Deleted the OAuth implementation, playback API calls, weekly streaming-track IDs, connection components, and election-night autoplay behavior.
- Added a one-time browser migration that removes any legacy authorization token, state, and verifier left by earlier releases.
- Added an eighth Playwright journey verifying that no connection controls remain and legacy authorization data is cleared.

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
