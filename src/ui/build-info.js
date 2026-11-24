import { t } from '../i18n/i18n.js';

const REPOSITORY = 'jcgit-coding/ifc-bim-families';
const BRANCH = 'main';
const SHA_LENGTH = 7;
const ENDPOINT = `https://api.github.com/repos/${REPOSITORY}/commits/${BRANCH}`;

function formatDate(isoString) {
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Shows the latest commit on the published branch so a push can be verified on the live page.
 * Returns a function that relabels the element after a language change.
 */
export function renderBuildInfo(element) {
  let text = t('Loading version');
  let failed = false;
  const paint = () => { element.textContent = failed ? t('version unavailable') : text; };
  paint();

  fetch(ENDPOINT, { headers: { Accept: 'application/vnd.github+json' } })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((commit) => {
      text = `${commit.sha.slice(0, SHA_LENGTH)} · ${formatDate(commit.commit.committer.date)}`;
      element.href = commit.html_url;
      element.title = commit.commit.message.split('\n')[0];
    })
    .catch(() => { failed = true; })
    .finally(paint);
  return paint;
}
