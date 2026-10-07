import {
  API_BASE,
  EVENT_PATH,
  EVENT_TRANSPORT,
  REQUEST_TIMEOUT_MS,
  UNLOCK_PATH,
} from '../config.js';
import { getSessionId } from './session.js';

const listeners = new Set();

// Abonnement au journal des appels (utilisé par le panneau ?debug=1).
export function onApiLog(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function log(entry) {
  for (const listener of listeners) {
    try {
      listener({ at: new Date(), ...entry });
    } catch {}
  }
}

export function buildRequest(base, path, data) {
  return {
    url: String(base).replace(/\/+$/, '') + path,
    init: {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    },
  };
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * POST JSON avec délai maximal. Ne lève jamais : renvoie toujours un résultat normalisé.
 *   { ok: true, status, data }
 *   { ok: false, kind: 'rejected', status: 422, hint }
 *   { ok: false, kind: 'rate_limited' | 'timeout' | 'network' | 'error', status }
 */
export async function post(path, data, options = {}) {
  const {
    base = API_BASE,
    timeoutMs = REQUEST_TIMEOUT_MS,
    fetchImpl = globalThis.fetch,
  } = options;
  const { url, init } = buildRequest(base, path, data);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let result;

  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    const body = await readJson(response);
    if (response.status === 422) {
      const hint = typeof body?.hint === 'string' && body.hint.trim() ? body.hint.trim() : null;
      result = { ok: false, kind: 'rejected', status: 422, hint };
    } else if (response.status === 429) {
      result = { ok: false, kind: 'rate_limited', status: 429 };
    } else if (response.ok && body?.ok === true) {
      result = { ok: true, status: response.status, data: body };
    } else {
      result = { ok: false, kind: 'error', status: response.status };
    }
  } catch {
    result = controller.signal.aborted
      ? { ok: false, kind: 'timeout', status: 0 }
      : { ok: false, kind: 'network', status: 0 };
  } finally {
    clearTimeout(timer);
  }

  log({ type: 'post', url, request: data, result });
  return result;
}

export function unlock(mechanic, proof, options) {
  return post(UNLOCK_PATH, { mechanic, session_id: getSessionId(), proof }, options);
}

// Événement d'analyse, « fire and forget » : ne lève jamais, ne bloque jamais.
export function sendEvent(mechanic, event, meta = {}, options = {}) {
  const {
    base = API_BASE,
    transport = EVENT_TRANSPORT,
    navigatorImpl = globalThis.navigator,
    fetchImpl = globalThis.fetch,
  } = options;
  const url = String(base).replace(/\/+$/, '') + EVENT_PATH;
  let payload = null;
  let via = 'none';

  try {
    payload = { mechanic, session_id: getSessionId(), event, meta };
    const body = JSON.stringify(payload);

    if (transport === 'beacon' && typeof navigatorImpl?.sendBeacon === 'function') {
      try {
        if (navigatorImpl.sendBeacon(url, new Blob([body], { type: 'application/json' }))) via = 'beacon';
      } catch {}
    }

    if (via === 'none' && typeof fetchImpl === 'function') {
      via = 'fetch';
      Promise.resolve(
        fetchImpl(url, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
      ).catch(() => {});
    }
  } catch {}

  log({ type: 'event', url, request: payload, result: { via } });
  return via;
}
