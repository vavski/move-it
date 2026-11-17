// Anonymní statistiky hraní (kolik lidí hrálo, jaký režim, jak dlouho).
// Žádné cookies, žádné jméno, žádný obraz z kamery — jen počty událostí.
// Poskytovatel: GoatCounter (zdarma, bez cookies). Prázdná adresa = statistiky VYPNUTÉ.
// Po založení účtu na https://www.goatcounter.com vyplň např. 'https://uhni-a-let.goatcounter.com/count'
export const GOATCOUNTER = '';

const zapnuto = !!GOATCOUNTER && !/^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname);
let fronta = [], nacteno = false;

if (zapnuto) {
  const s = document.createElement('script');
  s.async = true; s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = GOATCOUNTER;
  // zobrazení stránky si započítá count.js sám (pageview)
  s.onload = () => { nacteno = true; fronta.forEach(posli); fronta = []; };
  document.head.appendChild(s);
}

function posli(u) { try { window.goatcounter && window.goatcounter.count(u); } catch {} }
function udalost(path, title = path) {
  const u = { path, title, event: true };
  if (!zapnuto) { console.debug('[stats vypnuté]', path); return; }
  if (nacteno) posli(u); else fronta.push(u);
}

// Délku zaokrouhlíme do skupin, GoatCounter počítá jen počty.
function skupina(s) {
  if (s < 30) return '0-30s'; if (s < 60) return '30-60s'; if (s < 120) return '1-2min';
  if (s < 300) return '2-5min'; if (s < 600) return '5-10min'; return '10min+';
}
const lv = i => (i < 0 ? 'nekonecny' : 'L' + (i + 1));

let hra = null, tep = null;
export const stats = {
  // hra opravdu začala (po odpočtu)
  start(rezim, levelIndex, ovladani) {
    this.konec(null);
    hra = { rezim, level: lv(levelIndex), od: performance.now() };
    udalost(`start/${rezim}/${hra.level}`, `Start ${rezim} ${hra.level}`);
    udalost(`ovladani/${ovladani}`, `Ovládání ${ovladani}`);
    // tep: každá odehraná minuta = 1 událost → součet = celkový čas hraní v minutách
    clearInterval(tep);
    tep = setInterval(() => { if (hra && !document.hidden) udalost(`minuta/${hra.rezim}`, `Odehraná minuta ${hra.rezim}`); }, 60000);
  },
  // v = výsledek ze hry; null = hráč odešel uprostřed
  konec(v) {
    if (!hra) return;
    clearInterval(tep); tep = null;
    const s = (performance.now() - hra.od) / 1000;
    {
      const jak = v ? (v.vyhra ? 'vyhra' : 'prohra') : 'odchod';
      udalost(`konec/${hra.rezim}/${hra.level}/${jak}/${skupina(s)}`, `Konec ${hra.rezim} ${hra.level} ${jak} ${Math.round(s)} s, mince ${v ? v.mince : 0}`);
      if (v) udalost(`mince/${hra.rezim}/${v.mince >= 50 ? '50+' : v.mince >= 20 ? '20-49' : v.mince >= 5 ? '5-19' : '0-4'}`, 'Mince za hru');
    }
    hra = null;
  },
};
// zavření stránky uprostřed hry
addEventListener('pagehide', () => stats.konec(null));
