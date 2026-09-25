// Sonidos generados en el navegador (sin archivos). Voz opcional con speechSynthesis.
let ctx = null, master = null;
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .8; master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return true;
}
export const audioReady = () => !!ctx && ctx.state === "running";
// Deja el audio activo: intenta arrancar solo (OBS lo permite) y se desbloquea con el primer toque o tecla
export function autoUnlock() {
  unlockAudio();
  const kick = () => unlockAudio();
  ["pointerdown", "keydown", "touchstart", "click"].forEach(ev => addEventListener(ev, kick, { passive: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) unlockAudio(); });
  setInterval(() => { if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {}); }, 4000);
}
function tone(freq, start, dur, type = "square", vol = .35, slideTo) {
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .01);
  g.gain.setValueAtTime(vol, t + dur * .7);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02);
}
let useVoice = true;
export function setVoice(v) { useVoice = v; }
function say(text) {
  if (!useVoice || !("speechSynthesis" in window)) return;
  try { const u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 1.05; u.volume = 1; speechSynthesis.speak(u); } catch (e) {}
}
export const sounds = {
  count(n) { tone(880, 0, .18, "square", .28); say(String(n)); },
  start() { tone(660, 0, .14, "square", .3); tone(990, .12, .14, "square", .3); tone(1320, .24, .5, "sawtooth", .32); say("LEGO!"); },
  endgame() { tone(784, 0, .22, "triangle", .45); tone(988, .24, .22, "triangle", .45); tone(784, .48, .22, "triangle", .45); },
  end() { tone(220, 0, 1.4, "sawtooth", .4, 180); tone(233, 0, 1.4, "square", .18, 190); },
  test() { tone(880, 0, .2, "triangle", .35); },
  splat() { tone(420 + Math.random() * 200, 0, .09, "triangle", .25, 180); },
  blip() { tone(1200, 0, .04, "square", .12); },
  pop() { tone(523, 0, .12, "triangle", .4); tone(784, .1, .22, "triangle", .4); },
  fanfare() {
    [[523, 0, .16], [659, .16, .16], [784, .32, .16], [1047, .48, .5], [784, .98, .14], [1047, 1.12, .8]]
      .forEach(([f, st, d]) => { tone(f, st, d, "square", .22); tone(f / 2, st, d, "triangle", .3); });
  }
};
