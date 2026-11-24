# Project standards

These rules are checked automatically by `npm run check` (and in CI).

## Language
- All code, comments, identifiers, commit messages and documentation are in **English**.
- UI text is written in English in the source and shown through `t()` (`src/i18n/i18n.js`). Spanish lives
  only in `src/i18n/es.js`, the one file where the checker allows Spanish characters. Every new UI string
  needs a Spanish entry; IFC content (names, property sets, file names) is never translated.

## Prohibited
- **Emoji, pictographs and dingbats** are forbidden everywhere: code, UI text, comments, documentation
  and commit messages. Use plain text or SVG icons instead. Checked by `npm run check`.

## Interface defaults
- The **light theme is the default**. The dark theme is an explicit user choice (toggle in the app bar)
  and is never selected from the operating-system preference.

- The **language** is the stored choice, otherwise the browser language (Spanish if it starts with `es`,
  English otherwise). The app-bar button switches it and the URL state is kept.

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
- Template parameters are entered in **metres** (overall lengths such as width, depth, height), **centimetres** (cross sections, thicknesses, gaps) and **degrees**. Each parameter declares its `unit`.
- Everything after `compute()` (parts, IFC, viewer) is in **metres** and **degrees**.
- Convert with `valuesInMetres` (`src/core/templates/params.js`) or `toMetres` (`src/core/units.js`); never inline `/ 100` or `/ 1000`.

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
