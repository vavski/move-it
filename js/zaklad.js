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
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
const gradient = (() => {
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
export function castice(scene, max = 120) {
  const geo = new THREE.OctahedronGeometry(0.12, 0);
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
        p.v.y -= 6 * dt;
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
const vychozi = () => ({ mince: 0, skiny: ['dino', 'robo', 'orel'], vybrany: { beh: 'dino', let: 'orel' }, odemceno: { beh: 1, let: 1 }, hvezdy: { beh: [], let: [] }, rekord: { beh: 0, let: 0 }, ovladani: null, zvuk: true });
export const ulozene = (() => {
  let d = vychozi();
  try { const s = JSON.parse(localStorage.getItem(KLIC)); if (s) d = { ...d, ...s, vybrany: { ...d.vybrany, ...s.vybrany }, odemceno: { ...d.odemceno, ...s.odemceno }, hvezdy: { ...d.hvezdy, ...s.hvezdy }, rekord: { ...d.rekord, ...s.rekord } }; } catch {}
  return d;
})();
export function uloz() { try { localStorage.setItem(KLIC, JSON.stringify(ulozene)); } catch {} }

// ================= ZVUK =================
let ac = null, hlavni = null;
export function audio() {
  if (!ac) { ac = new AudioContext(); hlavni = ac.createGain(); hlavni.gain.value = ulozene.zvuk ? 0.9 : 0; hlavni.connect(ac.destination); }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
export function prepniZvuk() {
  ulozene.zvuk = !ulozene.zvuk; uloz();
  if (hlavni) hlavni.gain.value = ulozene.zvuk ? 0.9 : 0;
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
// Dvě vlastní smyčky: rychlá na běh, vzdušnější na let.
const HUDBY = {
  beh: { bpm: 132, akordy: [[48, [0, 4, 7]], [43, [0, 4, 7]], [45, [0, 3, 7]], [41, [0, 4, 7]]], melodie: [0, 1, 2, 1, 2, 3, 2, 1], buben: true },
  let: { bpm: 104, akordy: [[45, [0, 3, 7]], [41, [0, 4, 7]], [48, [0, 4, 7]], [43, [0, 4, 7]]], melodie: [0, 2, 1, 3, 2, 1, 2, 0], buben: false },
};
let hudba = null, krok = 0, dalsi = 0;
setInterval(() => {
  if (!hudba || !ac) return;
  const KROK = 60 / hudba.bpm / 4;
  while (dalsi < ac.currentTime + 0.15) {
    const takt = Math.floor(krok / 16) % 4, k = krok % 16, t = dalsi;
    const [koren, int] = hudba.akordy[takt];
    if (hudba.buben) { if (k % 4 === 0) ton(150, t, 0.18, 'sine', 0.32, 45); if (k % 4 === 2) sum(t, 0.05, 0.08); }
    else if (k % 8 === 4) sum(t, 0.12, 0.04, 3000);
    if ([0, 3, 6, 8, 11, 14].includes(k) && (hudba.buben || k % 8 === 0)) ton(hz(koren + (k === 6 || k === 14 ? 12 : 0)), t, KROK * (hudba.buben ? 1.6 : 6), 'triangle', 0.15);
    if (k % 2 === 0) {
      const i = hudba.melodie[(k / 2 + takt) % 8];
      const nota = koren + 24 + (i === 3 ? 12 : int[i]);
      if (!(takt === 3 && k > 10)) ton(hz(nota), t, KROK * (hudba.buben ? 1.4 : 2.6), hudba.buben ? 'square' : 'triangle', hudba.buben ? 0.042 : 0.07);
    }
    krok++; dalsi += KROK;
  }
}, 30);
export function hrajHudbu(jmeno) { audio(); if (hudba !== HUDBY[jmeno]) { hudba = HUDBY[jmeno]; krok = 0; dalsi = ac.currentTime + 0.05; } }
export function ztisHudbu() { hudba = null; }
export const SFX = {
  mince() { if (!ac) return; const t = ac.currentTime; ton(988, t, 0.07, 'square', 0.07); ton(1319, t + 0.06, 0.12, 'square', 0.07); },
  hvezda() { if (!ac) return; const t = ac.currentTime; [72, 76, 79, 84].forEach((n, i) => ton(hz(n), t + i * 0.05, 0.12, 'triangle', 0.12)); },
  kruh() { if (!ac) return; const t = ac.currentTime; [76, 81, 88].forEach((n, i) => ton(hz(n), t + i * 0.06, 0.16, 'triangle', 0.13)); },
  skok() { if (!ac) return; ton(330, ac.currentTime, 0.2, 'triangle', 0.12, 880); },
  mav() { if (!ac) return; sum(ac.currentTime, 0.12, 0.06, 900); },
  turbo() { if (!ac) return; ton(200, ac.currentTime, 0.4, 'sawtooth', 0.07, 900); },
  zasah() { if (!ac) return; const t = ac.currentTime; ton(160, t, 0.35, 'sawtooth', 0.15, 50); sum(t, 0.2, 0.18, 400); },
  svet() { if (!ac) return; const t = ac.currentTime; [60, 64, 67, 72, 76].forEach((n, i) => ton(hz(n), t + i * 0.07, 0.18, 'square', 0.06)); },
  vyhra() { if (!ac) return; const t = ac.currentTime; [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, i) => ton(hz(n), t + i * 0.09, 0.2, 'square', 0.07)); },
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
    const { PoseLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14');
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate: 'GPU' },
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
  posledniCas = -1; jas = 255;
  try { localStorage.setItem('uhni-kamera', stream.getVideoTracks()[0].getSettings().deviceId); } catch {}
  await naplnVyber();
}
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
