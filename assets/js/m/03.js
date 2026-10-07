import { setupEgg } from '../core/egg.js';

const K = [
  { id: 'g5', p: 0, w: 'stratégie', i: 0 },
  { id: 'g2', p: 0, w: 'artistiques', i: 0 },
  { id: 'g7', p: 1, w: 'toujours', i: 0 },
  { id: 'g3', p: 1, w: 'agiles', i: 0 },
  { id: 'g1', p: 2, w: 'Libres', i: 0 },
  { id: 'g6', p: 3, w: 'élaborons', i: 1 },
  { id: 'g9', p: 3, w: 'activons', i: 0 },
  { id: 'g8', p: 3, w: 'rayonner', i: 0 },
  { id: 'g10', p: 4, w: 'terrain', i: 0 },
  { id: 'g4', p: 4, w: 'Samsung', i: 0 },
];

const N = 5;

const egg = setupEgg('letters', { marks: K });
const nodes = [...document.querySelectorAll('[data-k]')];
let q = [];
let busy = false;

function set(node, on) {
  node.classList.toggle('is-on', on);
  node.setAttribute('aria-pressed', String(on));
}

function clear() {
  nodes.forEach((node) => set(node, false));
  q = [];
}

async function tap(node) {
  if (busy || node.classList.contains('is-on')) return;
  egg.start({ input: 'tap' });
  set(node, true);
  q.push(node.dataset.k);
  if (q.length < N) return;

  busy = true;
  const result = await egg.submit({ sequence: [...q] });
  if (result.ok) {
    q = [];
    return;
  }
  setTimeout(() => {
    clear();
    busy = false;
  }, 700);
}

for (const node of nodes) {
  node.setAttribute('role', 'button');
  node.tabIndex = 0;
  set(node, false);
  node.addEventListener('click', () => tap(node));
  node.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      tap(node);
    }
  });
}
