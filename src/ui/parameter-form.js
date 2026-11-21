import { coerceValue } from '../core/templates/params.js';
import { el } from './dom.js';

function createControl(param, value) {
  if (param.type === 'select') {
    const select = el('select', {}, param.options.map(([optionValue, label]) => el('option', { value: optionValue }, label)));
    select.value = value;
    return select;
  }
  const inputType = { range: 'range', number: 'number', text: 'text', boolean: 'checkbox' }[param.type];
  const input = el('input', { type: inputType });
  for (const attribute of ['min', 'max', 'step']) {
    if (param[attribute] !== undefined) input.setAttribute(attribute, param[attribute]);
  }
  if (param.type === 'boolean') input.checked = value;
  else input.value = value;
  return input;
}

const readControl = (param, control) =>
  coerceValue(param, param.type === 'boolean' ? control.checked : control.value);

/**
 * Renders a form from a template's parameter definitions.
 * @param {(key: string, value: unknown) => void} onChange called on every edit
 */
export function renderParameterForm(container, template, values, onChange) {
  container.replaceChildren();
  const groups = [...new Set(template.params.map((param) => param.group))];
  for (const group of groups) {
    const fieldset = el('fieldset', {}, el('legend', {}, group));
    for (const param of template.params.filter((entry) => entry.group === group)) {
      const control = createControl(param, values[param.key]);
      const unit = el('output', {}, param.type === 'range' ? `${values[param.key]} ${param.unit ?? ''}` : (param.unit ?? ''));
      control.addEventListener('input', () => {
        const value = readControl(param, control);
        if (param.type === 'range') unit.textContent = `${value} ${param.unit ?? ''}`;
        onChange(param.key, value);
      });
      fieldset.append(el('label', {}, el('span', {}, param.label), control, unit));
    }
    container.append(fieldset);
  }
}
