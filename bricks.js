// Reloj de ladrillos LEGO (misma construcción del contador: dígitos 8x12 armados con piezas reales y animación de caída)
const ROWS = 12, COLS = 8;
const FONT = {
  0: [".XXXXXX.","XXXXXXXX","XX....XX","XX....XX","XX....XX","XX....XX","XX....XX","XX....XX","XX....XX","XX....XX","XXXXXXXX",".XXXXXX."],
  1: ["...XX...","..XXX...",".XXXX...","...XX...","...XX...","...XX...","...XX...","...XX...","...XX...","...XX...",".XXXXXX.",".XXXXXX."],
  2: [".XXXXXX.","XXXXXXXX","XX....XX","......XX","......XX",".XXXXXXX","XXXXXXX.","XX......","XX......","XX......","XXXXXXXX","XXXXXXXX"],
  3: [".XXXXXX.","XXXXXXXX","XX....XX","......XX","......XX","..XXXXX.","..XXXXX.","......XX","......XX","XX....XX","XXXXXXXX",".XXXXXX."],
  4: ["XX....XX","XX....XX","XX....XX","XX....XX","XX....XX","XXXXXXXX","XXXXXXXX","......XX","......XX","......XX","......XX","......XX"],
  5: ["XXXXXXXX","XXXXXXXX","XX......","XX......","XXXXXXX.","XXXXXXXX","......XX","......XX","......XX","XX....XX","XXXXXXXX",".XXXXXX."],
  6: [".XXXXXX.","XXXXXXXX","XX....XX","XX......","XX......","XXXXXXX.","XXXXXXXX","XX....XX","XX....XX","XX....XX","XXXXXXXX",".XXXXXX."],
  7: ["XXXXXXXX","XXXXXXXX","......XX","......XX",".....XXX",".....XX.","....XXX.","....XX..","...XXX..","...XX...","...XX...","...XX..."],
  8: [".XXXXXX.","XXXXXXXX","XX....XX","XX....XX","XX....XX",".XXXXXX.","XXXXXXXX","XX....XX","XX....XX","XX....XX","XXXXXXXX",".XXXXXX."],
  9: [".XXXXXX.","XXXXXXXX","XX....XX","XX....XX","XX....XX","XXXXXXXX",".XXXXXXX","......XX","......XX","XX....XX","XXXXXXXX",".XXXXXX."]
};
const SH_H = [[2,4],[4,2],[2,3],[3,2],[2,2],[1,4],[4,1],[1,3],[3,1],[1,2],[2,1],[1,1]];
const SH_V = [[4,2],[2,4],[3,2],[2,3],[2,2],[4,1],[1,4],[3,1],[1,3],[2,1],[1,2],[1,1]];
function place(pat, byCols, shapes) {
  const free = pat.map(r => [...r].map(c => c === "X")), out = [];
  const visit = (r, c) => {
    if (!free[r][c]) return;
    for (const [h, w] of shapes) {
      if (r + h > ROWS || c + w > COLS) continue;
      let ok = true;
      for (let y = r; y < r + h && ok; y++) for (let x = c; x < c + w; x++) if (!free[y][x]) { ok = false; break; }
      if (!ok) continue;
      for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) free[y][x] = false;
      out.push({ r, c, h, w }); return;
    }
  };
  if (byCols) { for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) visit(r, c); }
  else { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) visit(r, c); }
  return { out, score: out.length + 2 * out.filter(b => Math.min(b.h, b.w) === 1).length };
}
const LAYOUT = {};
for (let v = 0; v <= 9; v++) {
  let best = null;
  for (const bc of [false, true]) for (const sh of [SH_H, SH_V]) { const t = place(FONT[v], bc, sh); if (!best || t.score < best.score) best = t; }
  LAYOUT[v] = best.out;
}
// Colores LEGO: cada pieza toma uno sin repetir con sus vecinas
const LEGO = ["#C91A09", "#F2CD37", "#0055BF", "#237841"];
for (let v = 0; v <= 9; v++) {
  const owner = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  LAYOUT[v].forEach((b, i) => { for (let y = b.r; y < b.r + b.h; y++) for (let x = b.c; x < b.c + b.w; x++) owner[y][x] = i; });
  LAYOUT[v].forEach((b, i) => {
    const near = new Set();
    for (let y = b.r - 1; y <= b.r + b.h; y++) for (let x = b.c - 1; x <= b.c + b.w; x++) {
      if (y < 0 || x < 0 || y >= ROWS || x >= COLS) continue;
      const o = owner[y][x]; if (o !== -1 && o < i) near.add(LAYOUT[v][o].color);
    }
    let k = (i * 3 + v) % 4;
    for (let n = 0; n < 4 && near.has(LEGO[k]); n++) k = (k + 1) % 4;
    b.color = LEGO[k];
  });
}
const COLON = [{ r: 3, c: 0, h: 2, w: 2, color: "#F2CD37" }, { r: 7, c: 0, h: 2, w: 2, color: "#F2CD37" }];
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class BrickClock {
  constructor(root) {
    this.root = root;
    root.classList.add("bc");
    root.innerHTML = "";
    const mk = cls => { const el = document.createElement("div"); el.className = cls; root.appendChild(el); return { el, live: new Map(), value: null }; };
    this.d = [mk("bc-digit"), mk("bc-digit")];
    this.colon = mk("bc-colon");
    this.d.push(mk("bc-digit"), mk("bc-digit"));
    this.apply(this.colon, COLON, false);
  }
  cell() { return this.d[0].el.offsetWidth / COLS || 14; }
  brick(b) {
    const el = document.createElement("div");
    el.className = "bc-brick";
    el.style.cssText = `--r:${b.r};--c:${b.c};--h:${b.h};--w:${b.w};--b:${b.color};z-index:${b.r + b.h}`;
    for (let i = 0; i < b.h * b.w; i++) el.appendChild(document.createElement("i"));
    return el;
  }
  apply(box, layout, animate) {
    const next = new Map(layout.map(b => [`${b.r},${b.c},${b.h},${b.w},${b.color}`, b]));
    for (const [k, it] of box.live) if (!next.has(k)) { box.live.delete(k); this.out(it.el, it.b, animate); }
    for (const [k, b] of next) {
      if (box.live.has(k)) continue;
      const el = this.brick(b); box.el.appendChild(el); box.live.set(k, { el, b });
      if (animate && !reduced) this.in(el, b);
    }
  }
  in(el, b) {
    const u = this.cell();
    el.animate([
      { transform: `translateY(${-u * 6}px)`, opacity: 0, easing: "cubic-bezier(.55,0,1,.45)" },
      { opacity: 1, offset: .3 },
      { transform: "translateY(0) scale(1.03,.9)", offset: .62, easing: "ease-out" },
      { transform: `translateY(${-u * .22}px) scale(.99,1.02)`, offset: .8, easing: "ease-in-out" },
      { transform: "translateY(0) scale(1,1)", opacity: 1, offset: 1 }
    ], { duration: 440, delay: 140 + (ROWS - (b.r + b.h)) * 22 + Math.random() * 35, fill: "backwards" });
  }
  out(el, b, animate) {
    el.getAnimations().forEach(a => a.cancel());
    if (!animate || reduced) { el.remove(); return; }
    const u = this.cell();
    const a = el.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: `translateY(${-u * 1.3}px) scale(.85)`, opacity: 0 }],
      { duration: 220, delay: b.r * 8 + Math.random() * 30, easing: "ease-in", fill: "forwards" });
    a.onfinish = () => el.remove(); a.oncancel = () => el.remove();
  }
  set(totalSec, animate = true) {
    const s = Math.max(0, Math.min(5999, Math.round(totalSec)));
    const m = Math.floor(s / 60), r = s % 60;
    [Math.floor(m / 10), m % 10, Math.floor(r / 10), r % 10].forEach((v, i) => {
      const box = this.d[i];
      if (box.value === v) return;
      box.value = v; this.apply(box, LAYOUT[v], animate);
    });
  }
  setColor(hex) { this.root.style.setProperty("--bc", hex); }
}
