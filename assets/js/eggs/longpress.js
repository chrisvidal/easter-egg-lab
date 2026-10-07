import { setupEgg } from '../core/egg.js';
import { createGlobe } from '../core/globe.js';
import { prefersReducedMotion } from '../core/reveal.js';

const HOLD_MS = 5000;
const SPIN_DEG_PER_S = 6;

const egg = setupEgg('longpress');
const stage = document.querySelector('[data-globe]');
const canvas = stage.querySelector('canvas');
const ring = stage.querySelector('[data-ring]');
const globe = createGlobe(canvas, [-10, -18, 0]);

let holdStart = null;
let submitted = false;
let lastFrame = performance.now();

function progress(now) {
  return holdStart == null ? 0 : Math.min(1, (now - holdStart) / HOLD_MS);
}

function frame(now) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  const p = progress(now);
  const reduced = prefersReducedMotion();

  if (!reduced) globe.state.rotation[0] += SPIN_DEG_PER_S * (1 - 0.9 * p) * dt;
  globe.state.shade = p * 0.85;
  globe.draw();
  stage.style.setProperty('--sink', reduced ? '0px' : `${(p * 14).toFixed(2)}px`);
  ring.style.strokeDashoffset = String(100 - p * 100);

  if (holdStart != null && p >= 1 && !submitted) {
    submitted = true;
    const duration = Math.round(now - holdStart);
    egg.submit({ duration_ms: duration }).finally(release);
  }
  requestAnimationFrame(frame);
}

function press(source) {
  if (holdStart != null || egg.busy) return;
  egg.start({ input: source });
  holdStart = performance.now();
  submitted = false;
  stage.classList.add('is-held');
}

function release() {
  if (egg.busy) return;
  holdStart = null;
  stage.classList.remove('is-held');
}

stage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  try {
    stage.setPointerCapture(event.pointerId);
  } catch {}
  stage.focus({ preventScroll: true });
  press(event.pointerType || 'pointer');
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  stage.addEventListener(type, () => {
    if (!submitted) release();
  });
}
stage.addEventListener('contextmenu', (event) => event.preventDefault());
stage.addEventListener('selectstart', (event) => event.preventDefault());

stage.addEventListener('keydown', (event) => {
  if (event.key !== ' ' && event.key !== 'Spacebar') return;
  event.preventDefault();
  if (!event.repeat) press('keyboard');
});
stage.addEventListener('keyup', (event) => {
  if (event.key !== ' ' && event.key !== 'Spacebar') return;
  event.preventDefault();
  if (!submitted) release();
});
stage.addEventListener('blur', () => {
  if (!submitted) release();
});

requestAnimationFrame(frame);
