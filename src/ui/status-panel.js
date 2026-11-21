import { el } from './dom.js';

/** Renders summary rows (label/value), warnings and errors of an evaluation result. */
export function renderStatus(container, result) {
  const rows = result.summary.map(({ label, value }) =>
    el('div', { class: 'row' }, el('span', {}, label), el('b', {}, value)));
  const messages = [
    ...result.errors.map((text) => el('p', { class: 'message error', role: 'alert' }, text)),
    ...result.warnings.map((text) => el('p', { class: 'message warning' }, text)),
  ];
  container.replaceChildren(...rows, ...messages);
}
