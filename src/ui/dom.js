/** Tiny DOM helpers shared by the UI modules. */

export const query = (selector, root = document) => root.querySelector(selector);

/** Creates an element: el('a', { class: 'card', href: '#' }, 'text', childElement). */
export function el(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (name === 'class') element.className = value;
    else element.setAttribute(name, value);
  }
  element.append(...children.flat());
  return element;
}

/** Downloads text as a file in the browser. */
export function downloadTextFile(fileName, text, mimeType) {
  const link = el('a', { href: URL.createObjectURL(new Blob([text], { type: mimeType })), download: fileName });
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
