const REPOSITORY = 'jcgit-coding/ifc-bim-families';
const BRANCH = 'main';
const SHA_LENGTH = 7;
const ENDPOINT = `https://api.github.com/repos/${REPOSITORY}/commits/${BRANCH}`;

function formatDate(isoString) {
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Shows the latest commit on the published branch so a push can be verified on the live page. */
export async function renderBuildInfo(element) {
  try {
    const response = await fetch(ENDPOINT, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const commit = await response.json();
    const sha = commit.sha.slice(0, SHA_LENGTH);
    element.textContent = `${sha} · ${formatDate(commit.commit.committer.date)}`;
    element.href = commit.html_url;
    element.title = commit.commit.message.split('\n')[0];
  } catch {
    element.textContent = 'version unavailable';
  }
}
