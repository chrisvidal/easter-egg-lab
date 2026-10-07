import { el } from './layout.js';
import { fr } from './typo.js';

export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function safeUrl(value) {
  try {
    const url = new URL(String(value), window.location.href);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

// Ne garde que la forme attendue du JSON "reveal" ; tout le reste est ignoré.
export function sanitizeReveal(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' ? raw.title : '';
  const paragraphs = Array.isArray(raw.paragraphs)
    ? raw.paragraphs.filter((p) => typeof p === 'string' && p.trim())
    : [];
  let cta = null;
  if (raw.cta && typeof raw.cta.label === 'string' && safeUrl(raw.cta.url)) {
    cta = { label: raw.cta.label, url: safeUrl(raw.cta.url) };
  }
  if (!title && !paragraphs.length) return null;
  return { title, paragraphs, cta };
}

/**
 * Affiche la partie B dans `container`. Construction DOM par textContent uniquement.
 * Transition « l'ombre se retire » : un voile sombre glisse et s'efface.
 */
export function showReveal(reveal, { container, animate = true, focus = true, onClose } = {}) {
  const data = sanitizeReveal(reveal);
  if (!data || !container) return false;

  const card = el('div', { class: 'reveal-card' });
  card.append(el('p', { class: 'reveal-kicker' }, 'De l’autre côté'));
  const heading = el('h2', { class: 'reveal-title', tabindex: '-1' }, fr(data.title));
  card.append(heading);
  for (const paragraph of data.paragraphs) card.append(el('p', {}, fr(paragraph)));
  if (data.cta) {
    card.append(
      el('a', { class: 'reveal-cta', href: data.cta.url, target: '_blank', rel: 'noopener noreferrer' }, fr(data.cta.label)),
    );
  }
  const close = el('button', { type: 'button', class: 'reveal-close' }, 'Refermer');
  close.addEventListener('click', () => {
    container.hidden = true;
    container.replaceChildren();
    onClose?.();
  });
  card.append(close);

  const veil = el('div', { class: 'reveal-veil', 'aria-hidden': 'true' });
  container.replaceChildren(card, veil);
  container.setAttribute('aria-label', 'Partie cachée');
  container.hidden = false;

  const motion = animate && !prefersReducedMotion();
  container.classList.toggle('is-revealing', motion);
  if (motion) veil.addEventListener('animationend', () => veil.remove(), { once: true });
  else veil.remove();

  if (focus) {
    heading.focus({ preventScroll: true });
    container.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
  }
  return true;
}
