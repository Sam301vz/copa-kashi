// Estado del temporizador compartido en /live/timer
// { status: "ready"|"running"|"paused"|"ended", startAt, endAt, remaining, duration }
export const COUNTDOWN_MS = 3000;
export function readyTimer(durationMs) { return { status: "ready", startAt: 0, endAt: 0, remaining: durationMs, duration: durationMs }; }
// Devuelve la fase que debe mostrar cualquier pantalla en el instante "now" (hora del servidor)
export function phase(t, now, endgameMs) {
  if (!t) return { kind: "ready", remaining: 150000, count: 0 };
  const d = t.duration || 150000;
  if (t.status === "ready") return { kind: "ready", remaining: d };
  if (t.status === "paused") return { kind: "paused", remaining: t.remaining };
  if (t.status === "ended") return { kind: "ended", remaining: 0 };
  if (now < t.startAt) return { kind: "countdown", remaining: t.endAt - t.startAt, count: Math.ceil((t.startAt - now) / 1000) };
  const rem = Math.max(0, t.endAt - now);
  if (rem <= 0) return { kind: "ended", remaining: 0 };
  return { kind: rem <= endgameMs ? "endgame" : "running", remaining: rem };
}
export const secsOf = ms => Math.ceil(Math.max(0, ms) / 1000);
export const fmt = ms => { const s = secsOf(ms); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
