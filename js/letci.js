// Letci 2. generace: oblé tělo, křídlo se třemi klouby (rameno, loket, dlaň) a skutečnými pery,
// barevný přechod od kořene pera ke špičce, vlající ocas. Pořád jen kód, žádné stažené modely.
// Rozhraní je stejné jako u starých letců: { g, stopa, kridla(u, cas) }, u = poloha rukou (-0.9 dole … 1.1 nahoře).
import { THREE, toon, obrys, stin, gradient } from './zaklad.js';

const C = c => new THREE.Color(c);
// ---- pomocné funkce na geometrii ----
// přechod barvy podél osy (od min po max) jako barvy vrcholů
function prechod(geo, osa, od, po, mocnina = 1) {
  const p = geo.attributes.position, n = p.count, a = C(od), b = C(po), c = new THREE.Color();
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < n; i++) { const v = p['get' + osa.toUpperCase()](i); min = Math.min(min, v); max = Math.max(max, v); }
  const barvy = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const t = Math.pow((p['get' + osa.toUpperCase()](i) - min) / (max - min || 1), mocnina); c.copy(a).lerp(b, t); barvy.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(barvy, 3));
  return geo;
}
// spojí víc geometrií do jedné (méně objektů = plynulejší hra)
function spoj(geos) {
  const casti = geos.map(g => g.index ? g.toNonIndexed() : g);
  const jmena = ['position', 'normal', 'color'];
  const out = new THREE.BufferGeometry();
  for (const j of jmena) {
    const delka = casti.reduce((s, g) => s + g.attributes[j].array.length, 0), arr = new Float32Array(delka);
    let o = 0; for (const g of casti) { arr.set(g.attributes[j].array, o); o += g.attributes[j].array.length; }
    out.setAttribute(j, new THREE.BufferAttribute(arr, 3));
  }
  return out;
}
// jedno pero: špičaté, mírně prohnuté, délka míří dozadu (+z)
function pero(delka, sirka, koren, spicka, tloustka = 0.05) {
  const s = new THREE.Shape();
  s.moveTo(-sirka * 0.35, 0);
  s.quadraticCurveTo(-sirka * 0.6, delka * 0.55, -sirka * 0.12, delka);
  s.quadraticCurveTo(0, delka * 1.04, sirka * 0.16, delka * 0.97);
  s.quadraticCurveTo(sirka * 0.62, delka * 0.5, sirka * 0.35, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: tloustka, bevelEnabled: false, curveSegments: 5 });
  g.translate(0, 0, -tloustka / 2);
  g.rotateX(Math.PI / 2);                 // délka podél +z, plocha vodorovně
  prechod(g, 'z', koren, spicka, 1.4);
  g.computeVertexNormals();
  return g;
}
function umisti(g, x, y, z, rotY = 0, rotX = 0) { g.rotateX(rotX); g.rotateY(rotY); g.translate(x, y, z); return g; }
const matPeri = (svit = 0) => new THREE.MeshToonMaterial({ vertexColors: true, side: THREE.DoubleSide, gradientMap: gradient, ...(svit ? { emissive: '#ff4a00', emissiveIntensity: svit } : {}) });
const matBarvy = (svit = 0) => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient, ...(svit ? { emissive: '#ff4a00', emissiveIntensity: svit } : {}) });

// měkká záře kolem postavy (pro Fénixe)
function zare(barva, velikost) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d');
  const gr = k.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, barva); gr.addColorStop(1, 'rgba(0,0,0,0)');
  k.fillStyle = gr; k.fillRect(0, 0, 128, 128);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
  s.scale.setScalar(velikost); s.userData.bezObrysu = true; return s;
}

