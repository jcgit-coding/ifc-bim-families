# Decision log

Format: decision, reason, alternatives considered.

## D1 - Generate IFC instead of editing the manufacturer's `.rfa` (Nov 2026)
- **Why:** `.rfa` is a proprietary binary format that cannot be edited without Revit, and converting it to
  IFC only yields fixed geometry. A generator that writes IFC from parameters gives a clean, controllable result.
- **Alternatives:** Revit API scripts (pyRevit/Dynamo) to build a real parametric `.rfa`; Autodesk Design
  Automation in the cloud. Kept as a possible separate track (see roadmap).
- **Consequence:** IFC imports into Revit as fixed geometry with properties, not as an editable family.

## D2 - Static site on GitHub Pages with all logic in the browser (Nov 2026)
- **Why:** colleagues only need a link; no server to maintain; the IFC is plain text so it is generated client side.
- **Limits:** no accounts or database; sharing is done with URL parameters and JSON files; the site is public.

## D3 - Template-based, generic engine (Nov 2026)
- **Why:** the owner wants many families (architecture, structure, plumbing, ...). A template declares
  parameters and computes parts; the engine provides the form, validation, viewer, sharing and IFC export.
- **Consequence:** the UI and viewer never reference a specific family.

## D4 - Hand-written STEP writer, no IFC library in the browser (Nov 2026)
- **Why:** zero runtime dependencies and a small download. IfcOpenShell is used only in CI to validate output.
- **Trade-off:** only extruded profiles are supported (rectangle, circle); new shapes need a writer in
  `src/core/ifc/profiles.js`.

## D5 - three.js vendored in `vendor/` (Nov 2026)
- **Why:** works offline and does not depend on a CDN. Pinned to three.js 0.160.0 (single-file build).

## D6 - Units: metres and centimetres in the UI, metres and degrees in the model (Nov 2026)
- **Why:** overall lengths read naturally in metres and sections and spacings in centimetres; IFC and three.js use metres. Each parameter declares its unit (m, cm, mm or deg) and the engine converts with `valuesInMetres` (`src/core/templates/params.js`, `src/core/units.js`). Revised from the first version, which used millimetres everywhere.
- **Consequence:** old shared links that carry millimetre values are out of range and show a validation error.

## D7 - Project rules enforced by script (Nov 2026)
- 1000-line maximum, kebab-case file names, English-only text, checked by `npm run check` and CI.
- **Why:** rules that are not checked automatically drift.

## D8 - Custom property set names use `Custom_` prefix (Nov 2026)
- **Why:** the `Pset_` prefix is reserved for buildingSMART standard property sets.

## D9 - Manufacturer file excluded from the repository (Nov 2026)
- The Gaviota Climatika `.rfa` is third-party material and is ignored by git. Only generic geometry is published.

## D10 - Viewer dimensions are overall bounding-box measurements (Nov 2026)
- **Why:** generic for every template. Template-specific dimensions (for example slat pitch) appear in the
  status summary. Per-part measurements are a possible future addition.

## D11 - Technical-workbench interface with vendored IBM Plex fonts (Nov 2026)
- **Why:** the owner found typical generated UIs generic. A three-pane workbench, restrained palette and
  monospace data give a distinct, professional character. Fonts are vendored (OFL) to avoid external requests.
- Details in `design.md`.

## D12 - Light theme by default, no emoji (Nov 2026)
- **Why:** owner rules. The theme never follows the operating-system preference; dark is an opt-in
  toggle stored in local storage. Emoji are banned everywhere and rejected by `npm run check`.

## D13 - Parametrised cross sections and conditional parameters (Nov 2026)
- **Why:** the first pergola version hard-coded square columns. Sections are now parameters (shape and
  dimensions). A generic `visibleWhen` rule in the engine hides parameters that do not apply, so any
  family can offer alternative sections without custom UI code.

## D15 - Materials as IfcMaterial with surface style (Nov 2026)
- **Why:** a family for Revit needs named materials, not only geometry. Each part references a catalogue material;
  the writer emits `IfcMaterial` (name, category), an `IfcSurfaceStyle` colour on the solid and a material
  definition representation, and one `IfcRelAssociatesMaterial` per material. CI validates that every element has a material.
- **Limits:** single material per part (no layer sets), no physical properties yet, no IFC type objects yet.

## D14 - English source strings with a Spanish dictionary (Nov 2026)
- **Why:** the owner wants the page in English and Spanish while the code stays English. Strings are written
  in English and looked up in `src/i18n/es.js`; a missing entry falls back to English, and the tests
  reject missing entries for template strings. The language is the stored choice, otherwise the browser language.
- **Alternatives:** key-based catalogues (`ui.reset`), rejected as heavier for a small app; a build-time i18n library.
- **Consequence:** `npm run check` allows Spanish characters only in `src/i18n/es.js`.
