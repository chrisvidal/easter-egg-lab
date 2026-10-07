// Globe orthographique sur <canvas>. d3-geo, topojson et world-atlas sont chargés à la demande ;
// s'ils échouent, le globe reste une sphère nue et la mécanique fonctionne toujours.
import { CDN } from '../config.js';

let worldPromise = null;

export function loadWorld() {
  worldPromise ??= (async () => {
    try {
      const [geo, topojson, topology] = await Promise.all([
        import(CDN.d3Geo),
        import(CDN.topojson),
        fetch(CDN.land).then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.json();
        }),
      ]);
      return { geo, land: topojson.feature(topology, topology.objects.land) };
    } catch {
      return null;
    }
  })();
  return worldPromise;
}

const INK = '236, 232, 225';

export function createGlobe(canvas, initialRotation = [0, -12, 0]) {
  const ctx = canvas.getContext('2d');
  const state = { rotation: [...initialRotation], shade: 0 };
  let world = null;
  let projection = null;
  let path = null;
  let graticule = null;
  let size = 0;
  let dpr = 1;

  function radius() {
    return Math.max(1, size / 2 - 2);
  }

  function draw() {
    if (!size) return;
    const c = size / 2;
    const r = radius();
    const light = 1 - state.shade;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0e0e0e';
    ctx.fill();

    if (projection) {
      projection.translate([c, c]).scale(r).rotate(state.rotation);
      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = `rgba(${INK}, ${0.07 * light})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.beginPath();
      path(world.land);
      ctx.fillStyle = `rgba(${INK}, ${0.2 + 0.5 * light})`;
      ctx.fill();
    }

    // Terminateur : la clarté vient d'en haut à gauche, l'ombre gagne le reste.
    const shadow = ctx.createRadialGradient(c - r * 0.35, c - r * 0.45, r * 0.05, c, c, r * 1.25);
    shadow.addColorStop(0, `rgba(${INK}, ${0.1 * light})`);
    shadow.addColorStop(0.55, 'rgba(0, 0, 0, 0.3)');
    shadow.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fillStyle = shadow;
    ctx.fill();

    if (state.shade > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * state.shade})`;
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(${INK}, ${0.08 + 0.12 * light})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = Math.max(1, Math.round(Math.min(rect.width, rect.height)));
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    draw();
  }

  function setWorld(loaded) {
    if (!loaded) return;
    world = loaded;
    projection = loaded.geo.geoOrthographic().clipAngle(90).precision(0.6);
    path = loaded.geo.geoPath(projection, ctx);
    graticule = loaded.geo.geoGraticule10();
    draw();
  }

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  resize();
  loadWorld().then(setWorld);

  return { state, draw, resize, radius };
}
