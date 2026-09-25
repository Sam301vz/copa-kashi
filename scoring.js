// Puntuación genérica a partir de missions.json
export async function loadMissions() {
  const r = await fetch("missions.json", { cache: "no-store" });
  if (!r.ok) throw new Error("No se pudo cargar missions.json");
  return r.json();
}
const items = M => M.missions.flatMap(m => m.items);
export function defaultAnswers(M) {
  const a = {};
  for (const it of items(M)) a[it.id] = it.type === "bool" ? false : it.type === "count" ? (it.min || 0) : it.options[0].value;
  a.tokens = M.precisionTokens.start;
  return a;
}
const truthy = v => !!v && v !== "none";
export const itemEnabled = (it, a) => !it.requires || truthy(a[it.requires]);
export function countMax(it, a) { let mx = it.max; if (it.maxFrom) mx = Math.min(mx, Number(a[it.maxFrom]) || 0); return mx; }
// Corrige respuestas imposibles (bonus sin requisito, destinos > miembros, etc.)
export function sanitize(M, a) {
  const out = { ...defaultAnswers(M), ...(a || {}) };
  for (const it of items(M)) {
    if (!itemEnabled(it, out)) out[it.id] = it.type === "bool" ? false : it.type === "count" ? (it.min || 0) : it.options[0].value;
    if (it.type === "count") out[it.id] = Math.max(it.min || 0, Math.min(countMax(it, out), Number(out[it.id]) || 0));
    if (it.type === "choice" && !it.options.some(o => o.value === out[it.id])) out[it.id] = it.options[0].value;
    if (it.type === "bool") out[it.id] = !!out[it.id];
  }
  const t = Number(out.tokens);
  out.tokens = Number.isFinite(t) ? Math.max(0, Math.min(M.precisionTokens.start, Math.round(t))) : M.precisionTokens.start;
  return out;
}
export function itemPoints(it, a) {
  if (!itemEnabled(it, a)) return 0;
  const v = a[it.id];
  if (it.type === "bool") return v ? (it.pointsBy ? (it.pointsBy.map[a[it.pointsBy.item]] || 0) : it.points) : 0;
  if (it.type === "choice") return (it.options.find(o => o.value === v) || { points: 0 }).points;
  if (it.type === "count") return (Number(v) || 0) * it.pointsEach;
  return 0;
}
export const tokenPoints = (M, n) => M.precisionTokens.points[String(n)] || 0;
export function computeScore(M, answers) {
  const a = sanitize(M, answers);
  const perMission = {};
  let total = 0;
  for (const m of M.missions) {
    const s = m.items.reduce((acc, it) => acc + itemPoints(it, a), 0);
    perMission[m.id] = s; total += s;
  }
  const tk = tokenPoints(M, a.tokens);
  total += tk;
  return { total, perMission, tokenPts: tk, answers: a };
}
