# 1976 Network Television Style Guide

## Creative brief

The game should feel like a playable 1976 network election special. It is not a modern analytics dashboard wearing a retro filter. The visual language comes from election desks, studio control rooms, wire-service copy, printed briefing books, and the physical television sets through which people followed the race.

The experience has two related modes:

- **Campaign desk:** dark broadcast navy, warm lettering, sharp rules, dense but legible data, and restrained analog texture.
- **Editorial report:** warm paper, ink, serif headlines, source notes, and tabular results for historical decisions, weekly recaps, and election night.

The electoral map is the primary visual. Party colors communicate electoral ownership and probability. They are not decorative button colors.

## Principles

1. **The map leads.** Supporting panels should frame decisions instead of competing with the map.
2. **Every line has a job.** Use rules to separate editorial sections, not borders around every sentence.
3. **Hardware is literal.** Wood, curvature, scanlines, knobs, and inset shadows belong only to television hardware and media surfaces.
4. **Data is sober.** Forecasts, money, stamina, dates, and electoral votes use tabular numerals and crisp alignment.
5. **Motion is a broadcast cut.** Use short cuts, wipes, and state changes. Never float, bounce, pulse, or glow for decoration.
6. **Period flavor never obscures play.** No blur, chromatic aberration, or color filter may reduce map or text clarity.

## Core tokens

| Role | Token | Value |
| --- | --- | --- |
| Ink | `--tv-ink` | `#101827` |
| Broadcast navy | `--tv-navy` | `#17294c` |
| Deep navy | `--tv-navy-deep` | `#0d1930` |
| Broadcast blue | `--tv-blue` | `#28517d` |
| Paper | `--tv-paper` | `#f4ecd8` |
| Muted paper | `--tv-paper-muted` | `#d8cbaa` |
| Rule | `--tv-rule` | `#b7a579` |
| Signal amber | `--tv-amber` | `#c4922d` |
| Democratic result | `--tv-democrat` | `#27639a` |
| Republican result | `--tv-republican` | `#a63e3c` |
| Positive | `--tv-positive` | `#496c57` |
| Warning | `--tv-warning` | `#b87526` |
| Danger | `--tv-danger` | `#983838` |

Signal amber indicates selection, timing, and primary action. Democratic blue and Republican red are reserved for candidates, polling, electoral calls, and outcome comparisons.

## Typography

- **Display and chyron:** Arial Narrow, Franklin Gothic Medium, or a condensed system sans. Use uppercase with modest tracking for labels and mastheads.
- **Body and controls:** Arial or Helvetica. Prefer short, direct labels.
- **Data:** Courier New or Courier with tabular numerals. Use for dates, seed numbers, money, percentages, action days, and electoral votes.
- **Editorial:** Georgia or Times New Roman. Use only for historical reports, recaps, and election-night headlines.

Do not use Montserrat, futuristic display faces, handwriting, or novelty distressed fonts.

## Geometry and depth

- Broadcast panels and cards: `0px` radius.
- Buttons and inputs: `2px` radius.
- Physical hardware: up to `4px`, with larger curves allowed only on a literal CRT screen.
- Use 1px rules and selective 2px section dividers.
- Use no colored glows.
- A modal may use one hard 5px offset shadow. A CRT may use one inset black shadow.
- Avoid gradients except restrained cabinet material or paper texture.

## Component patterns

### Masthead

A flat navy strip with a thin amber top rule. Candidate portrait, title, week, and settings sit on one broadcast plane. The title uses the display face; seed and autosave status use the data face.

### Scoreboards and resources

Treat money, action points, energy, credibility, and EV as a results board. Use aligned figures, segmented meters, and vertical rules. Avoid individual rounded tiles and circular energy pips.

### Campaign plan

The six action slots form a production rundown. Each day is a rectangular row with a day code, action, location, and remove control. The main call to action is `Advance week`, shown in amber only when available.

### Electoral map

The map may retain subtle CRT depth. The surrounding frame is compact and dark. Selection uses an amber outline, not purple glow. The legend is a flat lower-third with square swatches.

### State information

Use a state-name masthead, a large EV figure, polling chart, and ruled sections. Quick actions are rectangular briefing choices. Dense records use alternating low-contrast rows, not nested cards.

### Dialogs

All dialogs use a quiet dark overlay, a sharp paper or navy card, one signal rule, and consistent header and footer regions. Historical decisions and recaps use editorial paper. Planning and settings dialogs use broadcast navy.

### Wire

The news line is a network wire, not a modern notification pill. The label is amber on ink. Scrolling pauses on hover and is disabled with reduced motion.

## Responsive behavior

- Above 1200px: three-column control-room layout with the map dominant.
- 900px to 1200px: narrower side desks and reduced decorative hardware.
- Below 960px: a vertical flow with masthead, map, campaign desk, and plan. Physical TV controls are removed before they can crowd the receiver.
- Below 560px: 44px minimum touch targets, simplified labels, horizontally scrollable data tables, and no decorative cabinet frame.

The design must remain usable at 200% zoom, with CRT effects disabled, and with reduced motion enabled. Focus rings use signal amber and must never depend on party color alone.

## Do not use

- Purple or neon gradients
- Repeated rounded dashboard cards
- Hover lift or scale on cards and buttons
- Pulsing primary actions
- Colored box shadows or text glows
- Blurred modal backdrops
- Pill badges except literal toggle switches
- Decorative emoji in interface labels
- Continuous animation that carries important information
