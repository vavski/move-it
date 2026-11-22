// Režim BĚH: tři dráhy, uhýbání, skok, dřep, sbírání. Ovládání kamerou nebo klávesnicí.
import { THREE, nahoda, vyber, toon, svit, obrys, stin, vytvorNebe, svetla, castice, novaKamera, SFX, gradient } from './zaklad.js';
import { BEZCI } from './postavy.js';
import { t, tn } from './i18n.js';
import { hrajAnimaci } from './bezci.js';
import { nactiPrirodu, kus } from './priroda.js';

export const SVETY = [
  { jmeno: 'ŠUMAVA', nahore: '#3f9cff', dole: '#cdeeff', zem: '#78c850', cesta: '#d9b37c', okraj: '#a87b4f', cara: '#fff3d0', nizky: '#8a5a2b', vysoky: '#ff4d5e', bedna: '#c98a4b', hory: '#5f8f6a', mlha: '#cdeeff', vzor: 'hlina' },
  { jmeno: 'SAHARA', nahore: '#ff9e3d', dole: '#ffe3a8', zem: '#f0c26a', cesta: '#e3ab62', okraj: '#b97f3c', cara: '#fff0c8', nizky: '#a8763f', vysoky: '#2fb7a6', bedna: '#d69a52', hory: '#d99a55', mlha: '#ffe3a8', vzor: 'pisek' },
  { jmeno: 'ALPY', nahore: '#6fb6ff', dole: '#eef7ff', zem: '#f5f9ff', cesta: '#a9d1ef', okraj: '#7fb0d6', cara: '#ffffff', nizky: '#7fc8ff', vysoky: '#ff6b3d', bedna: '#9ab7d6', hory: '#9fb8d6', mlha: '#eef7ff', vzor: 'snih', snih: true },
  { jmeno: 'SOPKA', nahore: '#4a1530', dole: '#ff8a4a', zem: '#4a3a3a', cesta: '#6e5550', okraj: '#2e2222', cara: '#ffb000', nizky: '#2e2222', vysoky: '#ffd23f', bedna: '#7a5a50', hory: '#3a2a2a', mlha: '#c25a3a', vzor: 'lava', tmavy: true },
  { jmeno: 'MĚSÍC', nahore: '#0b0a24', dole: '#3a2f6e', zem: '#5e5c74', cesta: '#7c7a93', okraj: '#4a4860', cara: '#c9b8ff', nizky: '#9aa0b8', vysoky: '#ff3dd2', bedna: '#6c7aa0', hory: '#3d3b55', mlha: '#3a2f6e', vzor: 'panely', tmavy: true },
  { jmeno: 'NOC', nahore: '#050818', dole: '#1a2550', zem: '#2a3a3a', cesta: '#55556a', okraj: '#2a2a38', cara: '#ffe680', nizky: '#a07a4a', vysoky: '#ff4d5e', bedna: '#b0884f', hory: '#141a30', mlha: '#0d1430', vzor: 'asfalt', tmavy: true },
  // nové světy (21. 11.): Les a Šumava už nevypadají stejně, Ledovec má vlastní led
  { jmeno: 'LES', nahore: '#5aa0b8', dole: '#e2f4d0', zem: '#4c8a3c', cesta: '#9a7650', okraj: '#5e4229', cara: '#e8d6a0', nizky: '#7a4a25', vysoky: '#ff9b2f', bedna: '#9a6a3a', hory: '#2f5a3a', mlha: '#cfe8c0', vzor: 'listi' },
  { jmeno: 'LEDOVEC', nahore: '#5fb4ff', dole: '#effaff', zem: '#e4f4ff', cesta: '#bfe6ff', okraj: '#8fc4e8', cara: '#ffffff', nizky: '#9fe0ff', vysoky: '#3d8bff', bedna: '#b8e4ff', hory: '#a9c8ea', mlha: '#e8f6ff', vzor: 'led', snih: true },
];
// Každý level přidá jednu novinku: nejdřív jen uhýbání, pak skok, dřep, nízká gravitace, jezdící bedny, tma, dvojité řady.
// typy = jaké řady překážek se losují, hustota < 1 = řady blíž u sebe, navod = pohyb, který se v levelu naučí s panáčkem.
const T_VSE = ['blok1', 'blok1', 'blok2', 'nizkyVse', 'nizkyVse', 'vysokyVse', 'vysokyVse', 'nizky1', 'vysoky1', 'mince', 'mix'];
const ZB = { hustota: 1, gravitace: 31, jezdi: 0, dvojita: 0, tma: 0, navod: [], lehke: ['mince', 'blok1'] };
export const LEVELY = [
  // 1. level hned naučí všechny čtyři pohyby (doleva/doprava, skok, dřep), ale pomalu a s velkými mezerami
  { ...ZB, jmeno: 'Šumava', svet: 0, cil: 300, rychlost: [9, 11], typy: ['mince', 'blok1', 'blok1', 'blok2', 'nizkyVse', 'nizky1', 'vysokyVse', 'vysoky1'], hustota: 1.25, navod: ['krok', 'skok', 'drep'] },
  { ...ZB, jmeno: 'Sahara', svet: 1, cil: 380, rychlost: [10, 12.5], hustota: 1.1, typy: ['mince', 'blok1', 'blok2', 'nizkyVse', 'nizky1', 'vysokyVse', 'vysoky1'] },
  { ...ZB, jmeno: 'Alpy', svet: 2, cil: 450, rychlost: [10, 13], hustota: 1.05, typy: ['mince', 'blok1', 'blok2', 'nizkyVse', 'nizky1', 'vysokyVse', 'vysokyVse', 'vysoky1', 'mix'] },
  { ...ZB, jmeno: 'Sopka', svet: 3, cil: 550, rychlost: [11, 14], typy: T_VSE },
  { ...ZB, jmeno: 'Měsíc', svet: 4, cil: 600, rychlost: [11, 14.5], typy: T_VSE, gravitace: 16 },
  { ...ZB, jmeno: 'Les', svet: 6, cil: 650, rychlost: [11.5, 15.5], typy: [...T_VSE, 'jezdi', 'jezdi', 'jezdi'] },
  { ...ZB, jmeno: 'Noc', svet: 5, cil: 700, rychlost: [12, 16], typy: [...T_VSE, 'jezdi'], tma: 55 },
  { ...ZB, jmeno: 'Písečná bouře', svet: 1, cil: 750, rychlost: [12.5, 16.5], typy: T_VSE, dvojita: 0.45, hustota: 0.9, tma: 110 },   // tma = písečný opar
  { ...ZB, jmeno: 'Ledovec', svet: 7, cil: 850, rychlost: [14, 18.5], typy: [...T_VSE, 'jezdi', 'jezdi'], dvojita: 0.3, hustota: 0.85 },
  { ...ZB, jmeno: 'Finále', svet: 3, cil: 1000, rychlost: [14, 19], typy: [...T_VSE, 'jezdi', 'jezdi'], dvojita: 0.4, hustota: 0.8, tma: 85 },
];
export const NEKONECNY = { ...ZB, typy: T_VSE, jmeno: 'Nekonečný běh', svet: 0, cil: Infinity, rychlost: [10, 18], nekonecny: true };
const DRAHY = [-2.3, 0, 2.3];

