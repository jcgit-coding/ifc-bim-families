import { el } from './dom.js';

const ALL = 'All';
const MONOGRAM_LENGTH = 2;

const monogram = (name) => name.replace(/[^A-Za-z]/g, '').slice(0, MONOGRAM_LENGTH).toUpperCase();

function createCard(entry, href) {
  const mark = el('div', { class: 'card-mark', 'aria-hidden': 'true' }, monogram(entry.name));
  const text = el('div', {}, el('b', {}, entry.name), el('span', {}, entry.description));
  return href
    ? el('a', { class: 'card', href }, mark, text)
    : el('div', { class: 'card soon' }, mark, text);
}

/**
 * Renders the catalogue: discipline filter chips, then one section per discipline with the
 * implemented templates followed by "coming soon" placeholders.
 */
export function renderHome(filters, catalogue, registry, activeDiscipline = ALL) {
  const disciplines = [ALL, ...registry.disciplines];
  filters.replaceChildren(...disciplines.map((discipline) => {
    const chip = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(discipline === activeDiscipline) }, discipline);
    chip.addEventListener('click', () => renderHome(filters, catalogue, registry, discipline));
    return chip;
  }));

  catalogue.replaceChildren();
  for (const discipline of registry.disciplines) {
    if (activeDiscipline !== ALL && activeDiscipline !== discipline) continue;
    const grid = el('div', { class: 'cards' });
    registry.byDiscipline(discipline).forEach((template) =>
      grid.append(createCard(template, `#t=${template.id}`)));
    registry.plannedByDiscipline(discipline).forEach((entry) => grid.append(createCard(entry)));
    catalogue.append(el('h2', { class: 'section-title' }, discipline), grid);
  }
}
