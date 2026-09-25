// Lluvia de ladrillos LEGO en canvas: caída continua + ráfagas desde abajo
const COLORS = ["#D02820", "#E88810", "#F0C808", "#108840", "#1068B0", "#F4F4F4", "#D3359D"];
function mix(hex, to, a) {
  const n = parseInt(hex.slice(1), 16), t = to === "w" ? 255 : 0;
  const f = v => Math.round(v + (t - v) * a);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function rr(cx, x, y, w, h, r) { cx.beginPath(); if (cx.roundRect) cx.roundRect(x, y, w, h, r); else cx.rect(x, y, w, h); }

export function brickConfetti(canvas, { count = 80 } = {}) {
  const cx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  let pieces = [], raf = 0, last = 0, on = false;
  const make = (burst, fromX) => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const u = 13 + Math.random() * 17;
    const p = {
      x: burst ? fromX + (Math.random() - .5) * 120 : Math.random() * W,
      y: burst ? H + 30 : -40 - Math.random() * H,
      vx: burst ? (Math.random() - .5) * 700 : (Math.random() - .5) * 40,
      vy: burst ? -(900 + Math.random() * 650) : 90 + Math.random() * 120,
      rot: Math.random() * 6.28, vr: (Math.random() - .5) * 5,
      tum: Math.random() * 6.28, vt: (Math.random() - .5) * 7,
      sway: Math.random() * 6.28, u, studs: 1 + Math.floor(Math.random() * 3), plate: Math.random() < .35, burst,
      color, light: mix(color, "w", .38), dark: mix(color, "b", .32), edge: mix(color, "b", .5)
    };
    return p;
  };
  function draw(p) {
    const face = Math.max(.42, Math.abs(Math.cos(p.tum)));
    const u = p.u, w = p.studs * u, h = (p.plate ? .5 : 1.12) * u;
    const topH = Math.max(u * .17, u * .42 * (1 - .55 * face)), r = Math.max(1.5, u * .13);
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.scale(1, face);
    const g = cx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, p.light); g.addColorStop(.42, p.color); g.addColorStop(1, p.dark);
    cx.fillStyle = g; rr(cx, -w / 2, -h / 2, w, h, r); cx.fill();
    cx.fillStyle = "rgba(255,255,255,.3)"; rr(cx, -w / 2 + u * .07, -h / 2 + u * .05, u * .26, h * .8, r * .7); cx.fill();
    cx.fillStyle = "rgba(0,0,0,.2)"; rr(cx, -w / 2, h / 2 - h * .22, w, h * .22, r); cx.fill();
    cx.fillStyle = p.light; rr(cx, -w / 2, -h / 2 - topH, w, topH + r, r); cx.fill();
    for (let i = 0; i < p.studs; i++) {
      const sx = -w / 2 + i * u + u / 2, sy = -h / 2 - topH, rx = u * .3, ry = Math.max(1.6, topH * .62);
      cx.beginPath(); cx.ellipse(sx, sy + ry * .5, rx, ry, 0, 0, 6.283); cx.fillStyle = p.dark; cx.fill();
      cx.beginPath(); cx.ellipse(sx, sy, rx, ry, 0, 0, 6.283); cx.fillStyle = p.color; cx.fill();
      cx.beginPath(); cx.ellipse(sx - rx * .28, sy - ry * .3, rx * .42, ry * .42, 0, 0, 6.283); cx.fillStyle = "rgba(255,255,255,.55)"; cx.fill();
    }
    cx.strokeStyle = p.edge; cx.lineWidth = Math.max(.7, u * .05); rr(cx, -w / 2, -h / 2, w, h, r); cx.stroke();
    cx.restore();
  }
  function frame(t) {
    const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
    cx.clearRect(0, 0, W, H);
    pieces = pieces.filter(p => {
      if (p.burst) { p.vy += 1300 * dt; p.vx *= .995; }
      else { p.sway += dt * 1.6; p.x += Math.sin(p.sway) * 22 * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.tum += p.vt * dt;
      if (p.y > H + 60) {
        if (p.burst) return false;
        p.y = -40; p.x = Math.random() * W;
      }
      draw(p); return true;
    });
    if (on) raf = requestAnimationFrame(frame);
  }
  return {
    start() {
      if (on) return; on = true;
      if (!pieces.some(p => !p.burst)) pieces = Array.from({ length: count }, () => make(false));
      last = performance.now(); raf = requestAnimationFrame(frame);
    },
    stop() { on = false; cancelAnimationFrame(raf); cx.clearRect(0, 0, W, H); },
    burst(n = 140) { for (let i = 0; i < n; i++) pieces.push(make(true, [W * .2, W * .5, W * .8][i % 3])); }
  };
}
