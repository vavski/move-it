// Další běžci: čtyři vlastní ztřeštěné postavičky (převzaté ze starší hry Uhni!) a 11 postav od Kenney.nl
// (licence CC0 — volně i komerčně, soubory v ../postavy/, mají animace běhu, skoku a dřepu).
import { THREE, toon, svit, obrys, stin, gradient } from './zaklad.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const mat = barva => toon(barva);
const CESTA_POSTAV = new URL('postavy/', document.baseURI).href;

// společné nožičky a ručičky, ať se všechny hýbou stejně jako Dino
function koncetiny(g, barva, { kycelY = 0.62, kycelX = 0.24, ramenoY = 1.3, ramenoX = 0.5, ramenoZ = 0, bota = '#ffffff' } = {}) {
  const nohy = [], ruce = [];
  for (const sx of [-1, 1]) {
    const kycel = new THREE.Group(); kycel.position.set(sx * kycelX, kycelY, 0);
    const noha = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.56, 7), mat(barva)); noha.position.y = -0.28; kycel.add(noha);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.38), mat(bota)); b.position.set(0, -0.58, -0.06); kycel.add(b);
    g.add(kycel); nohy.push(kycel);
    const rameno = new THREE.Group(); rameno.position.set(sx * ramenoX, ramenoY, ramenoZ);
    const ruka = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.46, 6), mat(barva)); ruka.position.y = -0.22; rameno.add(ruka);
    const dlan = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat('#ffffff')); dlan.position.y = -0.48; rameno.add(dlan);
    g.add(rameno); ruce.push(rameno);
  }
  return { nohy, ruce };
}
function oci(g, y, z, x = 0.16, velikost = 0.12) {
  for (const sx of [-1, 1]) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(velikost, 12, 10), mat('#ffffff')); o.position.set(sx * x, y, z); g.add(o);
    const z2 = new THREE.Mesh(new THREE.SphereGeometry(velikost * 0.5, 8, 6), mat('#111111')); z2.position.set(sx * x, y, z - velikost * 0.8); g.add(z2);
  }
}
const hotovo = (g, ostatni) => { obrys(g, 1.04); stin(g); return { g, ...ostatni }; };

