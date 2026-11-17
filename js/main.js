// Řízení celé hry: domů → levely a postavičky → (čekání na ruce) → odpočet → hra → výsledek.
import { renderer, $, ulozene, uloz, audio, prepniZvuk, hrajHudbu, ztisHudbu, SFX, kamera, ruce, zpracujRuce } from './zaklad.js';
import { BEZCI, LETCI } from './postavy.js';
import { vytvorBeh, LEVELY as LV_BEH, NEKONECNY } from './beh.js';
import { vytvorLet, LEVELY as LV_LET, VOLNY } from './let.js';
import { stats } from './stats.js';
import { t, tn, jazyk, nastavJazyk, poZmene } from './i18n.js';

const ctx = {
  konec: v => konecHry(v),
  banner: (t, b) => banner(t, b),
  zasah: () => { $('zasah').style.opacity = 1; setTimeout(() => $('zasah').style.opacity = 0, 250); },
};
const beh = vytvorBeh(ctx);
const lt = vytvorLet(ctx);
const REZIMY = {
  beh: { api: beh, levely: LV_BEH, extra: NEKONECNY, skiny: BEZCI, nazev: 'mode.beh', hudba: 'beh',
    napovedaKamera: 'hint.beh.cam', napovedaKlavesy: 'hint.beh.keys' },
  let: { api: lt, levely: LV_LET, extra: VOLNY, skiny: LETCI, nazev: 'mode.let', hudba: 'let',
    napovedaKamera: 'hint.let.cam', napovedaKlavesy: 'hint.let.keys' },
};

let stav = 'domu';            // domu | levely | cekam | odpocet | hra | vysledek
let rezimHry = 'beh', levelIndex = 0, odpocetT = 0, skinIndex = 0;
let ovladani = ulozene.ovladani || 'kamera';
const R = () => REZIMY[rezimHry];

// ================= OBRAZOVKY =================
function ukaz(id) {
  for (const s of ['domu', 'levely', 'cekam', 'vysledek']) $(s).classList.toggle('skryt', s !== id);
  const veHre = id === null;
  $('hud').classList.toggle('skryt', !veHre);
  $('konecHry').classList.toggle('skryt', !veHre);
  $('napoveda').classList.toggle('skryt', !veHre);
  $('penezenka').classList.toggle('skryt', veHre);
}
function obnovPenezenku() { $('pocetMinci').textContent = ulozene.mince; }
let bannerT = null;
function banner(text, barva = '#ffffff') {
  const b = $('banner'); b.textContent = text; b.style.color = barva;
  b.style.opacity = 1; b.style.transform = 'translate(-50%,-50%) scale(1)';
  clearTimeout(bannerT);
  bannerT = setTimeout(() => { b.style.opacity = 0; b.style.transform = 'translate(-50%,-70%) scale(.9)'; }, 1300);
}

function naDomu() {
  stav = 'domu'; rezimHry = 'beh'; ztisHudbu();
  beh.nahled(ulozene.vybrany.beh);
  ukaz('domu'); obnovPenezenku();
}
function naLevely(rz = rezimHry) {
  stav = 'levely'; rezimHry = rz; ztisHudbu();
  const r = R();
  $('levelyNadpis').textContent = t(r.nazev);
  const seznam = $('levelySeznam'); seznam.innerHTML = '';
  const hv = ulozene.hvezdy[rz] || [];
  r.levely.forEach((lv, i) => {
    const b = document.createElement('button'); b.className = 'lvl';
    const odemceno = i < ulozene.odemceno[rz];
    b.disabled = !odemceno;
    const h = hv[i] || 0;
    b.innerHTML = `<div class="cislo">${odemceno ? i + 1 : '🔒'}</div><div class="jm">${tn(lv.jmeno)}</div><div class="hv">${'★'.repeat(h)}${'☆'.repeat(3 - h)}</div>`;
    b.onclick = () => { SFX.klik(); spustLevel(i); };
    seznam.appendChild(b);
  });
  const b = document.createElement('button'); b.className = 'lvl nekonecny';
  const rek = ulozene.rekord[rz] || 0;
  b.innerHTML = `<div class="cislo">∞</div><div class="jm">${tn(r.extra.jmeno)}</div><div class="hv" style="font-size:15px">${rek ? t('lvl.record', { n: rek }) : '&nbsp;'}</div>`;
  b.onclick = () => { SFX.klik(); spustLevel(-1); };
  seznam.appendChild(b);
  skinIndex = Math.max(0, r.skiny.findIndex(s => s.id === ulozene.vybrany[rz]));
  ukazSkin();
  obnovOvladani();
  ukaz('levely'); obnovPenezenku();
}

