// Fonctions pures du globe interactif (sans DOM ni d3) : testables sous Node.
// Convention d3-geo : rotate([λ, φ, γ]) amène le point (lng = -λ, lat = -φ) au centre.

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeLongitude(lng) {
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

// Coordonnée sous le réticule fixe au centre du globe.
export function coordinateUnderReticle(rotation) {
  const [lambda = 0, phi = 0] = rotation;
  return {
    lat: round(clamp(-phi, -90, 90)),
    lng: round(normalizeLongitude(-lambda)),
  };
}

// Rotation qui place une coordonnée sous le réticule.
export function rotationFor({ lat, lng }, gamma = 0) {
  return [normalizeLongitude(-lng), clamp(-lat, -90, 90), gamma];
}

// Glisser de (dx, dy) pixels sur un globe de rayon `radius` pixels.
export function applyDrag(rotation, dx, dy, radius) {
  const k = 180 / (Math.PI * Math.max(1, radius));
  const [lambda = 0, phi = 0, gamma = 0] = rotation;
  return [normalizeLongitude(lambda + dx * k), clamp(phi - dy * k, -90, 90), gamma];
}

// Saisie « lat, lng » : « 12.5, -3 », « 12.5 -3 » ou, avec décimales à virgule, « 12,5 ; -3 ».
export function parseLatLng(input) {
  const text = String(input ?? '').trim();
  if (!text) return null;
  const parts = text.includes(';')
    ? text.split(';').map((part) => part.trim().replace(',', '.'))
    : text.split(/\s*,\s*|\s+/);
  if (parts.length !== 2 || parts.some((part) => !/^[-+]?\d+(\.\d+)?$/.test(part))) return null;
  const [lat, lng] = parts.map(Number);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function formatCoordinate({ lat, lng }) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'O';
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lng).toFixed(2)}° ${ew}`;
}