// KAFÍNO BĚŽÍNO — hrnek kafe na nožičkách, kouří se mu z hlavy
function kafino() {
  const g = new THREE.Group();
  const hrnek = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 1.0, 20), mat('#ffffff')); hrnek.position.y = 1.15; g.add(hrnek);
  const pruh = new THREE.Mesh(new THREE.CylinderGeometry(0.555, 0.53, 0.18, 20), mat('#ff4d5e')); pruh.position.y = 0.95; g.add(pruh);
  const kafe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 20), mat('#6b3b1c')); kafe.position.y = 1.64; g.add(kafe);
  const ucho = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 8, 16, Math.PI * 1.2), mat('#ffffff')); ucho.position.set(0.58, 1.2, 0); ucho.rotation.z = -Math.PI * 0.6; g.add(ucho);
  oci(g, 1.3, -0.5, 0.2, 0.13);
  const pusa = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12, Math.PI), mat('#222222')); pusa.position.set(0, 1.08, -0.53); pusa.rotation.z = Math.PI; g.add(pusa);
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.14 - i * 0.02, 8, 6), new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })); p.position.set(-0.15 + i * 0.15, 1.85 + i * 0.25, 0); g.add(p); }
  return hotovo(g, { ...koncetiny(g, '#6b3b1c', { kycelY: 0.68, ramenoY: 1.25, ramenoX: 0.56, bota: '#ff4d5e' }), vyska: 2.1 });
}
// BANÁNO SPORTIVO — banán s čelenkou a slunečními brýlemi
function banano() {
  const g = new THREE.Group();
  const krivka = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.55, 0.15), new THREE.Vector3(0, 1.1, -0.08), new THREE.Vector3(0, 1.7, 0.05), new THREE.Vector3(0, 2.15, 0.35)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(krivka, 20, 0.33, 12), mat('#ffe14d')));
  const spicka = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 8), mat('#5a3a1a')); spicka.position.set(0, 2.3, 0.45); spicka.rotation.x = -0.6; g.add(spicka);
  const celenka = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.06, 6, 20), mat('#ff3dd2')); celenka.position.set(0, 1.82, 0.08); celenka.rotation.x = Math.PI / 2 + 0.15; g.add(celenka);
  const bryle = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.06), mat('#111111')); bryle.position.set(0, 1.55, -0.32); g.add(bryle);
  for (const sx of [-1, 1]) { const sklo = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.04), svit('#4ff3ff', 0.9)); sklo.position.set(sx * 0.15, 1.55, -0.36); g.add(sklo); }
  const pusa = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12, Math.PI), mat('#5a3a1a')); pusa.position.set(0, 1.3, -0.36); pusa.rotation.z = Math.PI; g.add(pusa);
  return hotovo(g, { ...koncetiny(g, '#c9a227', { kycelY: 0.6, ramenoY: 1.2, ramenoX: 0.36, bota: '#4ff3ff' }), vyska: 2.3 });
}
// ŽRALOKO TENISKO — tenisák se žraločí ploutví a zuby
function zraloko() {
  const g = new THREE.Group();
  const bota = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 1.3), mat('#6fa8dc')); bota.position.set(0, 1.0, 0.05); g.add(bota);
  const spicka = new THREE.Mesh(new THREE.SphereGeometry(0.43, 14, 10), mat('#6fa8dc')); spicka.scale.set(1, 0.85, 0.9); spicka.position.set(0, 0.95, -0.6); g.add(spicka);
  const podrazka = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 1.75), mat('#ffffff')); podrazka.position.set(0, 0.62, -0.12); g.add(podrazka);
  const bricho = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.3, 1.2), mat('#e8f2fb')); bricho.position.set(0, 0.82, 0); g.add(bricho);
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.04, 0.08), mat('#ffffff')); t.position.set(0, 1.25, 0.15 + i * 0.16); g.add(t); }
  const ptvar = new THREE.Shape(); ptvar.moveTo(-0.35, 0); ptvar.lineTo(0.4, 0); ptvar.quadraticCurveTo(0.25, 0.45, 0.55, 0.85); ptvar.quadraticCurveTo(-0.05, 0.55, -0.35, 0);
  const ploutev = new THREE.Mesh(new THREE.ExtrudeGeometry(ptvar, { depth: 0.1, bevelEnabled: false }), mat('#3d6fa0'));
  ploutev.rotation.y = Math.PI / 2; ploutev.position.set(-0.05, 1.37, 0.25); g.add(ploutev);
  for (let i = 0; i < 6; i++) { const z = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 4), mat('#ffffff')); z.position.set(-0.27 + i * 0.11, 0.84, -0.98); z.rotation.x = Math.PI; g.add(z); }
  oci(g, 1.22, -0.88, 0.22, 0.11);
  return hotovo(g, { ...koncetiny(g, '#3d6fa0', { kycelY: 0.56, kycelX: 0.28, ramenoY: 1.15, ramenoX: 0.5, bota: '#ff9b2f' }), vyska: 1.9 });
}
// PIZZA MIAUZZA — kousek pizzy s kočičíma ušima a vousky
function pizza() {
  const g = new THREE.Group();
  const tvar = new THREE.Shape(); tvar.moveTo(0, -0.85); tvar.lineTo(0.62, 0.75); tvar.quadraticCurveTo(0, 0.95, -0.62, 0.75); tvar.lineTo(0, -0.85);
  const telo = new THREE.Mesh(new THREE.ExtrudeGeometry(tvar, { depth: 0.22, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 }), mat('#ffb347'));
  telo.position.set(0, 1.45, 0.1); g.add(telo);
  const kurka = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.35, 10), mat('#c9782d')); kurka.rotation.z = Math.PI / 2; kurka.position.set(0, 2.25, 0.2); g.add(kurka);
  for (const z of [-0.02, 0.38]) for (const [x, y] of [[-0.2, 1.7], [0.22, 1.85], [0, 1.25], [-0.1, 2.0]]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12), mat('#d6362f')); s.rotation.x = Math.PI / 2; s.position.set(x, y, z); g.add(s); }
  for (const sx of [-1, 1]) { const u = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 4), mat('#c9782d')); u.position.set(sx * 0.42, 2.48, 0.2); g.add(u); }
  oci(g, 1.55, -0.04, 0.17, 0.11);
  for (const sx of [-1, 1]) for (const dy of [-0.04, 0.04]) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.015, 0.015), mat('#222222')); v.position.set(sx * 0.3, 1.38 + dy, -0.06); v.rotation.z = sx * dy * 4; g.add(v); }
  const ocas = new THREE.Group(); ocas.position.set(0, 1.0, 0.35);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.8, 6), mat('#c9782d')); o.position.y = 0.35; o.rotation.x = 0.4; ocas.add(o); g.add(ocas);
  return hotovo(g, { ...koncetiny(g, '#c9782d', { kycelY: 0.62, kycelX: 0.16, ramenoY: 1.5, ramenoX: 0.45, bota: '#7cff6b' }), ocas, vyska: 2.4 });
}