// ---- obchod se skiny ----
function ukazSkin() {
  const r = R(), s = r.skiny[skinIndex];
  r.api.nahled(s.id);
  $('skinJmeno').textContent = tn(s.jmeno);
  const ma = ulozene.skiny.includes(s.id), vybrany = ulozene.vybrany[rezimHry] === s.id;
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
function obnovOvladani() {
  $('ovlKamera').classList.toggle('aktivni', ovladani === 'kamera');
  $('ovlKlavesy').classList.toggle('aktivni', ovladani === 'klavesy');
}
$('ovlKamera').onclick = () => { ovladani = 'kamera'; ulozene.ovladani = ovladani; uloz(); obnovOvladani(); };
$('ovlKlavesy').onclick = () => { ovladani = 'klavesy'; ulozene.ovladani = ovladani; uloz(); obnovOvladani(); };

// ================= SPUŠTĚNÍ LEVELU =================
async function spustLevel(i) {
  audio();
  levelIndex = i;
  if (ovladani === 'kamera' && !kamera.zapnuta) {
    $('ovlChyba').textContent = t('cam.allow');
    try { await kamera.zapni(); $('ovlChyba').textContent = ''; }
    catch (e) { $('ovlChyba').textContent = t('cam.fail', { e: e.message || e }); ovladani = 'klavesy'; obnovOvladani(); return; }
  }
  $('kam').classList.toggle('skryt', ovladani !== 'kamera');
  const r = R(), lv = i < 0 ? r.extra : r.levely[i];
  r.api.pripravit(lv, ulozene.vybrany[rezimHry], ovladani);
  $('napoveda').textContent = t(ovladani === 'kamera' ? r.napovedaKamera : r.napovedaKlavesy);
  if (ovladani === 'kamera') { stav = 'cekam'; ukaz('cekam'); }
  else zacniOdpocet();
}
function zacniOdpocet() {
  stav = 'odpocet'; odpocetT = 2.99;
  ukaz(null); obnovHud();
  R().api.zacatekOdpoctu();
  hrajHudbu(R().hudba); SFX.tik();
}
function konecHry(v) {
  if (stav !== 'hra') return;
  stav = 'vysledek'; ztisHudbu();
  stats.konec(v);
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
  uloz();
  $('vysNadpis').textContent = t(levelIndex < 0 ? 'res.end' : v.vyhra ? 'res.done' : 'res.almost');
  $('vysHvezdy').innerHTML = levelIndex < 0 ? '' : '★'.repeat(hvezdy) + `<span class="prazdna">${'★'.repeat(3 - hvezdy)}</span>`;
  $('vysDetail').textContent = rezimHry === 'beh'
    ? (levelIndex < 0 ? t('res.runEndless', { m: Math.floor(v.vzdalenost), c: v.mince }) : v.vyhra ? t('res.runWin', { lvl: tn(lv.jmeno) }) : t('res.runLose', { m: Math.floor(v.vzdalenost), cil: lv.cil }))
    : (levelIndex < 0 ? t('res.flyEndless', { k: v.kruhy }) : t('res.fly', { k: v.kruhy, n: lv.kruhu }) + (v.vyhra ? '' : t('res.flyNeed', { n: lv.potreba })));
  $('vysMince').textContent = v.mince;
  $('vysRekord').textContent = rekordText;
  const dalsiOk = levelIndex >= 0 && v.vyhra && levelIndex + 1 < r.levely.length;
  $('btnDalsi').classList.toggle('skryt', !dalsiOk);
  $('vysRuce').classList.toggle('skryt', ovladani !== 'kamera');
  $('ruceBarObal2').classList.toggle('skryt', ovladani !== 'kamera');
  ukaz('vysledek'); obnovPenezenku();
}
function obnovHud() {
  const h = R().api.hud();
  $('hudVlevo').textContent = h.vlevo;
  $('hudStred').firstChild.nodeValue = h.stred;
  $('hudStred').querySelector('small').textContent = h.stredPopis;
  $('pocetMinci').textContent = ulozene.mince + h.mince;
  $('postup').classList.toggle('skryt', h.postup === null || stav === 'vysledek');
  if (h.postup !== null) $('postup').firstElementChild.style.width = (h.postup * 100) + '%';
}

// ================= TLAČÍTKA =================
$('btnBeh').onclick = () => { audio(); SFX.klik(); naLevely('beh'); };
$('btnLet').onclick = () => { audio(); SFX.klik(); naLevely('let'); };
$('btnZpet').onclick = () => { SFX.klik(); naDomu(); };
$('btnStartRucne').onclick = () => zacniOdpocet();
$('btnCekamZpet').onclick = () => naLevely();
$('btnZnovu').onclick = () => spustLevel(levelIndex);
$('btnDalsi').onclick = () => spustLevel(levelIndex + 1);
$('btnNaLevely').onclick = () => naLevely();
$('konecHry').onclick = () => ukonci();
$('zvuk').onclick = () => { audio(); $('zvuk').textContent = prepniZvuk() ? '♪' : '✕'; };
$('zvuk').textContent = ulozene.zvuk ? '♪' : '✕';
function ukonci() {
  // nekonečný režim: křížek = konec s výsledkem a mincemi
  if (stav === 'hra' && levelIndex < 0) { R().api.ukoncit(); return; }
  if (stav === 'hra') stats.konec(null);
  ztisHudbu(); naLevely();
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
  const dtS = (cas - posledni) / 1000, dt = Math.min(0.05, dtS); posledni = cas;
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
        const lv = levelIndex < 0 ? R().extra : R().levely[levelIndex];
        setTimeout(() => { $('odpocet').classList.add('skryt'); banner(tn(lv.jmeno).toUpperCase()); }, 500);
      }
    }
  } else $('odpocet').classList.add('skryt');

  const stavProRezim = stav === 'hra' ? 'hra' : stav === 'odpocet' ? 'odpocet' : stav === 'vysledek' ? 'konec' : 'nahled';
  api.aktualizuj(dt, stavProRezim, snimek);
  if (stav === 'hra' || stav === 'odpocet') obnovHud();

  // na slabším počítači sníží kvalitu, ať hra neseká
  if (!mereni.hotovo && stav === 'hra' && dtS < 0.5 && !document.hidden) {
    mereni.cas += dtS; mereni.n++;
    if (mereni.cas > 3) { if (mereni.n / mereni.cas < 40) { renderer.setPixelRatio(1); mereni.hotovo = true; } mereni.cas = mereni.n = 0; }
  }
  renderer.render(api.scene, api.camera);
  requestAnimationFrame(smycka);
}
// přepínač jazyka (EN | CZ)
document.querySelectorAll('[data-jazyk]').forEach(b => b.onclick = () => { SFX.klik(); nastavJazyk(b.dataset.jazyk); });
poZmene(() => { if (stav === 'levely') naLevely(); });
window.__hra = { beh, let: lt, ulozene, stav: () => stav, spustLevel, naLevely, konecHry };
naDomu();
requestAnimationFrame(smycka);
