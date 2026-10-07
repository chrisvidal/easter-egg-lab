import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRequest, onApiLog, post, sendEvent, unlock } from '../assets/js/core/api.js';
import { DEFAULT_API_BASE, UNLOCK_PATH } from '../assets/js/config.js';

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      if (body === undefined) throw new SyntaxError('empty body');
      return body;
    },
  };
}

function mockFetch(response) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return typeof response === 'function' ? response(url, init) : response;
  };
  return { calls, fetchImpl };
}

test('buildRequest : URL, méthode, en-têtes et corps JSON', () => {
  const { url, init } = buildRequest('https://api.example.test/', '/api/easter-egg/unlock', { a: 1 });
  assert.equal(url, 'https://api.example.test/api/easter-egg/unlock');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['Content-Type'], 'application/json');
  assert.equal(init.headers.Accept, 'application/json');
  assert.equal(init.credentials, 'omit');
  assert.deepEqual(JSON.parse(init.body), { a: 1 });
});

test('unlock : envoie mechanic, session_id uuid et proof vers l’API par défaut', async () => {
  const { calls, fetchImpl } = mockFetch(jsonResponse(200, { ok: true, mechanic: 'longpress', reveal: {} }));
  await unlock('longpress', { duration_ms: 5012 }, { fetchImpl });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, DEFAULT_API_BASE + UNLOCK_PATH);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.mechanic, 'longpress');
  assert.match(body.session_id, /^[0-9a-f-]{36}$/);
  assert.deepEqual(body.proof, { duration_ms: 5012 });
  assert.ok(calls[0].init.signal, 'un AbortSignal est fourni');
});

test('200 ok:true → succès avec le JSON', async () => {
  const data = { ok: true, mechanic: 'letters', reveal: { title: 'T', paragraphs: ['p'], cta: null } };
  const { fetchImpl } = mockFetch(jsonResponse(200, data));
  const result = await post('/x', {}, { base: 'https://a.test', fetchImpl });
  assert.deepEqual(result, { ok: true, status: 200, data });
});

test('422 → échec discret avec hint', async () => {
  const { fetchImpl } = mockFetch(jsonResponse(422, { ok: false, hint: 'Pas encore.' }));
  const result = await post('/x', {}, { base: 'https://a.test', fetchImpl });
  assert.deepEqual(result, { ok: false, kind: 'rejected', status: 422, hint: 'Pas encore.' });
});

test('422 sans hint (null ou corps illisible) → hint null', async () => {
  for (const body of [{ ok: false, hint: null }, undefined, { ok: false, hint: '   ' }]) {
    const { fetchImpl } = mockFetch(jsonResponse(422, body));
    const result = await post('/x', {}, { base: 'https://a.test', fetchImpl });
    assert.equal(result.kind, 'rejected');
    assert.equal(result.hint, null);
  }
});

test('429 → rate_limited', async () => {
  const { fetchImpl } = mockFetch(jsonResponse(429, undefined));
  const result = await post('/x', {}, { base: 'https://a.test', fetchImpl });
  assert.deepEqual(result, { ok: false, kind: 'rate_limited', status: 429 });
});

test('500 ou 200 sans ok:true → error', async () => {
  for (const response of [jsonResponse(500, { message: 'boom' }), jsonResponse(200, { ok: false })]) {
    const { fetchImpl } = mockFetch(response);
    const result = await post('/x', {}, { base: 'https://a.test', fetchImpl });
    assert.equal(result.ok, false);
    assert.equal(result.kind, 'error');
  }
});

test('erreur réseau → network', async () => {
  const fetchImpl = async () => {
    throw new TypeError('Failed to fetch');
  };
  const result = await post('/x', {}, { base: 'https://a.test', fetchImpl });
  assert.deepEqual(result, { ok: false, kind: 'network', status: 0 });
});

test('délai dépassé → timeout (requête annulée)', async () => {
  let aborted = false;
  const fetchImpl = (url, init) =>
    new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        aborted = true;
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  const result = await post('/x', {}, { base: 'https://a.test', fetchImpl, timeoutMs: 20 });
  assert.equal(aborted, true);
  assert.deepEqual(result, { ok: false, kind: 'timeout', status: 0 });
});

test('le délai par défaut est de 8 s', async () => {
  const { REQUEST_TIMEOUT_MS } = await import('../assets/js/config.js');
  assert.equal(REQUEST_TIMEOUT_MS, 8000);
});

test('onApiLog reçoit chaque appel', async () => {
  const entries = [];
  const off = onApiLog((entry) => entries.push(entry));
  const { fetchImpl } = mockFetch(jsonResponse(429, undefined));
  await post('/x', { a: 1 }, { base: 'https://a.test', fetchImpl });
  off();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].type, 'post');
  assert.equal(entries[0].result.kind, 'rate_limited');
});

test('sendEvent : sendBeacon avec Blob application/json si disponible', async () => {
  const beacons = [];
  const navigatorImpl = { sendBeacon: (url, blob) => (beacons.push({ url, blob }), true) };
  const via = sendEvent('console', 'page_view', { path: '/' }, { base: 'https://a.test', transport: 'beacon', navigatorImpl });
  assert.equal(via, 'beacon');
  assert.equal(beacons[0].url, 'https://a.test/api/easter-egg/event');
  assert.equal(beacons[0].blob.type, 'application/json');
  const payload = JSON.parse(await beacons[0].blob.text());
  assert.equal(payload.mechanic, 'console');
  assert.equal(payload.event, 'page_view');
  assert.deepEqual(payload.meta, { path: '/' });
});

test('sendEvent : transport par défaut = fetch keepalive sans credentials', () => {
  const { calls, fetchImpl } = mockFetch(jsonResponse(204, undefined));
  const navigatorImpl = { sendBeacon: () => assert.fail('sendBeacon ne doit pas être appelé') };
  assert.equal(sendEvent('overscroll', 'page_view', {}, { base: 'https://a.test', navigatorImpl, fetchImpl }), 'fetch');
  assert.equal(calls[0].init.credentials, 'omit');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
});

test('sendEvent : repli fetch keepalive, et jamais d’exception', async () => {
  const { calls, fetchImpl } = mockFetch(jsonResponse(204, undefined));
  const navigatorImpl = {
    sendBeacon: () => {
      throw new Error('blocked');
    },
  };
  assert.equal(sendEvent('letters', 'hint_seen', {}, { base: 'https://a.test', transport: 'beacon', navigatorImpl, fetchImpl }), 'fetch');
  assert.equal(calls[0].init.keepalive, true);
  assert.equal(calls[0].init.credentials, 'omit');

  const failing = async () => {
    throw new TypeError('offline');
  };
  assert.doesNotThrow(() => sendEvent('letters', 'gave_up', {}, { base: 'https://a.test', navigatorImpl: {}, fetchImpl: failing }));
});
