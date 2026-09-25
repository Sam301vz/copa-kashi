// Capa de datos: Firebase Realtime Database si hay configuración; si no, modo local (localStorage + BroadcastChannel).
import { FIREBASE_CONFIG } from "./config.js";
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const clone = v => (v === undefined || v === null) ? null : JSON.parse(JSON.stringify(v));
const parts = p => (p || "").split("/").filter(Boolean);
function getAt(o, p) { for (const k of parts(p)) { if (o == null) return null; o = o[k]; } return o === undefined ? null : o; }
function setAt(o, p, v) {
  const ks = parts(p); if (!ks.length) return;
  let cur = o;
  for (let i = 0; i < ks.length - 1; i++) {
    if (typeof cur[ks[i]] !== "object" || cur[ks[i]] === null) cur[ks[i]] = {};
    cur = cur[ks[i]];
  }
  if (v === null || v === undefined) delete cur[ks[ks.length - 1]]; else cur[ks[ks.length - 1]] = v;
}

function localImpl() {
  const KEY = "fll-scorekeeper-db";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  let tree = read();
  const subs = new Set();
  const bc = "BroadcastChannel" in window ? new BroadcastChannel(KEY) : null;
  // como Firebase: solo avisa a quien cambió su dato
  const emit = () => subs.forEach(s => {
    const v = getAt(tree, s.path), j = JSON.stringify(v ?? null);
    if (j !== s.last) { s.last = j; s.cb(clone(v)); }
  });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(tree)); } catch (e) {} if (bc) bc.postMessage(1); emit(); };
  if (bc) bc.onmessage = () => { tree = read(); emit(); };
  window.addEventListener("storage", e => { if (e.key === KEY) { tree = read(); emit(); } });
  return {
    mode: "local", now: () => Date.now(),
    subscribe(path, cb) {
      const v = getAt(tree, path), s = { path, cb, last: JSON.stringify(v ?? null) };
      subs.add(s); cb(clone(v)); return () => subs.delete(s);
    },
    async get(path) { return clone(getAt(tree, path)); },
    async set(path, val) { setAt(tree, path, clone(val)); save(); },
    async update(path, obj) { for (const [k, v] of Object.entries(obj)) setAt(tree, path ? `${path}/${k}` : k, clone(v)); save(); },
    async remove(path) { setAt(tree, path, null); save(); },
    onAuth(cb) { cb({ email: "modo local" }); return () => {}; },
    async login() {}, async logout() {}
  };
}

async function firebaseImpl() {
  const { initializeApp } = await import(FB + "firebase-app.js");
  const D = await import(FB + "firebase-database.js");
  const A = await import(FB + "firebase-auth.js");
  const app = initializeApp(FIREBASE_CONFIG);
  const db = D.getDatabase(app), auth = A.getAuth(app);
  let offset = 0;
  D.onValue(D.ref(db, ".info/serverTimeOffset"), s => { offset = s.val() || 0; });
  return {
    mode: "firebase", now: () => Date.now() + offset,
    subscribe(path, cb) { return D.onValue(D.ref(db, path || "/"), s => cb(s.val())); },
    async get(path) { return (await D.get(D.ref(db, path || "/"))).val(); },
    set(path, val) { return D.set(D.ref(db, path), clone(val)); },
    update(path, obj) { return D.update(D.ref(db, path || "/"), clone(obj)); },
    remove(path) { return D.remove(D.ref(db, path)); },
    onAuth(cb) { return A.onAuthStateChanged(auth, cb); },
    login(email, pass) { return A.signInWithEmailAndPassword(auth, email, pass); },
    logout() { return A.signOut(auth); }
  };
}

let store = null;
export async function openStore() {
  if (store) return store;
  store = (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL) ? await firebaseImpl() : localImpl();
  return store;
}
