import { setupEgg } from '../core/egg.js';
import { createGlobe } from '../core/globe.js';
import {
  applyDrag,
  coordinateUnderReticle,
  formatCoordinate,
  normalizeLongitude,
  parseLatLng,
  rotationFor,
} from './05b.js';

const KEY_STEP = 4;

const egg = setupEgg('coordinate');
const stage = document.querySelector('[data-globe]');
const canvas = stage.querySelector('canvas');
const readout = document.querySelector('[data-readout]');
const here = document.querySelector('[data-here]');
const form = document.querySelector('[data-latlng-form]');
const field = form.querySelector('input');
const globe = createGlobe(canvas, [-2, -20, 0]);

let drag = null;
let frameRequested = false;

function update() {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(() => {
    frameRequested = false;
    globe.draw();
    readout.textContent = formatCoordinate(coordinateUnderReticle(globe.state.rotation));
  });
}

function setRotation(rotation) {
  globe.state.rotation = rotation;
  update();
}

stage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  egg.start({ input: event.pointerType || 'pointer' });
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  try {
    stage.setPointerCapture(event.pointerId);
  } catch {}
  stage.classList.add('is-dragging');
});
stage.addEventListener('pointermove', (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  drag.x = event.clientX;
  drag.y = event.clientY;
  setRotation(applyDrag(globe.state.rotation, dx, dy, globe.radius()));
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  stage.addEventListener(type, () => {
    drag = null;
    stage.classList.remove('is-dragging');
  });
}

stage.addEventListener('keydown', (event) => {
  const step = event.shiftKey ? 1 : KEY_STEP;
  const [lambda, phi, gamma] = globe.state.rotation;
  const moves = {
    ArrowLeft: [lambda + step, phi],
    ArrowRight: [lambda - step, phi],
    ArrowUp: [lambda, Math.max(-90, phi - step)],
    ArrowDown: [lambda, Math.min(90, phi + step)],
  };
  const next = moves[event.key];
  if (!next) return;
  event.preventDefault();
  egg.start({ input: 'keyboard' });
  setRotation([normalizeLongitude(next[0]), next[1], gamma]);
});

here.addEventListener('click', () => {
  egg.start({ input: 'button' });
  egg.submit(coordinateUnderReticle(globe.state.rotation));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const coordinate = parseLatLng(field.value);
  if (!coordinate) {
    field.setAttribute('aria-invalid', 'true');
    egg.setStatus('Deux nombres : latitude, longitude.');
    return;
  }
  field.removeAttribute('aria-invalid');
  egg.start({ input: 'field' });
  setRotation(rotationFor(coordinate));
  egg.submit(coordinate);
});

update();
