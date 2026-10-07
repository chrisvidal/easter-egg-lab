import { setupEgg } from '../core/egg.js';

const MARKS = [
  { id: 'g5', p: 0, word: 'stratégie', i: 0 },
  { id: 'g2', p: 0, word: 'artistiques', i: 0 },
  { id: 'g7', p: 1, word: 'toujours', i: 0 },
  { id: 'g3', p: 1, word: 'agiles', i: 0 },
  { id: 'g1', p: 2, word: 'Libres', i: 0 },
  { id: 'g6', p: 3, word: 'élaborons', i: 1 },
  { id: 'g9', p: 3, word: 'activons', i: 0 },
  { id: 'g8', p: 3, word: 'rayonner', i: 0 },
  { id: 'g10', p: 4, word: 'terrain', i: 0 },
  { id: 'g4', p: 4, word: 'Samsung', i: 0 },
];

const LENGTH = 5;

const egg = setupEgg('letters', { marks: MARKS });
const glyphs = [...document.querySelectorAll('[data-glyph]')];
let sequence = [];
let locked = false;

function setAwake(glyph, awake) {
  glyph.classList.toggle('is-awake', awake);
  glyph.setAttribute('aria-pressed', String(awake));
}

function sleepAll() {
  glyphs.forEach((glyph) => setAwake(glyph, false));
  sequence = [];
}

async function wake(glyph) {
  if (locked || glyph.classList.contains('is-awake')) return;
  egg.start({ trigger: 'glyph' });
  setAwake(glyph, true);
  sequence.push(glyph.dataset.glyph);
  if (sequence.length < LENGTH) return;

  locked = true;
  const result = await egg.submit({ sequence: [...sequence] });
  if (result.ok) {
    sequence = [];
    return;
  }
  setTimeout(() => {
    sleepAll();
    locked = false;
  }, 700);
}

for (const glyph of glyphs) {
  glyph.setAttribute('role', 'button');
  glyph.tabIndex = 0;
  setAwake(glyph, false);
  glyph.addEventListener('click', () => wake(glyph));
  glyph.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      wake(glyph);
    }
  });
}
