// Řízení celé hry: domů → levely a postavičky → (čekání na ruce) → odpočet → hra → výsledek.
import { THREE, renderer, snizKvalitu, $, ulozene, uloz, nactiDucha, ulozDucha, audio, prepniZvuk, hrajHudbu, SFX, kamera, ruce, zpracujRuce } from './zaklad.js';
import { BEZCI, LETCI, KOSTATA } from './postavy.js';
import { vytvorBeh, LEVELY as LV_BEH, NEKONECNY } from './beh.js';
import { vytvorLet, LEVELY as LV_LET, VOLNY, LEVELY_KOSTE, VOLNY_KOSTE } from './let.js';
import { kresliPanacka, KROKY, UCINEK, KLAVESA } from './navod.js';
import { stats } from './stats.js';
import { nahravani } from './nahravani.js';
import { t, tn, jazyk, nastavJazyk, poZmene } from './i18n.js';
import './pwa.js';

const ctx = {
  konec: v => konecHry(v),
  banner: (t, b) => banner(t, b),
  zasah: () => { $('zasah').style.opacity = 1; setTimeout(() => $('zasah').style.opacity = 0, 250); },
};
const beh = vytvorBeh(ctx);
const lt = vytvorLet(ctx);
const ko = vytvorLet(ctx, 'koste');     // závod na koštěti: stejný motor jako let
const REZIMY = {
  beh: { api: beh, levely: LV_BEH, extra: NEKONECNY, skiny: BEZCI, nazev: 'mode.beh', hudba: 'beh',
    napovedaKamera: 'hint.beh.cam', napovedaKlavesy: 'hint.beh.keys' },
  let: { api: lt, levely: LV_LET, extra: VOLNY, skiny: LETCI, nazev: 'mode.let', hudba: 'let',
    napovedaKamera: 'hint.let.cam', napovedaKlavesy: 'hint.let.keys' },
  koste: { api: ko, levely: LEVELY_KOSTE, extra: VOLNY_KOSTE, skiny: KOSTATA, nazev: 'mode.koste', hudba: 'let',
    napovedaKamera: 'hint.koste.cam', napovedaKlavesy: 'hint.koste.keys' },
};

