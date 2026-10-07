import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SESSION_KEY, createUuid, getSessionId, isUuidV4 } from '../assets/js/core/session.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    map,
  };
}

test('génère un uuid v4 valide', () => {
  const id = getSessionId(memoryStorage());
  assert.match(id, UUID_V4);
  assert.ok(isUuidV4(id));
});

test('stable : le même stockage renvoie toujours le même identifiant', () => {
  const storage = memoryStorage();
  const first = getSessionId(storage);
  assert.equal(getSessionId(storage), first);
  assert.equal(getSessionId(storage), first);
  assert.equal(storage.map.get(SESSION_KEY), first);
});

test('remplace une valeur stockée invalide', () => {
  const storage = memoryStorage();
  storage.setItem(SESSION_KEY, 'pas-un-uuid');
  assert.match(getSessionId(storage), UUID_V4);
});

test('stockage indisponible : identifiant en mémoire, stable', () => {
  const broken = {
    getItem() {
      throw new Error('SecurityError');
    },
    setItem() {
      throw new Error('SecurityError');
    },
  };
  const id = getSessionId(broken);
  assert.match(id, UUID_V4);
  assert.equal(getSessionId(null), id);
});

test('repli getRandomValues sans randomUUID', () => {
  const fake = { getRandomValues: (bytes) => globalThis.crypto.getRandomValues(bytes) };
  for (let i = 0; i < 50; i += 1) assert.match(createUuid(fake), UUID_V4);
});
