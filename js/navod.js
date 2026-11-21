// Návod bez čtení: panáček předvede pohyb, hra počká, až ho dítě zopakuje.
// Kreslí se do obyčejného plátna (canvas), žádné obrázky navíc.

const PI = Math.PI;
const vlna = (t, f = 1) => (Math.sin(t * f) + 1) / 2;     // 0..1..0

// Póza = úhly kloubů. Ruka: [rameno, loket] — rameno 0 = visí dolů, PI/2 = do strany, PI = nahoru.
// Noha: [kyčel, koleno] — 0 = rovně dolů. Tělo: posun x/y a náklon.
const POZY = {
  start: t => ({ ruce: [[2.75 + vlna(t, 6) * 0.25, 0], [2.75 + vlna(t, 6) * 0.25, 0]] }),
  mav: t => { const s = vlna(t, 5); return { ruce: [[0.5 + s * 1.9, 0], [0.5 + s * 1.9, 0]] }; },
  zatacka: t => { const w = Math.sin(t * 2) * 0.55; return { ruce: [[PI / 2 + w, 0], [PI / 2 - w, 0]], naklon: -w * 0.25 }; },
  plachti: () => ({ ruce: [[PI / 2, 0], [PI / 2, 0]] }),
  strmhlav: t => ({ ruce: [[0.12, 0], [0.12, 0]], y: Math.sin(t * 3) * 2 }),
  kure: t => { const s = vlna(t, 9); return { ruce: [[0.35 + s * 0.9, 2.7], [0.35 + s * 0.9, 2.7]] }; },
  krok: t => { const s = Math.sin(t * 1.6); return { x: s * 38, ruce: [[0.3, 0], [0.3, 0]], nohy: [[0.15 + Math.max(0, -s) * 0.3, 0], [0.15 + Math.max(0, s) * 0.3, 0]] }; },
  skok: t => { const s = Math.max(0, Math.sin(t * 3.2)); return { y: -s * 34, ruce: [[0.4 + s * 2.3, 0], [0.4 + s * 2.3, 0]], nohy: [[0.1, s * 0.5], [0.1, s * 0.5]] }; },
  drep: t => { const s = vlna(t, 3); return { y: s * 34, ruce: [[0.9 + s * 0.5, 0.4], [0.9 + s * 0.5, 0.4]], nohy: [[0.5 + s * 0.9, s * 2.0], [0.5 + s * 0.9, s * 2.0]] }; },
};

// Co pohyb udělá ve hře (velká značka vedle panáčka).
export const UCINEK = { mav: '⬆', zatacka: '↶ ↷', plachti: '〰', strmhlav: '⬇', kure: '⚡', krok: '⬅ ➡', skok: '⤒', drep: '⤓', start: '▶' };
// Klávesa pro hraní bez kamery.
export const KLAVESA = { mav: 'MEZERNÍK', zatacka: '← →', plachti: '↑', strmhlav: '↓', kure: 'SHIFT', krok: '← →', skok: '↑', drep: '↓', start: '' };

export function kresliPanacka(k, w, h, poza, t, barva = '#ffffff') {
  const p = (POZY[poza] || POZY.start)(t);
  const m = Math.min(w / 200, h / 240);
  k.save();
  k.clearRect(0, 0, w, h);
  k.translate(w / 2 + (p.x || 0) * m, h * 0.06 + (p.y || 0) * m);
  k.scale(m, m);
  k.rotate(p.naklon || 0);
  const ramena = { x: 0, y: 70 }, boky = { x: 0, y: 138 };
  const nohy = p.nohy || [[0.12, 0], [0.12, 0]];
  const sed = nohy[0][1] ? 0 : 0;
  const car = [];
  // ruce: strana -1 = levá na obrázku
  [[-1, p.ruce[0]], [1, p.ruce[1]]].forEach(([sx, [a, l]]) => {
    const r0 = { x: ramena.x + sx * 22, y: ramena.y };
    const r1 = { x: r0.x + sx * Math.sin(a) * 34, y: r0.y + Math.cos(a) * 34 };
    const a2 = a + l;
    const r2 = { x: r1.x + sx * Math.sin(a2) * 32, y: r1.y + Math.cos(a2) * 32 };
    car.push([r0, r1, r2]);
  });
  [[-1, nohy[0]], [1, nohy[1]]].forEach(([sx, [a, kol]]) => {
    const n0 = { x: boky.x + sx * 12, y: boky.y + sed };
    const n1 = { x: n0.x + sx * Math.sin(a) * 40, y: n0.y + Math.cos(a) * 40 };
    const a2 = a - kol;
    const n2 = { x: n1.x + sx * Math.sin(a2) * 38, y: n1.y + Math.cos(a2) * 38 };
    car.push([n0, n1, n2]);
  });
  const tah = (sirka, styl) => {
    k.lineWidth = sirka; k.strokeStyle = styl; k.lineCap = k.lineJoin = 'round';
    k.beginPath(); k.moveTo(ramena.x, ramena.y - 4); k.lineTo(boky.x, boky.y); k.stroke();       // trup
    k.beginPath(); k.moveTo(ramena.x - 22, ramena.y); k.lineTo(ramena.x + 22, ramena.y); k.stroke(); // ramena
    k.beginPath(); k.moveTo(boky.x - 12, boky.y); k.lineTo(boky.x + 12, boky.y); k.stroke();
    for (const [a, b, c] of car) { k.beginPath(); k.moveTo(a.x, a.y); k.lineTo(b.x, b.y); k.lineTo(c.x, c.y); k.stroke(); }
  };
  tah(20, 'rgba(10,14,40,.85)');
  tah(12, barva);
  k.beginPath(); k.arc(0, 40, 20, 0, PI * 2); k.fillStyle = barva; k.lineWidth = 5; k.strokeStyle = 'rgba(10,14,40,.85)'; k.fill(); k.stroke();
  // obličej: dvě oči a úsměv
  k.fillStyle = '#1a1f3a'; k.beginPath(); k.arc(-7, 37, 2.8, 0, PI * 2); k.arc(7, 37, 2.8, 0, PI * 2); k.fill();
  k.lineWidth = 2.5; k.strokeStyle = '#1a1f3a'; k.beginPath(); k.arc(0, 42, 8, 0.15 * PI, 0.85 * PI); k.stroke();
  k.restore();
}

// Kroky návodu pro oba režimy. hotovo(api, dt, s) vrací true, když dítě pohyb udělalo.
export const KROKY = {
  let: [
    { poza: 'mav', hotovo: (a, dt, s) => a.pocty.mav >= s.start.mav + 2 },
    { poza: 'zatacka', hotovo: (a, dt, s) => drz(s, Math.abs(a.vstup.naklon) > 0.45, dt, 0.35) },
    { poza: 'strmhlav', hotovo: (a, dt, s) => drz(s, a.vstup.strmhlav, dt, 0.35) },
    { poza: 'kure', hotovo: (a, dt, s) => a.pocty.turbo > s.start.turbo },
  ],
  beh: [
    { poza: 'krok', hotovo: a => a.drahaHrace() !== 1 },
    { poza: 'skok', hotovo: (a, dt, s) => a.pocty.skok > s.start.skok },
    { poza: 'drep', hotovo: (a, dt, s) => drz(s, a.drepHrace(), dt, 0.3) },
  ],
};
function drz(s, podminka, dt, jak) { s.drzeno = podminka ? (s.drzeno || 0) + dt : 0; return s.drzeno >= jak; }
