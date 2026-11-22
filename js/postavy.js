// Postavičky. Běžci se vidí zezadu, letci taky. Všechno z jednoduchých tvarů v kresleném stylu.
import { THREE, toon, svit, pruhledny, obrys, stin } from './zaklad.js';
import { ptak2, drak2, vazka2, letecModel } from './letci.js';
import { model } from './bezci.js';
const VYSKA = 2.6;   // výška všech lidí a robotů
const CLOVEK = { vyska: VYSKA, mapa: { crouch: 'Roll' }, barvy: { Skin: '#f3c7a1' } };
const ZVIRE = { vyska: 2.1, mapa: { sprint: 'Gallop', jump: 'Gallop_Jump' } };
// Karatista je holohlavý a zezadu splýval s hnědou cestou → černé vlasy přidělané na kost hlavy.
function vlasy(barva) {
  return (m, THREE) => {
    const hlava = m.getObjectByName('Head'); if (!hlava) return;
    const geo = new THREE.SphereGeometry(0.56, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const v = new THREE.Mesh(geo, toon(barva)); v.scale.set(1, 0.95, 1.05);
    v.position.set(-0.1, 2.47, -0.05); v.rotation.x = -0.55; v.castShadow = true;
    m.add(v); m.updateMatrixWorld(true); hlava.attach(v);
  };
}
// Postava z kódu zvětšená na výšku ostatních (původní dino byl menší než lidé).
function vetsi(p, k) { const obal = new THREE.Group(); p.g.scale.setScalar(k); obal.add(p.g); p.g = obal; p.vyska *= k; return p; }

const S = (r, w = 14, h = 12) => new THREE.SphereGeometry(r, w, h);
const B = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const C = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const K = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
function dej(g, geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; }

// ================= BĚŽCI =================
function dino(o) {
  const g = new THREE.Group();
  const telo = toon(o.telo), bricho = toon(o.bricho), ostny = o.ostnySviti ? svit(o.ostny, 0.9) : toon(o.ostny);
  const t = dej(g, S(0.56), telo, 0, 1.02, 0); t.scale.set(1, 1.1, 1.18);
  const b = dej(g, S(0.42, 12, 10), bricho, 0, 0.98, -0.36); b.scale.set(1, 1.15, 0.6);
  dej(g, B(0.66, 0.54, 0.74), telo, 0, 1.78, -0.3);
  dej(g, B(0.56, 0.32, 0.44), telo, 0, 1.66, -0.84);
  for (const sx of [-1, 1]) {
    dej(g, S(0.12, 10, 8), toon('#ffffff'), sx * 0.21, 1.93, -0.6);
    dej(g, S(0.06, 8, 6), toon(o.oci || '#111111'), sx * 0.21, 1.93, -0.71);
    if (o.rohy) { const r = dej(g, K(0.08, 0.36, 6), toon('#ffd23f'), sx * 0.2, 2.17, -0.2); r.rotation.x = -0.5; r.rotation.z = -sx * 0.25; }
  }
  [[2.1, -0.22], [1.78, 0.14], [1.45, 0.47], [1.1, 0.64], [0.8, 0.68]].forEach(([y, z], i) => {
    const s = dej(g, K(0.15 - i * 0.012, 0.34, 5), ostny, 0, y, z); s.rotation.x = 0.9;
  });
  const ocas = new THREE.Group(); ocas.position.set(0, 0.85, 0.55); g.add(ocas);
  const om = dej(ocas, K(0.3, 1.1, 10), telo, 0, 0, 0.5); om.rotation.x = Math.PI / 2 + 0.25;
  const nohy = [], ruce = [];
  for (const sx of [-1, 1]) {
    const k = new THREE.Group(); k.position.set(sx * 0.3, 0.68, 0); g.add(k);
    dej(k, C(0.18, 0.15, 0.62, 8), telo, 0, -0.3, 0);
    dej(k, B(0.32, 0.14, 0.44), telo, 0, -0.6, -0.08);
    nohy.push(k);
    const r = new THREE.Group(); r.position.set(sx * 0.43, 1.35, -0.32); g.add(r);
    dej(r, C(0.075, 0.06, 0.38, 6), telo, 0, -0.17, 0);
    ruce.push(r);
  }
  let kridla = null;
  if (o.kridla) {
    kridla = [];
    const tvar = new THREE.Shape(); tvar.moveTo(0, 0); tvar.lineTo(1.1, 0.5); tvar.lineTo(1.0, -0.1); tvar.lineTo(0.75, 0.1); tvar.lineTo(0.55, -0.25); tvar.lineTo(0.3, -0.05); tvar.closePath();
    for (const sx of [-1, 1]) {
      const geo = new THREE.ShapeGeometry(tvar); geo.scale(sx, 1, 1);
      const k = new THREE.Group(); k.position.set(sx * 0.35, 1.5, 0.35); g.add(k);
      const m = new THREE.Mesh(geo, pruhledny(o.kridla, 0.85)); m.rotation.y = sx * 0.5; k.add(m);
      kridla.push(k);
    }
  }
  obrys(g); stin(g);
  return { g, nohy, ruce, ocas, kridla, vyska: 2.1 };
}
function robot(o) {
  const g = new THREE.Group();
  const telo = toon(o.telo), kov = toon(o.kov), tmava = toon('#1c2233'), svetlo = svit(o.svetlo, 1);
  dej(g, B(0.86, 0.84, 0.54), telo, 0, 1.18, 0);
  dej(g, S(0.13, 10, 8), svetlo, 0, 1.25, -0.28);                         // jádro na hrudi
  dej(g, B(0.72, 0.14, 0.48), tmava, 0, 0.72, 0);
  for (const sx of [-1, 1]) { const ram = dej(g, B(0.36, 0.22, 0.6), kov, sx * 0.58, 1.62, 0); ram.rotation.z = sx * 0.25; }
  dej(g, B(0.62, 0.5, 0.52), kov, 0, 1.88, 0);
  dej(g, B(0.52, 0.18, 0.06), svetlo, 0, 1.9, -0.27);                     // svítící hledí
  dej(g, C(0.025, 0.025, 0.32, 6), tmava, 0.2, 2.25, 0);
  dej(g, S(0.08, 10, 8), svit(o.anten || '#ff4d5e', 1), 0.2, 2.43, 0);
  const batoh = dej(g, B(0.6, 0.66, 0.3), kov, 0, 1.22, 0.4);
  // svítící pruhy na zádech — hlavní pohled je zezadu
  for (const sx of [-1, 1]) dej(g, B(0.06, 0.5, 0.02), svetlo, sx * 0.18, 1.24, 0.56);
  if (o.ploutve) for (const sx of [-1, 1]) { const p = dej(g, B(0.05, 0.5, 0.4), svit(o.svetlo, 0.5), sx * 0.36, 1.45, 0.5); p.rotation.z = sx * 0.6; }
  const plameny = [];
  for (const sx of [-1, 1]) {
    dej(g, C(0.1, 0.13, 0.22, 10), tmava, sx * 0.17, 0.82, 0.45);
    const pl = dej(g, K(0.11, 0.5, 8), svit('#ff9b2f', 1), sx * 0.17, 0.5, 0.45); pl.rotation.x = Math.PI; pl.visible = false; pl.userData.bezObrysu = true;
    plameny.push(pl);
  }
  const nohy = [], ruce = [];
  for (const sx of [-1, 1]) {
    const k = new THREE.Group(); k.position.set(sx * 0.23, 0.68, 0); g.add(k);
    dej(k, B(0.26, 0.6, 0.28), kov, 0, -0.3, 0);
    dej(k, B(0.32, 0.13, 0.42), tmava, 0, -0.6, -0.05);
    nohy.push(k);
    const r = new THREE.Group(); r.position.set(sx * 0.6, 1.5, 0); g.add(r);
    dej(r, B(0.21, 0.62, 0.23), telo, 0, -0.28, 0);
    dej(r, S(0.13, 8, 6), kov, 0, -0.63, 0);
    ruce.push(r);
  }
  obrys(g); stin(g);
  return { g, nohy, ruce, plameny, vyska: 2.45 };
}

export const BEZCI = [
  // Běžci (22. 11., verze 4): hotové modely s animacemi od Quaternius (CC0), viz postavy/modely/LICENCE.txt.
  // Vyřazeni Zombík a Alien (strašidelní), Mech Stan a Mike (moc detailní, nehodí se). Dino je zpátky původní z kódu.
  // Barvy jsou schválně syté a světlé: v toon stínování zezadu jinak vypadaly vybledle a tmavě.
  ...[
    ['karate', 'Karatista', 0, 'Kimono_Male', { ...CLOVEK, po: vlasy('#231c18') }],
    ['karatistka', 'Karatistka', 0, 'Kimono_Female', CLOVEK],
    ['hrdina', 'Modrásek', 120, 'PlatformHero', { vyska: 2.5, mapa: { crouch: 'Duck' } }],
    ['shiba', 'Pejsek', 180, 'ShibaInu', { ...ZVIRE, barvy: { Main: '#f39a3c', Main_Light: '#ffffff', Black: '#3a2a22' } }],
    ['slepice', 'Slepice', 220, 'Chicken', { vyska: 1.9, mapa: { jump: null }, jas: 2.1 }],
    ['robo', 'Robo', 250, 'RobotExpressive', { vyska: VYSKA, mapa: { sprint: 'Running' }, barvy: { Main: '#3d8bff', Grey: '#f4f7fb', Black: '#2a3140' } }],
    ['liska', 'Liška', 320, 'Fox', { ...ZVIRE, barvy: { Main: '#ff7a1f', Main_Light: '#ffffff', Black: '#2a2222', Eyes: '#1a1414', Grey: '#3a3434' } }],
    ['ninja', 'Ninja', 380, 'Ninja_Male', { ...CLOVEK, barvy: { ...CLOVEK.barvy, Main: '#e0362f', Details: '#ffd23f', Grey: '#3a3a44' } }],
    ['pirat', 'Pirát', 450, 'Pirate_Male', CLOVEK],
    ['viking', 'Viking', 700, 'Viking_Male', CLOVEK],
    ['carodej', 'Čaroděj', 1000, 'Wizard', CLOVEK],
    ['carodejnice', 'Čarodějnice', 1100, 'Witch', CLOVEK],
    ['rytir', 'Zlatý rytíř', 1200, 'Knight_Golden_Male', { ...CLOVEK, barvy: { ...CLOVEK.barvy, Armor: '#f7b51e', Armor_Dark: '#b8740c', Detail: '#d8323a', Red: '#d8323a' } }],
    ['para', 'Parasaurus', 1300, 'Parasaurolophus', { vyska: 2.5, barvy: { Green: '#f08a2c', LightGreen: '#ffd38a', LightYellow: '#fff0c8', Red: '#c2331e' } }],
    // Drak = nejlepší postava: létá nízko nad cestou a mává křídly. Oči tmavé (bílé bez zorniček působily strašidelně).
    ['drak', 'Drak', 2500, 'Dragon', { vyska: 2.3, vznasi: 0.7, mapa: { idle: 'Dragon_Flying', sprint: 'Dragon_Flying', jump: null }, barvy: { Main: '#d8322a', Belly: '#ffcf4a', Wings: '#ff8a2a', Claws: '#fff3d6', Eyes: '#1a1010' } }],
  ].map(([id, jmeno, cena, soubor, opt]) => ({ id, jmeno, cena, vytvor: () => model('modely/' + soubor + '.glb', opt) })),
  // původní dino z první verze (z kódu), zvětšený na výšku ostatních
  { id: 'dino', jmeno: 'Dino', cena: 500, vytvor: () => vetsi(dino({ telo: '#5cc85c', bricho: '#c4f29a', ostny: '#ff9b2f' }), 1.2) },
].sort((a, b) => a.cena - b.cena);

// ================= LETCI =================
// Každý letec vrací funkci kridla(uhel, cas), která pohne křídly podle rukou hráče.
function ptak(o) {
  const g = new THREE.Group();
  const telo = toon(o.telo), kridlo = toon(o.kridlo), konec = o.konecSviti ? svit(o.konec, 0.8) : toon(o.konec), hlava = toon(o.hlava), zobak = toon(o.zobak);
  const t = dej(g, S(1, 12, 10), telo); t.scale.set(0.55, 0.5, 1.5);
  const h = dej(g, S(0.45, 10, 8), hlava, 0, 0.25, -1.45); h.scale.set(0.9, 0.9, 1.15);
  const z = dej(g, K(0.15, 0.5, 6), zobak, 0, 0.17, -1.98); z.rotation.x = -Math.PI / 2 + 0.25;
  for (const sx of [-1, 1]) dej(g, S(0.07, 6, 5), toon('#111111'), sx * 0.3, 0.38, -1.7);
  const ocasTvar = new THREE.Shape();
  ocasTvar.moveTo(-0.2, 0); ocasTvar.lineTo(0.2, 0); ocasTvar.lineTo(0.65, o.dlouhyOcas ? 2.4 : 1.3); ocasTvar.lineTo(0, o.dlouhyOcas ? 2.0 : 1.45); ocasTvar.lineTo(-0.65, o.dlouhyOcas ? 2.4 : 1.3); ocasTvar.closePath();
  const og = new THREE.ShapeGeometry(ocasTvar); og.rotateX(Math.PI / 2);
  const ocas = new THREE.Mesh(og, o.konecSviti ? svit(o.ocas, 0.7) : toon(o.ocas, { side: THREE.DoubleSide })); ocas.position.set(0, 0.05, 1.3); g.add(ocas);
  const vnitrni = new THREE.Shape(); vnitrni.moveTo(0, -0.55); vnitrni.lineTo(2.3, -0.5); vnitrni.lineTo(2.3, 0.75); vnitrni.lineTo(0, 0.95); vnitrni.closePath();
  const vnejsi = new THREE.Shape(); vnejsi.moveTo(0, -0.5); vnejsi.lineTo(1.6, -0.4); vnejsi.lineTo(2.8, -0.05);
  vnejsi.lineTo(2.35, 0.18); vnejsi.lineTo(2.6, 0.35); vnejsi.lineTo(2.05, 0.45); vnejsi.lineTo(2.2, 0.66); vnejsi.lineTo(1.5, 0.72); vnejsi.lineTo(0, 0.75); vnejsi.closePath();
  const kr = {};
  for (const [strana, sx] of [['L', -1], ['P', 1]]) {
    const g1 = new THREE.ShapeGeometry(vnitrni); g1.rotateX(Math.PI / 2); g1.scale(sx, 1, 1);
    const g2 = new THREE.ShapeGeometry(vnejsi); g2.rotateX(Math.PI / 2); g2.scale(sx, 1, 1);
    const rameno = new THREE.Group(); rameno.position.set(sx * 0.4, 0.15, -0.25);
    rameno.add(new THREE.Mesh(g1, toon(o.kridlo, { side: THREE.DoubleSide })));
    const loket = new THREE.Group(); loket.position.set(sx * 2.3, 0, 0);
    loket.add(new THREE.Mesh(g2, o.konecSviti ? svit(o.konec, 0.8) : toon(o.konec, { side: THREE.DoubleSide })));
    rameno.add(loket); g.add(rameno);
    kr[strana] = { rameno, loket };
  }
  obrys(g, 1.05); stin(g);
  g.scale.setScalar(1.4); g.rotation.order = 'YXZ';
  return {
    g, stopa: o.stopa || null,
    kridla(u) { kr.L.rameno.rotation.z = -u; kr.L.loket.rotation.z = -u * 0.35; kr.P.rameno.rotation.z = u; kr.P.loket.rotation.z = u * 0.35; },
  };
}
function vazka() {
  const g = new THREE.Group();
  const modra = toon('#1fb5d6'), zelena = toon('#7be04a');
  for (let i = 0; i < 9; i++) { const s = dej(g, S(0.22 - i * 0.012, 10, 8), i % 2 ? zelena : modra, 0, 0, 0.2 + i * 0.36); s.scale.z = 1.3; }
  const hr = dej(g, S(0.42, 12, 10), modra, 0, 0.05, -0.4); hr.scale.set(1, 0.9, 1.3);
  for (const sx of [-1, 1]) dej(g, S(0.3, 12, 10), svit('#ff4d8d', 0.4), sx * 0.28, 0.18, -0.95);
  const kridla = [];
  const tvar = new THREE.Shape(); tvar.moveTo(0, 0); tvar.quadraticCurveTo(1.4, -0.35, 2.9, 0.05); tvar.quadraticCurveTo(1.6, 0.6, 0, 0.3); tvar.closePath();
  for (const sx of [-1, 1]) for (const [z, m] of [[-0.55, 1], [-0.1, 0.9]]) {
    const geo = new THREE.ShapeGeometry(tvar); geo.rotateX(Math.PI / 2); geo.scale(sx * m, 1, m);
    const k = new THREE.Group(); k.position.set(sx * 0.3, 0.3, z);
    const w = new THREE.Mesh(geo, pruhledny('#bff6ff', 0.45)); k.add(w);
    k.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#2a8fb0' })));
    g.add(k); kridla.push({ k, sx, faze: z < -0.3 ? 0 : 1.6 });
  }
  obrys(g, 1.06); stin(g);
  g.scale.setScalar(2.4); g.rotation.order = 'YXZ';
  return {
    g, stopa: null,
    kridla(u, cas) { for (const w of kridla) w.k.rotation.z = w.sx * (u * 0.5 + Math.sin(cas * 45 + w.faze) * 0.35); },
  };
}
function drakLet() {
  const g = new THREE.Group();
  const telo = toon('#2fbf6f'), bricho = toon('#f2e07a'), blana = toon('#7b3fe4', { side: THREE.DoubleSide });
  const t = dej(g, S(1, 12, 10), telo); t.scale.set(0.6, 0.55, 1.6);
  const b = dej(g, S(0.8, 10, 8), bricho, 0, -0.2, -0.2); b.scale.set(0.6, 0.4, 1.4);
  const h = dej(g, B(0.7, 0.55, 0.9), telo, 0, 0.35, -1.6);
  dej(g, B(0.5, 0.32, 0.5), telo, 0, 0.25, -2.2);
  for (const sx of [-1, 1]) {
    dej(g, S(0.09, 8, 6), svit('#ffd23f', 0.6), sx * 0.24, 0.55, -1.95);
    const r = dej(g, K(0.09, 0.5, 6), toon('#ffd23f'), sx * 0.25, 0.75, -1.35); r.rotation.x = 0.7;
  }
  for (let i = 0; i < 5; i++) { const o = dej(g, K(0.12, 0.3, 5), svit('#ff7a1a', 0.5), 0, 0.55 - i * 0.03, -0.6 + i * 0.5); o.rotation.x = 0.5; }
  const ocas = dej(g, K(0.3, 2.2, 8), telo, 0, 0, 2.2); ocas.rotation.x = Math.PI / 2;
  const tvar = new THREE.Shape(); tvar.moveTo(0, -0.5); tvar.lineTo(3.2, -0.6); tvar.lineTo(2.6, 0.2); tvar.lineTo(2.1, 0.0); tvar.lineTo(1.6, 0.7); tvar.lineTo(1.1, 0.35); tvar.lineTo(0.5, 0.9); tvar.lineTo(0, 0.7); tvar.closePath();
  const kr = {};
  for (const [s, sx] of [['L', -1], ['P', 1]]) {
    const geo = new THREE.ShapeGeometry(tvar); geo.rotateX(Math.PI / 2); geo.scale(sx, 1, 1);
    const rameno = new THREE.Group(); rameno.position.set(sx * 0.45, 0.3, -0.4);
    rameno.add(new THREE.Mesh(geo, blana)); g.add(rameno); kr[s] = rameno;
  }
  obrys(g, 1.05); stin(g);
  g.scale.setScalar(1.35); g.rotation.order = 'YXZ';
  return { g, stopa: '#ff7a1a', kridla(u) { kr.L.rotation.z = -u * 1.1; kr.P.rotation.z = u * 1.1; } };
}

export const LETCI = [
  // Letci (22. 11., verze 3): Orel zpátky, Holoubek vyřazen. Postavy s hotovou animací zvětšené aspoň na velikost Vážky.
  { id: 'orel', jmeno: 'Orel', cena: 0, vytvor: () => ptak2({ telo: '#5a3a1e', bricho: '#8a5c34', hlava: '#f6f2ea', zobak: '#f5b41a', kryt: '#6b4628', letka: '#4a2e16', spicka: '#1e1208', ocas: '#f6f2ea', oboci: '#3a2410' }) },
  { id: 'vazka', jmeno: 'Vážka', cena: 150, vytvor: () => vazka2() },
  { id: 'vcela', jmeno: 'Včelka', cena: 250, vytvor: () => letecModel('M_Armabee', { vyska: 4.6 }) },
  { id: 'duch', jmeno: 'Duch', cena: 400, vytvor: () => letecModel('M_Ghost', { vyska: 5.4, jas: 2.4 }) },
  { id: 'netopyr', jmeno: 'Netopýr', cena: 550, vytvor: () => letecModel('Bat', { vyska: 5.5, mapa: { idle: 'Bat_Flying', sprint: 'Bat_Flying', jump: null }, barvy: { Main: '#6a58a0', Belly: '#d8b8f4', Eyes: '#1a1430', Black: '#2a2040' } }) },
  { id: 'ptero', jmeno: 'Pterodaktyl', cena: 700, vytvor: () => drak2({ ptero: true, telo: '#3a9ad9', bricho: '#cdeeff', blana: '#8fd8ff', blana2: '#2a6fb0', kosti: '#1f5f9a', oci: '#ffe14d', zobak: '#ffc93a', hrebinek: '#ff7a2a' }) },
  { id: 'draklet', jmeno: 'Létající drak', cena: 1000, vytvor: () => drak2({ telo: '#2fbf6f', bricho: '#f2e07a', blana: '#9a5cff', blana2: '#4a1fa8', kosti: '#1f8a4f', rohy: '#ffd23f', ostny: '#ff7a1a', oci: '#ffe14d', stopa: '#ff7a1a' }) },
  { id: 'dracek', jmeno: 'Dráček', cena: 1200, vytvor: () => letecModel('M_Dragon_Evolved', { vyska: 5.4 }) },
  { id: 'zlatydrak', jmeno: 'Zlatý drak', cena: 1500, vytvor: () => drak2({ telo: '#f2b600', bricho: '#fff1b0', blana: '#ff5a3a', blana2: '#a8140a', kosti: '#c48a00', rohy: '#ffffff', ostny: '#ff3dd2', oci: '#4ff3ff', stopa: '#ffd23f' }) },
  { id: 'velkydrak', jmeno: 'Ohnivý drak', cena: 2000, vytvor: () => { const p = letecModel('Dragon', { vyska: 5.6, mapa: { idle: 'Dragon_Flying', sprint: 'Dragon_Flying', jump: null }, barvy: { Main: '#d8322a', Belly: '#ffcf4a', Wings: '#ff8a2a', Claws: '#fff3d6', Eyes: '#1a1010' } }); p.stopa = '#ff7a1a'; return p; } },
];
export const skinPodleId = id => [...BEZCI, ...LETCI].find(s => s.id === id);
