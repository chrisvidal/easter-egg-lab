import { setupEgg } from '../core/egg.js';
import { prefersReducedMotion } from '../core/reveal.js';
import {
  PUSH_GAP_MS,
  createOverscroll,
  dampen,
  isComplete,
  push,
  release,
  wheelPixels,
} from './overscroll-logic.js';

const PHRASE_DELAY_MS = 1400;
const KEY_DELTAS = { ArrowDown: 60, PageDown: 320, End: 320, ' ': 320 };

const egg = setupEgg('overscroll');
const world = document.querySelector('[data-world]');
const edge = document.querySelector('[data-edge]');
const phrase = edge.querySelector('[data-phrase]');

let state = createOverscroll();
let idleTimer = null;
let finishing = false;
let touchY = null;

function atBottom() {
  const doc = document.documentElement;
  return Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight - 2;
}

function stretch(px) {
  const reduced = prefersReducedMotion();
  const offset = reduced ? 0 : dampen(px);
  world.style.transform = offset ? `translate3d(0, ${(-offset).toFixed(1)}px, 0)` : '';
  edge.style.height = `${reduced ? 0 : offset.toFixed(1)}px`;
  edge.style.setProperty('--glow', String(Math.min(1, px / 400)));
}

function relax() {
  if (finishing) return;
  state = release(state);
  world.classList.add('is-relaxing');
  edge.classList.add('is-relaxing');
  stretch(0);
}

function feed(delta) {
  if (finishing || egg.busy || !atBottom()) return false;
  egg.start({ input: 'overscroll' });
  world.classList.remove('is-relaxing');
  edge.classList.remove('is-relaxing');
  state = push(state, delta, performance.now());
  stretch(state.current);
  clearTimeout(idleTimer);
  idleTimer = setTimeout(relax, PUSH_GAP_MS);
  if (isComplete(state)) finish();
  return true;
}

async function finish() {
  finishing = true;
  clearTimeout(idleTimer);
  edge.classList.add('is-open');
  phrase.textContent = 'Il y a quelque chose après le monde.';
  stretch(Math.max(state.current, 260));
  const proof = { pushes: state.pushes, distance_px: Math.round(state.distance) };
  await new Promise((resolve) => setTimeout(resolve, PHRASE_DELAY_MS));
  const result = await egg.submit(proof);
  finishing = false;
  edge.classList.remove('is-open');
  state = createOverscroll();
  relax();
  if (!result.ok) setTimeout(() => (phrase.textContent = ''), 600);
}

window.addEventListener(
  'wheel',
  (event) => {
    if (event.deltaY > 0) feed(wheelPixels(event.deltaY, event.deltaMode, window.innerHeight));
  },
  { passive: true },
);

window.addEventListener(
  'touchstart',
  (event) => {
    touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
  },
  { passive: true },
);
window.addEventListener(
  'touchmove',
  (event) => {
    if (touchY == null || event.touches.length !== 1) return;
    const y = event.touches[0].clientY;
    const delta = touchY - y;
    touchY = y;
    if (delta > 0) feed(delta);
  },
  { passive: true },
);
window.addEventListener('touchend', () => {
  touchY = null;
  clearTimeout(idleTimer);
  relax();
});

document.addEventListener('keydown', (event) => {
  const delta = KEY_DELTAS[event.key];
  if (!delta || event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target;
  const onPage = target === document.body || target === document.documentElement;
  if (event.key === ' ' && !onPage) return;
  if (target.closest?.('input, textarea, select, [contenteditable]')) return;
  if (feed(delta) && event.key === ' ') event.preventDefault();
});
