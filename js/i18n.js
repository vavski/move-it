// Jednoduchý překlad hry: angličtina (výchozí) a čeština.
// Volba se pamatuje v localStorage. Statické texty mají v HTML data-i18n="klíč".
const KLIC = 'moveit-jazyk';

const SLOVNIK = {
  en: {
    'meta.title': 'Move It – play with your whole body',
    'meta.desc': 'A motion game for kids: play with your whole body in front of your laptop camera. Dodge, jump, fly.',
    'logo.sub': 'PLAY WITH YOUR WHOLE BODY',
    'mode.beh': 'RUN', 'mode.let': 'FLY',
    'mode.beh.desc': 'dodge, jump, duck', 'mode.let.desc': 'flap your arms and fly through rings',
    'privacy': '🔒 Your camera picture stays in your browser and is never sent anywhere.',
    'install': 'Install app',
    'embed.window': 'Open in a new window',
    'back': '◀ Back', 'back.plain': 'Back',
    'skin.title': 'CHARACTER', 'skin.prev': 'Previous', 'skin.next': 'Next',
    'skin.selected': '✔ Playing with this one', 'skin.pick': 'Pick', 'skin.buy': 'Buy for {n}',
    'skin.missing': 'need {n} more', 'skin.new': 'NEW CHARACTER!',
    'controls.title': 'CONTROLS', 'controls.camera': '📷 Camera', 'controls.keys': '⌨️ Keyboard',
    'cam.allow': 'Allow the camera in your browser window…',
    'cam.fail': 'Camera not working ({e}). Switching to keyboard.',
    'wait.title': 'Stand 2–3 meters from the camera',
    'wait.body': 'Your whole body must fit in the little window bottom left.',
    'wait.hands': 'Raise both hands = START',
    'wait.manual': 'Start without hands',
    'res.next': 'Next level ▶', 'res.again': 'Again', 'res.levels': 'Levels',
    'res.hands': 'or raise both hands = play again',
    'res.done': 'YOU DID IT!', 'res.almost': 'SO CLOSE!', 'res.end': 'GAME OVER!',
    'res.newRecord': 'NEW RECORD: {n}', 'res.record': 'Record: {n}', 'lvl.record': 'record {n}',
    'res.runEndless': '{m} m · {c} coins', 'res.runWin': '{lvl} completed!',
    'res.runLose': 'Out of hearts after {m} m of {cil} m',
    'res.flyEndless': '{k} rings', 'res.fly': '{k} of {n} rings', 'res.flyNeed': ' · you need {n}',
    'quit': 'Quit (Esc)', 'sound': 'Sound (M)', 'camera': 'Camera', 'camera.n': 'Camera {n}',
    'countdown.start': 'GO!', 'step.back': 'STEP BACK, I CAN’T SEE YOU',
    'cam.bothHands': 'BOTH HANDS UP', 'cam.black': 'BLACK SCREEN — COVER OR TOO DARK',
    'cam.noSee': 'CAN’T SEE YOU — STEP BACK', 'cam.loading': 'LOADING', 'cam.loadingAi': 'LOADING BODY TRACKING',
    'cam.bad': 'THIS CAMERA DOESN’T WORK',
    'hint.beh.cam': 'step sideways = dodge · jump = jump · squat = duck under · hand up = grab star',
    'hint.beh.keys': '← → dodge · ↑ jump · ↓ duck',
    'hint.let.cam': 'flap down = go up · tilt arms = turn · arms wide = glide · arms at sides = dive · hands at shoulders + flap elbows = TURBO',
    'hint.let.keys': 'space = flap · ← → turn · ↑ glide · ↓ dive · Shift = turbo',
    'pose.calib': 'STAND STILL…', 'pose.jump': 'JUMP!', 'pose.duck': 'DUCK',
    'pose.left': 'LEFT', 'pose.mid': 'MIDDLE', 'pose.right': 'RIGHT', 'pose.hand': ' · HAND',
    'pose.fly': 'FLYING', 'pose.flap': 'FLAP!', 'pose.dive': 'DIVE', 'pose.glide': 'GLIDING', 'pose.turbo': 'TURBO!',
    'hud.points': 'POINTS', 'hud.goal': 'GOAL {n} m', 'hud.rings': 'RINGS', 'hud.need': 'YOU NEED {n}',
  },
  cs: {
    'meta.title': 'Move It – hraje se celým tělem',
    'meta.desc': 'Pohybová hra pro děti: hraje se celým tělem před kamerou notebooku. Uhýbej, skákej, leť.',
    'logo.sub': 'HRAJE SE CELÝM TĚLEM',
    'mode.beh': 'BĚH', 'mode.let': 'LET',
    'mode.beh.desc': 'uhýbej, skákej, dřepej', 'mode.let.desc': 'mávej rukama a leť kruhy',
    'privacy': '🔒 Obraz z kamery zůstává jen ve tvém prohlížeči, nikam se neodesílá.',
    'install': 'Nainstalovat',
    'embed.window': 'Otevřít v novém okně',
    'back': '◀ Zpět', 'back.plain': 'Zpět',
    'skin.title': 'POSTAVIČKA', 'skin.prev': 'Předchozí', 'skin.next': 'Další',
    'skin.selected': '✔ Hraješ s ním', 'skin.pick': 'Vybrat', 'skin.buy': 'Koupit za {n}',
    'skin.missing': 'chybí {n}', 'skin.new': 'NOVÁ POSTAVIČKA!',
    'controls.title': 'OVLÁDÁNÍ', 'controls.camera': '📷 Kamera', 'controls.keys': '⌨️ Klávesnice',
    'cam.allow': 'Povol kameru v okně prohlížeče…',
    'cam.fail': 'Kamera nejde ({e}). Přepínám na klávesnici.',
    'wait.title': 'Postav se 2–3 metry od kamery',
    'wait.body': 'Celé tělo musí být v okénku vlevo dole.',
    'wait.hands': 'Zvedni obě ruce = START',
    'wait.manual': 'Start bez rukou',
    'res.next': 'Další level ▶', 'res.again': 'Znovu', 'res.levels': 'Levely',
    'res.hands': 'nebo zvedni obě ruce = znovu',
    'res.done': 'HOTOVO!', 'res.almost': 'SKORO!', 'res.end': 'KONEC!',
    'res.newRecord': 'NOVÝ REKORD: {n}', 'res.record': 'Rekord: {n}', 'lvl.record': 'rekord {n}',
    'res.runEndless': '{m} m · {c} mincí', 'res.runWin': '{lvl} zvládnuto!',
    'res.runLose': 'Došla srdíčka po {m} m z {cil} m',
    'res.flyEndless': '{k} kruhů', 'res.fly': '{k} z {n} kruhů', 'res.flyNeed': ' · potřebuješ {n}',
    'quit': 'Konec (Esc)', 'sound': 'Zvuk (M)', 'camera': 'Kamera', 'camera.n': 'Kamera {n}',
    'countdown.start': 'START!', 'step.back': 'COUVNI, NEVIDÍM TĚ',
    'cam.bothHands': 'OBĚ RUCE NAHOŘE', 'cam.black': 'ČERNÝ OBRAZ — KRYTKA NEBO TMA',
    'cam.noSee': 'NEVIDÍM TĚ — COUVNI', 'cam.loading': 'NAČÍTÁM', 'cam.loadingAi': 'NAČÍTÁM ROZPOZNÁVÁNÍ',
    'cam.bad': 'TAHLE KAMERA NEJDE',
    'hint.beh.cam': 'krok do strany = uhni · výskok = skok · dřep = podlez · ruka nahoru = hvězda',
    'hint.beh.keys': '← → uhni · ↑ skok · ↓ dřep',
    'hint.let.cam': 'mávni dolů = nahoru · nakloň ruce = zatáčka · roztáhni = plachti · ruce u těla = střemhlav · dlaně u ramen + mávej lokty = TURBO',
    'hint.let.keys': 'mezerník = mávnutí · ← → zatáčka · ↑ plachti · ↓ střemhlav · Shift = turbo',
    'pose.calib': 'STŮJ ROVNĚ…', 'pose.jump': 'SKOK!', 'pose.duck': 'DŘEP',
    'pose.left': 'VLEVO', 'pose.mid': 'STŘED', 'pose.right': 'VPRAVO', 'pose.hand': ' · RUKA',
    'pose.fly': 'LETÍŠ', 'pose.flap': 'MÁVNUTÍ!', 'pose.dive': 'STŘEMHLAV', 'pose.glide': 'PLACHTÍŠ', 'pose.turbo': 'TURBO!',
    'hud.points': 'BODŮ', 'hud.goal': 'CÍL {n} m', 'hud.rings': 'KRUHŮ', 'hud.need': 'POTŘEBUJEŠ {n}',
  },
};

