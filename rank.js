// Clasificación: mejor puntaje de los intentos; desempate con el 2.º, 3.º y 4.º mejor.
export const ROUNDS = 4;
export const KASHI = ["#D02820", "#E88810", "#F0C808", "#108840", "#1068B0"];
export const ROUND_LIST = Array.from({ length: ROUNDS }, (_, i) => i + 1);

export function teamList(event) {
  const t = (event && event.teams) || {};
  const order = id => Number(String(id).replace(/\D/g, "")) || 0;
  return Object.entries(t).map(([id, v]) => ({ id, name: v.name || "" })).sort((a, b) => order(a.id) - order(b.id));
}
export function rankTeams(teams, results) {
  const rows = teams.map(t => {
    const r = (results && results[t.id]) || {};
    const scores = ROUND_LIST.map(n => (r["r" + n] && Number.isFinite(r["r" + n].score)) ? r["r" + n].score : null);
    const sorted = scores.filter(s => s !== null).sort((a, b) => b - a);
    const tb = [1, 2, 3].map(i => sorted[i] ?? -1);
    return { ...t, scores, best: sorted.length ? sorted[0] : null, tb, played: sorted.length };
  });
  rows.sort((a, b) => ((b.best ?? -1) - (a.best ?? -1)) || (b.tb[0] - a.tb[0]) || (b.tb[1] - a.tb[1]) || (b.tb[2] - a.tb[2]) || a.name.localeCompare(b.name));
  let rank = 0, prev = null;
  rows.forEach((row, i) => {
    const key = `${row.best}|${row.tb.join("|")}`;
    if (row.best === null) row.rank = null;
    else { if (key !== prev) rank = i + 1; row.rank = rank; prev = key; }
  });
  return rows;
}
export function toCSV(rows) {
  const e = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Posición", "Equipo", ...ROUND_LIST.map(n => `Intento ${n}`), "Puntaje máximo"];
  const lines = [head.map(e).join(",")];
  for (const r of rows) lines.push([r.rank ?? "", r.name, ...r.scores.map(s => s ?? ""), r.best ?? ""].map(e).join(","));
  return "\uFEFF" + lines.join("\r\n");
}
// Texto con letras en los colores de la Copa Kashi
export function kashiText(text) {
  let i = 0;
  return [...text].map(ch => ch === " " ? " " : `<span style="color:${KASHI[i++ % 5]}">${esc(ch)}</span>`).join("");
}
export function renderLeaderboard(el, rows, { compact = false } = {}) {
  const cell = s => s === null ? `<span class="lb-empty">—</span>` : s;
  el.innerHTML = `
    <table class="lb lb-kids ${compact ? "lb-compact" : ""}">
      <thead><tr><th>Puesto</th><th>Equipo</th>${ROUND_LIST.map(n => `<th class="lb-rh">Intento ${n}</th>`).join("")}<th class="lb-best-h">Máximo</th></tr></thead>
      <tbody>${rows.map((r, i) => `
        <tr class="k${i % 5} ${r.rank === 1 ? "lb-first" : ""}">
          <td class="lb-rank"><span class="rk">${r.rank ?? "–"}</span></td>
          <td class="lb-team"><span class="lb-name">${r.rank === 1 ? "🏆 " : ""}${esc(r.name)}</span>
            <span class="lb-mini">${r.scores.map((s, j) => `<i>I${j + 1} <b>${s ?? "—"}</b></i>`).join("")}</span></td>
          ${r.scores.map(s => `<td class="lb-s ${s !== null && s === r.best ? "lb-top" : ""}">${cell(s)}</td>`).join("")}
          <td class="lb-best"><span class="bestb">${cell(r.best)}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