// ================= PTÁK =================
// o: telo, bricho, hlava, zobak, kryt (krycí pera), letka (letky u kořene), spicka (špičky), ocas, oci,
//    fenix (ohnivý: chocholka, dlouhé ocasní pera, záře), oboci (přísný pohled orla), stopa
export function ptak2(o) {
  const g = new THREE.Group();
  const sv = o.fenix ? 0.35 : 0;
  // --- tělo: kapka (soustružený profil), nahoře barva těla, dole bříško ---
  const profil = [[0, -1.55], [0.3, -1.3], [0.5, -0.8], [0.58, -0.15], [0.52, 0.5], [0.34, 1.05], [0.16, 1.45], [0, 1.6]].map(([r, y]) => new THREE.Vector2(r, y));
  const teloGeo = new THREE.LatheGeometry(profil, 18); teloGeo.rotateX(Math.PI / 2); teloGeo.scale(0.95, 0.82, 1);
  prechod(teloGeo, 'y', o.bricho, o.telo, 0.8);
  const telo = new THREE.Mesh(teloGeo, matBarvy(sv)); g.add(telo);
  // --- hlava ---
  const hlavaGeo = new THREE.SphereGeometry(0.46, 18, 14); hlavaGeo.scale(0.92, 0.9, 1.08);
  prechod(hlavaGeo, 'y', o.bricho === o.telo ? o.hlava : o.hlava, o.hlava);
  const hlava = new THREE.Mesh(hlavaGeo, matBarvy(sv)); hlava.position.set(0, 0.32, -1.5); g.add(hlava);
  // zobák: horní zahnutý a dolní menší
  const hz = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.62, 10), toon(o.zobak)); hz.rotation.x = -Math.PI / 2 + 0.32; hz.position.set(0, 0.26, -2.02); g.add(hz);
  const hs = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), toon(o.zobak)); hs.position.set(0, 0.12, -2.22); hs.scale.set(0.8, 0.7, 1); g.add(hs);
  const dz = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.38, 8), toon(o.zobak)); dz.rotation.x = -Math.PI / 2 - 0.15; dz.position.set(0, 0.12, -1.9); g.add(dz);
  // oči: bělmo, zornice, odlesk — velké a laskavé, u orla s obočím
  for (const sx of [-1, 1]) {
    const bel = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), toon('#ffffff')); bel.position.set(sx * 0.27, 0.45, -1.78); g.add(bel);
    const zor = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), toon(o.oci || '#1a1020')); zor.position.set(sx * 0.31, 0.46, -1.88); g.add(zor);
    const odl = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), new THREE.MeshBasicMaterial({ color: '#ffffff' })); odl.position.set(sx * 0.33, 0.5, -1.94); odl.userData.bezObrysu = true; g.add(odl);
    if (o.oboci) { const ob = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.12), toon(o.oboci)); ob.position.set(sx * 0.27, 0.59, -1.8); ob.rotation.z = sx * -0.35; g.add(ob); }
  }
  // chocholka (Fénix): tři svítící pera nahoru dozadu
  const chocholka = [];
  if (o.fenix) {
    [[-0.12, 0.9, -0.25], [0, 1.15, 0], [0.12, 0.9, 0.25]].forEach(([x, d, r]) => {
      const pg = pero(d, 0.32, o.letka, o.spicka); pg.rotateX(-1.1); pg.rotateY(r);
      const m = new THREE.Mesh(pg, matPeri(0.6)); m.position.set(x, 0.62, -1.45); m.userData.bezObrysu = true; g.add(m); chocholka.push(m);
    });
  }
  // nožky schované pod tělem
  for (const sx of [-1, 1]) { const n = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 6), toon(o.zobak)); n.rotation.x = Math.PI / 2 + 0.4; n.position.set(sx * 0.2, -0.38, 0.75); g.add(n); }

  // --- křídla: rameno → loket → dlaň, na každém pera ---
  const kr = {};
  for (const [strana, sx] of [['L', -1], ['P', 1]]) {
    const rameno = new THREE.Group(); rameno.position.set(sx * 0.42, 0.2, -0.35); g.add(rameno);
    const loket = new THREE.Group(); loket.position.set(sx * 1.05, 0, 0.05); rameno.add(loket);
    const dlan = new THREE.Group(); dlan.position.set(sx * 1.0, 0, 0.08); loket.add(dlan);
    const kost = (delka, r) => { const k = new THREE.CapsuleGeometry(r, delka, 4, 8); k.rotateZ(Math.PI / 2); k.translate(sx * delka / 2, 0.02, 0); return prechod(k, 'y', o.kryt, o.kryt); };
    const segment = (rodic, delka, krycich, letek, delkaLetek, kostR) => {
      const geos = [kost(delka, kostR)];
      for (let i = 0; i < letek; i++) { const t = i / (letek - 1 || 1); geos.push(umisti(pero(delkaLetek * (1 - t * 0.12), 0.42, o.letka, o.spicka), sx * (0.08 + t * (delka - 0.05)), -0.02, -0.02, sx * -0.06 * t)); }
      for (let i = 0; i < krycich; i++) { const t = i / (krycich - 1 || 1); geos.push(umisti(pero(delkaLetek * 0.5, 0.4, o.kryt, o.letka), sx * (0.05 + t * (delka - 0.05)), 0.04, -0.12)); }
      const m = new THREE.Mesh(spoj(geos), matPeri(sv)); m.userData.bezObrysu = true; rodic.add(m);
    };
    segment(rameno, 1.05, 5, 6, 1.25, 0.12);
    segment(loket, 1.0, 5, 6, 1.35, 0.1);
    // ruční letky: vějíř od dozadu po do strany
    const geos = [kost(0.5, 0.08)];
    for (let i = 0; i < 6; i++) { const t = i / 5; geos.push(umisti(pero(1.55 + t * 0.6, 0.46, o.letka, o.spicka), sx * (0.05 + t * 0.45), -0.01 + t * 0.01, -0.02, sx * (0.15 + t * 1.05))); }
    const mh = new THREE.Mesh(spoj(geos), matPeri(sv)); mh.userData.bezObrysu = true; dlan.add(mh);
    kr[strana] = { rameno, loket, dlan, sx, l: 0, d: 0 };
  }

  // --- ocas: vějíř, u Fénixe navíc tři dlouhá vlající pera ---
  const ocas = new THREE.Group(); ocas.position.set(0, 0.08, 1.3); g.add(ocas);
  const og = [];
  for (let i = 0; i < 7; i++) { const t = i / 6 - 0.5; og.push(umisti(pero(1.35 - Math.abs(t) * 0.4, 0.5, o.ocas, o.spicka), t * 0.25, 0, 0, t * 1.1)); }
  const om = new THREE.Mesh(spoj(og), matPeri(sv)); om.userData.bezObrysu = true; ocas.add(om);
  const vlecky = [];
  if (o.fenix) {
    for (const [x, r] of [[-0.25, -0.22], [0, 0], [0.25, 0.22]]) {
      let rodic = ocas; const clanky = [];
      for (let k = 0; k < 4; k++) {
        const c = new THREE.Group(); c.position.set(k ? 0 : x, 0, k ? 0.85 : 0.6); if (!k) c.rotation.y = r; rodic.add(c);
        const pg = pero(0.95, 0.34 - k * 0.04, k < 2 ? o.letka : o.spicka, o.spicka, 0.04);
        const m = new THREE.Mesh(pg, matPeri(0.55)); m.userData.bezObrysu = true; c.add(m);
        clanky.push(c); rodic = c;
      }
      // na konci pera „oko“ jako u pávího/ohnivého ptáka
      const oko = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff3a0' })); oko.position.z = 0.9; oko.userData.bezObrysu = true; clanky[3].add(oko);
      vlecky.push(clanky);
    }
    const z = zare('rgba(255,140,40,1)', 7); z.position.set(0, 0.2, 0); g.add(z);
  }

  obrys(g, 1.05); stin(g);
  g.scale.setScalar(1.35); g.rotation.order = 'YXZ';
  let slozeniPlyn = 0;
  return {
    g, stopa: o.stopa || null,
    kridla(u, cas = 0) {
      const cil = Math.min(1, Math.max(0, (-u - 0.4) / 0.45)) * 0.45;   // ruce u těla = křídla trochu složená dozadu
      slozeniPlyn += (cil - slozeniPlyn) * 0.08; const slozeni = slozeniPlyn;
      const zvedni = u * (1 - slozeni * 0.6);
      for (const k of Object.values(kr)) {
        // každý kloub se zpožďuje za předchozím → křídlo se vlní jako opravdové
        k.l += (zvedni * 0.55 - k.l) * 0.35; k.d += (k.l * 0.8 - k.d) * 0.35;
        k.rameno.rotation.z = k.sx * zvedni * 0.85;
        k.loket.rotation.z = k.sx * (k.l - zvedni * 0.25);
        k.dlan.rotation.z = k.sx * k.d;
        k.rameno.rotation.y = -k.sx * slozeni * 1.0;
        k.loket.rotation.y = -k.sx * slozeni * 0.9;
        k.dlan.rotation.y = -k.sx * slozeni * 0.6;
      }
      ocas.rotation.x = -u * 0.12;
      vlecky.forEach((cl, j) => cl.forEach((c, i) => { c.rotation.x = Math.sin(cas * 5 - i * 0.9 + j) * 0.22; c.rotation.y = (i ? 0 : c.rotation.y) + (i ? Math.sin(cas * 3.4 - i + j * 2) * 0.12 : 0); }));
      chocholka.forEach((m, i) => { m.rotation.z = Math.sin(cas * 6 + i) * 0.08; });
    },
  };
}

