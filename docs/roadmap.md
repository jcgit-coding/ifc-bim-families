# Roadmap

## Done
- Generic engine: IFC4 writer, parameter handling, template registry, shareable URLs.
- Catalogue home, parameter form generated from the template, three.js preview, IFC/JSON export.
- Template: bioclimatic pergola, with parametrised column (rectangular or circular) and beam sections.
- Viewer with overall dimensions overlay and view presets.
- Technical-workbench interface, light theme by default with a dark toggle.
- English and Spanish interface with a language switch; latest commit shown in the app bar.
- Automated checks: conventions (1000 lines, kebab-case, English, no emoji), unit tests, and IFC
  validation in CI (the CI workflow has not run on GitHub yet).

## Next
- Review the dark theme visually and test the layout on phones.
- Per-part measurements and part selection in the viewer.
- More templates (structure, plumbing, stairs and railings). Plumbing needs sweeps/arcs (curved pipes).
- More profile types (I, L, hollow sections) and boolean openings.
- Instanced rendering for models with thousands of parts.
- More languages: add a dictionary next to `src/i18n/es.js` and register it in `src/i18n/i18n.js`.
- Verify how Revit categorises the imported IFC elements and document the mapping.

## Out of scope
- Native Revit `.rfa` generation. IFC imports as fixed geometry; editable parametric families
  would need a separate Revit API tool (pyRevit/Dynamo).
