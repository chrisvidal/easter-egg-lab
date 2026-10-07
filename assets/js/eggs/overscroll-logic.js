// Accumulation des poussées au bord de la page (fonctions pures, testables sous Node).

export const PUSH_GAP_MS = 320;
export const REQUIRED_PUSHES = 3;
export const REQUIRED_DISTANCE = 800;
export const MAX_STRETCH_PX = 180;

export function createOverscroll() {
  return { pushes: 0, distance: 0, current: 0, lastAt: -Infinity };
}

// Une poussée = une rafale de deltas positifs ; une pause > gap (ou un relâchement) en ouvre une nouvelle.
export function push(state, delta, now, gap = PUSH_GAP_MS) {
  if (!Number.isFinite(delta) || delta <= 0) return state;
  const fresh = now - state.lastAt > gap;
  return {
    pushes: state.pushes + (fresh ? 1 : 0),
    distance: state.distance + delta,
    current: (fresh ? 0 : state.current) + delta,
    lastAt: now,
  };
}

export function release(state) {
  return { ...state, current: 0, lastAt: -Infinity };
}

export function isComplete(state, pushes = REQUIRED_PUSHES, distance = REQUIRED_DISTANCE) {
  return state.pushes >= pushes && state.distance >= distance;
}

// Résistance croissante : l'étirement tend vers `max` sans jamais l'atteindre.
export function dampen(px, max = MAX_STRETCH_PX) {
  if (!(px > 0)) return 0;
  return max * (1 - Math.exp(-px / (max * 1.6)));
}

// Convertit un WheelEvent.deltaY en pixels selon son deltaMode (0 px, 1 ligne, 2 page).
export function wheelPixels(deltaY, deltaMode = 0, pageHeight = 800) {
  if (deltaMode === 1) return deltaY * 16;
  if (deltaMode === 2) return deltaY * pageHeight;
  return deltaY;
}
