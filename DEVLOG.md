# 1976 DevLog

Production-style releases use the same Arizona-calendar versioning policy as Campaign Baby, PeterMD, and Saguaro Signal.

- Every live push increments the patch number.
- The first live push in a new month advances the minor number and resets patch to `1`.
- The first live push in a new year advances the major number, sets minor to the Arizona calendar month minus one, and resets patch to `1`.
- Rebuilds of the same commit do not create another release.

## 2.7.1, August 18, 2026

Deterministic campaign foundation

- Rebuilt weekly actions as a truthful plan-then-resolve flow and closed the remove-action exploit.
- Allowed players to end a week without filling all six action slots.
- Moved player interviews into the week they affect and preserved the final-week decision.
- Gave the opponent the same six-action ceiling and removed invisible catch-up boosts.
- Added replayable simulation seeds, canonical action quotes, bounded electoral forecasts, and 10 automated tests.
- Corrected Maine's electoral votes and restored the national total to 538.
- Removed continuous menu static audio so core setup is calm and immediately usable.

