// Společný základ: grafika (toon styl, obrysy, nebe, částice), uložení postupu, zvuk a kamera.
import * as THREE from 'three';
import { t } from './i18n.js';
export { THREE };

export const nahoda = (a, b) => a + Math.random() * (b - a);
export const vyber = arr => arr[Math.floor(Math.random() * arr.length)];
export const omez = (x, a, b) => Math.max(a, Math.min(b, x));
export const $ = id => document.getElementById(id);

// ================= RENDERER =================
export const renderer = new THREE.WebGLRenderer({ canvas: $('svet'), antialias: true });
// Kvalita obrazu po stupních. Telefon toho dělá najednou hodně (kamera + rozpoznávání postavy + kreslení hry,
// při zrcadlení na TV ještě posílá obraz do televize) — na videu z 22. 11. hra běžela jen ~10 snímků za sekundu,
// a protože herní čas má strop na jeden snímek, běžela i zpomaleně. Proto: telefon začíná rovnou na nižší
// kvalitě a když hra i tak seká, sníží se další stupeň. Dosažený stupeň si zařízení pamatuje pro příště.
// 0 = plná, 1 = ostrost 1×, 2 = bez stínů, 3 = obraz kreslený menší (0,75×) a roztažený, 4 = 0,6×
const telefon = matchMedia('(pointer:coarse)').matches;
const OSTROST = [Math.min(devicePixelRatio, 2), 1, 1, 0.75, 0.6];
export const kvalita = { stupen: telefon ? 1 : 0, max: OSTROST.length - 1 };
try { kvalita.stupen = Math.max(kvalita.stupen, Math.min(kvalita.max, +localStorage.getItem('moveit-kvalita') || 0)); } catch {}
renderer.setPixelRatio(OSTROST[kvalita.stupen]);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = kvalita.stupen < 2;
renderer.shadowMap.type = telefon ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
// Sníží kvalitu o stupeň. Vrátí true, když se vypnuly stíny (pak je potřeba přestavět materiály scén).
export function snizKvalitu() {
  if (kvalita.stupen >= kvalita.max) return false;
  kvalita.stupen++;
  try { localStorage.setItem('moveit-kvalita', kvalita.stupen); } catch {}
  renderer.setPixelRatio(OSTROST[kvalita.stupen]);
  renderer.setSize(innerWidth, innerHeight);
  const stiny = kvalita.stupen < 2;
  if (renderer.shadowMap.enabled === stiny) return false;
  renderer.shadowMap.enabled = stiny;
  return true;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
export function novaKamera(fov = 62) {
  const c = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.1, 3000);
  kamery.push(c); return c;
}
const kamery = [];
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  for (const c of kamery) { c.aspect = innerWidth / innerHeight; c.updateProjectionMatrix(); }
});

