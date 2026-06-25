// Deterministic per-post "phase-space specimen" glyph.
//
// A small damped harmonograph (two superimposed oscillators per axis, slightly
// detuned so the figure precesses into a rosette). Smooth and legible at ~34px,
// rich and unique from the post slug, rendered build-time as inline SVG — zero
// client JS, calm by default. The real 3D Lorenz is reserved for the masthead.

function hashSlug(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns { d, end:[x,y] } in a 40x40 viewBox. Same slug → same specimen.
export function phaseGlyph(slug) {
  const rnd = mulberry32(hashSlug(String(slug)));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  const f1 = pick([2, 3, 3, 4]);
  const f2 = f1 + pick([1, 2]) + 0.04; // detune → never a static closed loop
  const f3 = pick([2, 3, 3, 4]);
  const f4 = f3 + pick([1, 2]) + 0.04;
  const p1 = rnd() * Math.PI * 2;
  const p2 = rnd() * Math.PI * 2;
  const p3 = rnd() * Math.PI * 2;
  const p4 = rnd() * Math.PI * 2;
  const d1 = 0.0035 + rnd() * 0.002; // slow envelope on the primary
  const d2 = 0.008 + rnd() * 0.003; // faster envelope on the secondary

  const T = 78;
  const dt = 0.2;
  const C = 20;

  // Trace once, tracking bounds so we can normalize the figure to fill the box.
  const pts = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let t = 0; t <= T; t += dt) {
    const e1 = Math.exp(-d1 * t);
    const e2 = Math.exp(-d2 * t);
    const x = e1 * Math.sin(f1 * t + p1) + 0.55 * e2 * Math.sin(f2 * t + p2);
    const y = e1 * Math.sin(f3 * t + p3) + 0.55 * e2 * Math.sin(f4 * t + p4);
    pts.push([x, y]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const s = 30 / span; // fit into ~30px, centered in the 40 box
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  let path = "";
  let ex = C;
  let ey = C;
  pts.forEach(([x, y], i) => {
    const px = +(C + (x - cx) * s).toFixed(1);
    const py = +(C + (y - cy) * s).toFixed(1);
    path += (i === 0 ? "M" : "L") + px + "," + py + " ";
    ex = px;
    ey = py;
  });

  return { d: path.trim(), end: [ex, ey] };
}
