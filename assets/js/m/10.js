import { setupEgg } from '../core/egg.js';
import { prefersReducedMotion } from '../core/reveal.js';
import { G, done, ease, init, px, reset, step } from './10b.js';

const W = 1400;
const KD = { ArrowDown: 60, PageDown: 320, End: 320, ' ': 320 };

const egg = setupEgg('overscroll');
const layer = document.querySelector('[data-v]');
const under = document.querySelector('[data-u]');
const line = under.querySelector('[data-l]');

let s = init();
let timer = null;
let locked = false;
let y0 = null;

function atEnd() {
  const doc = document.documentElement;
  return Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight - 2;
}

function shift(x) {
  const reduced = prefersReducedMotion();
  const offset = reduced ? 0 : ease(x);
  layer.style.transform = offset ? `translate3d(0, ${(-offset).toFixed(1)}px, 0)` : '';
  under.style.height = `${reduced ? 0 : offset.toFixed(1)}px`;
  under.style.setProperty('--glow', String(Math.min(1, x / 400)));
}

function settle() {
  if (locked) return;
  s = reset(s);
  layer.classList.add('is-easing');
  under.classList.add('is-easing');
  shift(0);
}

function move(delta) {
  if (locked || egg.busy || !atEnd()) return false;
  egg.start({ input: 'scroll' });
  layer.classList.remove('is-easing');
  under.classList.remove('is-easing');
  s = step(s, delta, performance.now());
  shift(s.c);
  clearTimeout(timer);
  timer = setTimeout(settle, G);
  if (done(s)) end();
  return true;
}

async function end() {
  locked = true;
  clearTimeout(timer);
  under.classList.add('is-open');
  line.textContent = 'Il y a quelque chose après le monde.';
  shift(Math.max(s.c, 260));
  const proof = { pushes: s.n, distance_px: Math.round(s.d) };
  await new Promise((resolve) => setTimeout(resolve, W));
  const result = await egg.submit(proof);
  locked = false;
  under.classList.remove('is-open');
  s = init();
  settle();
  if (!result.ok) setTimeout(() => (line.textContent = ''), 600);
}

window.addEventListener(
  'wheel',
  (event) => {
    if (event.deltaY > 0) move(px(event.deltaY, event.deltaMode, window.innerHeight));
  },
  { passive: true },
);

window.addEventListener(
  'touchstart',
  (event) => {
    y0 = event.touches.length === 1 ? event.touches[0].clientY : null;
  },
  { passive: true },
);
window.addEventListener(
  'touchmove',
  (event) => {
    if (y0 == null || event.touches.length !== 1) return;
    const y = event.touches[0].clientY;
    const delta = y0 - y;
    y0 = y;
    if (delta > 0) move(delta);
  },
  { passive: true },
);
window.addEventListener('touchend', () => {
  y0 = null;
  clearTimeout(timer);
  settle();
});

document.addEventListener('keydown', (event) => {
  const delta = KD[event.key];
  if (!delta || event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target;
  const onPage = target === document.body || target === document.documentElement;
  if (event.key === ' ' && !onPage) return;
  if (target.closest?.('input, textarea, select, [contenteditable]')) return;
  if (move(delta) && event.key === ' ') event.preventDefault();
});
