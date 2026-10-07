import { STORAGE_PREFIX } from '../config.js';

const KEY = STORAGE_PREFIX + 'unlocked';

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readAll(storage = defaultStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getUnlocked(mechanic, storage = defaultStorage()) {
  return readAll(storage)[mechanic]?.reveal ?? null;
}

export function isUnlocked(mechanic, storage = defaultStorage()) {
  return Boolean(readAll(storage)[mechanic]);
}

export function saveUnlocked(mechanic, reveal, storage = defaultStorage()) {
  const all = readAll(storage);
  all[mechanic] = { reveal, at: new Date().toISOString() };
  try {
    storage?.setItem(KEY, JSON.stringify(all));
  } catch {}
}

// Efface tout ce que le labo a mémorisé dans ce navigateur (progression et session).
export function clearAll(storage = defaultStorage()) {
  try {
    const keys = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch {}
}

// ?reset=1 : efface puis retire le paramètre de l'URL.
export function handleReset() {
  if (typeof window === 'undefined') return false;
  const url = new URL(window.location.href);
  if (url.searchParams.get('reset') !== '1') return false;
  clearAll();
  url.searchParams.delete('reset');
  try {
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  } catch {}
  return true;
}
