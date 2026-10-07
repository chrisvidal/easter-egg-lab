// Identifiant de session anonyme, stable par navigateur.

export const SESSION_KEY = 'ombres.session_id';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let memoryId = null;

export function isUuidV4(value) {
  return typeof value === 'string' && UUID_V4.test(value);
}

export function createUuid(cryptoImpl = globalThis.crypto) {
  if (typeof cryptoImpl?.randomUUID === 'function') return cryptoImpl.randomUUID();
  // crypto.randomUUID exige un contexte sécurisé ; getRandomValues non.
  const bytes = cryptoImpl.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getSessionId(storage = defaultStorage()) {
  let stored = null;
  try {
    stored = storage ? storage.getItem(SESSION_KEY) : null;
  } catch {
    storage = null;
  }
  if (isUuidV4(stored)) return stored;
  if (!storage) return (memoryId ??= createUuid());

  const id = createUuid();
  try {
    storage.setItem(SESSION_KEY, id);
  } catch {
    return (memoryId ??= id);
  }
  return id;
}
