import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  M as MAX_STRETCH_PX,
  G as PUSH_GAP_MS,
  init as createOverscroll,
  ease as dampen,
  done as isComplete,
  step as push,
  reset as release,
  px as wheelPixels,
} from '../assets/js/m/10b.js';

function burst(state, start, deltas, step = 16) {
  return deltas.reduce((s, delta, i) => push(s, delta, start + i * step), state);
}

test('une rafale continue compte pour une seule poussée', () => {
  const state = burst(createOverscroll(), 0, [40, 40, 40, 40]);
  assert.equal(state.n, 1);
  assert.equal(state.d, 160);
  assert.equal(state.c, 160);
});

test('une pause plus longue que le seuil ouvre une nouvelle poussée', () => {
  let state = burst(createOverscroll(), 0, [100, 100]);
  state = burst(state, 16 + PUSH_GAP_MS + 1, [100]);
  assert.equal(state.n, 2);
  assert.equal(state.c, 100, 'l’étirement repart de zéro');
  assert.equal(state.d, 300);
});

test('relâcher (touchend) ouvre aussi une nouvelle poussée', () => {
  let state = push(createOverscroll(), 50, 0);
  state = release(state);
  assert.equal(state.c, 0);
  state = push(state, 50, 10);
  assert.equal(state.n, 2);
});

test('les deltas nuls, négatifs ou non finis sont ignorés', () => {
  const start = createOverscroll();
  for (const delta of [0, -30, NaN, Infinity]) assert.equal(push(start, delta, 0), start);
});

test('complet seulement après 3 poussées ET 800 px cumulés', () => {
  let state = createOverscroll();
  state = burst(state, 0, [500, 400]);
  assert.equal(isComplete(state), false, '1 poussée, 900 px');
  state = burst(state, 1000, [10]);
  state = burst(state, 2000, [10]);
  assert.equal(state.n, 3);
  assert.equal(isComplete(state), true);

  let short = createOverscroll();
  short = burst(short, 0, [100]);
  short = burst(short, 1000, [100]);
  short = burst(short, 2000, [100]);
  assert.equal(short.n, 3);
  assert.equal(isComplete(short), false, '3 poussées, 300 px');
});

test('amortissement : croissant, borné par le maximum', () => {
  assert.equal(dampen(0), 0);
  assert.equal(dampen(-10), 0);
  const values = [10, 100, 400, 2000, 100000].map((px) => dampen(px));
  for (let i = 1; i < values.length; i += 1) assert.ok(values[i] > values[i - 1]);
  assert.ok(values.at(-1) <= MAX_STRETCH_PX);
  assert.ok(dampen(100) < 100, 'résistance dès le début');
});

test('conversion des deltas de molette', () => {
  assert.equal(wheelPixels(100, 0), 100);
  assert.equal(wheelPixels(3, 1), 48);
  assert.equal(wheelPixels(1, 2, 700), 700);
});