// ================= TOON STYL =================
// Tři odstíny světla místo plynulého přechodu = „kreslený“ vzhled jako v dětských hrách.
export const gradient = (() => {
  const d = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const cacheMat = new Map();
export function toon(barva, extra = {}) {
  const k = barva + JSON.stringify(extra);
  if (!cacheMat.has(k)) cacheMat.set(k, new THREE.MeshToonMaterial({ color: barva, gradientMap: gradient, ...extra }));
  return cacheMat.get(k);
}
export function svit(barva, sila = 0.8) {
  const k = 'svit' + barva + sila;
  if (!cacheMat.has(k)) cacheMat.set(k, new THREE.MeshToonMaterial({ color: barva, emissive: barva, emissiveIntensity: sila, gradientMap: gradient }));
  return cacheMat.get(k);
}
export function pruhledny(barva, opacity = 0.5) {
  const k = 'pr' + barva + opacity;
  if (!cacheMat.has(k)) cacheMat.set(k, new THREE.MeshToonMaterial({ color: barva, transparent: true, opacity, side: THREE.DoubleSide, gradientMap: gradient, depthWrite: false }));
  return cacheMat.get(k);
}
const obrysMat = new THREE.MeshBasicMaterial({ color: '#1b1430', side: THREE.BackSide });
// Tmavý obrys kolem postavičky (zvětšená kopie otočená naruby) — klasický trik z kreslených her.
export function obrys(skupina, tloustka = 1.07) {
  const meshe = [];
  skupina.traverse(m => { if (m.isMesh && !m.userData.bezObrysu && !m.material.transparent && m.geometry.type !== 'ShapeGeometry') meshe.push(m); });
  for (const m of meshe) {
    const o = new THREE.Mesh(m.geometry, obrysMat);
    o.scale.setScalar(tloustka); o.userData.bezObrysu = true; o.castShadow = false;
    m.add(o);
  }
  return skupina;
}
export function stin(o, prijima = false) {
  o.traverse(m => { if (m.isMesh && !m.userData.bezObrysu) { m.castShadow = true; if (prijima) m.receiveShadow = true; } });
  return o;
}

// ================= NEBE =================
export function vytvorNebe(scene) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { nahore: { value: new THREE.Color('#4aa8ff') }, dole: { value: new THREE.Color('#d9f1ff') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 nahore; uniform vec3 dole; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.15,0.0,1.0); gl_FragColor = vec4(mix(dole,nahore,h),1.0); }'
  });
  const nebe = new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 16), mat);
  nebe.renderOrder = -1;
  scene.add(nebe);
  return {
    mesh: nebe,
    nastav(nahore, dole) { mat.uniforms.nahore.value.set(nahore); mat.uniforms.dole.value.set(dole); },
    prechod(nahore, dole, k) { mat.uniforms.nahore.value.lerp(new THREE.Color(nahore), k); mat.uniforms.dole.value.lerp(new THREE.Color(dole), k); },
    dole: () => mat.uniforms.dole.value,
  };
}
export function svetla(scene) {
  const hemi = new THREE.HemisphereLight('#ffffff', '#6a8a5a', 1.25);
  const slunce = new THREE.DirectionalLight('#fff1d6', 1.9);
  slunce.castShadow = true;
  slunce.shadow.mapSize.set(1024, 1024);
  Object.assign(slunce.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 });
  slunce.shadow.bias = -0.0008;
  scene.add(hemi, slunce, slunce.target);
  return { hemi, slunce };
}

// ================= ČÁSTICE =================
export function castice(scene, max = 120, velikost = 0.12, gravitace = 6) {
  const geo = new THREE.OctahedronGeometry(velikost, 0);
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true }));
    m.visible = false; scene.add(m);
    pool.push({ m, v: new THREE.Vector3(), zivot: 0, delka: 1 });
  }
  let i = 0;
  return {
    vystrel(pozice, barva, pocet = 12, sila = 4, delka = 0.7) {
      for (let k = 0; k < pocet; k++) {
        const p = pool[i++ % max];
        p.m.position.copy(pozice); p.m.material.color.set(barva); p.m.visible = true;
        p.v.set(nahoda(-1, 1), nahoda(0.2, 1.4), nahoda(-1, 1)).normalize().multiplyScalar(sila * nahoda(0.5, 1));
        p.zivot = p.delka = delka * nahoda(0.7, 1.2);
      }
    },
    aktualizuj(dt, posun = 0) {
      for (const p of pool) {
        if (!p.m.visible) continue;
        p.zivot -= dt;
        if (p.zivot <= 0) { p.m.visible = false; continue; }
        p.v.y -= gravitace * dt;
        p.m.position.addScaledVector(p.v, dt); p.m.position.z += posun;
        const k = p.zivot / p.delka;
        p.m.scale.setScalar(0.4 + k); p.m.material.opacity = k; p.m.rotation.x += dt * 8;
      }
    },
    skryj() { for (const p of pool) p.m.visible = false; },
  };
}

