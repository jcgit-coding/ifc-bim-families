# Requirements

Source: instructions from the project owner during the design conversation (November 2026).
Status: Done / Partial / Pending.

## Purpose
| ID | Requirement | Status |
| --- | --- | --- |
| R1 | Generate parametric BIM families with **dimensions and angles as parameters**. | Done |
| R2 | The tool is **generic**: it must support many families (architecture, structure, plumbing, ...). Only the bioclimatic pergola is built for now. | Done (engine + 1 template) |
| R3 | Users fill in a **template** per family and **download the IFC**. | Done |
| R4 | Publish on **GitHub Pages** so colleagues can use it through a link. | Done |
| R5 | Parameters can be **shared** with colleagues. | Done (URL hash, JSON export) |

## Interface
| ID | Requirement | Status |
| --- | --- | --- |
| U1 | Professional, organised interface with a catalogue of families. | Done (first version) |
| U2 | **3D viewer** (three.js) to inspect the model. | Done |
| U4 | **Professional UI/UX and CSS** that does not look like a generic AI-generated design. | Done (first pass, see `design.md`; dark theme unchecked) |
| U3 | The viewer shows **measurements** so the user can verify the model. | Done (overall width, depth, height) |

## Code quality
| ID | Requirement | Status |
| --- | --- | --- |
| Q1 | No source file longer than **1000 lines**. | Enforced by `npm run check` |
| Q2 | **Everything in English** (code, comments, UI, documentation) for a global project. | Enforced by `npm run check` (Spanish characters are rejected) |
| Q3 | **Logical coherence** and **no redundancy**: shared logic lives in `src/core`. | Reviewed by structure; see `standards.md` |
| Q4 | **Standardised names** for files, variables and constants. | Documented in `standards.md`, file names enforced |
| Q5 | **Professional back end**: a clean engine layer separated from the UI. | Done (`src/core`; the app has no server) |
| Q7 | **No emoji** anywhere in the project. | Enforced by `npm run check` |
| Q8 | **Light mode by default.** | Done (dark is an opt-in toggle) |
| Q9 | Cross sections of columns and beams must be **parametrised** (shape and dimensions). | Done for the pergola (rectangular or circular columns, beam width and height) |
| Q6 | Documentation kept in `docs/`, including plans and audit material. | Done |

## Constraints discovered
- IFC imports into Revit as fixed geometry, so it cannot give editable parametric `.rfa` families.
- GitHub Pages is static hosting, so all computation runs in the browser.
- The manufacturer's `.rfa` (Gaviota Climatika) is not distributed in the repository.
