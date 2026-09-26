// PDF del horario de partidos con el estilo del evento (sin librerías: se dibuja en canvas y se guarda como PDF).
const K = ["#D02820", "#E88810", "#F0C808", "#108840", "#1068B0"];
const W = 1240, H = 1754, ROWS_PER_PAGE = 11;
const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
function fit(c, text, maxW, size, weight = 600) {
  let s = size; c.font = `${weight} ${s}px Fredoka, "Segoe UI", Arial, sans-serif`;
  while (c.measureText(text).width > maxW && s > 14) { s -= 1; c.font = `${weight} ${s}px Fredoka, "Segoe UI", Arial, sans-serif`; }
  return s;
}
export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return iso;
  const t = d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

async function drawPage({ event, rows, page, pages, logos }) {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  c.fillStyle = "#F6F8FB"; c.fillRect(0, 0, W, H);
  // encabezado oscuro (los logos tienen letras blancas)
  const g = c.createLinearGradient(0, 0, W, 330);
  g.addColorStop(0, "#1B2A40"); g.addColorStop(1, "#0E1520");
  c.fillStyle = g; c.fillRect(0, 0, W, 330);
  [[90, 60, 180, "rgba(208,40,32,.35)"], [1150, 40, 200, "rgba(16,104,176,.35)"], [640, 330, 260, "rgba(240,200,8,.12)"]].forEach(([x, y, r, col]) => {
    const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = rg; c.fillRect(0, 0, W, 330);
  });
  if (logos.kashi) { const h = 150, w = logos.kashi.width * h / logos.kashi.height; c.drawImage(logos.kashi, 60, 40, w, h); }
  if (logos.tech) { const h = 52, w = logos.tech.width * h / logos.tech.height; c.drawImage(logos.tech, W - 60 - w, 70, w, h); }
  // título con letras de colores
  const title = "Horario de partidos";
  c.font = `700 64px Fredoka, "Segoe UI", Arial, sans-serif`;
  let x = 60, i = 0;
  for (const ch of title) { if (ch !== " ") c.fillStyle = K[i++ % 5]; c.fillText(ch, x, 262); x += c.measureText(ch).width; }
  c.fillStyle = "#C9D3DF"; c.font = `500 28px Fredoka, "Segoe UI", Arial, sans-serif`;
  const sub = ["Robot Game", event.name, formatDate(event.date)].filter(Boolean).join("  ·  ");
  c.fillText(sub, 62, 306);
  // franja de ladrillos
  for (let k = 0; k < 16; k++) {
    const bw = W / 16; c.fillStyle = K[k % 5]; c.fillRect(k * bw + 2, 330, bw - 4, 18);
    c.fillRect(k * bw + bw * .18, 324, bw * .2, 7); c.fillRect(k * bw + bw * .62, 324, bw * .2, 7);
  }
  // encabezados de columnas
  const colX = { n: 60, h: 160, a: 360, b: 800 };
  c.fillStyle = "#5A6675"; c.font = `600 22px Fredoka, "Segoe UI", Arial, sans-serif`;
  c.fillText("Partido", colX.n, 400); c.fillText("Hora", colX.h, 400); c.fillText("Mesa A", colX.a, 400); c.fillText("Mesa B", colX.b, 400);
  // filas
  const rowH = 108, top = 420;
  rows.forEach((r, idx) => {
    const y = top + idx * (rowH + 14), col = K[(r.n - 1) % 5];
    c.fillStyle = "#FFFFFF"; rr(c, 50, y, W - 100, rowH, 18); c.fill();
    c.strokeStyle = "rgba(20,30,50,.08)"; c.lineWidth = 2; rr(c, 50, y, W - 100, rowH, 18); c.stroke();
    c.fillStyle = col; rr(c, 50, y, 12, rowH, [18, 0, 0, 18]); c.fill();
    // número como ladrillo con studs
    c.fillStyle = col; rr(c, colX.n + 14, y + 30, 64, 52, 8); c.fill();
    c.fillRect(colX.n + 22, y + 22, 16, 10); c.fillRect(colX.n + 54, y + 22, 16, 10);
    c.fillStyle = col === K[2] ? "#3A2C00" : "#FFFFFF"; c.font = `700 30px Fredoka, "Segoe UI", Arial, sans-serif`;
    c.textAlign = "center"; c.fillText(String(r.n), colX.n + 46, y + 67); c.textAlign = "left";
    // hora
    c.fillStyle = "#1B2533"; c.font = `700 40px Fredoka, "Segoe UI", Arial, sans-serif`;
    c.fillText(r.time || "—", colX.h, y + 68);
    // mesas
    for (const [key, cx, tagCol] of [["A", colX.a, K[4]], ["B", colX.b, K[0]]]) {
      const m = r[key];
      if (!m) { c.fillStyle = "#9AA5B1"; c.font = `500 26px Fredoka, "Segoe UI", Arial, sans-serif`; c.fillText("—", cx, y + 64); continue; }
      c.fillStyle = tagCol; rr(c, cx, y + 20, 36, 30, 7); c.fill();
      c.fillStyle = "#fff"; c.font = `700 20px Fredoka, "Segoe UI", Arial, sans-serif`; c.textAlign = "center"; c.fillText(key, cx + 18, y + 42); c.textAlign = "left";
      fit(c, m.name, 370, 32, 700); c.fillStyle = "#1B2533"; c.fillText(m.name, cx + 48, y + 46);
      c.fillStyle = "#5A6675"; c.font = `500 22px Fredoka, "Segoe UI", Arial, sans-serif`; c.fillText(`Intento ${m.round}`, cx + 48, y + 82);
    }
  });
  // pie
  c.fillStyle = "#5A6675"; c.font = `500 20px Fredoka, "Segoe UI", Arial, sans-serif`;
  c.fillText(`FIRST LEGO League Challenge · MASTERPIECE${pages > 1 ? `  ·  Página ${page} de ${pages}` : ""}`, 60, H - 50);
  c.textAlign = "right"; c.fillText("Horarios sujetos a cambios el día del evento", W - 60, H - 50); c.textAlign = "left";
  return cv;
}

