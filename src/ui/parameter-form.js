import { coerceValue } from '../core/templates/params.js';
import { el } from './dom.js';

const INPUT_TYPES = { range: 'range', number: 'number', text: 'text', boolean: 'checkbox' };

function createInput(param, value) {
  const input = el('input', { type: INPUT_TYPES[param.type] });
  for (const attribute of ['min', 'max', 'step']) {
    if (param[attribute] !== undefined) input.setAttribute(attribute, param[attribute]);
  }
  if (param.type === 'boolean') input.checked = value;
  else input.value = value;
  return input;
}

const readControl = (param, control) =>
  coerceValue(param, param.type === 'boolean' ? control.checked : control.value);

/** Builds the control cell of a field: [control element, wrapper element]. */
function createField(param, value) {
  if (param.type === 'select') {
    const select = el('select', {}, param.options.map(([optionValue, label]) => el('option', { value: optionValue }, label)));
    select.value = value;
    return { control: select, cell: el('div', { class: 'control' }, select) };
  }
  const input = createInput(param, value);
  if (param.type === 'range') {
    const output = el('output', {}, `${value} ${param.unit ?? ''}`);
    input.addEventListener('input', () => { output.textContent = `${input.value} ${param.unit ?? ''}`; });
    return { control: input, cell: el('div', { class: 'control range' }, input, output) };
  }
  if (param.type === 'boolean') return { control: input, cell: el('div', { class: 'control check' }, input) };
  const unit = param.unit ? el('span', { class: 'unit' }, param.unit) : '';
  return { control: input, cell: el('div', { class: 'control' }, input, unit) };
}

/**
 * Renders a form from a template's parameter definitions, one collapsible section per group.
 * @param {(key: string, value: unknown) => void} onChange called on every edit
 */
export function renderParameterForm(container, template, values, onChange) {
  container.replaceChildren();
  const groups = [...new Set(template.params.map((param) => param.group))];
  for (const group of groups) {
    const body = el('div', { class: 'group-body' });
    for (const param of template.params.filter((entry) => entry.group === group)) {
      const { control, cell } = createField(param, values[param.key]);
      control.addEventListener('input', () => onChange(param.key, readControl(param, control)));
      const fieldClass = param.type === 'range' ? 'field stacked' : 'field';
      body.append(el('label', { class: fieldClass }, el('span', {}, param.label), cell));
    }
    container.append(el('details', { class: 'group', open: '' }, el('summary', {}, group), body));
  }
}
