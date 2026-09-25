export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let toastT = 0;
export function toast(msg) {
  let el = $("#toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2600);
}
export function modeBadge(store) {
  return store.mode === "firebase"
    ? `<span class="badge live">En línea · Firebase</span>`
    : `<span class="badge local" title="Sin configuración de Firebase: solo sincroniza en este navegador">Modo local</span>`;
}
// Pide inicio de sesión (solo en modo Firebase). Llama onReady(user) una vez autenticado.
export function requireLogin(store, onReady) {
  let started = false;
  const gate = document.createElement("div");
  gate.className = "modal";
  gate.innerHTML = `<div class="card" style="max-width:420px">
      <h2>Acceso del staff</h2>
      <form class="grid" id="loginForm">
        <label class="f">Correo<input type="email" id="lgEmail" autocomplete="username" required></label>
        <label class="f">Contraseña<input type="password" id="lgPass" autocomplete="current-password" required></label>
        <button class="btn primary" type="submit">Entrar</button>
        <p class="muted" id="lgErr" style="margin:0;min-height:1.2em"></p>
      </form></div>`;
  document.body.appendChild(gate);
  $("#loginForm", gate).addEventListener("submit", async e => {
    e.preventDefault();
    $("#lgErr", gate).textContent = "Entrando…";
    try { await store.login($("#lgEmail", gate).value.trim(), $("#lgPass", gate).value); $("#lgErr", gate).textContent = ""; }
    catch (err) { $("#lgErr", gate).textContent = "No se pudo entrar: revisa el correo y la contraseña."; }
  });
  store.onAuth(user => {
    gate.classList.toggle("open", !user);
    if (user && !started) { started = true; setTimeout(() => onReady(user), 0); }   // espera a que la página termine de cargar
  });
}
export function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const baseURL = () => location.href.replace(/[^/]*([?#].*)?$/, "");

// Confirmación dentro de la página (los confirm()/prompt() del navegador pueden estar bloqueados en iframes y OBS)
export function askConfirm({ title = "¿Seguro?", text = "", ok = "Confirmar", danger = false, typeWord = "" } = {}) {
  return new Promise(resolve => {
    let m = $("#askModal");
    if (!m) {
      m = document.createElement("div"); m.id = "askModal"; m.className = "modal";
      m.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="askT" style="max-width:460px">
        <h2 id="askT" style="font-size:20px;color:var(--ink)"></h2><p id="askX" style="font-size:17px;margin:0 0 14px"></p>
        <input type="text" id="askIn" hidden autocomplete="off" style="width:100%;margin-bottom:14px">
        <div class="row"><button class="btn" id="askOk"></button><button class="btn" id="askNo">Cancelar</button></div></div>`;
      document.body.appendChild(m);
    }
    const okB = $("#askOk", m), noB = $("#askNo", m), inp = $("#askIn", m);
    $("#askT", m).textContent = title; $("#askX", m).innerHTML = text;
    inp.hidden = !typeWord; inp.value = ""; inp.placeholder = typeWord ? `Escribe ${typeWord}` : ""; inp.style.borderColor = "";
    okB.textContent = ok; okB.className = "btn " + (danger ? "primary" : "go");
    const done = v => { m.classList.remove("open"); okB.onclick = noB.onclick = inp.onkeydown = null; resolve(v); };
    okB.onclick = () => {
      if (typeWord && inp.value.trim().toUpperCase() !== typeWord) { inp.style.borderColor = "#FF7B6E"; inp.focus(); return; }
      done(true);
    };
    noB.onclick = () => done(false);
    inp.onkeydown = e => { if (e.key === "Enter") okB.onclick(); };
    m.classList.add("open"); (typeWord ? inp : okB).focus();
  });
}
