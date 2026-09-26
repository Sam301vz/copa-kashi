// Sonidos generados en el navegador (sin archivos).
// Todos los efectos pasan por la misma cadena: efecto → ganancia calibrada → limitador → salida.
// Las ganancias de LEVELS se midieron con sonoridad ponderada (BS.1770, ventanas de 400 ms) para que
// todos los avisos principales suenen igual de fuerte; así el operador de sonido no tiene que corregir nada.
let ctx = null, limiter = null, masterGain = null, masterVol = 1;

// dB por efecto, medidos para que 3-2-1, ¡LEGO!, últimos 30 s, fin de tiempo y fanfarria del resultado
// queden a la misma sonoridad (±0,1 dB). splat y blip son efectos de relleno que se repiten muy seguidos:
// medidos en su secuencia real, van 4 dB por debajo a propósito.
export const LEVELS = { count: -4.8, start: -9.2, endgame: -5.5, end: -4.8, fanfare: -4.8, pop: -2.3, test: -5.0, blip: -1.5, splat: 0.1 };

// Definición de cada efecto. T(freq, inicio, duración, forma, volumen, deslizarA)
const FX = {
  count: T => { T(880, 0, .24, "square", .5); T(440, 0, .24, "triangle", .6); },
  start: T => {                                   // "¡LEGO!": arpegio brillante y nota larga
    T(1047, 0, .1, "square", .4); T(1319, .08, .1, "square", .4);
    T(1568, .16, .7, "square", .42); T(784, .16, .7, "triangle", .6); T(523, .16, .7, "triangle", .45);
  },
  endgame: T => { [0, .24, .48].forEach((st, i) => { T(i === 1 ? 988 : 784, st, .22, "square", .4); T(i === 1 ? 494 : 392, st, .22, "triangle", .5); }); },
  end: T => { T(220, 0, 1.3, "sawtooth", .5, 180); T(233, 0, 1.3, "square", .3, 190); },
  test: T => { T(880, 0, .25, "square", .5); T(440, 0, .25, "triangle", .6); },
  splat: T => { T(420 + Math.random() * 200, 0, .09, "triangle", .5, 180); },
  blip: T => { T(1200, 0, .04, "square", .3); },
  pop: T => { T(523, 0, .12, "square", .4); T(784, .1, .22, "square", .4); },
  fanfare: T => {
    [[523, 0, .16], [659, .16, .16], [784, .32, .16], [1047, .48, .5], [784, .98, .14], [1047, 1.12, .8]]
      .forEach(([f, st, d]) => { T(f, st, d, "square", .3); T(f / 2, st, d, "triangle", .4); });
  }
};

function toneOn(c, dest, t0) {
  return (freq, start, dur, type = "square", vol = .35, slideTo) => {
    const t = t0 + start;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .01);
    g.gain.setValueAtTime(vol, t + dur * .7);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + .02);
  };
}
// Reproduce un efecto en cualquier contexto de audio (también se usa para medirlos sin conexión)
export function playFx(c, dest, name, t0 = c.currentTime + .01) {
  const bus = c.createGain();
  bus.gain.value = Math.pow(10, (LEVELS[name] || 0) / 20);
  bus.connect(dest);
  FX[name](toneOn(c, bus, t0));
}

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    limiter = ctx.createDynamicsCompressor();       // evita saturación cuando se juntan varios efectos
    limiter.threshold.value = -1; limiter.knee.value = 0; limiter.ratio.value = 20;
    limiter.attack.value = .002; limiter.release.value = .1;
    masterGain = ctx.createGain(); masterGain.gain.value = .55 * masterVol;
    limiter.connect(masterGain).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return true;
}
export function setVolume(v) { masterVol = Math.max(0, Math.min(2, Number(v) || 1)); if (masterGain) masterGain.gain.value = .55 * masterVol; }
export const audioReady = () => !!ctx && ctx.state === "running";
// Deja el audio activo: intenta arrancar solo (OBS lo permite) y se desbloquea con el primer toque o tecla
export function autoUnlock() {
  unlockAudio();
  const kick = () => unlockAudio();
  ["pointerdown", "keydown", "touchstart", "click"].forEach(ev => addEventListener(ev, kick, { passive: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) unlockAudio(); });
  setInterval(() => { if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {}); }, 4000);
}
function fx(name) {
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  playFx(ctx, limiter, name);
}
// Voz del navegador: desactivada por defecto. No pasa por el audio de OBS y su volumen no se puede
// igualar con el resto, por eso solo se activa con hud.html?voz=1
let useVoice = false;
export function setVoice(v) { useVoice = !!v; }
function say(text) {
  if (!useVoice || !("speechSynthesis" in window)) return;
  try { const u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 1.05; u.volume = 1; speechSynthesis.speak(u); } catch (e) {}
}
export const sounds = {
  count(n) { fx("count"); say(String(n)); },
  start() { fx("start"); say("LEGO!"); },
  endgame() { fx("endgame"); },
  end() { fx("end"); },
  test() { fx("test"); },
  splat() { fx("splat"); },
  blip() { fx("blip"); },
  pop() { fx("pop"); },
  fanfare() { fx("fanfare"); }
};
