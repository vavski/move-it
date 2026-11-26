// Nahrávání videa jedním tlačítkem (26. 11., nápad podle videí Sky Pecku): svislé video na telefon,
// nahoře dítě z kamery s čarami kostry, dole hra. Všechno se skládá a nahrává jen v tomhle zařízení,
// nic se nikam neposílá — video uloží nebo pošle rodič sám.
import { renderer, kamera, zvukovaStopa } from './zaklad.js';
import { t } from './i18n.js';

const W = 720, H = 1280, PAS = 64;          // rozměr videa, výška pruhu s logem mezi kamerou a hrou
const SPOJENI = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
const TYPY = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

let rec = null, kousky = [], platno = null, k = null, sKamerou = false, posledni = 0, typ = '', video = null, vysledek = null;

// vykreslí zdroj (video / plátno hry) tak, aby vyplnil obdélník a ořízl se okraje (jako object-fit: cover)
function vypln(zdroj, sw, sh, x, y, w, h, zrcadlit = false) {
  if (!sw || !sh) return;
  const m = Math.max(w / sw, h / sh), cw = w / m, ch = h / m;
  k.save(); k.beginPath(); k.rect(x, y, w, h); k.clip();
  if (zrcadlit) { k.translate(x + w, y); k.scale(-1, 1); k.drawImage(zdroj, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h); }
  else k.drawImage(zdroj, (sw - cw) / 2, (sh - ch) / 2, cw, ch, x, y, w, h);
  k.restore();
  return { m, cw, ch, sw, sh };
}
function pilulka(text, x, y, velikost, barva = '#ffffff', zarovnat = 'center') {
  k.font = `800 ${velikost}px "Baloo 2", "Trebuchet MS", sans-serif`;
  const w = k.measureText(text).width + velikost * 1.1, h = velikost * 1.45;
  const x0 = zarovnat === 'center' ? x - w / 2 : x;
  k.fillStyle = 'rgba(10,12,30,.75)'; k.beginPath(); k.roundRect(x0, y, w, h, h / 2.6); k.fill();
  k.fillStyle = barva; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, x0 + w / 2, y + h / 2 + 2);
}

export const nahravani = {
  umi: typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream && !!CanvasRenderingContext2D.prototype.roundRect,
  get bezi() { return !!rec && rec.state === 'recording'; },
  get video() { return vysledek; },
  zacni(kamerou) {
    this.zrus();
    if (!this.umi) return false;
    typ = TYPY.find(x => MediaRecorder.isTypeSupported(x)) || '';
    if (!platno) { platno = document.createElement('canvas'); platno.width = W; platno.height = H; k = platno.getContext('2d'); }
    video = document.getElementById('video');
    sKamerou = kamerou; posledni = 0; kousky = []; vysledek = null;
    this.snimek({});                                   // první snímek hned, ať video nezačíná černě
    const proud = platno.captureStream(30);
    const zvuk = zvukovaStopa(); if (zvuk) proud.addTrack(zvuk);
    try { rec = new MediaRecorder(proud, { mimeType: typ || undefined, videoBitsPerSecond: 3_000_000 }); }
    catch { rec = null; return false; }
    rec.ondataavailable = e => { if (e.data && e.data.size) kousky.push(e.data); };
    rec.start(1000);
    return true;
  },
  // jeden snímek videa; volá se hned po vykreslení hry (jinak by bylo plátno hry prázdné)
  snimek(info) {
    if (!k) return;
    const ted = performance.now();
    if (ted - posledni < 30) return;                   // stačí 30 snímků za sekundu
    posledni = ted;
    k.fillStyle = '#0e1230'; k.fillRect(0, 0, W, H);
    const horni = sKamerou ? Math.round(H * 0.36) : 0;
    const hra = renderer.domElement;
    vypln(hra, hra.width, hra.height, 0, horni + (sKamerou ? PAS : 0), W, H - horni - (sKamerou ? PAS : 0));
    if (sKamerou && video && video.readyState >= 2) {
      const r = vypln(video, video.videoWidth, video.videoHeight, 0, 0, W, horni, true);
      const L = kamera.posledniL;
      if (r && L) {
        // body těla z kamery přepočítané do výřezu (obraz je zrcadlený)
        const bod = i => [(((1 - L[i].x) * r.sw) - (r.sw - r.cw) / 2) * r.m, ((L[i].y * r.sh) - (r.sh - r.ch) / 2) * r.m];
        const vid = i => (L[i].visibility ?? 1) > 0.35;
        k.save(); k.beginPath(); k.rect(0, 0, W, horni); k.clip();
        k.lineWidth = 7; k.lineCap = 'round'; k.strokeStyle = '#4ff3ff';
        for (const [a, b] of SPOJENI) if (vid(a) && vid(b)) { const A = bod(a), B = bod(b); k.beginPath(); k.moveTo(...A); k.lineTo(...B); k.stroke(); }
        k.fillStyle = '#ffd23f';
        for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24]) if (vid(i)) { const A = bod(i); k.beginPath(); k.arc(A[0], A[1], i === 0 ? 11 : 8, 0, 7); k.fill(); }
        k.restore();
      }
    }
    if (sKamerou) {
      // pruh s logem mezi kamerou a hrou
      k.fillStyle = '#350873'; k.fillRect(0, horni, W, PAS);
      k.font = '800 38px "Baloo 2", "Trebuchet MS", sans-serif'; k.textBaseline = 'middle'; k.textAlign = 'left';
      k.fillStyle = '#ffd23f'; k.fillText('MOVE IT', 22, horni + PAS / 2 + 3);
      k.font = '700 22px "Baloo 2", "Trebuchet MS", sans-serif'; k.textAlign = 'right'; k.fillStyle = '#ffffff';
      k.fillText(t('logo.sub').toLowerCase(), W - 22, horni + PAS / 2 + 3);
    } else {
      pilulka('MOVE IT', 22, 22, 34, '#ffd23f', 'left');
    }
    const y0 = sKamerou ? horni + PAS + 18 : 90;
    if (info.radek) pilulka(info.radek, W / 2, y0, 34);
    if (info.banner) pilulka(info.banner, W / 2, y0 + 70, 40, info.bannerBarva || '#ffd23f');
  },
  // zastaví nahrávání; vrátí Promise s videem (Blob), nebo null
  zastav() {
    if (!rec) return Promise.resolve(null);
    const r = rec; rec = null;
    return new Promise(res => {
      r.onstop = () => { vysledek = kousky.length ? new Blob(kousky, { type: (typ || 'video/webm').split(';')[0] }) : null; kousky = []; res(vysledek); };
      try { r.stop(); } catch { res(null); }
    });
  },
  zrus() { if (rec) { rec.ondataavailable = null; rec.onstop = null; try { rec.stop(); } catch {} rec = null; } kousky = []; vysledek = null; },
  // uloží video: na telefonu nabídne sdílení (rodinný chat), jinak stáhne soubor
  async uloz(nazev) {
    if (!vysledek) return;
    const pripona = vysledek.type.includes('mp4') ? 'mp4' : 'webm';
    const soubor = new File([vysledek], `${nazev}.${pripona}`, { type: vysledek.type });
    const dotyk = matchMedia('(pointer:coarse)').matches;
    if (dotyk && navigator.canShare?.({ files: [soubor] })) {
      try { await navigator.share({ files: [soubor], title: 'Move It' }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(soubor); a.download = soubor.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  },
};
