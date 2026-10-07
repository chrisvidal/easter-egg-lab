import { EGGS, HINTS, MECHANICS } from '../config.js';
import { fr } from './typo.js';

export const TEXT_A_TITLE = '•OMBRES';

export const TEXT_A = [
  '•OMBRES (prononcé « Point Ombres ») est une organisation indépendante de création et de stratégie qui réunit des profils, des expertises et des sensibilités autour d’une même ambition : concevoir, déployer et sublimer des univers de marque et artistiques.',
  'Dans un marché de plus en plus fragmenté, où les projets mobilisent des interlocuteurs toujours plus nombreux, nous avons créé •OMBRES pour être au plus près des artistes et des marques, être agiles et réactifs, comprendre leurs ambitions et accompagner chacun de leurs temps forts.',
  'Libres, nous conjuguons exigence et créativité autour d’une même vision, avec une seule obsession : servir le projet et ses intérêts.',
  'Nous élaborons et activons nos stratégies en étroite collaboration avec nos partenaires. De la définition de la stratégie marketing globale à la création de contenus et d’expériences immersives, nous construisons des dispositifs cohérents, puissants et sur-mesure, pensés pour faire rayonner chaque univers.',
  'Portée par Cedrick Lohou (ex-Rec.118 / Warner, Sony, Universal), aux côtés de Monica Gallego (ex-Universal) et Jean Decaup (ex-Rec.118 / Warner), •OMBRES s’appuie sur une expérience concrète du terrain, forgée aux côtés d’artistes et de marques tels qu’Aya Nakamura, Ninho, Soprano, Hamza, Leto ou Samsung.',
];

export function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    node.setAttribute(name, value === true ? '' : String(value));
  }
  if (text != null) node.textContent = text;
  return node;
}

function rootPath() {
  return document.body.dataset.root || '.';
}

// i-ème caractère de la première occurrence de `w`.
export function locate(text, w, i) {
  const index = text.indexOf(w);
  return index < 0 || i < 0 || i >= w.length ? -1 : index + i;
}

export function renderTextA(container, marks = []) {
  const nodes = [el('h1', { class: 'brand-title' }, TEXT_A_TITLE)];
  TEXT_A.forEach((raw, p) => {
    const text = fr(raw);
    const para = el('p');
    const cuts = marks
      .filter((mark) => mark.p === p)
      .map((mark) => ({ ...mark, at: locate(text, mark.w, mark.i) }))
      .filter((mark) => mark.at >= 0)
      .sort((a, b) => a.at - b.at);
    let cursor = 0;
    for (const cut of cuts) {
      para.append(text.slice(cursor, cut.at));
      const node = el('span', {}, text[cut.at]);
      node.dataset.k = cut.id;
      para.append(node);
      cursor = cut.at + 1;
    }
    para.append(text.slice(cursor));
    nodes.push(para);
  });
  container.replaceChildren(...nodes);
}

function renderHeader(container, mechanic) {
  const root = rootPath();
  const brand = el('a', { class: 'brand', href: `${root}/index.html` });
  brand.append(el('span', { class: 'brand-mark' }, '•OMBRES'), el('span', { class: 'brand-lab' }, 'Easter Egg Lab'));
  const nodes = [brand];
  if (mechanic && EGGS[mechanic]) {
    nodes.push(el('p', { class: 'eyebrow' }, `${EGGS[mechanic].number} · ${fr(EGGS[mechanic].title)}`));
  }
  container.replaceChildren(...nodes);
  container.classList.add('site-header');
}

function renderFooter(container, mechanic) {
  const root = rootPath();
  const nodes = [];
  let hintEl = null;

  if (mechanic && HINTS[mechanic]) {
    hintEl = el('p', { class: `hint hint-${EGGS[mechanic].number}`, id: 'indice' }, fr(HINTS[mechanic]));
    nodes.push(hintEl);
  }

  const nav = el('nav', { class: 'egg-nav', 'aria-label': 'Les cinq expériences' });
  const list = el('ul');
  for (const key of MECHANICS) {
    const item = el('li');
    const link = el('a', { href: `${root}/${EGGS[key].page}` }, `${EGGS[key].number} ${fr(EGGS[key].title)}`);
    if (key === mechanic) link.setAttribute('aria-current', 'page');
    item.append(link);
    list.append(item);
  }
  nav.append(list);
  nodes.push(nav, el('p', { class: 'fine' }, 'Prototype de recherche · •OMBRES'));

  container.replaceChildren(...nodes);
  container.classList.add('site-footer');
  return hintEl;
}

export function mountLayout({ mechanic = null, marks = [] } = {}) {
  const header = document.querySelector('[data-layout="header"]');
  const textA = document.querySelector('[data-layout="text-a"]');
  const footer = document.querySelector('[data-layout="footer"]');
  if (header) renderHeader(header, mechanic);
  if (textA) renderTextA(textA, marks);
  const hintEl = footer ? renderFooter(footer, mechanic) : null;
  return { hintEl };
}
