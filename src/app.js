import { templates, planned, byId } from './templates/index.js';
import { writeIFC } from './core/ifc.js';
import { createViewer } from './viewer.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => (k === 'class' ? (e.className = v) : e.setAttribute(k, v)));
  kids.flat().forEach((k) => e.append(k));
  return e;
};

const viewer = createViewer($('#viewer'));
let tpl = templates[0];
let values = {};
let last = null;

/* ---------- Estado compartible por URL: #t=<id>&k=v ---------- */
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  const t = byId(h.get('t'));
  if (t) tpl = t;
  values = {};
  tpl.params.forEach((p) => {
    const raw = h.get(p.key);
    values[p.key] = raw == null ? p.default : (p.type === 'number' || p.type === 'range' ? parseFloat(raw) : raw);
  });
}
function writeHash() {
  const h = new URLSearchParams({ t: tpl.id });
  tpl.params.forEach((p) => { if (values[p.key] !== p.default) h.set(p.key, values[p.key]); });
  history.replaceState(null, '', '#' + h.toString());
}

/* ---------- Catálogo ---------- */
function renderCatalog() {
  const box = $('#catalog'); box.replaceChildren();
  box.append(el('a', { class: 'tpl back', href: '#' }, '← Catálogo'));
  const groups = [...new Set(templates.map((t) => t.discipline))];
  groups.forEach((g) => {
    box.append(el('h3', {}, g));
    templates.filter((t) => t.discipline === g).forEach((t) => {
      const b = el('button', { class: 'tpl' + (t === tpl ? ' on' : ''), type: 'button' },
        el('b', {}, t.name), el('span', {}, t.description));
      b.onclick = () => { location.hash = 't=' + t.id; };
      box.append(b);
    });
  });
}

/* ---------- Formulario generado desde el esquema ---------- */
function renderForm() {
  const form = $('#form'); form.replaceChildren();
  const groups = [...new Set(tpl.params.map((p) => p.group))];
  groups.forEach((g) => {
    const fs = el('fieldset', {}, el('legend', {}, g));
    tpl.params.filter((p) => p.group === g).forEach((p) => {
      let input;
      if (p.type === 'select') {
        input = el('select', {}, p.options.map(([v, l]) => el('option', { value: v }, l)));
      } else {
        input = el('input', { type: p.type === 'range' ? 'range' : p.type });
        ['min', 'max', 'step'].forEach((a) => p[a] != null && input.setAttribute(a, p[a]));
      }
      input.value = values[p.key];
      const out = el('output', {}, p.type === 'range' ? `${values[p.key]}${p.unit || ''}` : (p.unit || ''));
      input.addEventListener('input', () => {
        values[p.key] = p.type === 'number' || p.type === 'range' ? parseFloat(input.value) : input.value;
        if (p.type === 'range') out.textContent = `${input.value}${p.unit || ''}`;
        update();
      });
      fs.append(el('label', {}, el('span', {}, p.label), input, out));
    });
    form.append(fs);
  });
}

/* ---------- Cálculo, visor y exportación ---------- */
function update() {
  last = tpl.compute(values);
  $('#err').textContent = last.errors.join(' · ');
  $('#warn').textContent = last.warnings.join(' · ');
  $('#info').textContent = last.summary;
  $('#dl').disabled = last.errors.length > 0;
  if (!last.errors.length) viewer.setParts(last.parts);
  writeHash();
}

function download(name, text, type) {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

$('#dl').onclick = () => {
  const name = values.nombre || tpl.name;
  download(last.fileName || `${tpl.id}.ifc`,
    writeIFC({ name, objectType: last.objectType, parts: last.parts, psets: last.psets }), 'application/x-step');
};
$('#json').onclick = () => download(`${tpl.id}.json`, JSON.stringify({ template: tpl.id, values }, null, 2), 'application/json');
$('#share').onclick = async () => {
  try { await navigator.clipboard.writeText(location.href); $('#share').textContent = 'Enlace copiado ✓'; }
  catch { prompt('Copia el enlace:', location.href); }
  setTimeout(() => ($('#share').textContent = 'Copiar enlace'), 1800);
};
document.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => viewer.view(b.dataset.view)));

/* ---------- Inicio: catálogo de familias ---------- */
function renderHome() {
  const box = $('#cards'); box.replaceChildren();
  const disciplines = [...new Set([...templates, ...planned].map((t) => t.discipline))];
  disciplines.forEach((d) => {
    const grid = el('div', { class: 'cards' });
    templates.filter((t) => t.discipline === d).forEach((t) => grid.append(
      el('a', { class: 'card', href: '#t=' + t.id }, el('b', {}, t.name), el('span', {}, t.description))));
    planned.filter((t) => t.discipline === d).forEach((t) => grid.append(
      el('div', { class: 'card soon' }, el('em', {}, 'Próximamente'), el('b', {}, t.name), el('span', {}, t.description))));
    box.append(el('h2', {}, d), grid);
  });
}

function init() {
  const t = byId(new URLSearchParams(location.hash.slice(1)).get('t'));
  $('#home').hidden = !!t;
  $('#studio').hidden = !t;
  if (!t) { renderHome(); return; }
  readHash(); renderCatalog(); renderForm(); update();
}
addEventListener('hashchange', init);
init();
