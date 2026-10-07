import { mountDebug } from './core/debug.js';
import { mountLayout } from './core/layout.js';
import { handleReset, isUnlocked } from './core/unlocked.js';

handleReset();
mountDebug();
mountLayout();

for (const card of document.querySelectorAll('[data-card]')) {
  if (!isUnlocked(card.dataset.card)) continue;
  card.classList.add('is-solved');
  const badge = card.querySelector('[data-badge]');
  if (badge) {
    badge.hidden = false;
    badge.textContent = 'Révélé';
  }
}