// ================= DRAK / NETOPÝR =================
// Blanitá křídla: rameno → loket → dlaň se čtyřmi prsty, mezi prsty blána s vykrojeným okrajem.
// o: telo, bricho, blana, blana2, kosti, rohy, ostny, oci, netopyr (uši místo rohů, kratší krk a ocas), stopa
function blana(body, barva1, barva2) {
  const s = new THREE.Shape(); s.moveTo(body[0][0], body[0][1]);
  for (let i = 1; i < body.length; i++) {
    const [x, y, vykroj] = body[i], [px, py] = body[i - 1];
    if (vykroj) s.quadraticCurveTo((px + x) / 2 + vykroj[0], (py + y) / 2 + vykroj[1], x, y); else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ShapeGeometry(s, 6); g.rotateX(Math.PI / 2);   // y tvaru → z (dozadu)
  prechod(g, 'z', barva1, barva2); g.computeVertexNormals();
  return g;
}
export function drak2(o) {
  const g = new THREE.Group();
  const pt = !!o.ptero;              // pterodaktyl: štíhlé tělo, krk, dlouhý zobák, hřebínek dozadu, dlouhý tenký ocas
  const net = !!o.netopyr || pt;
  // tělo
  const profil = (net ? [[0, -0.9], [0.4, -0.6], [0.55, 0], [0.45, 0.6], [0.2, 1.0], [0, 1.1]] : [[0, -1.3], [0.38, -1.0], [0.6, -0.3], [0.62, 0.4], [0.45, 1.1], [0.22, 1.6], [0, 1.75]]).map(([r, y]) => new THREE.Vector2(r, y));
  const tg = new THREE.LatheGeometry(profil, 16); tg.rotateX(Math.PI / 2); tg.scale(0.95, 0.85, 1);
  prechod(tg, 'y', o.bricho, o.telo, 0.7);
  g.add(new THREE.Mesh(tg, matBarvy()));
  // krk a hlava
  const hlava = new THREE.Group(); hlava.position.set(0, pt ? 0.4 : net ? 0.15 : 0.35, pt ? -1.35 : net ? -0.95 : -1.55); g.add(hlava);
  if (!net || pt) { const krk = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 0.7, 10), toon(o.telo)); krk.rotation.x = Math.PI / 2 - 0.5; krk.position.set(0, -0.12, 0.3); hlava.add(krk); }
  const lebka = new THREE.Mesh(new THREE.SphereGeometry(net ? 0.42 : 0.4, 16, 12), toon(o.telo)); lebka.scale.set(1, 0.85, pt ? 1.25 : net ? 0.95 : 1.1); hlava.add(lebka);
  if (!pt) { const cumak = new THREE.Mesh(new THREE.SphereGeometry(net ? 0.2 : 0.3, 12, 10), toon(net ? o.bricho : o.telo)); cumak.scale.set(1, 0.7, 1.3); cumak.position.set(0, -0.08, net ? -0.32 : -0.48); hlava.add(cumak); }
  for (const sx of [-1, 1]) {
    if (!pt) { const nosni = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), toon('#1a1020')); nosni.position.set(sx * 0.08, 0, net ? -0.52 : -0.84); hlava.add(nosni); }
    const bel = new THREE.Mesh(new THREE.SphereGeometry(net ? 0.14 : 0.12, 12, 10), toon(o.oci || '#ffe14d')); bel.position.set(sx * 0.22, 0.12, -0.3); hlava.add(bel);
    const zor = new THREE.Mesh(new THREE.SphereGeometry(net ? 0.08 : 0.06, 8, 6), toon('#1a1020')); zor.scale.set(net ? 1 : 0.5, 1, 1); zor.position.set(sx * 0.25, 0.13, -0.41); hlava.add(zor);
    const odl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshBasicMaterial({ color: '#ffffff' })); odl.position.set(sx * 0.27, 0.17, -0.45); odl.userData.bezObrysu = true; hlava.add(odl);
    if (pt) { /* pterodaktyl: hlava se dodělá pod smyčkou */ }
    else if (net) {   // velké uši a zoubky
      const ucho = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.55, 4), toon(o.telo)); ucho.position.set(sx * 0.25, 0.45, 0.05); ucho.rotation.z = -sx * 0.35; hlava.add(ucho);
      const vnitrek = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.35, 4), toon(o.blana)); vnitrek.position.set(sx * 0.25, 0.42, -0.04); vnitrek.rotation.z = -sx * 0.35; hlava.add(vnitrek);
      const zub = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), toon('#ffffff')); zub.rotation.x = Math.PI; zub.position.set(sx * 0.07, -0.2, -0.45); hlava.add(zub);
    } else {     // rohy
      const roh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 6), toon(o.rohy)); roh.position.set(sx * 0.2, 0.32, 0.22); roh.rotation.x = 0.9; roh.rotation.z = -sx * 0.25; hlava.add(roh);
    }
  }
  if (pt) {
    // zobák: horní dlouhý a dolní kratší, mírně pootevřený (usměvavý)
    const zh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.5, 10), toon(o.zobak || '#f2c66a')); zh.rotation.x = -Math.PI / 2 + 0.06; zh.scale.set(1, 1, 0.55); zh.position.set(0, -0.02, -1.05); hlava.add(zh);
    const zd = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.2, 10), toon(o.zobak || '#f2c66a')); zd.rotation.x = -Math.PI / 2 - 0.12; zd.scale.set(1, 1, 0.5); zd.position.set(0, -0.2, -0.88); hlava.add(zd);
    // velký hřebínek dozadu (typický pteranodon)
    const tvar = new THREE.Shape(); tvar.moveTo(0, 0); tvar.quadraticCurveTo(0.5, 0.35, 1.45, 0.42); tvar.quadraticCurveTo(0.7, 0.05, 0.25, -0.22); tvar.closePath();
    const hg = new THREE.ExtrudeGeometry(tvar, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }); hg.translate(0, 0, -0.04); hg.rotateY(-Math.PI / 2);
    const hreb = new THREE.Mesh(hg, toon(o.hrebinek || '#e8434e')); hreb.position.set(0, 0.18, 0.15); hlava.add(hreb);
  }
  // ostny po zádech
  if (!net) for (let i = 0; i < 6; i++) { const os = new THREE.Mesh(new THREE.ConeGeometry(0.13 - i * 0.012, 0.36, 5), toon(o.ostny)); os.position.set(0, 0.55 - i * 0.03, -0.7 + i * 0.42); os.rotation.x = -0.5; g.add(os); }
  // ocas z článků (vlní se), na konci šipka
  const ocas = []; let rodic = g;
  const clanku = pt ? 5 : net ? 2 : 6;
  for (let i = 0; i < clanku; i++) {
    const c = new THREE.Group(); c.position.set(0, i ? 0 : 0.05, i ? 0.5 : (net ? 0.95 : 1.6)); rodic.add(c);
    const r0 = pt ? 0.11 - i * 0.015 : 0.22 - i * 0.03;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r0 + (pt ? 0.015 : 0.04), 0.55, 8), toon(o.telo)); m.rotation.x = Math.PI / 2; m.position.z = 0.25; c.add(m);
    ocas.push(c); rodic = c;
  }
  if (pt) { const k = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), toon(o.hrebinek || o.telo)); k.scale.set(1, 0.18, 1.3); k.position.z = 0.75; rodic.add(k); }
  if (!net) { const sipka = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4), toon(o.ostny)); sipka.rotation.x = Math.PI / 2; sipka.scale.set(1, 1, 0.35); sipka.position.z = 0.7; rodic.add(sipka); }
  // křídla
  const kr = {};
  for (const [strana, sx] of [['L', -1], ['P', 1]]) {
    const rameno = new THREE.Group(); rameno.position.set(sx * 0.45, 0.32, -0.5); g.add(rameno);
    const loket = new THREE.Group(); loket.position.set(sx * 1.1, 0, -0.05); rameno.add(loket);
    const dlan = new THREE.Group(); dlan.position.set(sx * 1.0, 0, 0); loket.add(dlan);
    const kost = (rod, delka, r) => { const k = new THREE.Mesh(new THREE.CapsuleGeometry(r, delka, 4, 8), toon(o.kosti)); k.rotation.z = Math.PI / 2; k.position.x = sx * delka / 2; rod.add(k); };
    kost(rameno, 1.1, 0.1); kost(loket, 1.0, 0.08);
    // prsty: vějíř od „do strany“ po „dozadu“
    const prsty = [[2.0, 0.15], [2.1, 0.6], [1.9, 1.0], [1.5, 1.35]];
    const spicky = prsty.map(([d, a]) => [sx * Math.cos(a) * d, Math.sin(a) * d]);
    prsty.forEach(([d, a], i) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, d, 5), toon(o.kosti)); p.rotation.order = 'YXZ'; p.rotation.y = -sx * a; p.rotation.z = Math.PI / 2;
      p.position.set(sx * Math.cos(a) * d / 2, 0, Math.sin(a) * d / 2); dlan.add(p);
      if (i === 0) { const dr = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 5), toon('#ffffff')); dr.rotation.z = -sx * Math.PI / 2; dr.position.set(sx * (Math.cos(a) * d + 0.08), 0, Math.sin(a) * d); dlan.add(dr); }
    });
    // blána: dlaň (mezi prsty), loket, rameno — vykrojený zadní okraj
    const b1 = blana([[0, 0], ...spicky.map(([x, z], i) => i ? [x, z, [sx * -0.1, -0.25]] : [x, z]), [0, 1.2, [sx * 0.2, -0.2]]], o.blana, o.blana2 || o.blana);
    const b2 = blana([[0, 0], [sx * 1.0, 0], [sx * 1.0, 1.25], [0, 1.15, [sx * 0.05, -0.25]]], o.blana, o.blana2 || o.blana);
    const b3 = blana([[0, 0], [sx * 1.1, 0], [sx * 1.1, 1.15], [sx * -0.4, 1.0, [sx * 0.1, -0.3]]], o.blana, o.blana2 || o.blana);
    const mb = matPeri(); for (const [rod, geo] of [[dlan, b1], [loket, b2], [rameno, b3]]) { const m = new THREE.Mesh(geo, mb); m.userData.bezObrysu = true; rod.add(m); }
    kr[strana] = { rameno, loket, dlan, sx, l: 0, d: 0 };
  }
  obrys(g, 1.05); stin(g);
  g.scale.setScalar(net ? 1.45 : 1.3); g.rotation.order = 'YXZ';
  return {
    g, stopa: o.stopa || null,
    kridla(u, cas = 0) {
      const slozeni = Math.min(1, Math.max(0, (-u - 0.4) / 0.45)), zvedni = u * (1 - slozeni * 0.6);
      for (const k of Object.values(kr)) {
        k.l += (zvedni * 0.6 - k.l) * 0.3; k.d += (k.l * 0.9 - k.d) * 0.3;
        k.rameno.rotation.z = k.sx * zvedni * 0.95; k.loket.rotation.z = k.sx * (k.l - zvedni * 0.3); k.dlan.rotation.z = k.sx * k.d;
        k.rameno.rotation.y = -k.sx * slozeni * 0.9; k.loket.rotation.y = k.sx * slozeni * 1.6; k.dlan.rotation.y = -k.sx * slozeni * 1.2;
      }
      ocas.forEach((c, i) => { c.rotation.y = Math.sin(cas * 3 - i * 0.7) * 0.18; c.rotation.x = Math.sin(cas * 2.2 - i * 0.5) * 0.06 - u * 0.03; });
      hlava.rotation.x = -u * 0.08;
    },
  };
}

