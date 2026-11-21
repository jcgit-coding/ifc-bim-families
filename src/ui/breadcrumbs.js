import { el } from './dom.js';

/** Header breadcrumb: Catalogue / Discipline / [template switcher]. */
export function renderBreadcrumbs(container, registry, activeTemplate) {
  if (!activeTemplate) {
    container.replaceChildren();
    return;
  }
  const select = el('select', { 'aria-label': 'Template' },
    registry.templates.map((template) => el('option', { value: template.id }, template.name)));
  select.value = activeTemplate.id;
  select.addEventListener('change', () => { window.location.hash = `t=${select.value}`; });
  container.replaceChildren(
    el('span', { class: 'sep' }), el('a', { href: '#' }, 'Catalogue'),
    el('span', { class: 'sep' }), el('span', {}, activeTemplate.discipline),
    el('span', { class: 'sep' }), select);
}
