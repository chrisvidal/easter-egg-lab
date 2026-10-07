import { setupEgg } from "../core/egg.js";
import { createGlobe } from "../core/globe.js";
import { prefersReducedMotion } from "../core/reveal.js";

const T = 46000;
const V = 6;

const egg = setupEgg("longpress");
const stage = document.querySelector("[data-globe]");
const canvas = stage.querySelector("canvas");
const halo = stage.querySelector("[data-h]");
const globe = createGlobe(canvas, [-10, -18, 0]);

let t0 = null;
let sent = false;
let last = performance.now();

function level(now) {
  return t0 == null ? 0 : Math.min(1, (now - t0) / T);
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const f = level(now);
  const reduced = prefersReducedMotion();

  if (!reduced) globe.state.rotation[0] += V * (1 - 0.9 * f) * dt;
  globe.state.shade = f * 0.85;
  globe.draw();
  stage.style.setProperty("--dy", reduced ? "0px" : `${(f * 14).toFixed(2)}px`);
  halo.style.strokeDashoffset = String(100 - f * 100);

  if (t0 != null && f >= 1 && !sent) {
    sent = true;
    egg.submit({ duration_ms: Math.round(now - t0) }).finally(up);
  }
  requestAnimationFrame(frame);
}

function down(source) {
  if (t0 != null || egg.busy) return;
  egg.start({ input: source });
  t0 = performance.now();
  sent = false;
  stage.classList.add("is-on");
}

function up() {
  if (egg.busy) return;
  t0 = null;
  stage.classList.remove("is-on");
}

stage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  try {
    stage.setPointerCapture(event.pointerId);
  } catch {}
  stage.focus({ preventScroll: true });
  down(event.pointerType || "pointer");
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  stage.addEventListener(type, () => {
    if (!sent) up();
  });
}
stage.addEventListener("contextmenu", (event) => event.preventDefault());
stage.addEventListener("selectstart", (event) => event.preventDefault());

stage.addEventListener("keydown", (event) => {
  if (event.key !== " " && event.key !== "Spacebar") return;
  event.preventDefault();
  if (!event.repeat) down("keyboard");
});
stage.addEventListener("keyup", (event) => {
  if (event.key !== " " && event.key !== "Spacebar") return;
  event.preventDefault();
  if (!sent) up();
});
stage.addEventListener("blur", () => {
  if (!sent) up();
});

requestAnimationFrame(frame);
