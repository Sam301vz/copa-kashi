// Clasificación oficial FLL: mejor puntaje; desempate con el 2.º y luego el 3.º mejor.
export function teamList(event) {
  const t = (event && event.teams) || {};
  return Object.entries(t).map(([id, v]) => ({ id, number: String(v.number ?? ""), name: v.name || "" }))
    .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0) || a.name.localeCompare(b.name));
}
export function rankTeams(teams, results) {
  const rows = teams.map(t => {
    const r = (results && results[t.id]) || {};
    const scores = [1, 2, 3].map(n => (r["r" + n] && Number.isFinite(r["r" + n].score)) ? r["r" + n].score : null);
    const sorted = scores.filter(s => s !== null).sort((a, b) => b - a);
    return { ...t, scores, best: sorted.length ? sorted[0] : null, s2: sorted[1] ?? -1, s3: sorted[2] ?? -1, played: sorted.length };
  });
  rows.sort((a, b) => ((b.best ?? -1) - (a.best ?? -1)) || (b.s2 - a.s2) || (b.s3 - a.s3) ||
    ((Number(a.number) || 0) - (Number(b.number) || 0)));
  let rank = 0, prev = null;
  rows.forEach((row, i) => {
    const key = `${row.best}|${row.s2}|${row.s3}`;
    if (row.best === null) row.rank = null;
    else { if (key !== prev) rank = i + 1; row.rank = rank; prev = key; }
  });
  return rows;
}
export function toCSV(rows) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Posición", "Número", "Equipo", "Intento 1", "Intento 2", "Intento 3", "Puntaje máximo"];
  const lines = [head.map(esc).join(",")];
  for (const r of rows) lines.push([r.rank ?? "", r.number, r.name, ...r.scores.map(s => s ?? ""), r.best ?? ""].map(esc).join(","));
  return "\uFEFF" + lines.join("\r\n");
}
export const KASHI = ["#D02820", "#E88810", "#F0C808", "#108840", "#1068B0"];
// Texto con letras en los colores de la Copa Kashi
export function kashiText(text) {
  let i = 0;
  return [...text].map(ch => ch === " " ? " " : `<span style="color:${KASHI[i++ % 5]}">${esc(ch)}</span>`).join("");
}
export function renderLeaderboard(el, rows, { compact = false } = {}) {
  const cell = s => s === null ? `<span class="lb-empty">—</span>` : s;
  el.innerHTML = `
    <table class="lb lb-kids ${compact ? "lb-compact" : ""}">
      <thead><tr><th>Puesto</th><th>Equipo</th><th>Intento 1</th><th>Intento 2</th><th>Intento 3</th><th class="lb-best-h">Máximo</th></tr></thead>
      <tbody>${rows.map((r, i) => `
        <tr class="k${i % 5} ${r.rank === 1 ? "lb-first" : ""}">
          <td class="lb-rank"><span class="rk">${r.rank ?? "–"}</span></td>
          <td class="lb-team"><span class="lb-num">${esc(r.number)}</span><span class="lb-name">${r.rank === 1 ? "🏆 " : ""}${esc(r.name)}</span></td>
          ${r.scores.map(s => `<td class="lb-s ${s !== null && s === r.best ? "lb-top" : ""}">${cell(s)}</td>`).join("")}
          <td class="lb-best"><span class="bestb">${cell(r.best)}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
