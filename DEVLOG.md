# 1976 DevLog

Production-style releases use the same Arizona-calendar versioning policy as Campaign Baby, PeterMD, and Saguaro Signal.

- Every live push increments the patch number.
- The first live push in a new month advances the minor number and resets patch to `1`.
- The first live push in a new year advances the major number, sets minor to the Arizona calendar month minus one, and resets patch to `1`.
- Rebuilds of the same commit do not create another release.

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
