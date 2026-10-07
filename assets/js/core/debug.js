import { API_BASE, DEBUG } from '../config.js';
import { onApiLog } from './api.js';
import { el } from './layout.js';

function stringify(value) {
  try {
    return JSON.stringify(value, null, 1);
  } catch {
    return String(value);
  }
}

// ?debug=1 : panneau flottant listant les appels API et leurs réponses.
export function mountDebug() {
  if (!DEBUG || typeof document === 'undefined') return;

  const panel = el('aside', { class: 'debug-panel', 'aria-label': 'Journal API (debug)' });
  const head = el('div', { class: 'debug-head' });
  const toggle = el('button', { type: 'button', 'aria-expanded': 'true' }, 'debug');
  head.append(toggle, el('code', {}, API_BASE));
  const list = el('ol', { class: 'debug-list' });
  panel.append(head, list);
  toggle.addEventListener('click', () => {
    const open = list.hidden;
    list.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });

  onApiLog((entry) => {
    const item = el('li', { class: `debug-${entry.type}` });
    const path = entry.url.replace(API_BASE, '');
    const status = entry.result?.status ?? entry.result?.via ?? '';
    const kind = entry.result?.ok ? 'ok' : entry.result?.kind ?? '';
    item.append(
      el('strong', {}, `${entry.at.toLocaleTimeString()} ${entry.type} ${path} → ${status} ${kind}`.trim()),
      el('pre', {}, `→ ${stringify(entry.request)}\n← ${stringify(entry.result)}`),
    );
    list.prepend(item);
  });

  document.body.append(panel);
}
