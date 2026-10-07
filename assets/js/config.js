// Configuration du labo. Aucune réponse ici : le serveur juge les preuves.

export const DEFAULT_API_BASE = 'https://experienceos-production-xajvam.laravel.cloud';
export const UNLOCK_PATH = '/api/easter-egg/unlock';
export const EVENT_PATH = '/api/easter-egg/event';
export const REQUEST_TIMEOUT_MS = 8000;

// 'fetch' : fetch keepalive sans credentials (compatible avec Access-Control-Allow-Origin: *).
// 'beacon' : navigator.sendBeacon puis repli fetch. sendBeacon envoie toujours les credentials :
// l'API doit alors répondre avec une origine explicite et Access-Control-Allow-Credentials: true,
// sinon chaque event échoue en CORS (voir DECISIONS.md).
export const EVENT_TRANSPORT = 'fetch';

export const STORAGE_PREFIX = 'ombres.';

export const CDN = {
  d3Geo: 'https://cdn.jsdelivr.net/npm/d3-geo@3/+esm',
  topojson: 'https://cdn.jsdelivr.net/npm/topojson-client@3/+esm',
  land: 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json',
};

export const MECHANICS = ['letters', 'longpress', 'coordinate', 'console', 'overscroll'];

export const EGGS = {
  letters: {
    number: '03',
    title: 'Les lettres endormies',
    mood: 'Certaines lettres veillent plus tard que les autres.',
    page: 'p/03.html',
  },
  longpress: {
    number: '04',
    title: 'Le poids du monde',
    mood: 'Il tourne sans fin. Il attend qu’on le retienne.',
    page: 'p/04.html',
  },
  coordinate: {
    number: '05',
    title: 'Là où le Titan fut changé en pierre',
    mood: 'Une montagne se souvient d’un regard.',
    page: 'p/05.html',
  },
  console: {
    number: '06',
    title: 'L’envers',
    mood: 'Chaque décor a un dos.',
    page: 'p/06.html',
  },
  overscroll: {
    number: '10',
    title: 'Le bord du monde',
    mood: 'Tout finit quelque part. Presque tout.',
    page: 'p/10.html',
  },
};

export const HINTS = {
  letters: 'Cinq lettres dorment dans ce texte. Réveille-les dans l’ordre de celui qui porte le monde.',
  longpress: 'Qui porte le monde ne le lâche pas.',
  coordinate: 'Persée lui montra la Méduse. Il devint montagne. Trouve-le.',
  console: 'L’envers s’ouvre par les outils du développeur.',
  overscroll: 'Le monde a un bord. Pousse.',
};

export const MESSAGES = {
  rateLimited: 'Le monde se repose. Reviens plus tard.',
  unreachable: 'Le monde ne répond pas. Réessaie dans un instant.',
};

function browserStorage(kind) {
  try {
    return typeof window !== 'undefined' ? window[kind] : null;
  } catch {
    return null;
  }
}

export function normalizeBase(value) {
  try {
    const url = new URL(String(value));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin + url.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

// ?api=<url> surcharge l'API pour la session de l'onglet ; ?api= (vide) revient au défaut.
export function resolveApiBase(search = '', storage = null) {
  const key = STORAGE_PREFIX + 'api';
  const params = new URLSearchParams(search);
  if (params.has('api')) {
    const base = normalizeBase(params.get('api'));
    try {
      if (base) storage?.setItem(key, base);
      else storage?.removeItem(key);
    } catch {}
    return base ?? DEFAULT_API_BASE;
  }
  try {
    const stored = normalizeBase(storage?.getItem(key) ?? '');
    if (stored) return stored;
  } catch {}
  return DEFAULT_API_BASE;
}

// ?debug=1 active le panneau pour la session de l'onglet ; ?debug=0 le coupe.
export function resolveDebug(search = '', storage = null) {
  const key = STORAGE_PREFIX + 'debug';
  const params = new URLSearchParams(search);
  if (params.has('debug')) {
    const on = params.get('debug') === '1';
    try {
      if (on) storage?.setItem(key, '1');
      else storage?.removeItem(key);
    } catch {}
    return on;
  }
  try {
    return storage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

const search = typeof window !== 'undefined' ? window.location.search : '';

export const API_BASE = resolveApiBase(search, browserStorage('sessionStorage'));
export const DEBUG = resolveDebug(search, browserStorage('sessionStorage'));
