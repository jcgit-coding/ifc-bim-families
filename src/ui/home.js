import { el } from './dom.js';

/** Renders the catalogue: one section per discipline, implemented templates plus "coming soon" cards. */
export function renderHome(container, registry) {
  container.replaceChildren();
  for (const discipline of registry.disciplines) {
    const grid = el('div', { class: 'cards' });
    for (const template of registry.byDiscipline(discipline)) {
      grid.append(el('a', { class: 'card', href: `#t=${template.id}` },
        el('b', {}, template.name), el('span', {}, template.description)));
    }
    for (const entry of registry.plannedByDiscipline(discipline)) {
      grid.append(el('div', { class: 'card soon' },
        el('em', {}, 'Coming soon'), el('b', {}, entry.name), el('span', {}, entry.description)));
    }
    container.append(el('h2', {}, discipline), grid);
  }
}
