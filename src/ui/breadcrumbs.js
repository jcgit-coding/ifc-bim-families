import { t } from '../i18n/i18n.js';
import { el } from './dom.js';

/** Header breadcrumb: Catalogue / Discipline / [template switcher]. */
export function renderBreadcrumbs(container, registry, activeTemplate) {
  if (!activeTemplate) {
    container.replaceChildren();
    return;
  }
  const select = el('select', { 'aria-label': t('Template') },
    registry.templates.map((template) => el('option', { value: template.id }, t(template.name))));
  select.value = activeTemplate.id;
  select.addEventListener('change', () => { window.location.hash = `t=${select.value}`; });
  container.replaceChildren(
    el('span', { class: 'sep' }), el('a', { href: '#' }, t('Catalogue')),
    el('span', { class: 'sep' }), el('span', {}, t(activeTemplate.discipline)),
    el('span', { class: 'sep' }), select);
}
