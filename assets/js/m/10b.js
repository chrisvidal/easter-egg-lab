// Fonctions pures, testables sous Node.

export const G = 320;
export const P = 3;
export const L = 800;
export const M = 180;

export function init() {
  return { n: 0, d: 0, c: 0, t: -Infinity };
}

export function step(s, delta, now, gap = G) {
  if (!Number.isFinite(delta) || delta <= 0) return s;
  const fresh = now - s.t > gap;
  return {
    n: s.n + (fresh ? 1 : 0),
    d: s.d + delta,
    c: (fresh ? 0 : s.c) + delta,
    t: now,
  };
}

export function reset(s) {
  return { ...s, c: 0, t: -Infinity };
}

export function done(s, n = P, d = L) {
  return s.n >= n && s.d >= d;
}

export function ease(x, max = M) {
  if (!(x > 0)) return 0;
  return max * (1 - Math.exp(-x / (max * 1.6)));
}

// WheelEvent.deltaY → pixels selon deltaMode (0 px, 1 ligne, 2 page).
export function px(deltaY, deltaMode = 0, pageHeight = 800) {
  if (deltaMode === 1) return deltaY * 16;
  if (deltaMode === 2) return deltaY * pageHeight;
  return deltaY;
}