let stav = 'domu';            // domu | levely | cekam | odpocet | hra | vysledek
let rezimHry = 'beh', levelIndex = 0, odpocetT = 0, skinIndex = 0;
let ovladani = ulozene.ovladani || 'kamera';
const R = () => REZIMY[rezimHry];
// čas s jedním desetinným místem podle jazyka (41.2 / 41,2)
const fmt = x => (+x).toLocaleString(jazyk, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// kdo z rodiny letěl (děti neumí psát jména, proto obrázky); pamatuje se poslední volba
const KDO = ['🧒', '👧', '👦', '👩', '👨', '👵', '👴', '🐶'];
const casyLevelu = (rz, i) => (ulozene.casy[rz] ||= [])[i] ||= [];

// ================= OBRAZOVKY =================
function ukaz(id) {
  for (const s of ['domu', 'levely', 'cekam', 'vysledek']) $(s).classList.toggle('skryt', s !== id);
  const veHre = id === null;
  $('hud').classList.toggle('skryt', !veHre);
  $('konecHry').classList.toggle('skryt', !veHre);
  $('napoveda').classList.toggle('skryt', !veHre);
  $('penezenka').classList.toggle('skryt', veHre);
  if (id === 'domu' || id === 'levely') $('kam').classList.add('skryt');
  else if (ovladani === 'kamera' && kamera.zapnuta) $('kam').classList.remove('skryt');
  document.body.classList.toggle('veHre', veHre);
  if (!veHre) for (const x of ['hudCas', 'hudDravec', 'znacka']) $(x).classList.add('skryt');   // ve hře se schová tlačítko celé obrazovky (překrývalo nápovědu)
}
function obnovPenezenku() { $('pocetMinci').textContent = ulozene.mince; }
let bannerT = null;
let bannerVideo = null;
function banner(text, barva = '#ffffff') {
  bannerVideo = { text, barva, do: performance.now() + 1300 };
  const b = $('banner'); b.textContent = text; b.style.color = barva;
  b.style.opacity = 1; b.style.transform = 'translate(-50%,-50%) scale(1)';
  clearTimeout(bannerT);
  bannerT = setTimeout(() => { b.style.opacity = 0; b.style.transform = 'translate(-50%,-70%) scale(.9)'; }, 1300);
}

function naDomu() {
  stav = 'domu'; rezimHry = 'beh'; hrajHudbu('lobby');
  beh.nahled(ulozene.vybrany.beh);
  ukaz('domu'); obnovPenezenku();
}
function naLevely(rz = rezimHry) {
  stav = 'levely'; rezimHry = rz; hrajHudbu('lobby');
  const r = R();
  $('levelyNadpis').textContent = t(r.nazev);
  const seznam = $('levelySeznam'); seznam.innerHTML = '';
  const hv = ulozene.hvezdy[rz] || [];
  r.levely.forEach((lv, i) => {
    const b = document.createElement('button'); b.className = 'lvl';
    const odemceno = i < ulozene.odemceno[rz];
    b.disabled = !odemceno;
    const h = hv[i] || 0;
    const nej = rz !== 'beh' && ulozene.casy[rz]?.[i]?.[0];
    b.innerHTML = `<div class="ikonaLvl">${odemceno ? IKONY[rz][i] || '' : '🔒'}</div><div class="cislo">${i + 1}</div><div class="jm">${tn(lv.jmeno)}</div><div class="hv">${'★'.repeat(h)}${'☆'.repeat(3 - h)}</div>${nej ? `<div class="casLvl">${nej.kdo} ${fmt(nej.t)}s</div>` : ''}`;
    b.onclick = () => { SFX.klik(); spustLevel(i); };
    seznam.appendChild(b);
  });
  const b = document.createElement('button'); b.className = 'lvl nekonecny';
  const rek = ulozene.rekord[rz] || 0;
  b.innerHTML = `<div class="ikonaLvl" style="color:var(--modra);font-weight:800">∞</div><div class="jm">${tn(r.extra.jmeno)}</div><div class="hv" style="font-size:15px">${rek ? t('lvl.record', { n: rek }) : '&nbsp;'}</div>`;
  b.onclick = () => { SFX.klik(); spustLevel(-1); };
  seznam.appendChild(b);
  skinIndex = Math.max(0, r.skiny.findIndex(s => s.id === ulozene.vybrany[rz]));
  ukazSkin();
  obnovOvladani();
  ukaz('levely'); obnovPenezenku();
}

// obrázek u levelu, ať dítě bez čtení pozná, co ho čeká
const IKONY = {
  beh: ['🌲', '🐪', '🏔️', '🌋', '🌙', '🌳', '🌃', '🌪️', '🧊', '🏆'],
  let: ['🏞️', '🌊', '🏜️', '🕳️', '🗿', '💨', '💃', '🎯', '⛈️', '🏆', '🌃'],
  koste: ['🌼', '🌊', '🏜️', '🗿', '💨', '💃', '⛈️', '🏆'],
};
// ---- obchod se skiny ----
function ukazSkin() {
  const r = R(), s = r.skiny[skinIndex];
  r.api.nahled(s.id);
  $('skinJmeno').textContent = tn(s.jmeno);
  const ma = ulozene.skiny.includes(s.id) || s.cena === 0, vybrany = ulozene.vybrany[rezimHry] === s.id;
  const st = $('skinStav'); st.innerHTML = '';
  const b = document.createElement('button'); b.className = 'tl';
  if (vybrany) { b.textContent = t('skin.selected'); b.className += ' tl-svetle'; b.disabled = true; }
  else if (ma) { b.textContent = t('skin.pick'); b.className += ' tl-zelene'; b.onclick = () => { ulozene.vybrany[rezimHry] = s.id; uloz(); SFX.klik(); ukazSkin(); }; }
  else if (ulozene.mince >= s.cena) {
    b.innerHTML = `${t('skin.buy', { n: s.cena })} <span class="minc"></span>`; b.className += ' tl-zlute';
    b.onclick = () => { ulozene.mince -= s.cena; ulozene.skiny.push(s.id); ulozene.vybrany[rezimHry] = s.id; uloz(); SFX.koupe(); obnovPenezenku(); banner(t('skin.new'), '#ffd23f'); ukazSkin(); };
  } else { b.innerHTML = `🔒 ${s.cena} <span class="minc"></span> · ${t('skin.missing', { n: s.cena - ulozene.mince })}`; b.className += ' tl-svetle'; b.disabled = true; }
  st.appendChild(b);
}
$('skinPred').onclick = () => { audio(); const n = R().skiny.length; skinIndex = (skinIndex - 1 + n) % n; SFX.klik(); ukazSkin(); };
$('skinDal').onclick = () => { audio(); skinIndex = (skinIndex + 1) % R().skiny.length; SFX.klik(); ukazSkin(); };

// ---- ovládání ----
// volby na obrazovce levelů: nahrávání videa a klidný let
function obnovVolby() {
  const n = $('btnNahravat'); n.classList.toggle('skryt', !nahravani.umi);
  n.textContent = t(ulozene.nahravat ? 'rec.on' : 'rec.off'); n.classList.toggle('aktivni', !!ulozene.nahravat);
  const k = $('btnKlidny'); k.classList.toggle('skryt', rezimHry !== 'let');
  k.textContent = t(ulozene.klidny ? 'calm.on' : 'calm.off'); k.classList.toggle('aktivni', !!ulozene.klidny);
}
$('btnNahravat').onclick = () => { SFX.klik(); ulozene.nahravat = !ulozene.nahravat; uloz(); obnovVolby(); };
$('btnKlidny').onclick = () => { SFX.klik(); ulozene.klidny = !ulozene.klidny; uloz(); obnovVolby(); };
function obnovOvladani() {
  obnovVolby();
  $('ovlKamera').classList.toggle('aktivni', ovladani === 'kamera');
  $('ovlKlavesy').classList.toggle('aktivni', ovladani === 'klavesy');
}
$('ovlKamera').onclick = () => { ovladani = 'kamera'; ulozene.ovladani = ovladani; uloz(); obnovOvladani(); };
$('ovlKlavesy').onclick = () => { ovladani = 'klavesy'; ulozene.ovladani = ovladani; uloz(); obnovOvladani(); };

// ================= NÁVOD BEZ ČTENÍ =================
// V prvním levelu každého režimu panáček předvede pohyb a hra čeká, až ho dítě zopakuje.
let navod = null;
const navodK = $('navodPan').getContext('2d'), cekamK = $('cekamPan').getContext('2d');
function zacniNavod(seznam) {
  const kroky = KROKY[rezimHry].filter(k => seznam.includes(k.poza));
  if (!kroky.length) return;
  navod = { kroky, i: 0, s: null, fajfkaT: -1 };
  R().api.trenink = true;
  $('navod').classList.remove('skryt'); $('navodPreskoc').classList.remove('skryt');
  krokNavodu(0);
}
function krokNavodu(i) {
  navod.i = i; navod.fajfkaT = -1;
  const k = navod.kroky[i], api = R().api;
  navod.s = { start: { ...api.pocty }, drzeno: 0 };
  $('navodUcinek').textContent = UCINEK[k.poza];
  const kl = KLAVESA[k.poza];
  $('navodKlavesa').textContent = ovladani === 'klavesy' ? (kl === 'MEZERNÍK' ? t('key.space') : kl) : '';
  $('navodFajfka').classList.add('skryt');
  $('navodTecky').innerHTML = navod.kroky.map((_, j) => `<i class="${j < i ? 'hotovo' : j === i ? 'ted' : ''}"></i>`).join('');
}
function konecNavodu(oznam = true) {
  if (!navod) return;
  navod = null; for (const r of Object.values(REZIMY)) r.api.trenink = false;
  $('navod').classList.add('skryt'); $('navodPreskoc').classList.add('skryt');
  if (oznam && stav === 'hra') { banner('▶ START!', '#ffd23f'); SFX.svet(); }
}
function aktualizujNavod(dt, cas) {
  if (!navod || stav !== 'hra') return;
  const k = navod.kroky[navod.i];
  kresliPanacka(navodK, 300, 360, k.poza, cas);
  if (navod.fajfkaT >= 0) {
    navod.fajfkaT -= dt;
    if (navod.fajfkaT < 0) { if (navod.i + 1 < navod.kroky.length) krokNavodu(navod.i + 1); else konecNavodu(); }
    return;
  }
  if (k.hotovo(R().api, dt, navod.s)) {
    navod.fajfkaT = 1.0; SFX.koupe();
    $('navodFajfka').classList.remove('skryt');
    $('navodTecky').children[navod.i].className = 'hotovo';
  }
}
$('navodPreskoc').onclick = () => { SFX.klik(); konecNavodu(); };
// malé obrázky pohybů vpravo dole místo textu (pro děti, co neumí číst)
function napovedaObrazky() {
  const n = $('napoveda'); n.innerHTML = '<div class="napovedaObr"></div>';
  const poz = rezimHry === 'let' ? ['mav', 'zatacka', 'strmhlav', 'kure'] : rezimHry === 'koste' ? ['naklon', 'nahoru', 'kouzlo'] : ['krok', 'skok', 'drep'];
  const casy = { naklon: 0.8, nahoru: 0.5, kouzlo: 0.4, mav: 0.2, zatacka: 0.8, strmhlav: 0, kure: 0.1, krok: 1, skok: 0.5, drep: 0.5 };
  for (const p of poz) {
    const d = document.createElement('div'), c = document.createElement('canvas'); c.width = 100; c.height = 120;
    kresliPanacka(c.getContext('2d'), 100, 120, p, casy[p]);
    d.appendChild(c); d.appendChild(document.createTextNode(UCINEK[p])); n.firstChild.appendChild(d);
  }
}

// ================= SPUŠTĚNÍ LEVELU =================
async function spustLevel(i) {
  audio();
  nahravani.zrus(); $('nahravam').classList.add('skryt'); $('vysVideo').classList.add('skryt');
  levelIndex = i;
  if (ovladani === 'kamera' && !kamera.zapnuta) {
    $('ovlChyba').textContent = t('cam.allow');
    try { await kamera.zapni(); $('ovlChyba').textContent = ''; }
    catch (e) { $('ovlChyba').textContent = t('cam.fail', { e: e.message || e }); ovladani = 'klavesy'; obnovOvladani(); return; }
  }
  $('kam').classList.toggle('skryt', ovladani !== 'kamera');
  const r = R(), lv = i < 0 ? r.extra : r.levely[i];
  r.api.klidny = !!ulozene.klidny;
  r.api.pripravit(lv, ulozene.vybrany[rezimHry], ovladani);
  // duch = nejlepší let v tomhle levelu (jen let; v koštěti jsou soupeři)
  if (i >= 0 && r.api.nastavDucha) { const d = nactiDucha(rezimHry + '-' + i); r.api.nastavDucha(d?.stopa, d?.id, casyLevelu(rezimHry, i)[0]?.t); }
  // připraví grafiku všech věcí ve scéně hned teď — jinak se dopočítávala v prvních vteřinách hry a ta sekala
  try { renderer.compile(r.api.scene, r.api.camera); } catch {}
  konecNavodu(false);
  if (ovladani === 'kamera') napovedaObrazky(); else $('napoveda').textContent = t(r.napovedaKlavesy);
  if (ovladani === 'kamera') { stav = 'cekam'; ukaz('cekam'); }
  else zacniOdpocet();
}
function zacniOdpocet() {
  stav = 'odpocet'; odpocetT = 2.99;
  ukaz(null); obnovHud();
  R().api.zacatekOdpoctu();
  if (ulozene.nahravat && nahravani.zacni(ovladani === 'kamera' && kamera.zapnuta)) $('nahravam').classList.remove('skryt');
  hrajHudbu(R().hudba); SFX.tik();
}
function konecHry(v) {
  if (stav !== 'hra') return;
  konecNavodu(false);
  stats.konec(v);
  stav = 'vysledek';
  const r = R(), lv = levelIndex < 0 ? r.extra : r.levely[levelIndex];
  let hvezdy = 0, rekordText = '';
  if (rezimHry === 'beh') hvezdy = v.vyhra ? v.srdce : 0; else hvezdy = v.hvezdy || 0;
  ulozene.mince += v.mince;
  if (levelIndex >= 0 && v.vyhra) {
    const h = ulozene.hvezdy[rezimHry];
    h[levelIndex] = Math.max(h[levelIndex] || 0, hvezdy);
    ulozene.odemceno[rezimHry] = Math.max(ulozene.odemceno[rezimHry], Math.min(r.levely.length, levelIndex + 2));
  }
  if (levelIndex < 0) {
    const body = rezimHry === 'beh' ? Math.floor(v.vzdalenost) + v.mince * 5 : v.kruhy;
    if (body > (ulozene.rekord[rezimHry] || 0)) { ulozene.rekord[rezimHry] = body; rekordText = t('res.newRecord', { n: body }); }
    else rekordText = t('res.record', { n: ulozene.rekord[rezimHry] });
  }
  // čas levelu: žebříček 5 nejlepších (kdo + čas), nejlepší let se uloží jako duch
  let novyZaznam = null, novyRekordCasu = false;
  if (levelIndex >= 0 && v.vyhra && v.cas > 0 && rezimHry !== 'beh') {
    const seznam = casyLevelu(rezimHry, levelIndex), byl = seznam[0]?.t;
    novyZaznam = { t: v.cas, kdo: ulozene.kdo };
    seznam.push(novyZaznam); seznam.sort((a, b) => a.t - b.t); seznam.length = Math.min(seznam.length, 5);
    novyRekordCasu = !byl || v.cas < byl;
    if (novyRekordCasu && v.stopa) ulozDucha(rezimHry + '-' + levelIndex, { id: ulozene.vybrany[rezimHry], stopa: v.stopa });
  }
  ukazCasy(novyZaznam, novyRekordCasu);
  $('vysVideo').classList.add('skryt');
  if (nahravani.bezi) {
    // ještě chvilku nahrávat (oslava), pak nabídnout uložení
    setTimeout(() => nahravani.zastav().then(v => { $('nahravam').classList.add('skryt'); if (v && stav === 'vysledek') $('vysVideo').classList.remove('skryt'); }), 1500);
  }
  uloz();
  $('vysNadpis').textContent = t(levelIndex < 0 ? 'res.end' : v.vyhra ? 'res.done' : 'res.almost');
  $('vysHvezdy').innerHTML = levelIndex < 0 ? '' : Array.from({ length: hvezdy }, (_, i) => `<span class="h" style="animation-delay:${0.25 + i * 0.3}s">★</span>`).join('') + `<span class="prazdna">${'★'.repeat(3 - hvezdy)}</span>`;
  const vyhral = levelIndex < 0 || v.vyhra;
  const ik = $('vysIkona'); ik.textContent = vyhral ? (hvezdy === 3 || levelIndex < 0 ? '🏆' : '🥇') : '💪'; ik.classList.toggle('vyhra', vyhral);
  if (vyhral) konfety();
  hrajHudbu(vyhral ? 'vyhra' : 'lobby');
  $('vysDetail').textContent = rezimHry === 'koste' && levelIndex >= 0
    ? t('res.broom', { p: v.misto, n: v.hracu, k: v.kruhy, b: v.balonky })
    : rezimHry === 'beh'
    ? (levelIndex < 0 ? t('res.runEndless', { m: Math.floor(v.vzdalenost), c: v.mince }) : v.vyhra ? t('res.runWin', { lvl: tn(lv.jmeno) }) : t('res.runLose', { m: Math.floor(v.vzdalenost), cil: lv.cil }))
    : (levelIndex < 0 ? t('res.flyEndless', { k: v.kruhy }) : t('res.fly', { k: v.kruhy, n: lv.kruhu }) + (v.vyhra ? '' : t('res.flyNeed', { n: lv.potreba })));
  $('vysMince').textContent = v.mince;
  $('vysRekord').textContent = rekordText;
  const dalsiOk = levelIndex >= 0 && v.vyhra && levelIndex + 1 < r.levely.length;
  $('btnDalsi').classList.toggle('skryt', !dalsiOk);
  $('btnDalsi').classList.toggle('tep', dalsiOk);
  $('btnZnovu').classList.toggle('tl-zlute', !v.vyhra && levelIndex >= 0); $('btnZnovu').classList.toggle('tl-svetle', !(!v.vyhra && levelIndex >= 0));
  $('vysRuce').classList.toggle('skryt', ovladani !== 'kamera');
  $('ruceBarObal2').classList.toggle('skryt', ovladani !== 'kamera');
  $('postup').classList.add('skryt');
  ukaz('vysledek'); obnovPenezenku();
}
// výsledek: čas, žebříček levelu a výběr, kdo letěl
function ukazCasy(zaznam, rekord) {
  const box = $('vysCasy');
  const seznam = levelIndex >= 0 && rezimHry !== 'beh' ? casyLevelu(rezimHry, levelIndex) : [];
  if (!zaznam && !seznam.length) { box.classList.add('skryt'); return; }
  box.classList.remove('skryt');
  const medaile = ['🥇', '🥈', '🥉', '4.', '5.'];
  $('vysCas').innerHTML = zaznam ? `⏱ ${fmt(zaznam.t)} s${rekord ? ` <b class="rekordCasu">${t('res.newBest')}</b>` : ''}` : '';
  $('vysZebricek').innerHTML = seznam.slice(0, 3).map((z, i) => `<span class="${z === zaznam ? 'ted' : ''}">${medaile[i]} ${z.kdo} ${fmt(z.t)} s</span>`).join('');
  const vyber = $('vysKdo');
  vyber.classList.toggle('skryt', !zaznam || !seznam.includes(zaznam));
  if (zaznam) vyber.innerHTML = `<span>${t('res.who')}</span>` + KDO.map(k => `<button class="${k === zaznam.kdo ? 'aktivni' : ''}" data-kdo="${k}">${k}</button>`).join('');
  vyber.querySelectorAll('button').forEach(b => b.onclick = () => { SFX.klik(); zaznam.kdo = ulozene.kdo = b.dataset.kdo; uloz(); ukazCasy(zaznam, rekord); });
}
function konfety() {
  const k = $('konfety'); k.innerHTML = '';
  const barvy = ['#ffd23f', '#ff4d8d', '#4ff3ff', '#7dff6b', '#ff8a1f', '#b06bff', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    const e = document.createElement('i');
    e.style.left = Math.random() * 100 + 'vw'; e.style.background = barvy[i % barvy.length];
    e.style.setProperty('--dx', (Math.random() * 30 - 15) + 'vw'); e.style.setProperty('--r', (Math.random() * 1440 - 720) + 'deg');
    e.style.animationDuration = (2.2 + Math.random() * 2) + 's'; e.style.animationDelay = Math.random() * 0.8 + 's';
    k.appendChild(e);
  }
  setTimeout(() => { k.innerHTML = ''; }, 5200);
}
function obnovHud() {
  const h = R().api.hud();
  $('hudVlevo').textContent = h.vlevo;
  $('hudStred').firstChild.nodeValue = h.stred;
  $('hudStred').querySelector('small').textContent = h.stredPopis;
  $('pocetMinci').textContent = ulozene.mince + h.mince;
  $('postup').classList.toggle('skryt', h.postup === null || stav === 'vysledek');
  if (h.postup !== null) $('postup').firstElementChild.style.width = (h.postup * 100) + '%';
  const c = $('hudCas');
  c.classList.toggle('skryt', h.cas === undefined || levelIndex < 0 || stav !== 'hra');
  const dv = $('hudDravec');
  dv.classList.toggle('skryt', h.dravec == null || stav !== 'hra');
  if (h.dravec != null) { dv.textContent = `🦅 ${h.dravec} m`; dv.classList.toggle('blizko', h.dravec < 25); }
  if (h.cas !== undefined) c.innerHTML = `⏱ ${fmt(h.cas)} s` + (h.nejlepsi ? ` <span class="${h.cas > h.nejlepsi ? 'pomalu' : ''}">· 🏆 ${fmt(h.nejlepsi)} s</span>` : '');
}
// značka k dalšímu kruhu: na obrazovce vzdálenost pod kruhem, mimo obrazovku červená šipka u okraje
const _v = new THREE.Vector3();
function obnovZnacku() {
  const z = $('znacka'), api = R().api, d = stav === 'hra' && !navod && api.dalsiCil?.();
  if (!d) { z.classList.add('skryt'); return; }
  const vzd = Math.round(d.cil.distanceTo(d.hrac));
  _v.copy(d.cil).project(api.camera);
  const W = innerWidth, H = innerHeight, zaKamerou = _v.z > 1;
  if (zaKamerou) { _v.x = -_v.x; _v.y = -_v.y; }
  const naObrazovce = !zaKamerou && Math.abs(_v.x) < 0.9 && Math.abs(_v.y) < 0.85;
  if (naObrazovce && vzd < 25) { z.classList.add('skryt'); return; }
  z.classList.remove('skryt'); z.classList.toggle('mimo', !naObrazovce);
  let x, y, uhel = 0;
  if (naObrazovce) { x = (_v.x + 1) / 2 * W; y = (1 - _v.y) / 2 * H + Math.min(70, 2600 / Math.max(vzd, 1)); }
  else { uhel = Math.atan2(_v.y, _v.x); x = W / 2 + Math.cos(uhel) * W * 0.42; y = Math.min(H - 90, Math.max(190, H / 2 - Math.sin(uhel) * H * 0.38)); }   // ne přes ukazatele nahoře
  z.style.transform = `translate(${x}px, ${y}px)`;
  z.firstElementChild.style.transform = `rotate(${-uhel + Math.PI / 2}rad)`;
  z.lastElementChild.textContent = vzd + ' m';
}

// ================= TLAČÍTKA =================
$('btnBeh').onclick = () => { audio(); SFX.klik(); naLevely('beh'); };
$('btnLet').onclick = () => { audio(); SFX.klik(); naLevely('let'); };
$('btnKoste').onclick = () => { audio(); SFX.klik(); naLevely('koste'); };
$('btnZpet').onclick = () => { SFX.klik(); naDomu(); };
$('btnStartRucne').onclick = () => zacniOdpocet();
$('btnCekamZpet').onclick = () => naLevely();
$('btnZnovu').onclick = () => spustLevel(levelIndex);
$('btnDalsi').onclick = () => spustLevel(levelIndex + 1);
$('btnNaLevely').onclick = () => { nahravani.zrus(); naLevely(); };
$('btnVideo').onclick = () => { SFX.klik(); const lv = levelIndex < 0 ? 'free' : levelIndex + 1; nahravani.uloz(`move-it-${rezimHry}-${lv}`); };
$('konecHry').onclick = () => ukonci();
$('zvuk').onclick = () => { audio(); $('zvuk').textContent = prepniZvuk() ? '♪' : '✕'; };
$('zvuk').textContent = ulozene.zvuk ? '♪' : '✕';
// celá obrazovka: bez horní lišty prohlížeče. Na telefonu se zapne sama při prvním dotyku,
// na počítači tlačítkem ⛶. iPhone to v prohlížeči neumí — tam pomůže „Přidat na plochu“ (aplikace je bez lišty).
const umiCelou = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
const veStandalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
function celaObrazovka(zapnout = !document.fullscreenElement) {
  const el = document.documentElement;
  if (zapnout) {
    const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el, { navigationUI: 'hide' });
    Promise.resolve(p).then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  } else (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
}
if (umiCelou && !veStandalone) {
  $('celaObr').classList.remove('skryt');
  $('celaObr').onclick = () => { SFX.klik(); celaObrazovka(); };
  const dotyk = matchMedia('(pointer:coarse)').matches;
  if (dotyk) addEventListener('pointerdown', function prvni(e) { if (e.target.id === 'celaObr') return; removeEventListener('pointerdown', prvni); celaObrazovka(true); });
}
function ukonci() {
  konecNavodu(false);
  if (!(stav === 'hra' && levelIndex < 0)) { nahravani.zrus(); $('nahravam').classList.add('skryt'); }
  // nekonečný režim: křížek = konec s výsledkem a mincemi
  if (stav === 'hra' && levelIndex < 0) { R().api.ukoncit(); return; }
  if (stav === 'hra') stats.konec(null);
  naLevely();
}
addEventListener('keydown', e => {
  if (e.code === 'KeyM') { audio(); $('zvuk').textContent = prepniZvuk() ? '♪' : '✕'; return; }
  if (e.code === 'Escape') { if (stav === 'hra' || stav === 'odpocet' || stav === 'cekam') ukonci(); else if (stav === 'levely') naDomu(); return; }
  if (stav === 'vysledek' && (e.code === 'Enter' || e.code === 'Space')) { spustLevel(levelIndex); return; }
  if (stav === 'hra' || stav === 'odpocet') R().api.klavesa(e);
});

// ================= SMYČKA =================
let posledni = performance.now();
const mereni = { cas: 0, n: 0, hotovo: false };
function smycka(cas) {
  const dtS = (cas - posledni) / 1000; posledni = cas;
  // TV režim: hra běží o 15 % pomaleji, ať zpoždění obrazu u zrcadlení na televizi tolik nevadí
  // strop na délku snímku: při velkém sekání by hra skákala o kusy; v běhu je vyšší (1/15 s), jinak by při
  // 15 snímcích za sekundu běžela zpomaleně — kolize v běhu to ještě spolehlivě chytí i v nejvyšší rychlosti
  const dt = Math.min(rezimHry === 'beh' ? 0.067 : 0.05, dtS) * (ulozene.tv && (stav === 'hra' || stav === 'odpocet') ? 0.85 : 1);
  const api = R().api;
  // kamera
  let snimek = null;
  if (kamera.zapnuta && ovladani === 'kamera' && !$('kam').classList.contains('skryt')) {
    snimek = kamera.snimek();
    if (snimek.novy) zpracujRuce(snimek.L, 1 / 30);
    if (stav === 'hra' || stav === 'odpocet') kamera.kresli((k, w, h) => api.vodítko(k, w, h));
    const s = api.stavKamery();
    kamera.stav(ruce.obe && stav !== 'hra' ? t('cam.bothHands') : s || t(kamera.cerny() ? 'cam.black' : 'cam.noSee'));
  }
  // start zvednutím rukou
  if (ovladani === 'kamera' && (stav === 'cekam' || stav === 'vysledek')) {
    const p = Math.min(1, ruce.t / 1.0);
    $('ruceBar1').style.width = $('ruceBar2').style.width = (p * 100) + '%';
    if (p >= 1) { ruce.t = 0; stav === 'cekam' ? zacniOdpocet() : spustLevel(levelIndex); }
  }
  // odpočet
  if (stav === 'odpocet') {
    const pred = Math.ceil(odpocetT);
    odpocetT -= dt;
    api.behemOdpoctu(odpocetT);
    const ted = Math.ceil(odpocetT);
    $('odpocet').classList.remove('skryt');
    $('odpocet').textContent = ted > 0 ? ted : t('countdown.start');
    if (ted !== pred && ted > 0) SFX.tik();
    if (odpocetT <= 0) {
      if (!api.konecOdpoctu()) { odpocetT = 1.5; banner(t('step.back'), '#ffd23f'); }
      else {
        stav = 'hra';
        stats.start(rezimHry, levelIndex, ovladani, jazyk);
        if (levelIndex >= 0 && R().levely[levelIndex].navod?.length) zacniNavod(R().levely[levelIndex].navod);
        const lv = levelIndex < 0 ? R().extra : R().levely[levelIndex];
        setTimeout(() => { $('odpocet').classList.add('skryt'); if (!navod) banner(tn(lv.jmeno).toUpperCase()); }, 500);
      }
    }
  } else $('odpocet').classList.add('skryt');

  aktualizujNavod(dt, cas / 1000);
  if (stav === 'cekam') kresliPanacka(cekamK, 240, 288, 'start', cas / 1000);
  const stavProRezim = stav === 'hra' ? 'hra' : stav === 'odpocet' ? 'odpocet' : stav === 'vysledek' ? 'konec' : 'nahled';
  api.aktualizuj(dt, stavProRezim, snimek);
  if (stav === 'hra' || stav === 'odpocet') obnovHud();
  obnovZnacku();

  // když hra seká (pod 40 snímků za sekundu), sníží kvalitu o stupeň; měří se znovu, dokud to nepomůže
  // měří se už během odpočtu, ať je kvalita srovnaná dřív, než se rozběhne
  if ((stav === 'hra' || stav === 'odpocet') && dtS < 0.5 && !document.hidden) {
    mereni.cas += dtS; mereni.n++;
    if (mereni.cas > 1.5) {
      if (mereni.n / mereni.cas < 40 && snizKvalitu()) {
        // stíny vypnuté → materiály ve všech režimech se musí přestavět (jednorázové škubnutí)
        for (const r of Object.values(REZIMY)) r.api.scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
      }
      mereni.cas = mereni.n = 0;
    }
  } else mereni.cas = mereni.n = 0;
  renderer.render(api.scene, api.camera);
  if (nahravani.bezi) {
    const h = stav === 'hra' ? api.hud() : null;
    nahravani.snimek({
      radek: h ? h.vlevo + (h.cas !== undefined && levelIndex >= 0 ? `   ⏱ ${fmt(h.cas)} s` : '') : '',
      banner: bannerVideo && performance.now() < bannerVideo.do ? bannerVideo.text : '', bannerBarva: bannerVideo?.barva,
    });
  }
  requestAnimationFrame(smycka);
}
window.__hra = { beh, let: lt, koste: ko, ulozene, stav: () => stav, spustLevel, naLevely, konecHry };
// přepínač jazyka (EN | CZ)
document.querySelectorAll('[data-jazyk]').forEach(b => b.onclick = () => { SFX.klik(); nastavJazyk(b.dataset.jazyk); $('nastaveni').classList.add('skryt'); });
// hraní na televizi: návod a TV režim (větší texty, pomalejší hra)
function obnovTv() {
  document.body.classList.toggle('tv', !!ulozene.tv);
  $('btnTvRezim').textContent = t(ulozene.tv ? 'tv.on' : 'tv.off');
  $('btnTvRezim').className = 'tl ' + (ulozene.tv ? 'tl-zlute' : 'tl-svetle');
}
$('btnTv').onclick = e => { e.stopPropagation(); SFX.klik(); $('nastaveni').classList.add('skryt'); obnovTv(); $('tvOkno').classList.remove('skryt'); };
$('btnTvRezim').onclick = () => { SFX.klik(); ulozene.tv = !ulozene.tv; uloz(); obnovTv(); };
$('btnTvHotovo').onclick = () => { SFX.klik(); $('tvOkno').classList.add('skryt'); };
$('tvOkno').onclick = e => { if (e.target.id === 'tvOkno') $('tvOkno').classList.add('skryt'); };
obnovTv();
$('btnNastaveni').onclick = e => { e.stopPropagation(); audio(); SFX.klik(); $('nastaveni').classList.toggle('skryt'); };
addEventListener('pointerdown', e => { if (!e.target.closest('#nastaveni, #btnNastaveni')) $('nastaveni').classList.add('skryt'); });
poZmene(() => { obnovTv(); if (stav === 'levely') naLevely(); });
naDomu();
requestAnimationFrame(smycka);
