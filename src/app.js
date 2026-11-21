import { registry } from './templates/index.js';
import { buildIfc } from './core/ifc/writer.js';
import { evaluateTemplate, toIfcModel } from './core/templates/evaluate.js';
import { decodeState, encodeState } from './core/url-state.js';
import { createViewer } from './viewer/viewer.js';
import { downloadTextFile, query } from './ui/dom.js';
import { renderHome } from './ui/home.js';
import { renderParameterForm } from './ui/parameter-form.js';
import { renderSidebar } from './ui/sidebar.js';
import { renderStatus } from './ui/status-panel.js';

const SHARE_LABEL_MS = 1800;

const elements = {
  home: query('#home'),
  catalogue: query('#catalogue'),
  generator: query('#generator'),
  sidebar: query('#sidebar'),
  form: query('#parameter-form'),
  status: query('#status'),
  viewer: query('#viewer'),
  downloadIfc: query('#download-ifc'),
  downloadJson: query('#download-json'),
  share: query('#share-link'),
  toggleDimensions: query('#toggle-dimensions'),
};

const viewer = createViewer(elements.viewer);
const state = { template: undefined, values: {}, result: undefined };

function refresh() {
  state.result = evaluateTemplate(state.template, state.values);
  renderStatus(elements.status, state.result);
  elements.downloadIfc.disabled = state.result.errors.length > 0;
  if (state.result.errors.length === 0) viewer.setParts(state.result.parts);
  history.replaceState(null, '', `#${encodeState(state.template, state.values)}`);
}

function showGenerator(template, values) {
  state.template = template;
  state.values = values;
  elements.home.hidden = true;
  elements.generator.hidden = false;
  renderSidebar(elements.sidebar, registry, template);
  renderParameterForm(elements.form, template, values, (key, value) => {
    state.values = { ...state.values, [key]: value };
    refresh();
  });
  refresh();
}

function showCatalogue() {
  elements.generator.hidden = true;
  elements.home.hidden = false;
  renderHome(elements.catalogue, registry);
}

function route() {
  const { template, values } = decodeState(registry, location.hash);
  if (template) showGenerator(template, values);
  else showCatalogue();
}

elements.downloadIfc.addEventListener('click', () => {
  const name = state.values.name || state.template.name;
  const content = buildIfc(toIfcModel(name, state.result));
  downloadTextFile(state.result.fileName, content, 'application/x-step');
});

elements.downloadJson.addEventListener('click', () => {
  const content = JSON.stringify({ template: state.template.id, values: state.values }, null, 2);
  downloadTextFile(`${state.template.id}.json`, content, 'application/json');
});

elements.share.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    elements.share.textContent = 'Link copied ✓';
  } catch {
    window.prompt('Copy this link:', location.href);
  }
  setTimeout(() => { elements.share.textContent = 'Copy link'; }, SHARE_LABEL_MS);
});

document.querySelectorAll('[data-view]').forEach((button) =>
  button.addEventListener('click', () => viewer.setView(button.dataset.view)));

elements.toggleDimensions.addEventListener('click', () => {
  const visible = elements.toggleDimensions.getAttribute('aria-pressed') !== 'true';
  elements.toggleDimensions.setAttribute('aria-pressed', String(visible));
  viewer.setDimensionsVisible(visible);
});

window.addEventListener('hashchange', route);
route();
