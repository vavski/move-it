// Modely přírody od Kenney.nl (Nature Kit, CC0) pro okolí trati a překážky v běhu.
// Načtou se jednou na pozadí; dokud nejsou, hra použije jednoduché tvary z kódu (kus() vrátí null).
import { THREE, gradient } from './zaklad.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CESTA = new URL('postavy/priroda/', document.baseURI).href;
const SOUBORY = `tree_default tree_oak tree_detailed tree_pineRoundA tree_pineRoundC tree_pineTallA tree_pineTallB tree_pineTallC
tree_pineSmallA tree_tall_dark tree_fat tree_thin_dark tree_cone_dark tree_palmTall tree_palmBend tree_plateau_fall tree_default_fall
plant_bush plant_bushLarge flower_redA flower_yellowA flower_purpleA grass_large mushroom_red mushroom_redGroup mushroom_redTall mushroom_tanTall
rock_smallA rock_largeA rock_largeB rock_tallA rock_tallB rock_tallE stone_tallA stone_largeC rock_smallFlatA
cactus_tall cactus_short statue_obelisk statue_columnDamaged log log_large log_stack log_stackLarge stump_oldTall stump_roundDetailed
stump_squareDetailedWide tent_detailedClosed campfire_logs fence_simpleHigh`.split(/\s+/);

const loader = new GLTFLoader();
const sablony = {};
let nacitani = null;
export function nactiPrirodu() {
  return nacitani ??= Promise.all(SOUBORY.map(n => loader.loadAsync(CESTA + n + '.glb').then(g => {
    const s = g.scene;
    s.traverse(o => { if (o.isMesh) o.material = toonZ(o.material); });
    s.updateMatrixWorld(true);
    sablony[n] = { s, box: new THREE.Box3().setFromObject(s) };
  }).catch(() => {})));
}
export const prirodaHotova = () => Object.keys(sablony).length > 0;

// materiály: toon styl jako zbytek hry, jeden materiál na barvu (šetří výkon).
// Kenney má pastelové barvy; tady sytější, ať ladí se zbytkem hry.
const PALETA = {
  leafsGreen: '#4fb342', leafsDark: '#2f8a4f', leafsFall: '#ef8a2c', grass: '#5cbf45', dirt: '#8a6a45',
  woodBark: '#7a4a25', woodBarkDark: '#5a3a22', woodBirch: '#f2ede0', woodInner: '#e8c98a', wood: '#a8743f', woodDark: '#6a4325',
  stone: '#9a9aa8', stoneDark: '#6e6e7c', colorRed: '#e8434e', colorRedDark: '#b8303a', colorTan: '#e0b878',
  colorYellow: '#ffd23f', colorPurple: '#b06bff', _defaultMat: '#f4f0e6',
};
const cacheMat = new Map();
function toonZ(mt, barva = null) {
  const c = barva ?? PALETA[mt.userData?.jmeno ?? mt.name] ?? '#' + mt.color.getHexString();
  const k = (mt.userData?.jmeno ?? mt.name) + '|' + c + '|' + (mt.userData?.svit ?? '');
  if (!cacheMat.has(k)) {
    const n = new THREE.MeshToonMaterial({ color: c, gradientMap: gradient });
    n.userData.jmeno = mt.userData?.jmeno ?? mt.name; n.name = n.userData.jmeno;
    cacheMat.set(k, n);
  }
  return cacheMat.get(k);
}
function svitivy(jmeno, barva) {
  const k = 'svit|' + jmeno + '|' + barva;
  if (!cacheMat.has(k)) { const n = new THREE.MeshBasicMaterial({ color: barva }); n.userData.jmeno = jmeno; n.name = jmeno; cacheMat.set(k, n); }
  return cacheMat.get(k);
}

// kus('tree_oak', { vyska: 4 }) → skupina postavená na zemi (y = 0), uprostřed.
// barvy = { jménoMateriálu: '#barva' } přebarví, sviti = { jménoMateriálu: '#barva' } udělá svítící (láva, oheň).
export function kus(nazev, { vyska = null, sirka = null, barvy = null, sviti = null } = {}) {
  const t = sablony[nazev];
  if (!t) return null;
  const m = t.s.clone(true);
  if (barvy || sviti) m.traverse(o => {
    if (!o.isMesh) return;
    const j = o.material.userData.jmeno;
    if (sviti && sviti[j]) o.material = svitivy(j, sviti[j]);
    else if (barvy && barvy[j]) o.material = toonZ(o.material, barvy[j]);
  });
  // jen výška nebo jen šířka = poměr stran zůstane; obojí = model se roztáhne (překážka musí zabrat celou dráhu)
  const v = t.box.max.y - t.box.min.y || 1, w = t.box.max.x - t.box.min.x || 1;
  const ky = vyska ? vyska / v : sirka ? sirka / w : 1;
  const kx = sirka ? sirka / w : ky;
  m.scale.set(kx, ky, kx);
  m.position.set(-(t.box.min.x + t.box.max.x) / 2 * kx, -t.box.min.y * ky, -(t.box.min.z + t.box.max.z) / 2 * kx);
  const g = new THREE.Group(); g.add(m);
  return g;
}

// Pro velké množství (stromy pod tratí v letu): díly modelu jako samostatné geometrie s výškou 1 a patou v nule,
// aby z nich šly udělat InstancedMesh (tisíc stromů = pár volání kreslení).
export function dilyProInstance(nazev, barvy = null) {
  const t = sablony[nazev];
  if (!t) return null;
  const v = t.box.max.y - t.box.min.y || 1, cx = (t.box.min.x + t.box.max.x) / 2, cz = (t.box.min.z + t.box.max.z) / 2;
  const posun = new THREE.Matrix4().makeTranslation(-cx, -t.box.min.y, -cz), mer = new THREE.Matrix4().makeScale(1 / v, 1 / v, 1 / v);
  const dily = [];
  t.s.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); g.applyMatrix4(posun); g.applyMatrix4(mer);
    const j = o.material.userData.jmeno;
    dily.push({ geo: g, mat: barvy && barvy[j] ? toonZ(o.material, barvy[j]) : o.material });
  });
  return dily;
}