// ================= VÁŽKA =================
// Duhové článkované tělo, velké oči, čtyři průhledná křídla s žilkami (kreslené do textury).
const zilkyTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const k = c.getContext('2d');
  k.fillStyle = 'rgba(200,245,255,0.35)'; k.fillRect(0, 0, 256, 64);
  k.strokeStyle = 'rgba(30,90,120,0.75)'; k.lineWidth = 2;
  k.beginPath(); k.moveTo(0, 20); k.quadraticCurveTo(128, 6, 256, 24); k.stroke();
  k.lineWidth = 1;
  for (let x = 10; x < 256; x += 14) { k.beginPath(); k.moveTo(x, 12 - x * 0.02); k.lineTo(x + 6, 60); k.stroke(); }
  for (let y = 28; y < 64; y += 10) { k.beginPath(); k.moveTo(0, y); k.lineTo(256, y + 2); k.stroke(); }
  k.fillStyle = 'rgba(40,60,90,0.8)'; k.fillRect(226, 14, 18, 8);     // tmavá ploška u špičky
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
export function vazka2(o = {}) {
  const g = new THREE.Group();
  const c1 = o.barva1 || '#18c0e8', c2 = o.barva2 || '#7be04a', c3 = o.barva3 || '#2a5bd8';
  // zadeček: 10 článků s duhovým přechodem
  for (let i = 0; i < 10; i++) {
    const t = i / 9, r = 0.2 - t * 0.09;
    const geo = new THREE.CapsuleGeometry(r, 0.22, 4, 10); geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, toon('#' + C(c1).lerp(C(c2), t).getHexString())); m.position.set(0, 0, 0.35 + i * 0.33); g.add(m);
    const pruh = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, 0.025, 4, 12), toon(c3)); pruh.position.set(0, 0, 0.5 + i * 0.33); g.add(pruh);
  }
  const hrud = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), toon(c1)); hrud.scale.set(0.95, 0.95, 1.35); hrud.position.z = -0.15; g.add(hrud);
  const hlava = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), toon(c3)); hlava.position.set(0, 0.02, -0.68); g.add(hlava);
  for (const sx of [-1, 1]) {
    const oko = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), toon(o.oci || '#ff4d8d')); oko.position.set(sx * 0.24, 0.12, -0.8); g.add(oko);
    const zor = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), toon('#1a1020')); zor.position.set(sx * 0.33, 0.16, -1.0); g.add(zor);
    const odl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), new THREE.MeshBasicMaterial({ color: '#ffffff' })); odl.position.set(sx * 0.36, 0.22, -1.08); odl.userData.bezObrysu = true; g.add(odl);
    for (let n = 0; n < 3; n++) { const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 4), toon('#1a1020')); noz.position.set(sx * 0.22, -0.32, -0.4 + n * 0.2); noz.rotation.z = sx * 0.6; g.add(noz); }
  }
  // úsměv
  const pusa = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 5, 10, Math.PI), toon('#1a1020')); pusa.rotation.z = Math.PI; pusa.position.set(0, -0.08, -0.93); g.add(pusa);
  // křídla
  const tvar = new THREE.Shape(); tvar.moveTo(0, 0); tvar.quadraticCurveTo(1.5, -0.32, 3.0, 0.02); tvar.quadraticCurveTo(3.15, 0.25, 2.9, 0.42); tvar.quadraticCurveTo(1.5, 0.75, 0, 0.32); tvar.closePath();
  const kridla = [];
  for (const sx of [-1, 1]) for (const [z, m, faze] of [[-0.35, 1, 0], [0.05, 0.88, 1.7]]) {
    const geo = new THREE.ShapeGeometry(tvar, 10);
    const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 3.1, 1 - (p.getY(i) + 0.35) / 1.1);
    geo.rotateX(Math.PI / 2); geo.scale(sx * m, 1, m);
    const k = new THREE.Group(); k.position.set(sx * 0.25, 0.28, z);
    const w = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: zilkyTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })); w.userData.bezObrysu = true; k.add(w);
    g.add(k); kridla.push({ k, sx, faze });
  }
  obrys(g, 1.06); stin(g);
  g.scale.setScalar(2.2); g.rotation.order = 'YXZ';
  return {
    g, stopa: o.stopa || null,
    kridla(u, cas = 0) { for (const w of kridla) w.k.rotation.z = w.sx * (u * 0.45 + Math.sin(cas * 48 + w.faze) * 0.38); },
  };
}

