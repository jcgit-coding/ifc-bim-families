# Roadmap

## Done
- Generic engine: IFC4 writer, parameter handling, template registry, shareable URLs.
- Catalogue home, parameter form generated from the template, three.js preview, IFC/JSON export.
- Template: bioclimatic pergola.
- Automated conventions check, unit tests and IFC validation in CI.

## Next
- More templates (structure, plumbing, stairs and railings). Plumbing needs sweeps/arcs (curved pipes).
- More profile types (I, L, hollow sections) and boolean openings.
- Instanced rendering for models with thousands of parts.
- Optional UI translations (strings are English only today).
- Verify how Revit categorises the imported IFC elements and document the mapping.

## Out of scope
- Native Revit `.rfa` generation. IFC imports as fixed geometry; editable parametric families
  would need a separate Revit API tool (pyRevit/Dynamo).