// Jména levelů, světů a postaviček (v kódu jsou česky) → angličtina.
const JMENA_EN = {
  'Šumava': 'Forest', 'Sahara': 'Sahara', 'Alpy': 'Alps', 'Sopka': 'Volcano', 'Měsíc': 'Moon',
  'Nekonečný běh': 'Endless Run',
  'Údolí': 'Valley', 'Jezera': 'Lakes', 'Kaňon': 'Canyon', 'Jeskyně': 'Cave', 'Překážky': 'Obstacles',
  'Volný let': 'Open Sky',
  'Dino': 'Dino', 'Robo': 'Robo', 'Lávový dino': 'Lava Dino', 'Zlatý robot': 'Golden Robot', 'Drak': 'Dragon',
  'Orel': 'Eagle', 'Vážka': 'Dragonfly', 'Fénix': 'Phoenix', 'Létající drak': 'Flying Dragon',
};
const JMENA_EN_VELKA = Object.fromEntries(Object.entries(JMENA_EN).map(([k, v]) => [k.toUpperCase(), v.toUpperCase()]));

let ulozeny = null;
try { ulozeny = localStorage.getItem(KLIC); } catch {}
export let jazyk = ulozeny === 'cs' ? 'cs' : 'en';

export function t(klic, prom = {}) {
  const s = SLOVNIK[jazyk][klic] ?? SLOVNIK.en[klic] ?? klic;
  return s.replace(/\{(\w+)\}/g, (_, k) => prom[k] ?? '');
}
// přeloží jméno levelu / světa / postavičky
export function tn(jmeno) {
  if (jazyk === 'cs') return jmeno;
  return JMENA_EN[jmeno] ?? JMENA_EN_VELKA[jmeno] ?? jmeno;
}

const posluchaci = [];
export function poZmene(fn) { posluchaci.push(fn); }

export function prelozStranku() {
  document.documentElement.lang = jazyk;
  document.title = t('meta.title');
  const d = document.querySelector('meta[name="description"]'); if (d) d.content = t('meta.desc');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-jazyk]').forEach(el => el.classList.toggle('aktivni', el.dataset.jazyk === jazyk));
}

export function nastavJazyk(j) {
  jazyk = j === 'cs' ? 'cs' : 'en';
  try { localStorage.setItem(KLIC, jazyk); } catch {}
  prelozStranku();
  posluchaci.forEach(fn => fn(jazyk));
}

prelozStranku();