// ---- létající postavy s hotovou animací (Quaternius, CC0) ----
// Křídla se nehýbou podle rukou kloub po kloubu, ale animace zrychlí, když dítě mává, a zpomalí, když plachtí.
import { model, hrajAnimaci } from './bezci.js';
export function letecModel(soubor, opt = {}) {
  const p = model('modely/' + soubor + '.glb', { vyska: 2.4, mapa: { idle: 'Flying_Idle', sprint: 'Fast_Flying', jump: null }, ...opt });
  let posledni = null, predU = 0, mavani = 0;
  p.kridla = (u, cas = 0) => {
    const dt = posledni === null ? 0 : Math.min(0.1, Math.max(0, cas - posledni)); posledni = cas;
    mavani = Math.max(mavani * Math.exp(-dt * 3), Math.min(3, Math.abs(u - predU) / Math.max(dt, 0.001) * 0.4)); predU = u;
    hrajAnimaci(p, mavani > 0.6 ? 'sprint' : 'idle', 0.25);
    if (p.mixer) p.mixer.update(dt * (0.7 + Math.min(1.5, mavani * 0.5)));
  };
  return p;
}

// ---- jezdec na koštěti (režim Koště) ----
// Postava z běhu (Quaternius) v sedu: vezme se první snímek animace Idle (rovný postoj) a kosti nohou
// a rukou se pootočí (úhly spočítané tak, aby kolena byla vpředu ve výšce boků a pěsti u sebe na násadě).
// Koště je z kódu. Rozhraní jako letec: { g, stopa, kridla(u, cas) } — „křídla“ tu jen jemně houpou koštětem.
const SED = { UpperLeg: [-1.2, 0, 0], LowerLeg: [1.05, 0, 0], UpperArmL: [0.6, 0.2, -1], UpperArmR: [0.6, -0.2, 1] };
export function jezdec(soubor, opt = {}) {
  const g = new THREE.Group();
  const kost = new THREE.Group(); kost.rotation.x = 0.22; g.add(kost);
  const nasada = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 3.8, 8), toon(opt.nasada || '#8a5a2b'));
  nasada.rotation.x = Math.PI / 2; nasada.position.z = -0.2; kost.add(nasada);
  const spicka = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), toon(opt.pasek || '#e8434e')); spicka.position.z = -2.1; kost.add(spicka);
  const metla = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 12), toon(opt.metla || '#f2c66a'));
  metla.rotation.x = -Math.PI / 2; metla.position.z = 2.15; kost.add(metla);
  const pasek = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.18, 10), toon(opt.pasek || '#e8434e'));
  pasek.rotation.x = Math.PI / 2; pasek.position.z = 1.5; kost.add(pasek);
  obrys(kost, 1.06); stin(kost);
  // vyska = výška postavy ve stoje (stejná u všech jezdců); jen Idle, aby galerie ani hra nepouštěly běh
  const p = model('modely/' + soubor + '.glb', { vyska: opt.vyska || 2.3, barvy: opt.barvy || {}, po: opt.po || null, mapa: { sprint: null, jump: null } });
  g.add(p.g);
  g.rotation.order = 'YXZ'; g.scale.setScalar(opt.mer || 2.5);   // jezdec je menší než letci, ať je ve hře dobře vidět (22. 11. zvětšeno z 1.7)
  let sedi = false;
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3();
  function posad() {
    if (!p.mixer || !p.akce.idle) return;
    p.akce.idle.play(); p.mixer.update(0);
    const m = p.g.children[0]?.children[0]; if (!m) return;
    const otoc = (jm, [x, y, z]) => { const b = m.getObjectByName(jm); if (b) b.quaternion.multiply(q.setFromEuler(e.set(x, y, z))); };
    for (const sd of ['L', 'R']) { otoc('UpperLeg' + sd, SED.UpperLeg); otoc('LowerLeg' + sd, SED.LowerLeg); }
    otoc('UpperArmL', SED.UpperArmL); otoc('UpperArmR', SED.UpperArmR);
    p.akce.idle.stop();                 // póza zůstane, mixer už kosti nepřepisuje
    // boky posadit na násadu (kus za středem násady)
    g.updateMatrixWorld(true);
    const boky = m.getObjectByName('Hips'); if (!boky) return;
    g.worldToLocal(boky.getWorldPosition(v));
    p.g.position.set(-v.x, 0.06 - v.y, 0.15 - v.z);
    sedi = true;
  }
  return {
    g, stopa: opt.stopa || null, ohen: !!opt.ohen, jezdec: p,
    kridla(u, cas = 0) {
      if (!sedi) posad();
      kost.rotation.z = Math.sin(cas * 2.1) * 0.04;
      metla.scale.set(1 + Math.sin(cas * 9) * 0.04, 1, 1);
    },
  };
}
