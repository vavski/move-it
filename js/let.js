// Režim LET: proleť kruhy na trati. Mávnutí = vzlet, náklon rukou = zatáčka, roztažené ruce = plachtění,
// ruce u těla dolů = střemhlav, „kuře“ (dlaně u ramen, mávání lokty) = turbo.
import { THREE, nahoda, omez, toon, svit, obrys, stin, vytvorNebe, svetla, castice, novaKamera, SFX } from './zaklad.js';
import { t } from './i18n.js';
import { LETCI } from './postavy.js';

// ---- šum pro krajinu ----
function hash(ix, iy) { let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 5; i++) { s += a * noise(x * f, y * f); f *= 2; a *= 0.5; } return s / 0.96875; }
const smooth = (a, b, x) => { const t = omez((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export const LEVELY = [
  { jmeno: 'Údolí', typ: 'kruhy', kruhu: 12, potreba: 8, posun: 0, more: 0, nahore: '#3f9cff', dole: '#d6f0ff', amp: 25, vyska: 55 },
  { jmeno: 'Jezera', typ: 'kruhy', kruhu: 15, potreba: 10, posun: 37, more: 22, nahore: '#4a8dff', dole: '#e2f3ff', amp: 45, vyska: 40 },
  { jmeno: 'Kaňon', typ: 'kanon', kruhu: 15, potreba: 11, posun: 81, more: 0, nahore: '#ff9e5a', dole: '#ffe1b8', amp: 14, vyska: 32 },
  { jmeno: 'Jeskyně', typ: 'jeskyne', kruhu: 14, potreba: 10, posun: 120, more: 0, nahore: '#7a6cff', dole: '#e0dcff', amp: 0, vyska: 45 },
  { jmeno: 'Překážky', typ: 'prekazky', kruhu: 18, potreba: 13, posun: 201, more: 8, nahore: '#2f86ff', dole: '#cfeaff', amp: 35, vyska: 50 },
];
export const VOLNY = { jmeno: 'Volný let', typ: 'volny', kruhu: Infinity, potreba: 0, posun: 0, more: 0, nahore: '#3f9cff', dole: '#d6f0ff', amp: 0, vyska: 70 };

export function vytvorLet(ctx) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#d6f0ff', 350, 1500);
  const camera = novaKamera(70);
  const nebe = vytvorNebe(scene);
  const { slunce } = svetla(scene);
  slunce.shadow.camera.left = slunce.shadow.camera.bottom = -25; slunce.shadow.camera.right = slunce.shadow.camera.top = 25;
  const jiskry = castice(scene, 160);
  const voda = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.MeshToonMaterial({ color: '#3a9be0', transparent: true, opacity: 0.88 }));
  voda.rotation.x = -Math.PI / 2; scene.add(voda);

  let level = LEVELY[0], svetSkupina = null, vyskaTerenu = () => 0;
  let drahaX = () => 0, drahaY = () => 50;
  const kruhy = [], sloupy = [], tunely = [];
  let dalsiKruh = 0, sebrano = 0, konecT = -1, rezim = 'klavesy', postava = null, cas = 0;

  // ---- svět levelu ----
  function postavSvet(lv) {
    if (svetSkupina) { scene.remove(svetSkupina); svetSkupina.traverse(o => { if (o.geometry && o.geometry !== kruhGeo) o.geometry.dispose?.(); }); }
    svetSkupina = new THREE.Group(); scene.add(svetSkupina);
    kruhy.length = 0; sloupy.length = 0; tunely.length = 0;
    nebe.nastav(lv.nahore, lv.dole); scene.fog.color.set(lv.dole);
    const o = lv.posun;
    vyskaTerenu = (x, z) => {
      const d = Math.hypot(x, z), ostrov = 1 - smooth(500, 1400, d);
      const zaklad = (fbm(x * 0.003 + o, z * 0.003 + o) - 0.42) * 90 - lv.more;
      const hory = Math.pow(fbm(x * 0.0015 + 50 + o, z * 0.0015 + 50 + o), 2.5) * 260;
      let h = (zaklad + hory) * ostrov + (ostrov - 1) * 30;
      if (lv.typ === 'kanon') h = Math.min(h, 12) * ostrov + (ostrov - 1) * 30; // dno kaňonu
      return h;
    };
    // terén s plochými trojúhelníky a barvou podle výšky
    const g = new THREE.PlaneGeometry(3000, 3000, 190, 190); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, vyskaTerenu(p.getX(i), p.getZ(i)));
    const geo = g.toNonIndexed(); g.dispose();
    const pos = geo.attributes.position, barvy = new Float32Array(pos.count * 3), c = new THREE.Color();
    const pisek = lv.typ === 'kanon' ? '#e8b77a' : '#ead79c', trava1 = lv.typ === 'kanon' ? '#d9965a' : '#7cc84f', trava2 = lv.typ === 'kanon' ? '#c47a45' : '#56a23e';
    for (let i = 0; i < pos.count; i += 3) {
      const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
      c.set(y < 0 ? '#c9b47a' : y < 2.5 ? pisek : y < 38 ? trava1 : y < 75 ? trava2 : y < 135 ? '#8c8577' : '#f6f6f6');
      c.offsetHSL(0, 0, (hash(i, 7) - 0.5) * 0.05);
      for (let k = 0; k < 3; k++) barvy.set([c.r, c.g, c.b], (i + k) * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(barvy, 3)); geo.computeVertexNormals();
    const teren = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); teren.receiveShadow = true;
    svetSkupina.add(teren);
    // stromy
    const N = lv.typ === 'kanon' ? 300 : 1600;
    const stromy = new THREE.InstancedMesh(new THREE.ConeGeometry(2.8, 10, 6), toon(lv.typ === 'kanon' ? '#4d8a3a' : '#2f7a33'), N);
    const kmeny = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.7, 3, 5), toon('#6b4423'), N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
    let n = 0, pokus = 0;
    while (n < N && pokus < 50000) {
      pokus++;
      const x = (hash(pokus + o, 1) - 0.5) * 2600, z = (hash(pokus + o, 2) - 0.5) * 2600, h = vyskaTerenu(x, z);
      if (h < 3 || h > 75) continue;
      const k = 0.7 + hash(pokus, 3) * 0.9;
      m4.compose(v.set(x, h + 6 * k, z), q, s.set(k, k, k)); stromy.setMatrixAt(n, m4);
      m4.compose(v.set(x, h + 1.2 * k, z), q, s.set(k, k, k)); kmeny.setMatrixAt(n, m4); n++;
    }
    stromy.count = kmeny.count = n; svetSkupina.add(stromy, kmeny);
    // mraky
    const mrakMat = toon('#ffffff');
    for (let i = 0; i < 70; i++) {
      const mrak = new THREE.Group();
      for (let k = 0; k < 4; k++) { const r = 10 + hash(i, k + 10) * 14; const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mrakMat); b.position.set(k * 16 - 24, hash(i, k + 20) * 7, hash(i, k + 30) * 10); mrak.add(b); }
      mrak.position.set((hash(i + o, 40) - 0.5) * 3000, 170 + hash(i, 41) * 100, (hash(i + o, 42) - 0.5) * 3000);
      svetSkupina.add(mrak);
    }
    // trať
    if (lv.typ === 'volny') { drahaX = () => 0; drahaY = () => lv.vyska; return; }
    const f = 0.55 + (o % 7) * 0.05;
    drahaX = z => lv.amp * Math.sin(z * 0.009 * f + o) + lv.amp * 0.5 * Math.sin(z * 0.021 + o * 2);
    drahaY = z => {
      const zakl = lv.vyska + (lv.typ === 'jeskyne' ? 0 : 14 * Math.sin(z * 0.012 + o));
      return Math.max(zakl, vyskaTerenu(drahaX(z), z) + 22);
    };
    const roztec = lv.typ === 'jeskyne' ? 75 : 85;
    const z0 = 650;
    for (let i = 0; i < lv.kruhu; i++) {
      const z = z0 - i * roztec;
      const x = drahaX(z), y = drahaY(z);
      const smer = new THREE.Vector3(drahaX(z - 5) - drahaX(z + 5), drahaY(z - 5) - drahaY(z + 5), -10).normalize();
      const m = new THREE.Mesh(kruhGeo, svit('#ffc928', 0.5)); m.position.set(x, y, z);
      m.lookAt(m.position.clone().add(smer));
      svetSkupina.add(m);
      kruhy.push({ mesh: m, smer, stav: 0, predchozi: null });
    }
    // speciality
    const kamenMat = toon(lv.typ === 'kanon' ? '#c96f3c' : '#8d8a96');
    if (lv.typ === 'kanon') {
      for (let z = z0 + 150; z > z0 - lv.kruhu * roztec - 120; z -= 14) {
        for (const sx of [-1, 1]) {
          const v2 = nahoda(70, 120), sir = nahoda(16, 26);
          const st = new THREE.Mesh(new THREE.BoxGeometry(sir, v2, 16), kamenMat);
          st.position.set(drahaX(z) + sx * (24 + sir / 2 + nahoda(0, 4)), v2 / 2 - 10, z); st.rotation.y = nahoda(-0.15, 0.15);
          svetSkupina.add(st);
        }
      }
    }
    if (lv.typ === 'jeskyne') {
      const tunelMat = new THREE.MeshToonMaterial({ color: '#4a3a6a', side: THREE.BackSide });
      for (const [od, po] of [[2, 4], [6, 9], [10, 13]]) {
        const zA = z0 - od * roztec + 40, zB = z0 - po * roztec - 40, delka = zA - zB, zS = (zA + zB) / 2;
        const t = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, delka, 18, 1, true), tunelMat);
        t.rotation.x = Math.PI / 2; t.position.set(drahaX(zS), drahaY(zS), zS); svetSkupina.add(t);
        const plast = new THREE.Mesh(new THREE.CylinderGeometry(19, 22, delka - 4, 10, 1, true), toon('#6a5a7a', { side: THREE.FrontSide }));
        plast.rotation.x = Math.PI / 2; plast.position.copy(t.position); svetSkupina.add(plast);
        for (let k = 0; k < 18; k++) { // svítící krystaly uvnitř
          const a = nahoda(0, Math.PI * 2), zk = nahoda(zB, zA);
          const kr = new THREE.Mesh(new THREE.OctahedronGeometry(nahoda(1, 2.2), 0), svit(['#4ff3ff', '#ff3dd2', '#b06bff'][k % 3], 1));
          kr.position.set(t.position.x + Math.cos(a) * 14, t.position.y + Math.sin(a) * 14, zk); svetSkupina.add(kr);
        }
        tunely.push({ zA, zB, x: t.position.x, y: t.position.y });
      }
    }
    if (lv.typ === 'prekazky') {
      for (let i = 0; i < lv.kruhu - 1; i++) {
        const z = z0 - i * roztec - roztec / 2;
        const strana = i % 2 ? 1 : -1;
        const x = drahaX(z) + strana * nahoda(10, 14), vy = vyskaTerenu(x, z);
        const sl = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 160, 8), kamenMat);
        sl.position.set(x, vy + 70, z); svetSkupina.add(obrys(stin(sl), 1.03));
        const cepice = new THREE.Mesh(new THREE.ConeGeometry(6, 8, 8), toon('#ff4d5e')); cepice.position.set(x, vy + 154, z); svetSkupina.add(cepice);
        sloupy.push({ x, z, r: 5 });
      }
    }
  }
  const kruhGeo = new THREE.TorusGeometry(9, 1.0, 10, 36);

  // ---- hráč ----
  const hrac = { pos: new THREE.Vector3(), yaw: 0, vy: 0, rychlost: 30, naklon: 0, turbo: 0, otres: 0 };
  const vstup = { vzlet: 0, naklon: 0, plachti: false, strmhlav: false, kridla: 0.1, mavT: 0 };
  const dopredu = () => new THREE.Vector3(-Math.sin(hrac.yaw), 0, -Math.cos(hrac.yaw));
  const sipka = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.2, 4), svit('#4ff3ff', 0.8));
  sipka.geometry.rotateX(-Math.PI / 2); scene.add(sipka);
  const kamPos = new THREE.Vector3();

  // ---- rozpoznávání pohybu ----
  const poza = { zdvih: 0, nahoru: true, max: 0, min: 0, loket: 0, lNahoru: true, lMax: 0, lMin: 0, stav: 'pose.fly', videt: false };
  const MAV = { prah: 0.5, zaklad: 14, zaKus: 6, navrat: 0.4 };
  function analyzuj(L, dt) {
    const ok = i => L[i] && (L[i].visibility ?? 1) > 0.3;
    poza.videt = ok(11) && ok(12);
    if (!poza.videt) { vstup.plachti = true; vstup.strmhlav = false; return; }
    const sw = Math.max(0.05, Math.abs(L[11].x - L[12].x));
    const ruka = (s, e, w) => ok(w) ? (L[s].y - L[w].y) / sw : ok(e) ? (L[s].y - L[e].y) / sw * 1.8 : null;
    const l = ruka(11, 13, 15), r = ruka(12, 14, 16);
    if (l === null && r === null) { poza.videt = false; return; }
    const zdvih = l === null ? r : r === null ? l : (l + r) / 2;
    poza.zdvih = poza.zdvih * 0.4 + zdvih * 0.6;
    // „kuře“: dlaně u ramen, mávají lokty → turbo
    const uRamene = (w, s) => ok(w) && Math.hypot(L[w].x - L[s].x, L[w].y - L[s].y) < sw * 0.85;
    const kure = uRamene(15, 11) && uRamene(16, 12) && ok(13) && ok(14);
    if (kure) {
      const e = ((L[11].y - L[13].y) + (L[12].y - L[14].y)) / 2 / sw;
      poza.loket = poza.loket * 0.4 + e * 0.6;
      if (poza.lNahoru) { poza.lMax = Math.max(poza.lMax, poza.loket); if (poza.lMax - poza.loket > 0.3) { turbo(); poza.lNahoru = false; poza.lMin = poza.loket; } }
      else { poza.lMin = Math.min(poza.lMin, poza.loket); if (poza.loket - poza.lMin > 0.25) { poza.lNahoru = true; poza.lMax = poza.loket; } }
      vstup.plachti = false; vstup.strmhlav = false; vstup.kridla = 0.3 + Math.sin(cas * 30) * 0.5; poza.stav = 'pose.turbo';
    } else {
      if (poza.nahoru) { poza.max = Math.max(poza.max, poza.zdvih); if (poza.max - poza.zdvih > MAV.prah) { mav(MAV.zaklad); poza.nahoru = false; poza.min = poza.zdvih; } }
      else { if (poza.zdvih < poza.min) { vstup.vzlet += (poza.min - poza.zdvih) * MAV.zaKus; poza.min = poza.zdvih; } if (poza.zdvih - poza.min > MAV.navrat) { poza.nahoru = true; poza.max = poza.zdvih; } }
      const [iL, iR] = ok(15) && ok(16) ? [15, 16] : [13, 14];
      let n = ((L[iR].y - L[iL].y) / sw) * (iL === 15 ? 0.9 : 1.6);
      vstup.naklon = omez(n, -1, 1);
      const sirka = Math.abs(L[iL].x - L[iR].x) / sw;
      vstup.plachti = sirka > (iL === 15 ? 2.2 : 1.5) && Math.abs(poza.zdvih) < 0.7;
      // ruce dole u těla = střemhlav
      vstup.strmhlav = poza.zdvih < -1.1 && sirka < 1.8;
      vstup.kridla = vstup.strmhlav ? -0.9 : omez(poza.zdvih * 0.7, -0.9, 1.1);
      poza.stav = vstup.mavT > 0 ? 'pose.flap' : vstup.strmhlav ? 'pose.dive' : vstup.plachti ? 'pose.glide' : 'pose.fly';
    }
  }
  function mav(sila) { vstup.vzlet += sila; vstup.mavT = 0.3; SFX.mav(); }
  function turbo() {
    if (hrac.turbo > 0.25) return;
    hrac.turbo = 1.2; hrac.rychlost = Math.min(62, hrac.rychlost + 9); SFX.turbo(); ctx.banner('TURBO!', '#4ff3ff');
  }

  // ---- klávesnice ----
  const klavesy = {};
  let mavKlT = 0;
  addEventListener('keyup', e => { klavesy[e.code] = false; });

  function umistiVolnyKruh(k) {
    const f = dopredu(), bok = new THREE.Vector3(-f.z, 0, f.x);
    const p = hrac.pos.clone().addScaledVector(f, nahoda(160, 380)).addScaledVector(bok, nahoda(-60, 60));
    p.y = Math.min(220, Math.max(vyskaTerenu(p.x, p.z) + 20, hrac.pos.y + nahoda(-25, 25)));
    k.mesh.position.copy(p); k.mesh.rotation.set(0, hrac.yaw, 0);
    k.smer = f.clone(); k.stav = 0; k.predchozi = null;
  }

  function vysledek(vyhra) {
    if (konecT >= 0) return;
    konecT = 0;
    const pocet = level.kruhu, vyh = vyhra ?? sebrano >= level.potreba;
    if (vyh) { SFX.vyhra(); jiskry.vystrel(hrac.pos.clone(), '#ffd23f', 50, 10, 1.3); } else SFX.prohra();
    const zbytek = pocet - level.potreba;
    const hvezdy = !vyh ? 0 : sebrano >= pocet ? 3 : sebrano >= level.potreba + Math.ceil(zbytek / 2) ? 2 : 1;
    setTimeout(() => ctx.konec({ vyhra: vyh, mince: sebrano * 3, kruhy: sebrano, hvezdy }), 900);
  }

  const api = {
    scene, camera, analyzuj, poza, vstup,
    nastavPostavu(id) { if (postava) scene.remove(postava.g); postava = (LETCI.find(l => l.id === id) || LETCI[0]).vytvor(); scene.add(postava.g); },
    pripravit(lv, idPostavy, rz) {
      level = lv; rezim = rz; konecT = -1; sebrano = 0; dalsiKruh = 0;
      postavSvet(lv); api.nastavPostavu(idPostavy); jiskry.skryj();
      if (lv.typ === 'volny') {
        hrac.pos.set(0, 120, 950); hrac.yaw = 0;
        for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(kruhGeo, svit('#ffc928', 0.5)); svetSkupina.add(m); const k = { mesh: m, smer: new THREE.Vector3(), stav: 0 }; kruhy.push(k); umistiVolnyKruh(k); }
      } else {
        const k0 = kruhy[0].mesh.position;
        hrac.pos.set(drahaX(k0.z + 130), drahaY(k0.z + 130), k0.z + 130); hrac.yaw = 0;
      }
      Object.assign(hrac, { vy: 0, rychlost: 30, naklon: 0, turbo: 0, otres: 0 });
      Object.assign(vstup, { vzlet: 0, naklon: 0, plachti: true, strmhlav: false, kridla: 0.1 });
      kamPos.copy(hrac.pos).add(new THREE.Vector3(0, 9, 17));
    },
    nahled(idPostavy) { if (!svetSkupina) postavSvet(LEVELY[0]); api.nastavPostavu(idPostavy); hrac.pos.set(0, 90, 700); hrac.yaw = 0; },
    zacatekOdpoctu() {}, behemOdpoctu() {}, konecOdpoctu: () => true,
    klavesa(e) {
      klavesy[e.code] = true;
      if (e.code === 'Space' && !e.repeat) { mav(12); mavKlT = 0.35; e.preventDefault(); }
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) turbo();
    },
    stavKamery() { return poza.videt ? t(poza.stav) : null; },
    vodítko() {},
    hud() {
      if (level.typ === 'volny') return { vlevo: '◯ ' + sebrano, stred: sebrano, stredPopis: t('hud.rings'), mince: sebrano * 3, postup: null };
      return { vlevo: '◯ ' + sebrano + ' / ' + level.kruhu, stred: sebrano + ' / ' + level.kruhu, stredPopis: t('hud.need', { n: level.potreba }), mince: sebrano * 3, postup: dalsiKruh / level.kruhu };
    },
    ukoncit() { if (level.typ === 'volny') vysledek(true); },
    ladeni: () => ({ y: hrac.pos.y, cilY: kruhy[dalsiKruh]?.mesh.position.y ?? null, sebrano, dalsiKruh }),
    aktualizuj(dt, stav, snimek) {
      cas += dt;
      if (snimek && snimek.novy && snimek.L && rezim === 'kamera') analyzuj(snimek.L, dt);
      else if (snimek && snimek.novy && !snimek.L) poza.videt = false;
      vstup.mavT = Math.max(0, vstup.mavT - dt);

      if (rezim === 'klavesy' || stav !== 'hra') {
        const cilN = (klavesy.ArrowRight || klavesy.KeyD ? 1 : 0) - (klavesy.ArrowLeft || klavesy.KeyA ? 1 : 0);
        if (rezim === 'klavesy') {
          vstup.naklon += (cilN - vstup.naklon) * Math.min(1, dt * 5);
          vstup.plachti = !!(klavesy.ArrowUp || klavesy.KeyW);
          vstup.strmhlav = !!(klavesy.ArrowDown || klavesy.KeyS);
          mavKlT = Math.max(0, mavKlT - dt);
          vstup.kridla = vstup.strmhlav ? -0.9 : mavKlT > 0 ? Math.cos((0.35 - mavKlT) / 0.35 * Math.PI * 2) * 0.9 : vstup.plachti ? 0 : 0.15 + Math.sin(cas * 3) * 0.1;
        }
      }
      if (stav === 'nahled' || stav === 'odpocet') {
        // ukázka / odpočet: letec mává na místě
        const u = Math.sin(cas * 5) * 0.6;
        postava.kridla(stav === 'nahled' ? u : vstup.kridla, cas);
        postava.g.position.copy(hrac.pos).add(new THREE.Vector3(0, Math.sin(cas * 2) * 0.6, 0));
        postava.g.rotation.set(0, stav === 'nahled' ? cas * 0.6 : 0, 0);
        vstup.vzlet = 0;
      }
      if (stav === 'hra' && konecT < 0) {
        const vz = Math.min(vstup.vzlet, 30); vstup.vzlet = 0;
        hrac.vy += vz; hrac.rychlost += vz * 0.12;
        hrac.vy -= 15 * dt;                                   // rychlejší klesání než dřív
        if (vstup.strmhlav) { hrac.vy += (-22 - hrac.vy) * Math.min(1, dt * 3); hrac.rychlost += 14 * dt; }
        else if (vstup.plachti) hrac.vy = Math.max(hrac.vy, -5.5);
        hrac.vy = omez(hrac.vy, -30, 24);
        hrac.turbo = Math.max(0, hrac.turbo - dt);
        hrac.rychlost += (30 - hrac.rychlost) * dt * (hrac.turbo > 0 ? 0.05 : 0.45);
        hrac.rychlost = Math.min(62, hrac.rychlost);
        hrac.naklon += (vstup.naklon - hrac.naklon) * Math.min(1, dt * 4);
        hrac.yaw -= hrac.naklon * 1.15 * dt;
        // jemná pomoc k dalšímu kruhu (děti)
        const cilK = level.typ === 'volny' ? null : kruhy[dalsiKruh];
        if (cilK) {
          const d = cilK.mesh.position.clone().sub(hrac.pos);
          let rozdil = Math.atan2(-d.x, -d.z) - hrac.yaw; rozdil = Math.atan2(Math.sin(rozdil), Math.cos(rozdil));
          if (Math.abs(rozdil) < 1.2) hrac.yaw += rozdil * 1.2 * dt;
          if (Math.abs(rozdil) > 1.6) hrac.yaw += Math.sign(rozdil) * 0.6 * dt;   // když letí úplně jinam, stočí ho zpátky
          // výškový magnet: u blížícího se kruhu ho jemně přitáhne do jeho výšky
          const vzd = Math.hypot(d.x, d.z);
          if (vzd < 230) hrac.pos.y += omez(d.y / 15, -1, 1) * 9 * (1 - vzd / 260) * dt;
        } else if (level.typ === 'volny' && Math.hypot(hrac.pos.x, hrac.pos.z) > 1250) {
          let rozdil = Math.atan2(hrac.pos.x, hrac.pos.z) - hrac.yaw; rozdil = Math.atan2(Math.sin(rozdil), Math.cos(rozdil));
          hrac.yaw += omez(rozdil, -1, 1) * 0.9 * dt;
        }
        const f = dopredu();
        hrac.pos.addScaledVector(f, hrac.rychlost * dt); hrac.pos.y += hrac.vy * dt;
        const zem = Math.max(vyskaTerenu(hrac.pos.x, hrac.pos.z), 0) + 2.5;
        if (hrac.pos.y < zem) { hrac.pos.y = zem; hrac.vy = Math.max(hrac.vy, 0); hrac.rychlost *= 1 - dt * 0.8; }
        if (hrac.pos.y > 320) { hrac.pos.y = 320; hrac.vy = Math.min(hrac.vy, 0); }
        // kaňon: stěny tě nepustí ven
        if (level.typ === 'kanon') { const dx = hrac.pos.x - drahaX(hrac.pos.z); if (Math.abs(dx) > 21) { hrac.pos.x = drahaX(hrac.pos.z) + Math.sign(dx) * 21; hrac.yaw += Math.sign(dx) * -0.8 * dt * 3; } if (hrac.pos.y > 95) hrac.pos.y = 95; }
        // jeskyně: drží tě uvnitř tunelu
        for (const t of tunely) if (hrac.pos.z < t.zA && hrac.pos.z > t.zB) {
          const dx = hrac.pos.x - t.x, dy = hrac.pos.y - t.y, r = Math.hypot(dx, dy);
          if (r > 12) { hrac.pos.x = t.x + dx / r * 12; hrac.pos.y = t.y + dy / r * 12; hrac.vy *= 0.5; }
        }
        // sloupy: náraz odrazí
        for (const s of sloupy) {
          const dx = hrac.pos.x - s.x, dz = hrac.pos.z - s.z, r = Math.hypot(dx, dz);
          if (r < s.r + 2.5) {
            hrac.pos.x = s.x + dx / r * (s.r + 2.6); hrac.pos.z = s.z + dz / r * (s.r + 2.6);
            if (hrac.otres <= 0) { hrac.otres = 0.4; hrac.rychlost *= 0.6; SFX.zasah(); ctx.zasah(); }
          }
        }
        hrac.otres = Math.max(0, hrac.otres - dt);

        // kruhy
        if (level.typ === 'volny') {
          for (const k of kruhy) {
            const od = hrac.pos.clone().sub(k.mesh.position);
            if (od.length() < 10) { sebrano++; SFX.kruh(); jiskry.vystrel(k.mesh.position, '#ffd23f', 20, 8, 0.8); umistiVolnyKruh(k); continue; }
            if (od.dot(dopredu()) > 60 || od.length() > 800) umistiVolnyKruh(k);
          }
        } else {
          for (let i = dalsiKruh; i < Math.min(kruhy.length, dalsiKruh + 3); i++) {
            const k = kruhy[i], od = hrac.pos.clone().sub(k.mesh.position), pred = od.dot(k.smer);
            if (k.predchozi !== null && k.predchozi < 0 && pred >= 0) {
              const vRovine = od.clone().addScaledVector(k.smer, -pred).length();
              if (vRovine < 10.5) { k.stav = 1; sebrano++; SFX.kruh(); jiskry.vystrel(k.mesh.position, '#ffd23f', 24, 9, 0.9); k.mesh.material = svit('#4dff88', 0.6); }
              else { k.stav = -1; k.mesh.material = toon('#888888'); }
              dalsiKruh = i + 1;
              if (dalsiKruh >= kruhy.length) vysledek();
            }
            k.predchozi = pred;
          }
          // když kruh úplně mine stranou, po chvíli ho počítá jako minutý
          const k = kruhy[dalsiKruh];
          if (k && hrac.pos.z < k.mesh.position.z - 40) { k.stav = -1; k.mesh.material = toon('#888888'); dalsiKruh++; if (dalsiKruh >= kruhy.length) vysledek(); }
        }
        postava.g.position.copy(hrac.pos);
        postava.g.rotation.set(omez(hrac.vy * 0.02, vstup.strmhlav ? -0.6 : -0.2, 0.4), hrac.yaw, -hrac.naklon * 0.7);
        postava.kridla(hrac.turbo > 0.8 ? Math.sin(cas * 40) * 0.6 : vstup.kridla, cas);
        if (postava.stopa) jiskry.vystrel(hrac.pos.clone().addScaledVector(dopredu(), -2.5), postava.stopa, 1, 1.2, 0.5);
        if (hrac.turbo > 0) jiskry.vystrel(hrac.pos.clone().addScaledVector(dopredu(), -2), '#4ff3ff', 2, 2, 0.4);
      }
      // zvýraznění dalšího kruhu a šipka k němu
      const dalsi = level.typ === 'volny' ? null : kruhy[dalsiKruh];
      kruhy.forEach((k, i) => { if (k.stav === 0 && level.typ !== 'volny') { const akt = i === dalsiKruh; k.mesh.scale.setScalar(akt ? 1 + Math.sin(cas * 6) * 0.08 : 0.85); k.mesh.material = akt ? svit('#ffd23f', 0.9) : svit('#ffc928', 0.3); } });
      if (dalsi && stav === 'hra') {
        sipka.visible = true;
        sipka.position.copy(hrac.pos).add(new THREE.Vector3(0, 4.5, 0)).addScaledVector(dopredu(), 3);
        sipka.lookAt(dalsi.mesh.position);
      } else sipka.visible = false;

      // kamera za letcem
      const f = dopredu();
      const cilKam = hrac.pos.clone().addScaledVector(f, -17).add(new THREE.Vector3(0, 9, 0));
      kamPos.lerp(cilKam, 1 - Math.exp(-4 * dt));
      camera.position.copy(kamPos).add(new THREE.Vector3((Math.random() - 0.5) * hrac.otres * 2, (Math.random() - 0.5) * hrac.otres * 2, 0));
      camera.lookAt(hrac.pos.clone().addScaledVector(f, 12));
      camera.fov = 68 + (hrac.rychlost - 30) * 0.55 + hrac.turbo * 6; camera.updateProjectionMatrix();
      nebe.mesh.position.copy(camera.position);
      voda.position.set(hrac.pos.x, 0, hrac.pos.z);
      slunce.position.copy(hrac.pos).add(new THREE.Vector3(30, 60, 20)); slunce.target.position.copy(hrac.pos);
      jiskry.aktualizuj(dt, 0);
    },
  };
  return api;
}