export function vytvorBeh(ctx) {
  const scene = new THREE.Scene();
  // modely přírody se načtou na pozadí; jakmile jsou, okolí se postaví znovu už z nich
  nactiPrirodu().then(() => { if (dekorace.length) vycistiDekorace(); });
  scene.fog = new THREE.Fog('#cdeeff', 45, 150);
  const camera = novaKamera(62);
  const KAM = new THREE.Vector3(0, 3.6, 6.6);
  const nebe = vytvorNebe(scene);
  const { hemi, slunce } = svetla(scene);
  const jiskry = castice(scene);

  // ---- povrch a cesta ----
  const zemMat = new THREE.MeshToonMaterial({ color: '#78c850' });
  const zem = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), zemMat);
  zem.rotation.x = -Math.PI / 2; zem.position.set(0, -0.02, -120); zem.receiveShadow = true; scene.add(zem);
  const platno = document.createElement('canvas'); platno.width = 256; platno.height = 512;
  const cestaTex = new THREE.CanvasTexture(platno);
  cestaTex.wrapS = cestaTex.wrapT = THREE.RepeatWrapping; cestaTex.repeat.set(1, 30); cestaTex.colorSpace = THREE.SRGBColorSpace;
  cestaTex.anisotropy = 8;
  const cesta = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 300), new THREE.MeshToonMaterial({ map: cestaTex }));
  cesta.rotation.x = -Math.PI / 2; cesta.position.set(0, 0, -120); cesta.receiveShadow = true; scene.add(cesta);
  // obrubníky
  const obrubaMat = new THREE.MeshToonMaterial({ color: '#a87b4f' });
  for (const sx of [-1, 1]) { const o = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 300), obrubaMat); o.position.set(sx * 3.85, 0.1, -120); o.receiveShadow = true; scene.add(o); }

  // vzdálené kulisy (hory, sopka, planeta) — nemění se během běhu
  const kulisy = new THREE.Group(); scene.add(kulisy);
  const hvezdy = (() => {
    const g = new THREE.BufferGeometry(), p = [];
    for (let i = 0; i < 700; i++) p.push(nahoda(-500, 500), nahoda(30, 300), nahoda(-600, -150));
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 1.4, fog: false, sizeAttenuation: false }));
    scene.add(m); return m;
  })();

  let svet = SVETY[0], svetIndex = 0;
  const cil = { nahore: new THREE.Color(), dole: new THREE.Color(), zem: new THREE.Color(), mlha: new THREE.Color() };
  function nakresliCestu() {
    const c = platno.getContext('2d'), R = Math.random;
    c.fillStyle = svet.cesta; c.fillRect(0, 0, 256, 512);
    const flek = (barva, n, w, h = w) => { c.fillStyle = barva; for (let i = 0; i < n; i++) c.fillRect(R() * 256, R() * 512, w * (0.5 + R()), h * (0.5 + R())); };
    switch (svet.vzor) {
      case 'hlina': flek('rgba(0,0,0,.07)', 260, 7); flek('rgba(255,255,255,.12)', 60, 5); break;            // udusaná hlína s kamínky
      case 'pisek': for (let y = 0; y < 512; y += 18) { c.fillStyle = 'rgba(160,100,40,.12)'; c.fillRect(0, y + R() * 6, 256, 4); } flek('rgba(255,255,255,.15)', 80, 3); break;   // písečné vlnky
      case 'snih': flek('rgba(255,255,255,.55)', 160, 10); flek('rgba(120,170,220,.18)', 50, 14, 4); break;   // ujetý sníh
      case 'lava': c.strokeStyle = '#ff7a1a'; c.lineWidth = 3; for (let i = 0; i < 14; i++) { c.beginPath(); let x = R() * 256, y = R() * 512; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += R() * 40 - 20; y += R() * 40 - 10; c.lineTo(x, y); } c.stroke(); } flek('rgba(0,0,0,.15)', 120, 9); break;   // čedič s rozžhavenými prasklinami
      case 'panely': c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; for (let y = 0; y < 512; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); } flek('rgba(255,255,255,.18)', 40, 6); break;   // kovové panely
      case 'asfalt': flek('rgba(255,255,255,.06)', 400, 3); flek('rgba(0,0,0,.12)', 120, 6); break;
      case 'listi': flek('rgba(0,0,0,.08)', 200, 7); for (const b of ['#e0892c', '#c9561e', '#e8c03a', '#7aa83a']) flek(b, 22, 7, 5); break;   // cestička s listím
      case 'led': c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; for (let i = 0; i < 18; i++) { c.beginPath(); const x = R() * 256, y = R() * 512; c.moveTo(x, y); c.lineTo(x + R() * 60 - 30, y + R() * 60 - 30); c.stroke(); } flek('rgba(255,255,255,.35)', 40, 18, 6); break;   // led s odlesky a prasklinkami
      default: flek('rgba(0,0,0,.07)', 300, 7);
    }
    c.fillStyle = svet.okraj; c.fillRect(0, 0, 16, 512); c.fillRect(240, 0, 16, 512);
    c.fillStyle = svet.cara;
    for (const x of [256 / 3, 512 / 3]) for (let y = 0; y < 512; y += 128) c.fillRect(x - 4, y + 20, 8, 70);
    cestaTex.needsUpdate = true;
  }
  function postavKulisy() {
    kulisy.clear();
    const m = toon(svet.hory, { fog: false });
    for (let i = 0; i < 16; i++) {
      const x = (i - 7.5) * 60 + nahoda(-20, 20);
      if (Math.abs(x) < 25) continue;
      const v = nahoda(40, 110);
      const h = new THREE.Mesh(new THREE.ConeGeometry(nahoda(35, 60), v, 6), m);
      h.position.set(x, v / 2 - 5, nahoda(-330, -270)); h.rotation.y = Math.random() * 3; kulisy.add(h);
      if (svet.snih || (svetIndex === 0 && v > 90)) { const s = new THREE.Mesh(new THREE.ConeGeometry(v * 0.18, v * 0.3, 6), toon('#ffffff', { fog: false })); s.position.set(x, v - 5 - v * 0.15, h.position.z); kulisy.add(s); }
    }
    if (svetIndex === 3) {
      const sopka = new THREE.Mesh(new THREE.CylinderGeometry(30, 110, 150, 8), toon('#2a1c1c', { fog: false })); sopka.position.set(-40, 70, -360); kulisy.add(sopka);
      const lava = new THREE.Mesh(new THREE.CylinderGeometry(28, 30, 8, 8), new THREE.MeshBasicMaterial({ color: '#ff6a00', fog: false })); lava.position.set(-40, 146, -360); kulisy.add(lava);
    }
    if (svetIndex === 4) {
      const planeta = new THREE.Mesh(new THREE.SphereGeometry(60, 24, 16), toon('#6d8bff', { fog: false })); planeta.position.set(120, 140, -420); kulisy.add(planeta);
      const prstenec = new THREE.Mesh(new THREE.TorusGeometry(95, 5, 4, 40), toon('#c9b8ff', { fog: false })); prstenec.position.copy(planeta.position); prstenec.rotation.x = 1.2; kulisy.add(prstenec);
    }
    hvezdy.visible = !!svet.tmavy;
  }
  function prepniSvet(i, hned = false) {
    svetIndex = i % SVETY.length; svet = SVETY[svetIndex];
    cil.nahore.set(svet.nahore); cil.dole.set(svet.dole); cil.zem.set(svet.zem); cil.mlha.set(svet.mlha);
    nakresliCestu(); postavKulisy(); obrubaMat.color.set(svet.okraj);
    hemi.groundColor.set(svet.tmavy ? '#5a3a6a' : '#6a8a5a');
    hemi.intensity = svet.tmavy ? 0.95 : 1.25;
    if (hned) { nebe.nastav(svet.nahore, svet.dole); zemMat.color.copy(cil.zem); scene.fog.color.copy(cil.mlha); }
  }

  // ---- tvary překážek a sběru ----
  const G = {
    kmen: new THREE.CylinderGeometry(0.42, 0.42, 2.0, 12).rotateZ(Math.PI / 2),
    sloup: new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8),
    stit: new THREE.BoxGeometry(2.05, 1.2, 0.2),
    tyc: new THREE.BoxGeometry(2.05, 0.42, 0.3),
    tram: new THREE.CylinderGeometry(0.24, 0.24, 2.15, 10).rotateZ(Math.PI / 2),
    rampouch: new THREE.ConeGeometry(0.07, 0.36, 5).rotateX(Math.PI),
    bedna: new THREE.BoxGeometry(1.85, 1.95, 1.85),
    mince: new THREE.CylinderGeometry(0.36, 0.36, 0.12, 20).rotateX(Math.PI / 2),
    branaSloup: new THREE.BoxGeometry(0.5, 5, 0.5),
    branaTyc: new THREE.BoxGeometry(8.4, 1.0, 0.5),
  };
  // Mince se strukturou (22. 11.): vystouplý okraj, propadlá plocha a vyražené „M“ (Move It) se stínem,
  // ať je mince vidět jako opravdová i na světlé cestě. Okraj je soustružený profil, líc a rub mají obrázek.
  const minceDily = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(46, 40, 8, 64, 64, 64);
    g.addColorStop(0, '#fff3b0'); g.addColorStop(0.55, '#ffc928'); g.addColorStop(1, '#e8901a');
    x.fillStyle = g; x.beginPath(); x.arc(64, 64, 64, 0, Math.PI * 2); x.fill();
    // vnitřní vyražený kroužek: tmavá linka a pod ní světlá (vypadá jako prohloubení)
    x.lineWidth = 5; x.strokeStyle = '#c96d10'; x.beginPath(); x.arc(64, 64, 49, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 3; x.strokeStyle = 'rgba(255,248,200,.9)'; x.beginPath(); x.arc(64, 66, 46, 0, Math.PI * 2); x.stroke();
    // „M“: stín dole vpravo, pak světlý obrys nahoře vlevo, pak samotné písmeno
    x.font = '900 64px "Arial Black", "Baloo 2", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#b8600c'; x.fillText('M', 68, 72);
    x.fillStyle = '#fff8d0'; x.fillText('M', 62, 65);
    x.fillStyle = '#f5a623'; x.fillText('M', 64, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const lic = new THREE.MeshToonMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.32, gradientMap: gradient });
    // okraj: profil (poloměr, výška) — tlustší val na kraji, plocha uvnitř trochu propadlá
    const pr = [[0, 0.045], [0.27, 0.045], [0.3, 0.07], [0.35, 0.075], [0.38, 0.05], [0.385, 0], [0.38, -0.05], [0.35, -0.075], [0.3, -0.07], [0.27, -0.045], [0, -0.045]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const okrajGeo = new THREE.LatheGeometry(pr, 28).rotateX(Math.PI / 2);
    const okraj = new THREE.MeshToonMaterial({ color: '#f0a020', emissive: '#ff9a00', emissiveIntensity: 0.22, gradientMap: gradient });
    const licGeo = new THREE.CircleGeometry(0.3, 28);
    return { lic, okraj, okrajGeo, licGeo };
  })();
  function novaMince() {
    const m = new THREE.Group();
    m.add(new THREE.Mesh(minceDily.okrajGeo, minceDily.okraj));
    const a = new THREE.Mesh(minceDily.licGeo, minceDily.lic); a.position.z = 0.047; m.add(a);
    const b = new THREE.Mesh(minceDily.licGeo, minceDily.lic); b.position.z = -0.047; b.rotation.y = Math.PI; m.add(b);
    return m;
  }
  const hvezdaGeo = (() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.22 : 0.52, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false }); g.center(); return g;
  })();
  const bednaTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 10; x.strokeRect(5, 5, 118, 118);
    x.lineWidth = 8; x.beginPath(); x.moveTo(10, 10); x.lineTo(118, 118); x.stroke();
    x.lineWidth = 3; for (let y = 32; y < 128; y += 32) { x.beginPath(); x.moveTo(10, y); x.lineTo(118, y); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const bednaMat = {};
  // záře kolem mincí a hvězd, aby byly vidět i z dálky a na světlé cestě
  // (22. 11.) slabší než dřív — přepalovala; mince zlatá záře, hvězda růžovofialová, ať se nepletou
  const zareTex = (stred, okraj) => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, stred); g.addColorStop(0.35, okraj); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const zareMat = {
    mince: new THREE.SpriteMaterial({ map: zareTex('rgba(255,230,140,.55)', 'rgba(255,190,40,.25)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }),
    hvezda: new THREE.SpriteMaterial({ map: zareTex('rgba(255,170,240,.7)', 'rgba(200,80,255,.3)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }),
  };
  const zare = (velikost, druh = 'mince') => { const z = new THREE.Sprite(zareMat[druh]); z.scale.setScalar(velikost); z.userData.bezObrysu = true; return z; };

  // ---- stav ----
  const hrac = { draha: 1, x: 0, y: 0, vy: 0, drep: false, drepKlavesa: 0, nesmrtelny: 0, srdce: 3, faze: 0 };
  let level = LEVELY[0], postava = null, rezim = 'klavesy';
  let rychlost = 0, vzdalenost = 0, mince = 0, casHry = 0, dalsiRada = 0, otres = 0, branaPostavena = false, konecHlasen = false;
  const objekty = [], dekorace = [];
  let dalsiDekorace = 0;

  // ---- překážky podle světa ----
  // Tvar říká, co dělat: vysoká věc = uhni, nízká věc přes celou dráhu = skoč, tyč nahoře = dřepni.
  // Modely přírody (Kenney); dokud se nenačtou, jednoduché tvary z kódu.
  const SAND = { dirt: '#d9a35a', grass: '#e8c07a', _defaultMat: '#c98f4f', stone: '#e0b070', stoneDark: '#b8803f' };
  const LAVA = { barvy: { dirt: '#2a1f1f', _defaultMat: '#3a2a2a' }, sviti: { grass: '#ff6a00' } };
  const MESIC = { barvy: { dirt: '#7c7a93', _defaultMat: '#5e5c74' }, sviti: { grass: '#c58bff' } };
  const LED = { stone: '#bfe6ff', _defaultMat: '#ffffff' };
  const SNIH = { stone: '#dfe9f5', _defaultMat: '#ffffff' };
  const ledMat = toon('#a9ddff'), snihMat = toon('#ffffff');
  const obal = m => { const g = new THREE.Group(); g.add(m); return g; };
  function bednaSveta() {
    const a = Math.random() < 0.5;
    switch (svetIndex) {
      case 0: return a ? kus('rock_tallA', { vyska: 1.95, sirka: 1.9 }) : kus('stump_oldTall', { vyska: 1.95, sirka: 1.6 });
      case 1: return a ? kus('cactus_tall', { vyska: 2.5, sirka: 1.6 }) : kus('rock_tallB', { vyska: 1.95, sirka: 1.9, barvy: SAND });
      case 2: if (a) return kus('stone_tallA', { vyska: 1.95, sirka: 1.9, barvy: SNIH }); else { const g = snehulak(); g.scale.setScalar(1.05); return g; }
      case 3: return kus('rock_tallB', { vyska: 1.95, sirka: 1.9, ...LAVA });
      case 4: if (a) return kus('rock_tallA', { vyska: 1.95, sirka: 1.9, ...MESIC }); else { const g = krystal(); g.scale.setScalar(1.25); return g; }
      case 5: return a ? null : kus('tent_detailedClosed', { vyska: 1.7, sirka: 1.95 });   // null = klasická bedna
      case 6: return a ? kus('stump_oldTall', { vyska: 1.95, sirka: 1.7, barvy: { woodBark: '#6a4a2a' } }) : kus('mushroom_redTall', { vyska: 2.3, sirka: 1.8 });
      case 7: if (a) return kus('stone_tallA', { vyska: 1.95, sirka: 1.9, barvy: LED }); else { const m = new THREE.Mesh(G.bedna, ledMat); m.position.y = 0.97; return obal(m); }
    }
    return null;
  }
  function nizkySveta() {
    switch (svetIndex) {
      case 0: case 5: case 6: return kus('log_large', { vyska: 0.84, sirka: 2.1 });
      case 1: return kus('stone_largeC', { vyska: 0.7, sirka: 2.1, barvy: SAND });
      case 2: { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.2, 4, 10), snihMat); m.rotation.z = Math.PI / 2; m.position.y = 0.3; m.scale.y = 1.15; return obal(m); }   // sněhová závěj
      case 3: return kus('rock_largeB', { vyska: 0.8, sirka: 2.1, ...LAVA });
      case 4: return kus('rock_largeB', { vyska: 0.8, sirka: 2.1, ...MESIC });
      case 7: { const m = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 0.9), ledMat); m.position.y = 0.375; return obal(m); }   // ledová kra
    }
    return null;
  }
  // tyč na dřep: dřevěná v lese, ledová s rampouchy v horách, rozžhavená na sopce, neonová na Měsíci
  const STYL_TYCE = { 0: 'drevo', 6: 'drevo', 5: 'drevo', 2: 'led', 7: 'led', 3: 'lava', 4: 'neon', 1: 'pisek' };
  // Nad tyčí je vysoký štít se šipkami dolů (22. 11.): dřív byla jen tyč a postava při skoku vypadala, že ji přeskočí.
  // Teď je z tvaru jasné, že jediná cesta je pod ní.
  const stitTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 150; const x = c.getContext('2d');
    x.fillStyle = '#2b2350'; x.fillRect(0, 0, 256, 150);
    x.fillStyle = '#ffd23f'; for (let i = -1; i < 12; i++) { x.beginPath(); x.moveTo(i * 26, 0); x.lineTo(i * 26 + 13, 0); x.lineTo(i * 26 - 2, 14); x.lineTo(i * 26 - 15, 14); x.fill(); }
    x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 14; x.strokeStyle = '#ffd23f';
    for (const cx of [52, 128, 204]) for (const dy of [0, 34]) { x.beginPath(); x.moveTo(cx - 24, 46 + dy); x.lineTo(cx, 70 + dy); x.lineTo(cx + 24, 46 + dy); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const stitMat = new THREE.MeshToonMaterial({ map: stitTex, gradientMap: gradient, emissive: '#ffffff', emissiveMap: stitTex, emissiveIntensity: 0.25 });
  function vysokySveta() {
    const styl = STYL_TYCE[svetIndex] || 'klasik', m = new THREE.Group();
    const sloupBarva = { drevo: '#6a4325', led: '#ffffff', lava: '#2a1f1f', neon: '#c9b8ff', pisek: '#c98f4f' }[styl] || '#f4f4f4';
    for (const sx of [-1, 1]) { const s = new THREE.Mesh(G.sloup, toon(sloupBarva)); s.position.set(sx * 1.0, 1.6, 0); m.add(s); }
    const stit = new THREE.Mesh(G.stit, stitMat); stit.position.y = 2.5; m.add(stit);
    if (styl === 'drevo') {
      const t = new THREE.Mesh(G.tram, toon('#a8743f')); t.position.y = 1.66; m.add(t);
    } else {
      const barva = { led: '#3d8bff', lava: '#ff6a00', neon: '#ff3dd2', pisek: svet.vysoky }[styl] || svet.vysoky;
      const t = new THREE.Mesh(G.tyc, styl === 'lava' || styl === 'neon' ? svit(barva, 0.9) : toon(barva)); t.position.y = 1.66; m.add(t);
      if (styl === 'led') for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(G.rampouch, toon('#e6f6ff')); r.position.set(-0.9 + i * 0.3, 1.3, 0); r.scale.y = nahoda(0.7, 1.3); m.add(r); }
      if (styl === 'klasik' || styl === 'pisek') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.43, 0.31), toon('#ffffff')); p.position.y = 1.66; m.add(p); }
    }
    return m;
  }

  function pridej(typ, draha, z, navic = null) {
    let m;
    if (typ === 'nizky') { m = nizkySveta(); if (!m) { m = new THREE.Mesh(G.kmen, toon(svet.nizky)); m.position.y = 0.42; } }
    else if (typ === 'vysoky') m = vysokySveta();
    else if (typ === 'bedna') {
      m = bednaSveta();
      if (!m) { m = new THREE.Mesh(G.bedna, bednaMat[svet.bedna] ??= new THREE.MeshToonMaterial({ map: bednaTex, color: svet.bedna })); m.position.y = 0.97; }
    } else if (typ === 'mince') { m = novaMince(); m.position.y = 0.85; m.scale.setScalar(1.35); m.add(zare(1.4)); }
    else if (typ === 'hvezda') { m = new THREE.Mesh(hvezdaGeo, svit('#ff5ad8', 0.4)); m.position.y = 2.75; m.scale.setScalar(1.25); m.add(zare(2.6, 'hvezda')); }
    else if (typ === 'brana') {
      m = new THREE.Group();
      for (const sx of [-1, 1]) { const s = new THREE.Mesh(G.branaSloup, toon('#ffffff')); s.position.set(sx * 4.2, 2.5, 0); m.add(s); }
      const t = new THREE.Mesh(G.branaTyc, svit('#ff4d5e', 0.4)); t.position.y = 4.8; m.add(t);
      for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.52), toon(i % 2 ? '#111111' : '#ffffff')); f.position.set(-3.6 + i * 1.03, 4.8, 0.02); m.add(f); }
    }
    if (typ !== 'mince' && typ !== 'hvezda') { obrys(m, 1.04); stin(m); }
    m.position.x = typ === 'brana' ? 0 : DRAHY[draha]; m.position.z = z;
    scene.add(m);
    objekty.push({ mesh: m, typ, draha, z, hotovo: false, ...navic });
  }
  function rada(z, lehka = false, druha = false) {
    const typ = lehka ? vyber(level.lehke) : vyber(level.typy);
    if (!lehka && !druha && level.dvojita && Math.random() < level.dvojita) rada(z - 8, false, true);   // hned za ní další řada
    // Překážka míří hlavně do dráhy, kde hráč právě je (22. 11.): dřív se losovalo naslepo, a když bedna padla
    // do jiné dráhy, postava běžela rovně a dítě nemuselo nic dělat. Volná dráha je proto většinou jinde než hráč.
    const kde = hrac.draha, jinam = [0, 1, 2].filter(d => d !== kde), nahodna = Math.floor(Math.random() * 3);
    const volna = Math.random() < 0.75 ? vyber(jinam) : nahodna;
    const ostatni = [0, 1, 2].filter(d => d !== volna).sort((a, b) => (b === kde) - (a === kde));
    const vyzva = Math.random() < 0.75 ? kde : nahodna, vedle = [0, 1, 2].filter(d => d !== vyzva);
    const radaMinci = (d, n = 5) => { for (let i = 0; i < n; i++) pridej('mince', d, z - i * 2.2); };
    switch (typ) {
      case 'mince': radaMinci(volna, 6); if (Math.random() < 0.5) pridej('hvezda', vyber(ostatni), z - 6); break;
      case 'blok1': pridej('bedna', ostatni[0], z); radaMinci(volna); break;
      case 'blok2': ostatni.forEach(d => pridej('bedna', d, z)); radaMinci(volna, 4); break;
      case 'nizkyVse': [0, 1, 2].forEach(d => pridej('nizky', d, z)); pridej('hvezda', 1, z); break;
      case 'vysokyVse': [0, 1, 2].forEach(d => pridej('vysoky', d, z)); radaMinci(volna, 3); break;
      case 'nizky1': pridej('nizky', vyzva, z); pridej('hvezda', vyzva, z); pridej('bedna', vyber(vedle), z - 1); break;
      case 'vysoky1': pridej('vysoky', vyzva, z); pridej('bedna', vedle[0], z); radaMinci(vedle[1], 4); break;
      case 'mix': pridej('nizky', ostatni[0], z); pridej('vysoky', ostatni[1], z); radaMinci(volna); break;
      case 'jezdi': { // bedna jezdí mezi dvěma drahami, třetí je volná
        const od = Math.random() < 0.5 ? 0 : 1;
        pridej('bedna', od, z, { jezdi: { od, do: od + 1, faze: Math.random() * 6 } });
        radaMinci(od === 0 ? 2 : 0, 4); break;
      }
    }
  }

  // ---- dekorace po stranách ----
  const M = n => toon(n);
  function strom(barva = '#3f9a3a', snih = false) {
    const g = new THREE.Group();
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.3, 6), M('#7a4a25')); k.position.y = 0.65; g.add(k);
    [[1.7, 1.45], [2.5, 1.15], [3.2, 0.8]].forEach(([y, r]) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, 1.45, 7), M(barva)); c.position.y = y; g.add(c);
      if (snih) { const s = new THREE.Mesh(new THREE.ConeGeometry(r * 0.55, 0.52, 7), M('#ffffff')); s.position.y = y + 0.5; g.add(s); }
    });
    return g;
  }
  function listnac() {
    const g = new THREE.Group();
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.6, 6), M('#7a4a25')); k.position.y = 0.8; g.add(k);
    const barva = vyber(['#4fb342', '#62c24c', '#3e9e3a']);
    [[0, 2.2, 0, 1.2], [0.6, 2.0, 0.2, 0.8], [-0.5, 2.5, -0.2, 0.85]].forEach(([x, y, z, r]) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), M(barva)); s.position.set(x, y, z); g.add(s); });
    return g;
  }
  function kaktus() {
    const g = new THREE.Group(), z = M('#3f9e55');
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 2.6, 8), z); t.position.y = 1.3; g.add(t);
    for (const [sx, y] of [[-1, 1.2], [1, 1.7]]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.8, 7), z); r.position.set(sx * 0.6, y + 0.3, 0); g.add(r);
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 7), z); s.rotation.z = Math.PI / 2; s.position.set(sx * 0.4, y, 0); g.add(s);
    }
    return g;
  }
  function kamen(barva) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(nahoda(0.5, 1.3), 0), M(barva)); m.position.y = 0.3; m.rotation.set(Math.random(), Math.random(), 0); return m; }
  function snehulak() {
    const g = new THREE.Group(), b = M('#ffffff');
    [[0.55, 0.5], [0.4, 1.3], [0.28, 1.9]].forEach(([r, y]) => { const k = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), b); k.position.y = y; g.add(k); });
    const nos = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 6), M('#ff8a2f')); nos.rotation.x = Math.PI / 2; nos.position.set(0, 1.9, 0.3); g.add(nos);
    return g;
  }
  function lavovyKamen() {
    const g = new THREE.Group();
    g.add(kamen('#2a1f1f'));
    const z = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), svit('#ff5a00', 1)); z.position.set(0.3, 0.6, 0.2); g.add(z);
    return g;
  }
  function krystal() {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const k = new THREE.Mesh(new THREE.OctahedronGeometry(nahoda(0.4, 0.9), 0), svit(vyber(['#b06bff', '#4ff3ff', '#ff3dd2']), 0.7));
      k.scale.y = 2; k.position.set(nahoda(-0.6, 0.6), 0.8, nahoda(-0.6, 0.6)); k.rotation.y = Math.random() * 3; g.add(k);
    }
    return g;
  }
  function kvetiny() {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) { const k = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), M(vyber(['#ff6b9a', '#ffd23f', '#ffffff', '#b06bff']))); k.position.set(nahoda(-0.8, 0.8), 0.25, nahoda(-0.8, 0.8)); g.add(k); }
    return g;
  }
  // okolí trati: [funkce, váha]; kd = model přírody s náhodnou výškou. Bez načtených modelů staré tvary z kódu.
  const kd = (n, v, opt = {}) => () => kus(n, { vyska: v * nahoda(0.85, 1.2), ...opt });
  const taborak = () => { const g = kus('campfire_logs', { vyska: 0.35 }); if (!g) return null; const p = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 6), svit('#ffb000', 1)); p.position.y = 0.5; g.add(p); return g; };
  const ledKrystal = () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const k = new THREE.Mesh(new THREE.OctahedronGeometry(nahoda(0.4, 0.9), 0), toon(vyber(['#bfe9ff', '#ffffff', '#8fd0ff']))); k.scale.y = 2; k.position.set(nahoda(-0.6, 0.6), 0.8, nahoda(-0.6, 0.6)); k.rotation.y = Math.random() * 3; g.add(k); } return g; };
  const DEKORACE = {
    0: [[kd('tree_default', 4.4), 3], [kd('tree_oak', 3.8), 3], [kd('tree_detailed', 4.2), 2], [kd('tree_pineRoundA', 4.6), 2], [kd('plant_bushLarge', 0.9), 2], [kd('flower_redA', 0.7), 1], [kd('flower_yellowA', 0.55), 1], [kd('flower_purpleA', 0.6), 1], [kd('rock_smallA', 0.7), 1], [kd('mushroom_red', 0.6), 1]],
    1: [[kd('cactus_tall', 3.2), 3], [kd('cactus_short', 1.8), 2], [kd('tree_palmTall', 5.5), 2], [kd('tree_palmBend', 5), 1], [kd('rock_largeA', 1.0, { barvy: SAND }), 2], [kd('statue_obelisk', 4.5, { barvy: SAND }), 1], [kd('statue_columnDamaged', 2.6, { barvy: SAND }), 1]],
    2: [[() => strom('#2f7a4a', true), 4], [kd('tree_pineTallA', 5, { barvy: { leafsDark: '#2f6a4a' } }), 2], [() => snehulak(), 1], [kd('stone_tallA', 2.2, { barvy: SNIH }), 1]],
    3: [[() => lavovyKamen(), 2], [kd('rock_tallB', 2.6, LAVA), 2], [kd('stump_oldTall', 2, { barvy: { woodBark: '#241a1a' } }), 1], [() => kamen('#3a2a2a'), 1]],
    4: [[() => krystal(), 3], [kd('rock_tallA', 2.2, MESIC), 2], [() => kamen('#6d6b82'), 1]],
    5: [[kd('tree_cone_dark', 5.2), 3], [kd('tree_pineTallC', 5.6), 2], [kd('tent_detailedClosed', 1.9), 1], [taborak, 1], [() => kamen('#3a3a4a'), 1]],
    6: [[kd('tree_tall_dark', 6.2), 3], [kd('tree_thin_dark', 5.2), 2], [kd('tree_fat', 4.2), 2], [kd('tree_plateau_fall', 4.6), 2], [kd('tree_default_fall', 5), 1], [kd('mushroom_redGroup', 1.1), 2], [kd('mushroom_tanTall', 1.4), 1], [kd('stump_roundDetailed', 0.6), 1], [kd('log_stack', 0.9), 1], [kd('grass_large', 0.6), 2]],
    7: [[kd('tree_pineSmallA', 3.2, { barvy: { leafsDark: '#cfe8f5', woodBarkDark: '#8aa8c0' } }), 2], [kd('stone_tallA', 2.4, { barvy: LED }), 2], [ledKrystal, 2], [() => snehulak(), 1]],
  };
  function dekorace1() {
    const seznam = DEKORACE[svetIndex];
    if (seznam) {
      let los = Math.random() * seznam.reduce((s, x) => s + x[1], 0);
      for (const [fn, vaha] of seznam) {
        los -= vaha;
        if (los <= 0) { const d = fn(); if (d) { if (d.children.length === 1 && d.children[0].isGroup) d.userData.model = true; return d; } break; }
      }
    }
    switch (svetIndex) {
      case 0: { const r = Math.random(); return r < 0.45 ? strom() : r < 0.75 ? listnac() : r < 0.9 ? kvetiny() : kamen('#8d8d8d'); }
      case 1: return Math.random() < 0.6 ? kaktus() : kamen('#c98f4f');
      case 2: return Math.random() < 0.78 ? strom('#2f7a4a', true) : snehulak();
      case 3: return Math.random() < 0.5 ? lavovyKamen() : kamen('#3a2a2a');
      case 5: return Math.random() < 0.7 ? strom('#1f4a3a') : kamen('#3a3a4a');
      case 6: return Math.random() < 0.7 ? listnac() : strom('#2f6a3a');
      case 7: return Math.random() < 0.7 ? strom('#9ec4dc', true) : ledKrystal();
      default: return Math.random() < 0.55 ? krystal() : kamen('#6d6b82');
    }
  }
  function pridejDekoraci(z) {
    for (const strana of [-1, 1]) {
      const d = dekorace1();
      if (!d.userData.kvetiny && !d.userData.model) obrys(d, 1.05);   // modely od Kenney obrys nepotřebují (šetří výkon)
      stin(d);
      if (!d.userData.model) d.scale.multiplyScalar(nahoda(0.8, 1.4));
      d.position.set(strana * nahoda(5.2, 18), d.position.y, z + nahoda(-1.5, 1.5));
      d.rotation.y = Math.random() * Math.PI * 2;
      scene.add(d); dekorace.push(d);
    }
  }
  function vycistiDekorace() { for (const d of dekorace) scene.remove(d); dekorace.length = 0; for (let z = 6; z > -140; z -= 3.2) pridejDekoraci(z); }

  // ---- rozpoznávání pohybu (měří se v šířkách ramen) ----
  const P = { baseX: 0.5, baseY: 0.4, sw: 0.15, kalibrace: null, draha: 1, nahore: false, drep: false, ruka: false, videt: false };
  const PRAH = { draha: 0.7, drahaZpet: 0.38, skok: 0.3, skokZpet: 0.13, drep: 0.5, drepZpet: 0.32 };
  function analyzuj(L) {
    const ok = i => L[i] && (L[i].visibility ?? 1) > 0.4;
    P.videt = ok(11) && ok(12);
    if (!P.videt) return false;
    const mx = 1 - (L[11].x + L[12].x) / 2, my = (L[11].y + L[12].y) / 2, sw = Math.max(0.04, Math.abs(L[11].x - L[12].x));
    const vrsek = ok(0) ? L[0].y : my - sw * 0.8;
    const l = ok(15) && L[15].y < vrsek, p = ok(16) && L[16].y < vrsek;
    P.ruka = l || p;
    if (P.kalibrace) { if (!(l && p)) P.kalibrace.push([mx, my, sw]); return false; }
    const posun = (mx - P.baseX) / P.sw, vyska = (P.baseY - my) / P.sw;
    if (posun < -PRAH.draha) P.draha = 0; else if (posun > PRAH.draha) P.draha = 2; else if (Math.abs(posun) < PRAH.drahaZpet) P.draha = 1;
    let skokTed = false;
    if (!P.nahore && vyska > PRAH.skok) { P.nahore = true; skokTed = true; } else if (P.nahore && vyska < PRAH.skokZpet) P.nahore = false;
    if (vyska < -PRAH.drep) P.drep = true; else if (vyska > -PRAH.drepZpet) P.drep = false;
    if (Math.abs(vyska) < 0.15 && !P.ruka) { P.baseY += (my - P.baseY) * 0.02; P.sw += (sw - P.sw) * 0.02; }
    // Zaseknutý dřep nebo skok (22. 11.): když dítě poodejde od kamery nebo k ní, ramena v obraze klesnou/stoupnou
    // a hra si myslela, že je pořád v dřepu. Skutečný dřep pod tyčí trvá pod sekundu — když „dřep“ nebo „nahoře“
    // trvá déle než 1,2 s, hra si novou polohu vezme jako výchozí (posune nulu k ramenům, plynule během ~1 s).
    const ted = performance.now(), krok = Math.min(0.1, (ted - (P.posledni || ted)) / 1000); P.posledni = ted;
    P.mimoT = (P.drep || P.nahore) ? (P.mimoT || 0) + krok : 0;
    if (P.mimoT > 1.2) { P.baseY += (my - P.baseY) * Math.min(1, krok * 3); P.sw += (sw - P.sw) * Math.min(1, krok * 3); }
    return skokTed;
  }
  function dokonciKalibraci() {
    const k = P.kalibrace; P.kalibrace = null;
    if (!k || k.length < 5) return false;
    const pr = i => k.reduce((s, v) => s + v[i], 0) / k.length;
    P.baseX = pr(0); P.baseY = pr(1); P.sw = pr(2); P.draha = 1; P.nahore = false; P.drep = false; P.mimoT = 0;
    return true;
  }

  const pocty = { skok: 0 };
  // Výška skoku je pevná (≈1,8 m), na Měsíci s nízkou gravitací jen o kousek vyšší, zato pomalejší (vznáší se).
  // Dřív stejná rychlost odrazu + poloviční gravitace = dvojnásobná výška, vypadalo to jako dvojskok.
  function skok() { if (hrac.y <= 0.001) { const g = level.gravitace || 31; hrac.vy = Math.sqrt(2 * g * (g < 25 ? 2.2 : 1.8)); SFX.skok(); pocty.skok++; jiskry.vystrel(new THREE.Vector3(hrac.x, 0.1, 0), '#ffffff', 6, 2, 0.4); } }

  function animuj(dt, stav) {
    const g = postava.g;
    if (postava.kenney) {   // postava od Kenney.nl: hotové animace místo hýbání nohama v kódu
      if (stav === 'nahled') { g.position.set(0, 0, 0); g.rotation.set(0, g.rotation.y + dt * 0.9, 0); g.visible = true; }
      else { g.rotation.set(0, 0, (DRAHY[hrac.draha] - hrac.x) * -0.13); g.position.set(hrac.x, hrac.y, 0); g.visible = hrac.nesmrtelny > 0 ? Math.floor(hrac.nesmrtelny * 12) % 2 === 0 : true; }
      hrajAnimaci(postava, stav === 'nahled' ? 'idle' : stav !== 'hra' ? 'idle' : hrac.y > 0.05 ? 'jump' : hrac.drep ? 'crouch' : 'sprint', 0.12);
      if (postava.mixer) postava.mixer.update(dt * (stav === 'hra' ? Math.max(1, rychlost / 9) : 1));
      // modely bez animace dřepu (dinosauři, robot) se při dřepu přimáčknou k zemi
      if (!postava.akce.crouch) {
        const cv = stav === 'hra' && hrac.drep && hrac.y < 0.3 ? 0.55 : 1;
        g.scale.y += (cv - g.scale.y) * Math.min(1, dt * 25); g.scale.x = g.scale.z = 1 + (1 - g.scale.y) * 0.35;
      }
      return;
    }
    if (stav === 'nahled') { g.position.set(0, 0, 0); g.rotation.set(0, g.rotation.y + dt * 0.9, 0); g.scale.setScalar(1); g.visible = true; hrac.faze += dt * 5; }
    else {
      g.rotation.y = 0; g.position.set(hrac.x, hrac.y, 0);
      g.rotation.z = (DRAHY[hrac.draha] - hrac.x) * -0.13;
      const cv = hrac.drep && hrac.y < 0.3 ? 0.55 : 1;
      g.scale.y += (cv - g.scale.y) * Math.min(1, dt * 25);
      g.scale.x = g.scale.z = 1 + (1 - g.scale.y) * 0.35;
      hrac.faze += dt * (stav === 'hra' ? rychlost * 1.25 : 4);
      g.visible = hrac.nesmrtelny > 0 ? Math.floor(hrac.nesmrtelny * 12) % 2 === 0 : true;
    }
    const vz = hrac.y > 0.05 && stav === 'hra', s = Math.sin(hrac.faze);
    postava.nohy[0].rotation.x = vz ? -0.7 : s * 0.9; postava.nohy[1].rotation.x = vz ? 0.4 : -s * 0.9;
    postava.ruce[0].rotation.x = vz ? -2.4 : -s * 0.8; postava.ruce[1].rotation.x = vz ? -2.4 : s * 0.8;
    if (postava.ocas) postava.ocas.rotation.y = Math.sin(hrac.faze * 0.5) * 0.35;
    if (postava.plameny) postava.plameny.forEach(p => { p.visible = vz; p.scale.y = 0.8 + Math.random() * 0.5; });
    if (postava.kridla) postava.kridla.forEach((k, i) => k.rotation.z = (i ? -1 : 1) * (vz ? Math.sin(hrac.faze * 2) * 0.6 : 0.15 + Math.sin(hrac.faze * 0.5) * 0.08));
  }

  const api = {
    scene, camera, P, PRAH, analyzuj, dokonciKalibraci, pocty, trenink: false,
    drahaHrace: () => hrac.draha, drepHrace: () => hrac.drep,
    nastavPostavu(id) {
      if (postava) scene.remove(postava.g);
      postava = (BEZCI.find(b => b.id === id) || BEZCI[0]).vytvor();
      scene.add(postava.g);
    },
    pripravit(lv, idPostavy, rz) {
      level = lv; rezim = rz;
      for (const o of objekty) scene.remove(o.mesh); objekty.length = 0;
      jiskry.skryj();
      Object.assign(hrac, { draha: 1, x: 0, y: 0, vy: 0, drep: false, drepKlavesa: 0, nesmrtelny: 0, srdce: 3 });
      rychlost = 0; vzdalenost = 0; mince = 0; casHry = 0; otres = 0; branaPostavena = false; konecHlasen = false;
      api.nastavPostavu(idPostavy);
      postava.g.rotation.set(0, 0, 0); postava.g.scale.setScalar(1);
      prepniSvet(lv.svet, true);
      scene.fog.near = lv.tma ? lv.tma * 0.25 : 45; scene.fog.far = lv.tma || 150;
      vycistiDekorace();
      // první překážky už po 30 metrech
      rada(-30, true); rada(-52); rada(-76); rada(-100);
      dalsiRada = 14;
    },
    nahled(idPostavy) { api.nastavPostavu(idPostavy); prepniSvet(0, true); scene.fog.near = 45; scene.fog.far = 150; if (!dekorace.length) vycistiDekorace(); },
    zacatekOdpoctu() { if (rezim === 'kamera') P.kalibrace = []; },
    behemOdpoctu(zbyva) { if (rezim === 'kamera' && zbyva > 1.6) P.kalibrace = []; },
    konecOdpoctu() { return rezim !== 'kamera' || dokonciKalibraci(); },
    klavesa(e) {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') hrac.draha = Math.max(0, hrac.draha - 1);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') hrac.draha = Math.min(2, hrac.draha + 1);
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') { skok(); e.preventDefault(); }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { hrac.drepKlavesa = 0.7; if (hrac.y > 0) hrac.vy = Math.min(hrac.vy, -14); }
    },
    stavKamery() {
      if (!P.videt) return null;
      if (P.kalibrace) return t('pose.calib');
      if (P.nahore) return t('pose.jump');
      if (P.drep) return t('pose.duck');
      return t(['pose.left', 'pose.mid', 'pose.right'][P.draha]) + (P.ruka ? t('pose.hand') : '');
    },
    vodítko(kctx, w, h) { const cx = P.baseX * w, s = P.sw * w * PRAH.draha; kctx.fillStyle = 'rgba(79,243,255,.15)'; kctx.fillRect(cx - s, 0, s * 2, h); },
    hud() {
      return {
        vlevo: '❤'.repeat(Math.max(0, hrac.srdce)) + '♡'.repeat(Math.max(0, 3 - hrac.srdce)),
        stred: level.nekonecny ? Math.floor(vzdalenost) + mince * 5 : Math.floor(vzdalenost) + ' m',
        stredPopis: level.nekonecny ? t('hud.points') : t('hud.goal', { n: level.cil }),
        mince, postup: level.nekonecny ? null : Math.min(1, vzdalenost / level.cil),
      };
    },
    aktualizuj(dt, stav, snimek) {
      if (snimek && snimek.novy && snimek.L && rezim === 'kamera') { if (analyzuj(snimek.L) && stav === 'hra') skok(); }
      else if (snimek && snimek.novy && !snimek.L) P.videt = false;

      if (stav === 'hra') {
        if (!api.trenink) casHry += dt;
        rychlost = api.trenink ? 0 : Math.min(level.rychlost[1], level.rychlost[0] + casHry * 0.12);   // start rychlejší než dřív (vypadal jako zpomalený záběr)   // v návodu stojí na místě
        const dz = rychlost * dt;
        vzdalenost += dz; cestaTex.offset.y += dz / 10;
        if (rezim === 'kamera') hrac.draha = P.draha;
        hrac.drepKlavesa = Math.max(0, hrac.drepKlavesa - dt);
        hrac.drep = (rezim === 'kamera' && P.drep) || hrac.drepKlavesa > 0;
        hrac.x += (DRAHY[hrac.draha] - hrac.x) * Math.min(1, dt * 18);
        hrac.vy -= (level.gravitace || 31) * dt; hrac.y = Math.max(0, hrac.y + hrac.vy * dt);
        if (hrac.y === 0) hrac.vy = Math.max(hrac.vy, 0);
        hrac.nesmrtelny = Math.max(0, hrac.nesmrtelny - dt);

        // nové řady, a před cílem brána
        const doCile = level.cil - vzdalenost;
        dalsiRada -= dz;
        if (dalsiRada <= 0 && doCile > 120) { rada(-110); dalsiRada = (nahoda(12, 17) + rychlost * 0.4) * level.hustota; }   // mezery kratší než dřív (15–22), bez hluchých úseků
        if (!branaPostavena && doCile <= 110) { pridej('brana', 1, -doCile); branaPostavena = true; }

        const ruka = rezim === 'kamera' && P.ruka;
        for (let i = objekty.length - 1; i >= 0; i--) {
          const o = objekty[i];
          o.z += dz; o.mesh.position.z = o.z;
          if (o.typ === 'mince' || o.typ === 'hvezda') o.mesh.rotation.y += dt * 2.5;   // pomaleji, ať je obrázek na minci vidět
          if (o.jezdi) { const k = (Math.sin(casHry * 2.2 + o.jezdi.faze) + 1) / 2; o.mesh.position.x = DRAHY[o.jezdi.od] + (DRAHY[o.jezdi.do] - DRAHY[o.jezdi.od]) * k; }
          if (o.typ === 'brana') { if (o.z > 0 && !konecHlasen) { konecHlasen = true; SFX.vyhra(); jiskry.vystrel(new THREE.Vector3(hrac.x, 2, -1), '#ffd23f', 40, 7, 1.2); ctx.konec({ vyhra: true, mince, srdce: hrac.srdce, vzdalenost }); } }
          else if (!o.hotovo && Math.abs(o.z) < 0.7 && Math.abs(hrac.x - o.mesh.position.x) < 1.0) {
            if (o.typ === 'mince' && hrac.y < 1.6) { o.hotovo = true; mince++; SFX.mince(); jiskry.vystrel(o.mesh.position, '#ffd23f', 6, 3, 0.4); scene.remove(o.mesh); }
            else if (o.typ === 'hvezda' && (hrac.y > 0.7 || ruka)) { o.hotovo = true; mince += 3; SFX.hvezda(); jiskry.vystrel(o.mesh.position, '#ff9be8', 16, 5, 0.7); scene.remove(o.mesh); ctx.banner('+3', '#ff7ae0'); }
            else if (o.typ === 'nizky' || o.typ === 'vysoky' || o.typ === 'bedna') {
              const narazil = o.typ === 'nizky' ? hrac.y < 0.82 : o.typ === 'vysoky' ? !hrac.drep || hrac.y > 0.3 : true;
              if (narazil && hrac.nesmrtelny === 0) {
                o.hotovo = true; hrac.srdce--; hrac.nesmrtelny = 1.6; otres = 0.35; SFX.zasah(); ctx.zasah();
                jiskry.vystrel(new THREE.Vector3(hrac.x, 1, 0), '#ffffff', 14, 5, 0.5);
                if (hrac.srdce <= 0 && !konecHlasen) { konecHlasen = true; SFX.prohra(); ctx.konec({ vyhra: false, mince, srdce: 0, vzdalenost }); }
              } else if (!narazil) o.hotovo = true;
            }
          }
          if (o.z > 9) { scene.remove(o.mesh); objekty.splice(i, 1); }
        }
        if (level.nekonecny) {
          const ns = Math.floor(vzdalenost / 350) % SVETY.length;
          if (ns !== svetIndex) { prepniSvet(ns); SFX.svet(); ctx.banner(tn(svet.jmeno), '#ffffff'); }
        }
        jiskry.aktualizuj(dt, dz);
      } else jiskry.aktualizuj(dt, 0);

      const pohyb = stav === 'hra' ? rychlost * dt : (stav === 'konec' ? 0 : 3 * dt);
      if (stav !== 'hra' && stav !== 'konec') cestaTex.offset.y += pohyb / 10;
      dalsiDekorace -= pohyb;
      for (let i = dekorace.length - 1; i >= 0; i--) { const d = dekorace[i]; d.position.z += pohyb; if (d.position.z > 10) { scene.remove(d); dekorace.splice(i, 1); } }
      if (dalsiDekorace <= 0) { pridejDekoraci(-140); dalsiDekorace = 3.2; }

      const k = Math.min(1, dt * 2.5);
      nebe.prechod(svet.nahore, svet.dole, k); zemMat.color.lerp(cil.zem, k); scene.fog.color.lerp(cil.mlha, k);

      animuj(dt, stav === 'nahled' ? 'nahled' : stav);
      otres = Math.max(0, otres - dt);
      camera.position.set(KAM.x + hrac.x * 0.35 + (Math.random() - 0.5) * otres, KAM.y + hrac.y * 0.25 + (Math.random() - 0.5) * otres, KAM.z);
      camera.lookAt(hrac.x * 0.5, 1.3 + hrac.y * 0.3, -6);
      camera.fov = 62 + Math.max(0, rychlost - 9) * 0.6; camera.updateProjectionMatrix();
      nebe.mesh.position.copy(camera.position);
      slunce.position.set(hrac.x + 7, 14, 6); slunce.target.position.set(hrac.x, 0, -4);
    },
    skocNa(m) { vzdalenost = m; },
    // jen pro zkoušení: co je před hráčem
    ladeni: () => ({ x: hrac.x, y: hrac.y, draha: hrac.draha, srdce: hrac.srdce, vzdalenost, konec: konecHlasen, pred: objekty.filter(o => !o.hotovo && o.z < 0.7 && o.z > -30).map(o => ({ typ: o.typ, x: o.mesh.position.x, z: o.z, jezdi: !!o.jezdi })) }),
    klavesaSim(code) { api.klavesa({ code, preventDefault() {} }); },
    ukoncit() { if (!konecHlasen) { konecHlasen = true; SFX.prohra(); ctx.konec({ vyhra: false, mince, srdce: hrac.srdce, vzdalenost }); } },
  };
  prepniSvet(0, true);
  return api;
}
