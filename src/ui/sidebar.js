import { el } from './dom.js';

/** Template switcher shown beside the generator, grouped by discipline. */
export function renderSidebar(container, registry, activeTemplate) {
  container.replaceChildren(el('a', { class: 'item back', href: '#' }, '← Catalogue'));
  for (const discipline of registry.disciplines) {
    const templates = registry.byDiscipline(discipline);
    if (templates.length === 0) continue;
    container.append(el('h3', {}, discipline));
    for (const template of templates) {
      const active = template.id === activeTemplate.id ? ' active' : '';
      container.append(el('a', { class: `item${active}`, href: `#t=${template.id}` },
        el('b', {}, template.name), el('span', {}, template.description)));
    }
  }
}
