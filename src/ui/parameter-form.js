import { coerceValue, isVisible } from '../core/templates/params.js';
import { t } from '../i18n/i18n.js';
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

/** Builds the control cell of a field: { control, cell }. */
function createField(param, value) {
  if (param.type === 'select') {
    const select = el('select', {}, param.options.map(([optionValue, label]) => el('option', { value: optionValue }, t(label))));
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
 * Fields with `visibleWhen` are shown or hidden as their controlling value changes.
 * @param {(key: string, value: unknown) => void} onChange called on every edit
 */
export function renderParameterForm(container, template, values, onChange) {
  container.replaceChildren();
  const current = { ...values };
  const fields = [];
  const applyVisibility = () => fields.forEach(({ param, label }) => { label.hidden = !isVisible(param, current); });

  const groups = [...new Set(template.params.map((param) => param.group))];
  for (const group of groups) {
    const body = el('div', { class: 'group-body' });
    for (const param of template.params.filter((entry) => entry.group === group)) {
      const { control, cell } = createField(param, values[param.key]);
      const label = el('label', { class: param.type === 'range' ? 'field stacked' : 'field' }, el('span', {}, t(param.label)), cell);
      control.addEventListener('input', () => {
        current[param.key] = readControl(param, control);
        applyVisibility();
        onChange(param.key, current[param.key]);
      });
      fields.push({ param, label });
      body.append(label);
    }
    container.append(el('details', { class: 'group', open: '' }, el('summary', {}, t(group)), body));
  }
  applyVisibility();
}
