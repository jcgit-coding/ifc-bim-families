# Project standards

These rules are checked automatically by `npm run check` (and in CI).

## Language
- All code, comments, identifiers, UI text, commit messages and documentation are in **English**.

## Prohibited
- **Emoji, pictographs and dingbats** are forbidden everywhere: code, UI text, comments, documentation
  and commit messages. Use plain text or SVG icons instead. Checked by `npm run check`.

## Interface defaults
- The **light theme is the default**. The dark theme is an explicit user choice (toggle in the app bar)
  and is never selected from the operating-system preference.

## File rules
- At most **1000 lines per file** (aim for far fewer; split by responsibility).
- File names are **kebab-case** (`parameter-form.js`). Exceptions: `README.md`, `LICENSE.md`.
- One responsibility per module. Shared logic lives in `src/core`; never copy code between templates.

## Naming
| Item | Convention | Example |
| --- | --- | --- |
| Variables, functions, parameters | `camelCase`, verb for functions | `buildBeams`, `slatCount` |
| Classes | `PascalCase` | `StepBuilder` |
| Module-level constants | `UPPER_SNAKE_CASE` | `MAX_LINES` |
| Template ids | kebab-case | `bioclimatic-pergola` |
| Parameter keys | `camelCase` English nouns | `columnWidth` |
| Part fields | `name, ifcClass, predefinedType, role, origin, extrusionAxis, profileAxis, profile, length` | |
| IFC property names | `PascalCase` | `SlatCount` |
| Custom property sets | `Custom_<Family>_<Topic>` (`Pset_` is reserved by buildingSMART) | `Custom_BioclimaticPergola_Parameters` |

## Units
- Template parameters are entered in **millimetres** and **degrees**.
- Everything after `compute()` (parts, IFC, viewer) is in **metres** and **degrees**.
- Convert with `src/core/units.js`; never inline `/ 1000`.

## Architecture
- `src/core`: generic engine (IFC writer, parameter handling, registry, URL state). No family-specific code.
- `src/templates`: one file per family, following the contract in `docs/adding-a-template.md`.
- `src/viewer`: three.js preview. `src/ui`: DOM rendering. `src/app.js`: wiring only.
- UI and viewer never import a specific template; they work from the registry.

## Definition of done
A change is finished only when all of these are true:
1. `npm test` and `npm run check` pass.
2. The affected documents in `docs/` describe the new behaviour. Review, in this order:
   `requirements.md` (status of the related requirement), `plan.md` (structure and phases),
   `design.md` (interface changes), `decisions.md` (new decision and its reason),
   `adding-a-template.md` (engine or contract changes), `roadmap.md` (done and next).
3. Search `docs/` and `README.md` for names that the change removed or renamed (for example old
   parameter keys or module names) and update them.
4. The commit message explains what changed and why.

## Quality gates
```
npm test       # unit tests (Node >= 22)
npm run check  # conventions: line limit, naming, English
```
CI also exports sample IFC files and validates them with IfcOpenShell (`scripts/validate-ifc.py`).
