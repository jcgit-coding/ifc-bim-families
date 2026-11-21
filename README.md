# BIM Families

A web tool that generates **parametric BIM families as IFC4 files**. Pick a template, set its
parameters, review the model in 3D (with dimensions) and download the IFC. It runs entirely in the
browser, so it can be hosted on GitHub Pages and shared with colleagues through a link (parameters
travel in the URL).

Live site: https://jcgit-coding.github.io/ifc-bim-families/

## Templates
| Discipline | Template |
| --- | --- |
| Architecture | Bioclimatic pergola |

More families are planned (see [docs/roadmap.md](docs/roadmap.md)). Adding one takes a single file:
[docs/adding-a-template.md](docs/adding-a-template.md).

## Development
Requires Node.js 22 or newer. There are no runtime dependencies (three.js is vendored in `vendor/`).

```
npm start        # local server at http://localhost:8080
npm test         # unit tests
npm run check    # project conventions (line limit, naming, English)
```

## Documentation
All project documentation lives in [docs/](docs/README.md): requirements, plan, decisions,
standards and the guide for adding templates.

## Note on Revit
IFC files import into Revit as fixed geometry with their properties; they are not editable
parametric `.rfa` families. Regenerate the IFC with new parameters instead.
