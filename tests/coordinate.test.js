import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyDrag,
  coordinateUnderReticle,
  formatCoordinate,
  normalizeLongitude,
  parseLatLng,
  rotationFor,
} from '../assets/js/eggs/coordinate-math.js';

test('le réticule pointe l’inverse de la rotation (convention d3-geo)', () => {
  assert.deepEqual(coordinateUnderReticle([0, 0, 0]), { lat: 0, lng: 0 });
  assert.deepEqual(coordinateUnderReticle([-2.35, -48.85, 0]), { lat: 48.85, lng: 2.35 });
  assert.deepEqual(coordinateUnderReticle([74, 40.7, 0]), { lat: -40.7, lng: -74 });
});

test('longitude ramenée dans ]-180, 180]', () => {
  assert.equal(normalizeLongitude(190), -170);
  assert.equal(normalizeLongitude(-190), 170);
  assert.equal(normalizeLongitude(540), 180);
  assert.equal(normalizeLongitude(-180), 180);
  assert.deepEqual(coordinateUnderReticle([-200, 0]), { lat: 0, lng: -160 });
});

test('latitude bornée et arrondie à 4 décimales', () => {
  assert.equal(coordinateUnderReticle([0, -120]).lat, 90);
  assert.equal(coordinateUnderReticle([0, 12.345678]).lat, -12.3457);
});

test('rotationFor et coordinateUnderReticle sont réciproques', () => {
  for (const point of [{ lat: 10, lng: 20 }, { lat: -45.5, lng: 170.25 }, { lat: 89, lng: -179 }]) {
    assert.deepEqual(coordinateUnderReticle(rotationFor(point)), point);
  }
});

test('glisser : vers la droite fait défiler l’ouest sous le réticule, vers le bas le nord', () => {
  const radius = 180 / Math.PI;
  const right = coordinateUnderReticle(applyDrag([0, 0, 0], 10, 0, radius));
  assert.equal(right.lng, -10);
  const down = coordinateUnderReticle(applyDrag([0, 0, 0], 0, 10, radius));
  assert.equal(down.lat, 10);
  const pole = applyDrag([0, -85, 0], 0, 1000, radius);
  assert.equal(pole[1], -90);
});

test('saisie « lat, lng »', () => {
  assert.deepEqual(parseLatLng('12.5, -3'), { lat: 12.5, lng: -3 });
  assert.deepEqual(parseLatLng('  -12.5   44 '), { lat: -12.5, lng: 44 });
  assert.deepEqual(parseLatLng('12,5 ; -3,25'), { lat: 12.5, lng: -3.25 });
  assert.equal(parseLatLng(''), null);
  assert.equal(parseLatLng('abc, 3'), null);
  assert.equal(parseLatLng('95, 3'), null);
  assert.equal(parseLatLng('1, 2, 3'), null);
});

test('affichage lisible', () => {
  assert.equal(formatCoordinate({ lat: -12.5, lng: 3 }), '12.50° S · 3.00° E');
  assert.equal(formatCoordinate({ lat: 1, lng: -20 }), '1.00° N · 20.00° O');
});