// PDF mínimo con una imagen JPEG por página (A4)
function pdfFromJpegs(imgs) {
  const enc = new TextEncoder(), chunks = []; let len = 0; const offs = [];
  const push = x => { const b = typeof x === "string" ? enc.encode(x) : x; chunks.push(b); len += b.length; };
  push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
  const PW = 595.28, PH = 841.89, n = imgs.length;
  const obj = (id, parts) => { offs[id] = len; push(`${id} 0 obj\n`); parts.forEach(push); push("\nendobj\n"); };
  obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  obj(2, [`<< /Type /Pages /Kids [${imgs.map((_, i) => `${3 + 3 * i} 0 R`).join(" ")}] /Count ${n} >>`]);
  imgs.forEach((im, i) => {
    const p = 3 + 3 * i, cs = p + 1, io = p + 2, content = `q ${PW} 0 0 ${PH} 0 0 cm /Im${i} Do Q`;
    obj(p, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im${i} ${io} 0 R >> >> /Contents ${cs} 0 R >>`]);
    obj(cs, [`<< /Length ${enc.encode(content).length} >>\nstream\n${content}\nendstream`]);
    obj(io, [`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`, im.bytes, "\nendstream"]);
  });
  const xref = len, total = 3 + 3 * n;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) x += String(offs[i]).padStart(10, "0") + " 00000 n \n";
  push(x + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: "application/pdf" });
}

// rows: [{ n, time, A: {name, round} | null, B: {...} | null }]
export async function buildSchedulePDF({ event, rows, kashiSrc, techSrc }) {
  try { await document.fonts.load('700 40px "Fredoka"'); } catch (e) {}
  const logos = { kashi: await loadImg(kashiSrc), tech: await loadImg(techSrc) };
  const pages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE)), imgs = [];
  for (let p = 0; p < pages; p++) {
    const cv = await drawPage({ event, rows: rows.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE), page: p + 1, pages, logos });
    const bin = atob(cv.toDataURL("image/jpeg", .92).split(",")[1]);
    const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    imgs.push({ bytes, w: W, h: H });
  }
  return pdfFromJpegs(imgs);
}
