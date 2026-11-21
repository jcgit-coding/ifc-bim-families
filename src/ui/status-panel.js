import { el } from './dom.js';

/** Renders the model properties (summary rows) plus warnings and errors of an evaluation result. */
export function renderStatus(container, result) {
  const rows = result.summary.map(({ label, value }) =>
    el('div', { class: 'row' }, el('dt', {}, label), el('dd', {}, value)));
  const messages = [
    ...result.errors.map((text) => el('p', { class: 'message error', role: 'alert' }, text)),
    ...result.warnings.map((text) => el('p', { class: 'message warning' }, text)),
  ];
  container.replaceChildren(el('dl', { class: 'props' }, ...rows), ...messages);
}
