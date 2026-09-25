// Pintor 3D (figura de juguete de diseño propio) con un motor 3D simple en canvas.
// painterPose(t) da la pose según el tiempo de la escena: saluda, se voltea, pinta, se voltea y celebra.
const TAU = Math.PI * 2;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
function mulM(a, b) { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]; return o; }
function rotM(rx, ry, rz) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  return mulM(mulM([cy, 0, sy, 0, 1, 0, -sy, 0, cy], [1, 0, 0, 0, cx, -sx, 0, sx, cx]), [cz, -sz, 0, sz, cz, 0, 0, 0, 1]);
}
const appM = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
function box(w, h, d) {
  const x = w / 2, y = h / 2, z = d / 2;
  const v = [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
  return [[4, 5, 6, 7, [0, 0, 1]], [1, 0, 3, 2, [0, 0, -1]], [5, 1, 2, 6, [1, 0, 0]], [0, 4, 7, 3, [-1, 0, 0]], [3, 7, 6, 2, [0, 1, 0]], [0, 1, 5, 4, [0, -1, 0]]]
    .map(q => ({ v: [v[q[0]], v[q[1]], v[q[2]], v[q[3]]], n: q[4] }));
}
function cyl(r, h, seg = 16) {
  const y = h / 2, out = [];
  for (let i = 0; i < seg; i++) {
    const a = i / seg * TAU, b = (i + 1) / seg * TAU, m = (a + b) / 2;
    out.push({ v: [[Math.cos(a) * r, -y, Math.sin(a) * r], [Math.cos(b) * r, -y, Math.sin(b) * r], [Math.cos(b) * r, y, Math.sin(b) * r], [Math.cos(a) * r, y, Math.sin(a) * r]], n: [Math.cos(m), 0, Math.sin(m)], curved: true });
  }
  const top = [], bot = [];
  for (let i = 0; i < seg; i++) { const a = i / seg * TAU; top.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
  for (let i = seg - 1; i >= 0; i--) { const a = i / seg * TAU; bot.push([Math.cos(a) * r, -y, Math.sin(a) * r]); }
  out.push({ v: top, n: [0, 1, 0] }, { v: bot, n: [0, -1, 0] });
  return out;
}
const C = { skin: [250, 205, 55], smock: [243, 243, 238], pants: [42, 75, 141], shoe: [30, 42, 56], beret: [211, 53, 157],
  wood: [150, 98, 48], tan: [232, 208, 160], red: [208, 40, 32], blue: [16, 104, 176], yellow: [240, 200, 8], green: [16, 136, 64],
  orange: [232, 136, 16], scarf: [208, 40, 32], metal: [170, 175, 180] };

const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const lerp = (a, b, k) => a + (b - a) * k;
// Línea de tiempo (segundos): 0-0.9 saluda · 0.9-1.5 se voltea · 1.5-4.3 pinta · 4.3-5.0 se voltea · 5.0-5.8 presenta · 5.8+ celebra
export const TIMELINE = { paintStart: 1.5, paintEnd: 4.3, count: 4.5, cheer: 5.8 };
export function painterPose(t) {
  const p = { yaw: 0, y: 0, lean: 0, brush: { x: .1, z: .22 }, pal: { x: -.55, z: .3 }, headX: 0, headY: 0, legL: 0, legR: 0, squash: 0 };
  if (t < .9) { const k = t / .9; p.y = Math.sin(Math.PI * k) * .9; p.brush = { x: -.15, z: 2.4 + .35 * Math.sin(t * 16) }; p.headY = .15 * Math.sin(t * 8); return p; }
  if (t < 1.5) { const k = ease((t - .9) / .6); p.yaw = lerp(0, 1.3, k); p.brush = { x: lerp(-.15, -1.0, k), z: lerp(2.4, .35, k) }; p.headY = lerp(0, .15, k); return p; }
  if (t < 4.3) {
    const u = t - 1.5;
    p.yaw = 1.3 + .05 * Math.sin(u * 3);
    p.brush = { x: -1.25 - .38 * Math.sin(u * 9), z: .3 + .32 * Math.sin(u * 4.5) };
    p.lean = .05 * Math.sin(u * 4.5); p.headX = .1 * Math.sin(u * 9 + 1); p.headY = .12;
    p.y = .1 * Math.abs(Math.sin(u * 4.5)); return p;
  }
  if (t < 5.0) { const k = ease((t - 4.3) / .7); p.yaw = lerp(1.3, -.15, k); p.brush = { x: lerp(-1.25, -.45, k), z: lerp(.3, 1.35, k) }; p.headY = lerp(.12, .3, k); return p; }
  if (t < 5.8) { const k = (t - 5.0) / .8; p.yaw = -.15; p.brush = { x: -.45, z: 1.35 + .08 * Math.sin(k * 9) }; p.headY = .3; p.headX = -.05; return p; }
  const u = t - 5.8, ph = (u % .7) / .7, hop = Math.sin(Math.PI * ph);
  p.y = hop * 1.5; p.squash = ph < .12 || ph > .9 ? .08 : 0;
  p.brush = { x: -.15, z: 2.55 + .25 * Math.sin(u * 9) }; p.pal = { x: -.15, z: 2.55 + .25 * Math.sin(u * 9 + 1.5) };
  p.legL = .35 * hop; p.legR = -.25 * hop; p.headX = .1 * Math.sin(u * 9); p.yaw = .15 * Math.sin(u * 2.2);
  return p;
}

// ---------- personajes (diseños propios de figuras de juguete) ----------
export const CAST = {
  pintor:    { shirt: C.smock, pants: C.pants, shoe: C.shoe, dots: true, scarf: C.scarf, hat: "beret", hatColor: C.beret, left: "brush", right: "palette", mustache: true },
  bailarina: { shirt: [211, 53, 157], pants: [248, 196, 222], shoe: [246, 246, 246], tutu: [255, 158, 208], hat: "bun", hatColor: [46, 34, 34], lashes: true },
  director:  { shirt: [16, 136, 64], pants: [122, 80, 40], shoe: C.shoe, hat: "cap", hatColor: [27, 42, 52], right: "camera" },
  musico:    { shirt: [200, 26, 9], pants: C.pants, shoe: C.shoe, hat: "hair", hatColor: [110, 70, 35], left: "guitar" },
  sonido:    { shirt: [106, 44, 145], pants: [163, 168, 171], shoe: C.shoe, hat: "phones", hatColor: [110, 70, 35], right: "mic" }
};

// Escena 3D reutilizable: begin() → figure()/brick() → draw()
export function createScene(canvas, camOpt) {
  const cx = canvas.getContext("2d");
  const LIGHT = norm([-.45, .75, .6]), FILL = norm([.55, .25, .75]);
  let polys = [], faces = [], W = canvas.width, H = canvas.height, cam = null;
  const emit = (geo, M, T, c, o) => { for (const p of geo) polys.push({ v: p.v.map(v => add(appM(M, v), T)), n: appM(M, p.n), c, o: o || 0, curved: !!p.curved }); };
  const child = (M, T, t, r) => [r ? mulM(M, rotM(r[0] || 0, r[1] || 0, r[2] || 0)) : M, add(T, appM(M, t))];
  const at = (M, T, off) => add(T, appM(M, off));
  function makeCam() {
    const pos = camOpt.pos, target = camOpt.target;
    const fwd = norm(sub(target, pos)), right = norm([-fwd[2], 0, fwd[0]]);
    const up = [right[1] * fwd[2] - right[2] * fwd[1], right[2] * fwd[0] - right[0] * fwd[2], right[0] * fwd[1] - right[1] * fwd[0]];
    const dist = Math.hypot(...sub(target, pos));
    const f = camOpt.ppu ? camOpt.ppu(W, H) * dist : (H / 2) / Math.tan(camOpt.fov * Math.PI / 180);
    return { pos, fwd, right, up, f };
  }
  function project(p) {
    const v = sub(p, cam.pos), z = dot(v, cam.fwd);
    return [W / 2 + cam.f * dot(v, cam.right) / z, H * .5 - cam.f * dot(v, cam.up) / z, z];
  }
  function shade(c, n, extra) {
    const l = Math.max(0, dot(n, LIGHT)), fl = Math.max(0, dot(n, FILL)), sky = Math.max(0, n[1]) * .1;
    const k = .42 + .6 * l + .38 * fl + sky - (extra || 0), spec = Math.pow(l, 28) * .35;
    const f = v => Math.max(0, Math.min(255, Math.round(v * k + 255 * spec)));
    return `rgb(${f(c[0])},${f(c[1])},${f(c[2])})`;
  }
  const shadows = [];
  function figure(cfg, s, pos) {
    const [Mr, Tr] = child(I, add(pos || [0, 0, 0], [0, s.y, 0]), [0, 0, 0], [s.pitch || 0, s.yaw, s.lean]);
    shadows.push({ x: (pos || [0])[0], z: (pos || [0, 0, 0])[2], y: s.y });
    const sq = 1 - s.squash;
    for (const side of [-1, 1]) {
      const [M, T] = child(Mr, Tr, [side * .62, 2.5 * sq, 0], [side < 0 ? s.legL : s.legR, 0, 0]);
      emit(box(1.12, 2.55 * sq, 1.25), M, at(M, T, [0, -1.28 * sq, 0]), cfg.pants);
      emit(box(1.25, .62, 1.75), M, at(M, T, [0, -2.72 * sq, .2]), cfg.shoe);
    }
    emit(box(2.45, .8, 1.35), Mr, at(Mr, Tr, [0, 2.9 * sq, 0]), cfg.pants);
    if (cfg.tutu) emit(cyl(1.95, .38, 22), Mr, at(Mr, Tr, [0, 3.25 * sq, 0]), cfg.tutu);
    const [Mb, Tb] = child(Mr, Tr, [0, 3.3 * sq, 0], [0, 0, 0]);
    emit(box(2.9, 3.0, 1.55), Mb, at(Mb, Tb, [0, 1.5, 0]), cfg.shirt);
    if (cfg.dots) [[C.red, -.6, 2.1], [C.blue, .55, 1.3], [C.yellow, -.25, .8], [C.green, .7, 2.3]].forEach(([c, x, y]) =>
      emit(cyl(.2, .06, 10), mulM(Mb, rotM(Math.PI / 2, 0, 0)), at(Mb, Tb, [x, y, .79]), c));
    if (cfg.scarf) { emit(box(1.5, .45, 1.62), Mb, at(Mb, Tb, [0, 2.78, 0]), cfg.scarf); emit(box(.5, .7, .2), Mb, at(Mb, Tb, [.35, 2.3, .8]), cfg.scarf); }
    for (const side of [-1, 1]) {
      const a = side < 0 ? s.brush : s.pal, prop = side < 0 ? cfg.left : cfg.right;
      const [M, T] = child(Mb, Tb, [side * 1.6, 2.6, 0], [a.x, 0, side * a.z]);
      emit(box(.86, 1.95, .95), M, at(M, T, [0, -.98, 0]), cfg.shirt);
      emit(cyl(.5, .6, 14), M, at(M, T, [0, -2.1, 0]), C.skin);
      if (prop === "brush") {
        const [Mp, Tp] = child(M, T, [0, -2.25, .25], [Math.PI / 2 - .25, 0, 0]);
        emit(cyl(.11, 2.0, 8), Mp, at(Mp, Tp, [0, .95, 0]), C.wood);
        emit(cyl(.15, .3, 8), Mp, at(Mp, Tp, [0, 2.0, 0]), C.metal);
        emit(cyl(.17, .45, 8), Mp, at(Mp, Tp, [0, 2.35, 0]), C.red);
      } else if (prop === "palette") {
        const [Mp, Tp] = child(M, T, [0, -2.35, .55], [.25, 0, 0]);
        emit(cyl(1.05, .14, 18), Mp, Tp, C.tan);
        [[C.red, -.5, -.2], [C.blue, -.1, .45], [C.yellow, .35, .25], [C.green, .45, -.3], [C.orange, -.2, -.6]].forEach(([c, x, z]) =>
          emit(cyl(.17, .12, 8), Mp, at(Mp, Tp, [x, .12, z]), c));
      } else if (prop === "camera") {
        emit(box(1.0, .8, 1.3), M, at(M, T, [0, -2.45, .55]), [30, 36, 44]);
        emit(cyl(.34, .5, 12), mulM(M, rotM(Math.PI / 2, 0, 0)), at(M, T, [0, -2.45, 1.4]), C.metal);
        emit(box(.4, .3, .5), M, at(M, T, [0, -1.95, .4]), [30, 36, 44]);
      } else if (prop === "guitar") {
        const [Mp, Tp] = child(M, T, [0, -2.2, .5], [.3, 0, .9]);
        emit(cyl(1.0, .45, 18), mulM(Mp, rotM(Math.PI / 2, 0, 0)), at(Mp, Tp, [0, -.9, 0]), C.orange);
        emit(cyl(.32, .5, 12), mulM(Mp, rotM(Math.PI / 2, 0, 0)), at(Mp, Tp, [0, -.9, .03]), [60, 40, 25]);
        emit(box(.35, 2.4, .3), Mp, at(Mp, Tp, [0, .9, 0]), C.wood);
      } else if (prop === "mic") {
        const [Mp, Tp] = child(M, T, [0, -2.25, .3], [Math.PI / 2 - .4, 0, 0]);
        emit(cyl(.14, 1.1, 8), Mp, at(Mp, Tp, [0, .5, 0]), [30, 36, 44]);
        emit(cyl(.34, .45, 12), Mp, at(Mp, Tp, [0, 1.2, 0]), [79, 195, 232]);
      }
    }
    const [Mh, Th] = child(Mb, Tb, [0, 3.0, 0], [s.headX, s.headY, 0]);
    emit(cyl(.48, .55, 12), Mh, at(Mh, Th, [0, -.1, 0]), C.skin, .1);
    emit(cyl(1.22, 1.95, 26), Mh, at(Mh, Th, [0, 1.0, 0]), C.skin);
    const hc = cfg.hatColor;
    if (cfg.hat === "beret") {
      const [Mbt, Tbt] = child(Mh, Th, [.08, 2.08, 0], [0, 0, -.16]);
      emit(cyl(1.42, .42, 24), Mbt, Tbt, hc); emit(cyl(.22, .32, 10), Mbt, at(Mbt, Tbt, [.1, .34, 0]), hc);
    } else if (cfg.hat === "bun") {
      emit(cyl(1.28, .7, 24), Mh, at(Mh, Th, [0, 1.85, 0]), hc);
      emit(cyl(.6, .6, 14), Mh, at(Mh, Th, [0, 2.4, -.35]), hc);
      emit(box(2.2, 1.4, .5), Mh, at(Mh, Th, [0, 1.35, -1.0]), hc);
    } else if (cfg.hat === "cap") {
      emit(cyl(1.28, .66, 24), Mh, at(Mh, Th, [0, 1.95, 0]), hc);
      emit(box(1.9, .16, 1.3), Mh, at(Mh, Th, [0, 1.66, 1.3]), hc);
    } else if (cfg.hat === "hair" || cfg.hat === "phones") {
      emit(cyl(1.28, .72, 24), Mh, at(Mh, Th, [0, 1.85, 0]), hc);
      emit(box(2.3, 1.1, .5), Mh, at(Mh, Th, [0, 1.45, -1.0]), hc);
      if (cfg.hat === "phones") {
        emit(box(2.9, .3, .45), Mh, at(Mh, Th, [0, 2.3, 0]), [30, 36, 44]);
        for (const x of [-1.32, 1.32]) emit(cyl(.55, .45, 14), mulM(Mh, rotM(0, 0, Math.PI / 2)), at(Mh, Th, [x, 1.05, 0]), [30, 36, 44]);
      }
    }
    faces.push({ M: Mh, T: at(Mh, Th, [0, 1.05, 0]), cfg });
  }
  function brick(wu, du, hu, color, pos, rotY) {
    const M = rotM(0, rotY || 0, 0);
    emit(box(wu, hu, du), M, add(pos, [0, hu / 2, 0]), color);
    for (let i = 0; i < wu; i++) for (let j = 0; j < du; j++)
      emit(cyl(.3, .2, 10), M, add(pos, appM(M, [-wu / 2 + .5 + i, hu + .1, -du / 2 + .5 + j])), color);
  }
  function begin() { polys = []; faces = []; shadows.length = 0; W = canvas.width; H = canvas.height; cam = makeCam(); }
  function draw({ clear = true, shadowSize = 150 } = {}) {
    if (clear) cx.clearRect(0, 0, W, H);
    for (const sh of shadows) {
      const g0 = project([sh.x, 0, sh.z]), k = 1 - Math.min(.55, sh.y / 4), r = shadowSize * cam.f / g0[2] / 66;
      cx.fillStyle = `rgba(0,0,0,${.3 * k})`;
      cx.beginPath(); cx.ellipse(g0[0], g0[1], r * k, r * .18 * k, 0, 0, TAU); cx.fill();
    }
    const list = [];
    for (const p of polys) {
      let c0 = [0, 0, 0]; for (const v of p.v) c0 = add(c0, v); c0 = [c0[0] / p.v.length, c0[1] / p.v.length, c0[2] / p.v.length];
      if (dot(p.n, sub(c0, cam.pos)) >= 0) continue;
      const pts = p.v.map(project);
      let z = 0; for (const q of pts) z += q[2];
      const fill = shade(p.c, norm(p.n), p.o);
      list.push({ pts, z: z / pts.length, fill, stroke: p.curved ? fill : `rgba(0,0,0,.28)` });
    }
    list.sort((a, b) => b.z - a.z);
    cx.lineJoin = "round";
    for (const p of list) {
      cx.beginPath(); cx.moveTo(p.pts[0][0], p.pts[0][1]);
      for (let i = 1; i < p.pts.length; i++) cx.lineTo(p.pts[i][0], p.pts[i][1]);
      cx.closePath(); cx.fillStyle = p.fill; cx.fill(); cx.strokeStyle = p.stroke; cx.lineWidth = 1; cx.stroke();
    }
    for (const f of faces) drawFace(f);
  }
  function drawFace(f) {
    const camDir = norm(sub(f.T, cam.pos));
    const visible = local => dot(norm(appM(f.M, local)), camDir) < -.08;
    const P = off => project(add(f.T, appM(f.M, off)));
    const s0 = cam.f / P([0, 0, 1.2])[2] * .34;
    for (const ex of [-.45, .45]) {
      if (!visible([ex, 0, 1])) continue;
      const e = P([ex, .38, 1.16]);
      cx.fillStyle = "#1A2630"; cx.beginPath(); cx.ellipse(e[0], e[1], s0 * .32, s0 * .42, 0, 0, TAU); cx.fill();
      cx.fillStyle = "#fff"; cx.beginPath(); cx.ellipse(e[0] - s0 * .1, e[1] - s0 * .14, s0 * .12, s0 * .15, 0, 0, TAU); cx.fill();
      const b1 = P([ex - .2, .72, 1.14]), b2 = P([ex + .2, .76, 1.14]);
      cx.strokeStyle = f.cfg.lashes ? "#1A2630" : "#5A3A1E"; cx.lineWidth = s0 * .16; cx.lineCap = "round";
      cx.beginPath(); cx.moveTo(b1[0], b1[1]); cx.lineTo(b2[0], b2[1]); cx.stroke();
      const ck = P([ex * 1.35, -.08, 1.08]);
      cx.fillStyle = "rgba(226,102,92,.38)"; cx.beginPath(); cx.ellipse(ck[0], ck[1], s0 * .38, s0 * .24, 0, 0, TAU); cx.fill();
    }
    if (visible([0, 0, 1])) {
      if (f.cfg.mustache) {
        const m1 = P([-.42, -.18, 1.17]), m2 = P([0, -.1, 1.2]), m3 = P([.42, -.18, 1.17]);
        cx.fillStyle = "#4A2E16";
        cx.beginPath(); cx.moveTo(m1[0], m1[1]); cx.quadraticCurveTo(m2[0], m2[1] - s0 * .45, m3[0], m3[1]);
        cx.quadraticCurveTo(m2[0], m2[1] + s0 * .1, m1[0], m1[1]); cx.fill();
      }
      const a = P([-.36, -.42, 1.18]), b = P([0, -.62, 1.2]), c = P([.36, -.42, 1.18]);
      cx.strokeStyle = "#1A2630"; cx.lineWidth = s0 * .16; cx.lineCap = "round";
      cx.beginPath(); cx.moveTo(a[0], a[1]); cx.quadraticCurveTo(b[0], b[1] + s0 * .2, c[0], c[1]); cx.stroke();
    }
  }
  return { begin, figure, brick, draw, project: p => project(p), ctx: cx, get W() { return W; }, get H() { return H; } };
}

export function createPainter(canvas) {
  const sc = createScene(canvas, { pos: [0, 6.8, 30], target: [0, 5.4, 0], fov: 12.8 });
  return { render(s) { sc.begin(); sc.figure(CAST.pintor, s, [0, 0, 0]); sc.draw(); } };
}