// ================= ULOŽENÍ POSTUPU =================
const KLIC = 'uhni-a-let-v1';
const vychozi = () => ({ mince: 0, skiny: ['karate', 'karatistka', 'orel'], vybrany: { beh: 'karate', let: 'orel', koste: 'ko-carodejnice' }, odemceno: { beh: 1, let: 1, koste: 1 }, hvezdy: { beh: [], let: [], koste: [] }, rekord: { beh: 0, let: 0, koste: 0 }, ovladani: null, zvuk: true, tv: false });
export const ulozene = (() => {
  let d = vychozi();
  try { const s = JSON.parse(localStorage.getItem(KLIC)); if (s) d = { ...d, ...s, vybrany: { ...d.vybrany, ...s.vybrany }, odemceno: { ...d.odemceno, ...s.odemceno }, hvezdy: { ...d.hvezdy, ...s.hvezdy }, rekord: { ...d.rekord, ...s.rekord } }; } catch {}
  // vyřazené postavy (22. 11.): kdo je koupil, dostane mince zpátky a vybere se mu výchozí postava
  const VYRAZENE = { zombik: 600, alien: 1400, mech: 1500, mech2: 1800, robo: 250 };   // koupené vyřazené postavy = mince zpátky
  for (const [id, cena] of Object.entries(VYRAZENE)) if (d.skiny.includes(id)) { d.skiny = d.skiny.filter(x => x !== id); d.mince += cena; }
  if (VYRAZENE[d.vybrany.beh]) d.vybrany.beh = 'karate';
  return d;
})();
export function uloz() { try { localStorage.setItem(KLIC, JSON.stringify(ulozene)); } catch {} }

