// Orchestration commune à chaque sous-page : layout, events, statut, déverrouillage, reveal.
import { MESSAGES } from '../config.js';
import { sendEvent, unlock } from './api.js';
import { mountDebug } from './debug.js';
import { mountLayout } from './layout.js';
import { sanitizeReveal, showReveal } from './reveal.js';
import { fr } from './typo.js';
import { getUnlocked, handleReset, saveUnlocked } from './unlocked.js';

export function messageFor(result) {
  if (result.ok) return '';
  if (result.kind === 'rejected') return result.hint ?? '';
  if (result.kind === 'rate_limited') return MESSAGES.rateLimited;
  return MESSAGES.unreachable;
}

function observeOnce(target, callback) {
  if (!target || typeof IntersectionObserver === 'undefined') return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        callback();
      }
    },
    { threshold: 0.5 },
  );
  observer.observe(target);
}

export function setupEgg(mechanic, { marks = [] } = {}) {
  handleReset();
  mountDebug();
  const { hintEl } = mountLayout({ mechanic, marks });

  sendEvent(mechanic, 'page_view', { path: window.location.pathname });
  observeOnce(hintEl, () => sendEvent(mechanic, 'hint_seen'));

  const revealBox = document.getElementById('partie-b');
  const statusEl = document.querySelector('[data-status]');
  let started = false;
  let busy = false;

  const saved = getUnlocked(mechanic);
  if (saved) showReveal(saved, { container: revealBox, animate: false, focus: false });

  function setStatus(text) {
    if (statusEl) statusEl.textContent = fr(text);
  }

  return {
    get busy() {
      return busy;
    },
    get solved() {
      return Boolean(getUnlocked(mechanic));
    },
    setStatus,
    start(meta = {}) {
      if (started) return;
      started = true;
      sendEvent(mechanic, 'attempt_started', meta);
    },
    async submit(proof) {
      if (busy) return { ok: false, kind: 'busy' };
      busy = true;
      setStatus('');
      const result = await unlock(mechanic, proof);
      busy = false;
      if (result.ok) {
        const reveal = sanitizeReveal(result.data.reveal);
        if (reveal) {
          saveUnlocked(mechanic, reveal);
          showReveal(reveal, { container: revealBox });
        }
      } else {
        setStatus(messageFor(result));
      }
      return result;
    },
  };
}
