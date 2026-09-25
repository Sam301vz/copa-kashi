// Corredores estilo "juego del dinosaurio": dos personajes 3D corren sobre placas LEGO,
// saltan pilas de ladrillos y cada cierto tiempo entra otra pareja. Animación continua.
import { createScene, CAST } from "./painter3d.js";

const PAIRS = [["pintor", "bailarina"], ["director", "musico"], ["sonido", "pintor"], ["bailarina", "director"], ["musico", "sonido"]];
const KASHI = [[208, 40, 32], [232, 136, 16], [240, 200, 8], [16, 136, 64], [16, 104, 176]];
const rgb = (c, k = 1) => `rgb(${c.map(v => Math.max(0, Math.min(255, Math.round(v * k)))).join(",")})`;
const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const UNITS_H = 14, CAM_Y = 6.4, SPEED = 13, CYCLE = 13, JUMP_T = .62, JUMP_H = 3.4;

export function createRunners(canvas) {
  const sc = createScene(canvas, { pos: [0, CAM_Y, 80], target: [0, CAM_Y, 0], ppu: (W, H) => H / UNITS_H });
  const ctx = canvas.getContext("2d");
  let raf = 0, on = false, last = 0, t = 0, obstacles = [], nextSpawn = 1.2;
  const jumps = [{ t: -9 }, { t: -9 }];
  let pairIdx = 0, pairStart = 0;

  const halfW = () => canvas.width / 2 / (canvas.height / UNITS_H);
  function runPose(ph, y, jumping) {
    const s = Math.sin(ph), c = Math.cos(ph);
    if (jumping) return { yaw: Math.PI / 2, y, pitch: .08, lean: 0, squash: 0, brush: { x: -1.1, z: .5 }, pal: { x: -1.1, z: .5 }, legL: -.9, legR: .5, headX: -.1, headY: 0 };
    return { yaw: Math.PI / 2, y: y + Math.abs(c) * .28, pitch: .14, lean: 0, squash: 0,
      brush: { x: s * .95, z: .18 }, pal: { x: -s * .95, z: .18 }, legL: s * .85, legR: -s * .85, headX: .05 * c, headY: 0 };
  }
  function ground(hw) {
    const ppu = canvas.height / UNITS_H, gy = sc.project([0, 0, 0])[1], plateH = .6 * ppu, bw = 4 * ppu;
    const shift = (t * SPEED * ppu) % (bw * 5);
    for (let x = -shift - bw; x < canvas.width + bw; x += bw) {
      const i = Math.round((x + shift) / bw), col = KASHI[((i % 5) + 5) % 5];
      ctx.fillStyle = rgb(col); ctx.fillRect(x + 1, gy, bw - 2, plateH);
      ctx.fillStyle = rgb(col, 1.18); ctx.fillRect(x + 1, gy, bw - 2, plateH * .22);
      ctx.fillStyle = rgb(col, .72); ctx.fillRect(x + 1, gy + plateH * .78, bw - 2, plateH * .22);
      for (let k = 0; k < 4; k++) {           // studs vistos de lado
        ctx.fillStyle = rgb(col, 1.08);
        const sx = x + (k + .5) * ppu - ppu * .3;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx, gy - ppu * .2, ppu * .6, ppu * .22, [3, 3, 0, 0]) : ctx.rect(sx, gy - ppu * .2, ppu * .6, ppu * .22); ctx.fill();
      }
    }
  }
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; t += dt;
    const hw = halfW();
    // obstáculos: pilas de 1 o 2 ladrillos que vienen desde la derecha
    if (t >= nextSpawn) {
      obstacles.push({ x: hw + 4, h: Math.random() < .35 ? 2 : 1, c: KASHI[Math.floor(Math.random() * 5)], c2: KASHI[Math.floor(Math.random() * 5)] });
      nextSpawn = t + 1.5 + Math.random() * 1.6;
    }
    obstacles.forEach(o => { o.x -= SPEED * dt; });
    obstacles = obstacles.filter(o => o.x > -hw - 6);
    // pareja actual: entra por la izquierda, corre y sale disparada a la derecha
    let c = t - pairStart;
    if (c >= CYCLE) { pairStart = t; pairIdx = (pairIdx + 1) % PAIRS.length; c = 0; }
    const lead = -hw * .42, gap = 6.5;
    const enter = (1 - ease(c / 1.5)) * -(hw + 10 - lead + gap);
    const exit = ease((c - (CYCLE - 1.6)) / 1.6) * (2 * hw + 24);
    const xs = [lead + enter + exit, lead - gap + enter + exit * .92];

    sc.begin();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ground(hw);
    for (const o of obstacles) {
      sc.brick(2, 2, 1.2, o.c, [o.x, 0, 0]);
      if (o.h === 2) sc.brick(2, 2, 1.2, o.c2, [o.x, 1.2, 0]);
    }
    PAIRS[pairIdx].forEach((name, i) => {
      const x = xs[i], j = jumps[i];
      const jumping = t - j.t < JUMP_T;
      if (!jumping && obstacles.some(o => o.x - x > 1.3 && o.x - x < 4.3)) j.t = t;
      const u = (t - j.t) / JUMP_T, y = u < 1 ? 4 * JUMP_H * u * (1 - u) : 0;
      sc.figure(CAST[name], runPose(t * 11 + i * 1.7, y, u < 1), [x, 0, 0]);
    });
    sc.draw({ clear: false, shadowSize: 120 });
    if (on) raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (on) return; on = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { on = false; cancelAnimationFrame(raf); },
    get running() { return on; }
  };
}