// ---- postavy od Kenney.nl: načtou se na pozadí, do té doby je skupina prázdná ----
const loader = new GLTFLoader();
const cache = {};
const VYSKA_KENNEY = 2.3;
// Tomík a Anička mají v původním modelu tmavou pleť; v kopii barevné mapy ji přebarvíme na světlou.
const SVETLA_KUZE = new Set(['male-a', 'female-a']);
let svetlaTex = null;
function texSvetlaKuze(puvodni) {
  if (svetlaTex) return svetlaTex;
  const img = puvodni.image, c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    // tmavá pleť je v mapě přechod od (134,85,66) do (182,101,69); zachováme stínování přechodu
    const r = p[i], g = p[i + 1], b = p[i + 2];
    if (r >= 128 && r <= 188 && g >= 82 && g <= 104 && b >= 62 && b <= 71) {
      const f = Math.min(1, Math.max(0, (r - 134) / 48));
      p[i] = 214 + f * 36; p[i + 1] = 163 + f * 47; p[i + 2] = 128 + f * 50;
    }
  }
  x.putImageData(d, 0, 0);
  svetlaTex = new THREE.CanvasTexture(c);
  for (const k of ['flipY', 'colorSpace', 'magFilter', 'minFilter', 'wrapS', 'wrapT', 'channel']) svetlaTex[k] = puvodni[k];
  return svetlaTex;
}
function kenney(id) {
  const g = new THREE.Group();
  const p = { g, nohy: [], ruce: [], kenney: true, mixer: null, akce: {}, anim: null, vyska: 2.1 };
  (cache[id] ??= loader.loadAsync(CESTA_POSTAV + 'character-' + id + '.glb')).then(gltf => {
    const model = SkeletonUtils.clone(gltf.scene);
    if (SVETLA_KUZE.has(id)) model.traverse(o => {
      if (o.isMesh && o.material && o.material.map) { o.material = o.material.clone(); o.material.map = texSvetlaKuze(o.material.map); }
    });
    model.scale.setScalar(VYSKA_KENNEY); model.rotation.y = Math.PI;   // model kouká k nám, hráč běží od kamery
    g.add(model); stin(g);
    p.mixer = new THREE.AnimationMixer(model);
    for (const n of ['idle', 'sprint', 'jump', 'fall', 'crouch', 'emote-yes']) {
      const clip = THREE.AnimationClip.findByName(gltf.animations, n);
      if (!clip) continue;
      p.akce[n] = p.mixer.clipAction(clip);
      if (['jump', 'crouch', 'emote-yes'].includes(n)) { p.akce[n].setLoop(THREE.LoopOnce); p.akce[n].clampWhenFinished = true; }
    }
  }).catch(() => {});
  return p;
}
// ---- hotové modely s animacemi (Quaternius, CC0): dinosauři a robot ----
// mapa = jak se jmenuje animace v souboru; dřep většina nemá – hra pak postavu jen přimáčkne k zemi.
// barvy = přebarvení materiálů podle jména (varianty jako Lávový dino nebo Zlatý robot).
const modely = {};
// Měkčí stínování než u postav z kódu: hotové modely mají hodně malých plošek a při ostrých třech odstínech
// při otáčení blikaly („lesk po pixelech“) a ze zadu byly moc tmavé.
const GRAD_MODEL = (() => {
  const d = new Uint8Array([165, 165, 165, 255, 215, 215, 215, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
// po = funkce, která modelu něco přidá (vlasy, zorničky) ještě před změřením výšky; dostane model a THREE.
export function model(soubor, { vyska = 2.3, otoc = Math.PI, mapa = {}, barvy = {}, toonStyl = true, skok = 0.75, vznasi = 0, po = null, jas = 1 } = {}) {
  const g = new THREE.Group();
  const p = { g, nohy: [], ruce: [], kenney: true, mixer: null, akce: {}, anim: null, vyska };
  (modely[soubor] ??= loader.loadAsync(CESTA_POSTAV + soubor)).then(gltf => {
    const m = SkeletonUtils.clone(gltf.scene);
    m.traverse(o => {
      if (!o.isMesh) return;
      const prevod = mt => {
        const barva = barvy[mt.name] ?? '#' + mt.color.getHexString();
        if (!toonStyl && !barvy[mt.name]) return mt;
        const n = toonStyl ? new THREE.MeshToonMaterial({ color: barva, gradientMap: GRAD_MODEL }) : mt.clone();
        if (!toonStyl) n.color.set(barva);
        if (jas !== 1) n.color.multiplyScalar(jas);   // zesvětlení modelů s barvami v obrázku (slepice)
        n.name = mt.name; if (mt.map) n.map = mt.map;
        // oči a obličej leží těsně na hlavě; bez posunu z dálky problikávaly
        if (/face|eye/i.test(mt.name)) { n.polygonOffset = true; n.polygonOffsetFactor = -2; n.polygonOffsetUnits = -2; }
        return n;
      };
      o.material = Array.isArray(o.material) ? o.material.map(prevod) : prevod(o.material);
      o.frustumCulled = false;
    });
    // výška a postavení na zem podle skutečné velikosti modelu
    m.updateMatrixWorld(true);
    if (po) { po(m, THREE); m.updateMatrixWorld(true); }
    const box = new THREE.Box3().setFromObject(m), v = box.max.y - box.min.y || 1;
    const obal = new THREE.Group(); obal.add(m);
    m.scale.multiplyScalar(vyska / v); m.position.y = -box.min.y * (vyska / v);
    obal.rotation.y = otoc; obal.position.y = vznasi;   // vznáší = létající postava se drží nad zemí
    g.add(obal); stin(g);
    p.mixer = new THREE.AnimationMixer(m);
    for (const [nase, jejich] of Object.entries({ idle: 'Idle', sprint: 'Run', jump: 'Jump', ...mapa })) {
      if (!jejich) continue;
      const clip = gltf.animations.find(a => a.name === jejich || a.name.endsWith('|' + jejich) || a.name.toLowerCase().endsWith(jejich.toLowerCase()));
      if (!clip) continue;
      const ak = p.mixer.clipAction(clip);
      // kotoul (Roll) se opakuje, dokud je dítě v dřepu; ostatní dřepy a skok jen jednou
      if (nase === 'jump' || (nase === 'crouch' && !/roll/i.test(clip.name))) { ak.setLoop(THREE.LoopOnce); ak.clampWhenFinished = true; }
      if (nase === 'jump') ak.timeScale = clip.duration / skok;   // skok ve hře trvá asi 0,75 s
      p.akce[nase] = ak;
    }
  }).catch(e => console.warn('model', soubor, e));
  return p;
}

export function hrajAnimaci(p, jmeno, prechod = 0.15) {
  if (!p.mixer || p.anim === jmeno || !p.akce[jmeno]) return;
  p.akce[jmeno].reset().fadeIn(prechod).play();
  if (p.anim && p.akce[p.anim]) p.akce[p.anim].fadeOut(prechod);
  p.anim = jmeno;
}

export const DALSI_BEZCI = [
  // Kafíno, Bára a Kuba (21. 11.) vyřazeni – nikomu nic neříkali. Funkce kafino() v souboru zůstala, kdyby se hodila.
  // Banáno, Žraloko a Pizza (21. 11.) vyřazeni – vypadali nedodělaně; funkce zůstaly v souboru.
  // Tomík a Anička = výchozí postavy zdarma (se světlou pletí, viz SVETLA_KUZE)
  ...[['male-a', 'Tomík', 0], ['female-a', 'Anička', 0],
    ['worker', 'Stavař', 380], ['soldier', 'Voják', 450], ['raider', 'Pirát', 520], ['zombie', 'Zombík', 800],
    ['robot', 'Plecháč', 1000], ['knight', 'Rytíř', 1400], ['alien', 'Ufoň', 1600]]
    .map(([soubor, jmeno, cena]) => ({ id: 'k-' + soubor, jmeno, cena, vytvor: () => kenney(soubor) })),
];
