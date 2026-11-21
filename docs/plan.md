# Plan

## Goal
A static web application where a user picks a **family template**, sets its parameters, previews the
model in 3D with dimensions and downloads an **IFC4** file. Hosted on GitHub Pages and shareable by link.
First template: bioclimatic pergola. The design must accept any other family by adding one file.

## Architecture
```
src/
  core/            generic engine (no family-specific code)
    ifc/           STEP helpers, typed measures, profile writers, IFC writer
    geometry/      vector helpers for part orientation
    templates/     parameter handling, template contract/registry, evaluation
    units.js       millimetre/metre/degree conversions
    url-state.js   shareable URL state
  templates/       one file per family + catalogue index + "coming soon" list
  viewer/          three.js preview, part geometry, dimensions overlay
  ui/              DOM rendering (home, sidebar, parameter form, status)
  app.js           wiring only
scripts/           dev server, convention checker, sample export, IFC validation
tests/             unit tests (node:test)
docs/              requirements, plan, decisions, standards, guides
```
Data flow: `parameter values -> evaluateTemplate (range checks + template.compute) -> parts ->
viewer / buildIfc`. The UI and the viewer never import a specific template.

## Phases
1. **Base (done):** engine, pergola template, viewer, export, sharing, Pages deployment.
2. **Standardisation (done):** English-only code, modular files, conventions checker, tests, CI, docs.
3. **Viewer measurements (done):** overall width/depth/height overlay with toggle.
4. **Second family (next):** structural (profile sections) or plumbing (pipes with elbows) to prove the
   engine is generic; likely needs new profile types and curved sweeps.
5. **Hardening:** instanced rendering for large models, richer measurements per template,
   optional UI translations, Revit import mapping notes.

## Quality gates
- `npm test`: engine, contract of every template, IFC output.
- `npm run check`: line limit, file naming, English text.
- CI: both of the above plus IfcOpenShell validation of exported samples.

## Risks
- Plumbing requires sweeps and arcs, which the extrusion-only engine does not support yet.
- Large models can slow the viewer; mitigate with instancing.
- Revit may categorise imported IFC elements differently than expected; verify and document.