// ================= ZVUK =================
let ac = null, hlavni = null;
export function audio() {
  if (!ac) { ac = new AudioContext(); hlavni = ac.createGain(); hlavni.gain.value = ulozene.zvuk ? 0.9 : 0; hlavni.connect(ac.destination); }
  if (ac.state === 'suspended') ac.resume();
  if (chtena && !hraje) pouzijHudbu();
  return ac;
}
export function prepniZvuk() {
  ulozene.zvuk = !ulozene.zvuk; uloz();
  if (hlavni) hlavni.gain.value = ulozene.zvuk ? 0.9 : 0;
  pozastavHudbu(!ulozene.zvuk);
  return ulozene.zvuk;
}
const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);
function ton(f, t, delka, typ = 'square', hl = 0.08, f2 = null) {
  if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = typ; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + delka);
  g.gain.setValueAtTime(hl, t); g.gain.exponentialRampToValueAtTime(0.0001, t + delka);
  o.connect(g).connect(hlavni); o.start(t); o.stop(t + delka + 0.02);
}
let sumBuf = null;
function sum(t, delka, hl, filtr = 6000) {
  if (!ac) return;
  if (!sumBuf) { sumBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = sumBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
  s.buffer = sumBuf; f.type = 'highpass'; f.frequency.value = filtr;
  g.gain.setValueAtTime(hl, t); g.gain.exponentialRampToValueAtTime(0.0001, t + delka);
  s.connect(f).connect(g).connect(hlavni); s.start(t); s.stop(t + delka);
}
// ================= HUDBA =================
// Dvě vlastní písničky (16 taktů, sloka + refrén), hrané syntezátorem v prohlížeči — žádné cizí nahrávky, žádné licence.
// Zápis: jeden takt = 8 osmin oddělených mezerou. Nota „E5“, „-“ = drž předchozí, „.“ = ticho. Akord = jméno na takt.
const NOTY = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const midiZ = n => { const m = n.match(/^([A-G]#?)(-?\d)$/); return 12 * (+m[2] + 1) + NOTY[m[1]]; };
const AKORDY = { C: [48, [0, 4, 7]], G: [43, [0, 4, 7]], Am: [45, [0, 3, 7]], F: [41, [0, 4, 7]], Dm: [50, [0, 3, 7]], E: [40, [0, 4, 7]], Em: [40, [0, 3, 7]] };
function pisen(o) {
  // převede zápis na seznam not: { krok (16tiny), midi, delka (16tiny) }
  const melodie = [];
  o.melodie.forEach((takt, ti) => {
    takt.trim().split(/\s+/).forEach((tok, i) => {
      const krok = ti * 16 + i * 2;
      if (tok === '-') { if (melodie.length) melodie[melodie.length - 1].delka += 2; }
      else if (tok !== '.') melodie.push({ krok, midi: midiZ(tok), delka: 2 });
    });
  });
  const podleKroku = new Map(melodie.map(n => [n.krok, n]));
  return { ...o, podleKroku, taktu: o.melodie.length };
}
const HUDBY = {
  beh: pisen({
    bpm: 140, styl: 'beh',
    akordy: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'],
    melodie: [
      'E5 . G5 . C6 . G5 E5', 'D5 . G5 . B5 - A5 G5', 'C5 . E5 . A5 - G5 E5', 'F5 . A5 . G5 - E5 D5',
      'E5 . G5 . C6 . D6 E6', 'D6 - B5 G5 D5 . G5 .', 'A5 - C6 A5 G5 - F5 E5', 'D5 - - . G5 . B5 .',
      'A5 . A5 C6 B5 . A5 .', 'F5 . A5 . C6 - A5 .', 'G5 . E5 . G5 C6 E6 .', 'D6 - - . B5 - D6 .',
      'E6 . D6 C6 B5 . A5 .', 'C6 . A5 F5 A5 . C6 .', 'G5 - E5 . C5 . E5 G5', 'B5 - D6 - G6 - - .',
    ],
  }),
  let: pisen({
    bpm: 96, styl: 'let',
    akordy: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'E'],
    melodie: [
      'E5 - - - A5 - B5 -', 'C6 - - - A5 - - -', 'G5 - - - E5 - G5 -', 'D5 - - - - - . .',
      'E5 - A5 - B5 - C6 -', 'D6 - C6 - A5 - - -', 'G5 - E5 - G5 - C6 -', 'B5 - - - - - . .',
      'A5 - C6 - F6 - E6 -', 'E6 - D6 - C6 - - -', 'D6 - B5 - G5 - B5 -', 'C6 - - - - - . .',
      'A5 - C6 - F6 - - -', 'G6 - E6 - C6 - - -', 'D6 - - - B5 - D6 -', 'B5 - - - G#5 - - -',
    ],
  }),
};
let hudbaBus = null, ozvena = null;
function pripravHudbu() {
  if (hudbaBus) return;
  hudbaBus = ac.createGain(); hudbaBus.gain.value = 0.55;
  const komp = ac.createDynamicsCompressor(); komp.threshold.value = -16; komp.ratio.value = 4;
  hudbaBus.connect(komp).connect(hlavni);
  // ozvěna (delay) dodá melodii prostor
  ozvena = ac.createDelay(1); ozvena.delayTime.value = 0.32;
  const zpet = ac.createGain(), mix = ac.createGain(), tlum = ac.createBiquadFilter();
  tlum.type = 'lowpass'; tlum.frequency.value = 2600; zpet.gain.value = 0.32; mix.gain.value = 0.28;
  ozvena.connect(tlum); tlum.connect(zpet).connect(ozvena); tlum.connect(mix).connect(hudbaBus);
}
// nástroj: oscilátory → filtr s obálkou → hlasitost s obálkou
function nastroj(t, f, delka, { typy = ['square'], ladeni = [0], hl = 0.05, utok = 0.01, filtr = 3000, filtrOd = null, ozv = 0 }) {
  const g = ac.createGain(), fl = ac.createBiquadFilter();
  fl.type = 'lowpass'; fl.Q.value = 1.2;
  fl.frequency.setValueAtTime(filtrOd ?? filtr, t); fl.frequency.exponentialRampToValueAtTime(filtr, t + Math.max(0.02, Math.min(0.25, delka)));
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(hl, t + utok);
  g.gain.setValueAtTime(hl, t + Math.max(utok, delka * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t + delka + 0.08);
  typy.forEach((typ, i) => { const o = ac.createOscillator(); o.type = typ; o.frequency.value = f; o.detune.value = ladeni[i] || 0; o.connect(fl); o.start(t); o.stop(t + delka + 0.12); });
  fl.connect(g); g.connect(hudbaBus);
  if (ozv) { const s = ac.createGain(); s.gain.value = ozv; g.connect(s).connect(ozvena); }
}
function kopak(t, hl = 0.5) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(hl, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g).connect(hudbaBus); o.start(t); o.stop(t + 0.25); }
function sumHudba(t, delka, hl, typ, f) {
  if (!sumBuf) { sumBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = sumBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter();
  s.buffer = sumBuf; fl.type = typ; fl.frequency.value = f;
  g.gain.setValueAtTime(hl, t); g.gain.exponentialRampToValueAtTime(0.0001, t + delka);
  s.connect(fl).connect(g).connect(hudbaBus); s.start(t, Math.random() * 0.3); s.stop(t + delka);
}
function hrajKrok(p, krok, t, K) {
  const takt = Math.floor(krok / 16) % p.taktu, k = krok % 16;
  const [koren, int] = AKORDY[p.akordy[takt]];
  const kolo = Math.floor(krok / (16 * p.taktu));          // druhé kolo písničky má navíc arpeggio
  const n = p.podleKroku.get(takt * 16 + k);
  if (n) {
    if (p.styl === 'beh') nastroj(t, hz(n.midi), n.delka * K * 0.92, { typy: ['square', 'square'], ladeni: [-7, 7], hl: 0.045, filtr: 2400, filtrOd: 5000, ozv: 0.35 });
    else nastroj(t, hz(n.midi), n.delka * K, { typy: ['triangle', 'sine'], ladeni: [0, 1200], hl: 0.09, utok: 0.03, filtr: 3500, ozv: 0.6 });
  }
  if (p.styl === 'beh') {
    // basa: osminy, kořen a oktáva
    if (k % 2 === 0) nastroj(t, hz(koren - 12 + (k % 4 === 2 ? 12 : 0)), K * 1.7, { typy: ['sawtooth'], hl: 0.07, filtr: 500, filtrOd: 1400 });
    // bubny: kopák na 1 a 3 (+ „a" před čtyřkou), virbl na 2 a 4, činel na osminách
    if (k === 0 || k === 8 || k === 14) kopak(t);
    if (k === 4 || k === 12) { sumHudba(t, 0.16, 0.16, 'bandpass', 1800); nastroj(t, 190, 0.08, { typy: ['triangle'], hl: 0.08, filtr: 1500 }); }
    if (k % 2 === 0) sumHudba(t, 0.045, k % 4 === 2 ? 0.05 : 0.03, 'highpass', 8000);
    // arpeggio v druhém kole
    if (kolo % 2 === 1 && k % 2 === 1) nastroj(t, hz(koren + 24 + int[(k >> 1) % 3]), K * 0.9, { typy: ['square'], hl: 0.018, filtr: 3500 });
  } else {
    // let: měkký polštář akordu, basa na dobách, jemný šustík a zvonkohra
    if (k === 0) for (const i of int) nastroj(t, hz(koren + 12 + i), K * 15, { typy: ['triangle', 'triangle'], ladeni: [-6, 6], hl: 0.022, utok: 0.35, filtr: 1400 });
    if (k === 0 || k === 8) nastroj(t, hz(koren - 12), K * 7, { typy: ['triangle'], hl: 0.11, utok: 0.02, filtr: 700 });
    if (k === 0) kopak(t, 0.28);
    if (k % 4 === 2) sumHudba(t, 0.09, 0.025, 'highpass', 6000);
    if (k % 2 === 1) nastroj(t, hz(koren + 24 + int[(k >> 1) % 3]), K * 1.2, { typy: ['sine'], hl: kolo % 2 ? 0.03 : 0.018, filtr: 4000, ozv: 0.5 });
  }
}
let hudba = null, krok = 0, dalsi = 0;
setInterval(() => {
  if (!hudba || !ac) return;
  const K = 60 / hudba.bpm / 4;
  if (dalsi < ac.currentTime - 0.5) dalsi = ac.currentTime + 0.05;   // po uspání karty nedohánět zpožděné noty
  while (dalsi < ac.currentTime + 0.15) { hrajKrok(hudba, krok, dalsi, K); krok++; dalsi += K; }
}, 30);
// (výše je původní hudba generovaná v kódu, zůstává jen pro zkusHudbu; ve hře hrají skladby ze složky hudba/)

// ================= HUDBA ZE SOUBORŮ =================
// Skladby z Gemini (běh, let, výhra) a klidná podložka do lobby z kódu.
// Výhra začne hrát už v cíli a hraje dokola, dokud je vidět výsledek.
const SKLADBY = { beh: 'beh.mp3', let: 'let.mp3', vyhra: 'vyhra.mp3', lobby: 'lobby2.mp3' };   // lobby = živá smyčka s bubny, bez melodie (22. 11. večer; dřívější klidná byla moc potichu a nudná)
const HLASITOST = { beh: 0.3, let: 0.3, vyhra: 0.35, lobby: 0.34 };   // hudba vůči zvukům ve hře (0.3 ≈ hlasitost původní hudby z kódu)
const prehravace = {};
let chtena = null, hraje = null;   // { stopa, hl }
function prehravac(stopa) {
  if (!prehravace[stopa]) {
    const el = new Audio(new URL('hudba/' + SKLADBY[stopa], document.baseURI).href);
    el.loop = true; el.preload = 'auto';
    const g = ac.createGain(); g.gain.value = 0;
    ac.createMediaElementSource(el).connect(g).connect(hlavni);
    prehravace[stopa] = { el, g, zastav: null };
  }
  return prehravace[stopa];
}
function prolni(g, cil, s) {
  const t = ac.currentTime;
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(cil, t + s);
}
function spust(p) { if (ulozene.zvuk && !document.hidden) p.el.play().catch(() => {}); }
function pouzijHudbu() {
  if (!ac) return;   // zvuk ještě nepovolen (žádné kliknutí) – začne při prvním kliknutí
  if (chtena && hraje && chtena.stopa === hraje.stopa && chtena.hl === hraje.hl) return;
  if (hraje && (!chtena || chtena.stopa !== hraje.stopa)) {
    const st = prehravace[hraje.stopa];
    prolni(st.g, 0, 0.8); clearTimeout(st.zastav); st.zastav = setTimeout(() => st.el.pause(), 900);
  }
  if (!chtena) { hraje = null; return; }
  const p = prehravac(chtena.stopa), stejna = hraje && hraje.stopa === chtena.stopa;
  clearTimeout(p.zastav);
  if (!stejna) p.el.currentTime = 0;
  spust(p);
  prolni(p.g, chtena.hl, stejna ? 1.2 : 0.3);
  hraje = { ...chtena };
}
export function hrajHudbu(jmeno) {
  chtena = { stopa: jmeno, hl: HLASITOST[jmeno] };
  pouzijHudbu();
}
export function ztisHudbu() { chtena = null; pouzijHudbu(); }
// jen pro kontrolu z konzole: co hraje, jak nahlas a kde
export const stavHudby = () => ({ chtena, hraje, prehravace: Object.fromEntries(Object.entries(prehravace).map(([k, p]) =>
  [k, { cas: +p.el.currentTime.toFixed(1), hraje: !p.el.paused, hl: +p.g.gain.value.toFixed(2), chyba: p.el.error && p.el.error.code }])) });
function pozastavHudbu(ano) {
  if (!hraje) return;
  const p = prehravace[hraje.stopa];
  if (ano) p.el.pause(); else spust(p);
}
document.addEventListener('visibilitychange', () => pozastavHudbu(document.hidden));
// první kliknutí nebo klávesa kdekoliv povolí zvuk a pustí hudbu do lobby
['pointerdown', 'keydown'].forEach(u => addEventListener(u, () => { if (chtena && !hraje) audio(); }, true));
// jen pro kontrolu: vyrenderuje písničku potichu do paměti a vrátí hlasitost (špička, průměr)
export async function zkusHudbu(jmeno, sekundy = 20) {
  const puvodni = [ac, hlavni, hudbaBus, ozvena];
  const off = new OfflineAudioContext(1, 22050 * sekundy, 22050);
  ac = off; hlavni = off.createGain(); hlavni.connect(off.destination); hudbaBus = null; pripravHudbu();
  const p = HUDBY[jmeno], K = 60 / p.bpm / 4;
  for (let i = 0, t = 0.05; t < sekundy - 0.5; i++, t += K) hrajKrok(p, i, t, K);
  [ac, hlavni, hudbaBus, ozvena] = puvodni;
  const d = (await off.startRendering()).getChannelData(0);
  let spicka = 0, soucet = 0, nan = 0; for (const v of d) { if (Number.isNaN(v)) nan++; spicka = Math.max(spicka, Math.abs(v)); soucet += v * v; }
  return { spicka: +spicka.toFixed(3), prumer: +Math.sqrt(soucet / d.length).toFixed(3), nan };
}
export const SFX = {
  mince() { if (!ac) return; const t = ac.currentTime; ton(988, t, 0.07, 'square', 0.07); ton(1319, t + 0.06, 0.12, 'square', 0.07); },
  hvezda() { if (!ac) return; const t = ac.currentTime; [72, 76, 79, 84].forEach((n, i) => ton(hz(n), t + i * 0.05, 0.12, 'triangle', 0.12)); },
  kruh() { if (!ac) return; const t = ac.currentTime; [76, 81, 88].forEach((n, i) => ton(hz(n), t + i * 0.06, 0.16, 'triangle', 0.13)); },
  skok() { if (!ac) return; ton(330, ac.currentTime, 0.2, 'triangle', 0.12, 880); },
  mav() { if (!ac) return; sum(ac.currentTime, 0.12, 0.06, 900); },
  turbo() { if (!ac) return; ton(200, ac.currentTime, 0.4, 'sawtooth', 0.07, 900); },
  zasah() { if (!ac) return; const t = ac.currentTime; ton(160, t, 0.35, 'sawtooth', 0.15, 50); sum(t, 0.2, 0.18, 400); },
  svet() { if (!ac) return; const t = ac.currentTime; [60, 64, 67, 72, 76].forEach((n, i) => ton(hz(n), t + i * 0.07, 0.18, 'square', 0.06)); },
  vyhra() { if (!ac) return; hrajHudbu('vyhra'); const t = ac.currentTime; [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, i) => ton(hz(n), t + i * 0.09, 0.2, 'square', 0.07)); },
  prohra() { if (!ac) return; const t = ac.currentTime; [67, 64, 60, 55].forEach((n, i) => ton(hz(n), t + i * 0.16, 0.25, 'triangle', 0.14)); },
  koupe() { if (!ac) return; const t = ac.currentTime; [72, 79, 84, 91].forEach((n, i) => ton(hz(n), t + i * 0.06, 0.15, 'square', 0.07)); },
  klik() { if (!ac) return; ton(880, ac.currentTime, 0.05, 'square', 0.05); },
  tik() { if (!ac) return; ton(660, ac.currentTime, 0.1, 'square', 0.06); },
};

// ================= KAMERA =================
// Kamera se zapne jednou a slouží oběma režimům. Rozpoznávání postavy běží jen v prohlížeči, nic se neodesílá.
const video = $('video'), kamCanvas = $('kamCanvas'), kctx = kamCanvas.getContext('2d'), stavKam = $('stavKam'), vyberKamery = $('vyberKamery');
let landmarker = null, posledniCas = -1, stream = null, jas = 255, mereniJasu = 0;
const SPOJENI = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
export const kamera = {
  zapnuta: false,
  async zapni() {
    let ulozena = null;
    try { ulozena = localStorage.getItem('uhni-kamera') || localStorage.getItem('mavani-kamera'); } catch {}
    try { await spustStream(ulozena); } catch (e) { if (!ulozena) throw e; await spustStream(null); }
    $('kam').classList.remove('skryt');
    stavKam.textContent = t('cam.loadingAi');
    const { PoseLandmarker, FilesetResolver } = await import('../vendor/mediapipe/vision_bundle.mjs');
    const vision = await FilesetResolver.forVisionTasks(new URL('vendor/mediapipe/wasm', document.baseURI).href);
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: new URL('vendor/model/pose_landmarker_lite.task', document.baseURI).href, delegate: 'GPU' },
      runningMode: 'VIDEO', numPoses: 1
    });
    this.zapnuta = true;
  },
  // Vrátí body těla z nového snímku, nebo null (žádný nový snímek / nikdo).
  snimek() {
    const w = kamCanvas.width, h = kamCanvas.height;
    kctx.save(); kctx.scale(-1, 1); kctx.drawImage(video, -w, 0, w, h); kctx.restore();
    if (performance.now() - mereniJasu > 1000 && video.readyState >= 2) {
      mereniJasu = performance.now();
      const px = kctx.getImageData(0, 0, w, h).data; let s = 0, n = 0;
      for (let i = 0; i < px.length; i += 64) { s += px[i] + px[i + 1] + px[i + 2]; n++; }
      jas = s / (n * 3);
    }
    if (!landmarker || video.readyState < 2 || video.currentTime === posledniCas) return { novy: false, L: null };
    posledniCas = video.currentTime;
    const r = landmarker.detectForVideo(video, performance.now());
    const L = r.landmarks && r.landmarks[0] || null;
    if (L) {
      kctx.lineWidth = 4; kctx.strokeStyle = '#4ff3ff'; kctx.fillStyle = '#ffd23f';
      for (const [a, b] of SPOJENI) {
        if ((L[a].visibility ?? 1) < 0.3 || (L[b].visibility ?? 1) < 0.3) continue;
        kctx.beginPath(); kctx.moveTo((1 - L[a].x) * w, L[a].y * h); kctx.lineTo((1 - L[b].x) * w, L[b].y * h); kctx.stroke();
      }
      for (const i of [0, 15, 16]) if ((L[i].visibility ?? 1) > 0.4) { kctx.beginPath(); kctx.arc((1 - L[i].x) * w, L[i].y * h, 6, 0, 7); kctx.fill(); }
    }
    return { novy: true, L };
  },
  kresli(fn) { fn(kctx, kamCanvas.width, kamCanvas.height); },
  stav(text) { stavKam.textContent = text; },
  cerny: () => jas < 25,
};
async function spustStream(deviceId) {
  const novy = await navigator.mediaDevices.getUserMedia({
    video: deviceId ? { deviceId: { exact: deviceId }, width: 640, height: 480 } : { width: 640, height: 480, facingMode: 'user' }, audio: false
  });
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = novy; video.srcObject = stream; await video.play();
  posledniCas = -1; jas = 255; srovnejPomer();
  try { localStorage.setItem('uhni-kamera', stream.getVideoTracks()[0].getSettings().deviceId); } catch {}
  await naplnVyber();
}
// Náhled kamery má stejný poměr stran jako obraz z kamery. Dřív byl natvrdo 4 : 3, takže obraz
// z telefonu (na výšku nebo 16 : 9) byl roztažený a vypadal křivě. Telefon při otočení pošle 'resize'.
function srovnejPomer() {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return;
  const h = Math.round(320 * vh / vw);
  if (kamCanvas.height !== h) kamCanvas.height = h;
  $('kam').style.setProperty('--pomerKam', (vw / vh).toFixed(3));
}
video.addEventListener('resize', srovnejPomer);
video.addEventListener('loadedmetadata', srovnejPomer);
async function naplnVyber() {
  const kamery = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
  const aktualni = stream && stream.getVideoTracks()[0].getSettings().deviceId;
  vyberKamery.innerHTML = '';
  kamery.forEach((k, i) => { const o = document.createElement('option'); o.value = k.deviceId; o.textContent = '📷 ' + (k.label || t('camera.n', { n: i + 1 })); o.selected = k.deviceId === aktualni; vyberKamery.add(o); });
}
vyberKamery.onchange = () => spustStream(vyberKamery.value).catch(() => { naplnVyber(); stavKam.textContent = t('cam.bad'); });

// Obě ruce nad hlavou (start / znovu) — společné pro oba režimy.
export const ruce = { t: 0, obe: false, jedna: false };
export function zpracujRuce(L, dt) {
  const ok = i => L && L[i] && (L[i].visibility ?? 1) > 0.4;
  if (!ok(11) || !ok(12)) { ruce.t = 0; ruce.obe = ruce.jedna = false; return; }
  const my = (L[11].y + L[12].y) / 2, sw = Math.abs(L[11].x - L[12].x);
  const vrsek = ok(0) ? L[0].y : my - sw * 0.8;
  const l = ok(15) && L[15].y < vrsek, p = ok(16) && L[16].y < vrsek;
  ruce.obe = l && p; ruce.jedna = l || p;
  ruce.t = ruce.obe ? ruce.t + dt : 0;
}
