# Interface design

Goal: a professional, distinctive interface that feels like a technical workbench, not a generic
template. Requested by the project owner; decisions below keep it consistent as families are added.

## Principles
- **Quiet and precise:** neutral "paper and ink" palette, one accent colour (teal), hairline borders,
  4 px radii, no shadows or gradients. Colour is reserved for meaning (accent = active/primary,
  amber = measurements, red/orange = errors and warnings).
- **Workbench layout:** parameters on the left, a full-bleed 3D viewport in the centre, model
  properties and export on the right. The viewport gets the most space.
- **Numbers are data:** values and units use a monospace face with tabular figures so columns align.
- **Dense but readable:** 13 px base text, 28 px controls, 4 px spacing scale, collapsible parameter groups.
- **Context in the header:** breadcrumb `Catalogue / Discipline / Template` with a template switcher.

## Typography
- IBM Plex Sans (UI) and IBM Plex Mono (values, labels, units), vendored in `vendor/fonts`
  (SIL Open Font License, see `vendor/fonts/ibm-plex-LICENSE.txt`). No external font requests.

## Colour tokens
Defined once in `:root` in `styles.css` (`--paper`, `--panel`, `--ink`, `--line`, `--accent`, ...), with a
`:root[data-theme="dark"]` override. The light theme is the default; the app-bar toggle switches theme and
remembers the choice in local storage (`src/ui/theme.js`). Components only use tokens, never literal colours.
The viewer uses neutral grey for structure and teal for operable parts; dimension annotations use amber.

## Behaviour
- Catalogue with discipline filter chips; "Soon" placeholders are visibly dashed and not clickable.
- Parameter edits update the 3D model, properties, file name and URL immediately.
- Invalid values show an inline message and disable export.
- `Reset` restores template defaults. `Copy link` shares the exact state.
- Keyboard focus is always visible; interactive controls have accessible names.
- Below 960 px the layout stacks (viewport first).

- Parameters with `visibleWhen` appear only when relevant (for example the column diameter when the
  section shape is circular).

## Open items
- Dark theme switches correctly (verified through computed styles) but has not been reviewed visually.
- Per-part measurements and part selection in the viewer.
