// Jednoduchý překlad hry: angličtina (výchozí), čeština a v nastavení němčina, španělština, francouzština.
// Volba se pamatuje v localStorage; bez volby podle jazyka prohlížeče. Statické texty mají v HTML data-i18n="klíč".
import { DALSI_SLOVNIK, DALSI_JMENA } from './i18n-dalsi.js';
const KLIC = 'moveit-jazyk';
export const JAZYKY = { en: 'English', cs: 'Čeština', de: 'Deutsch', es: 'Español', fr: 'Français' };

const SLOVNIK = {
  en: {
    'rec.on': '📹 Record video: ON', 'rec.off': '📹 Record video: OFF', 'rec.tip': 'Records a vertical video of you and the game. It stays on this device.', 'rec.save': '📹 Save video', 'calm.on': '🪶 Calm flight: ON', 'calm.off': '🪶 Calm flight: OFF', 'res.newBest': 'NEW BEST TIME!', 'res.who': 'Who flew?',
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
    'res.next': '▶ Next', 'res.again': '↻ Again', 'res.levels': '☰ Levels', 'key.space': 'SPACE', 'skip': 'Skip',
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
    'hint.let.cam': 'flap down = go up · lean to the side = turn · arms wide = glide · arms down = rest and sink · hands at shoulders + flap elbows = TURBO',
    'tv.menu': 'Play on TV', 'tv.title': 'PLAY ON TV', 'tv.step1': 'Connect a laptop or phone to the TV. A cable (HDMI) works best.', 'tv.step2': 'Put it under the TV with the camera facing the player.', 'tv.step3': 'Stand 2–3 metres from the TV so the camera sees your whole body.', 'tv.wireless': 'Wireless screen mirroring works too, but the picture comes a bit late. Turn on TV mode: everything is bigger and the game is a bit slower.', 'tv.on': '📺 TV mode: ON', 'tv.off': '📺 TV mode: OFF', 'tv.done': 'Done',
    'fullscreen': 'Full screen',
    'settings': 'Settings', 'settings.lang': 'Language',
    'hint.let.keys': 'space = flap · ← → turn · ↑ glide · ↓ dive · Shift = turbo',
    'pose.calib': 'STAND STILL…', 'pose.jump': 'JUMP!', 'pose.duck': 'DUCK',
    'pose.left': 'LEFT', 'pose.mid': 'MIDDLE', 'pose.right': 'RIGHT', 'pose.hand': ' · HAND',
    'pose.fly': 'FLYING', 'pose.flap': 'FLAP!', 'pose.dive': 'DIVE', 'pose.glide': 'GLIDING', 'pose.turbo': 'TURBO!',
    'mode.koste': 'BROOM', 'mode.koste.desc': 'race on a broom and cast spells', 'hud.place': 'PLACE', 'res.broom': '{p}. place of {n} · {k} rings · {b} balloons',
    'hint.koste.cam': 'hold an invisible broom with both hands · move it left or right = turn · lift it a little = climb · push it down = sink · one hand up like a wand = SPELL',
    'hint.koste.keys': '← → turn · ↑ climb · ↓ sink · space = spell',
    'pose.broom': 'ON THE BROOM', 'pose.up': 'UP', 'pose.down': 'DOWN', 'pose.spell': 'SPELL!',
    'hud.points': 'POINTS', 'hud.goal': 'GOAL {n} m', 'hud.rings': 'RINGS', 'hud.need': 'YOU NEED {n}',
  },
  cs: {
    'rec.on': '📹 Nahrávat video: ZAP', 'rec.off': '📹 Nahrávat video: VYP', 'rec.tip': 'Nahraje svislé video tebe a hry. Zůstane jen v tomhle zařízení.', 'rec.save': '📹 Uložit video', 'calm.on': '🪶 Klidný let: ZAP', 'calm.off': '🪶 Klidný let: VYP', 'res.newBest': 'NOVÝ NEJLEPŠÍ ČAS!', 'res.who': 'Kdo letěl?',
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
    'res.next': '▶ Další', 'res.again': '↻ Znovu', 'res.levels': '☰ Levely', 'key.space': 'MEZERNÍK', 'skip': 'Přeskočit',
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
    'hint.let.cam': 'mávni dolů = nahoru · nakloň se do strany = zatáčka · roztáhni ruce = plachti · ruce dole = odpočinek, klesáš · dlaně u ramen + mávej lokty = TURBO',
    'tv.menu': 'Hrát na televizi', 'tv.title': 'HRÁT NA TELEVIZI', 'tv.step1': 'Připoj notebook nebo telefon k televizi. Nejlepší je kabel (HDMI).', 'tv.step2': 'Polož ho pod televizi, kamerou k hráči.', 'tv.step3': 'Stoupni si 2–3 metry od televize, ať tě kamera vidí celého.', 'tv.wireless': 'Bezdrátové zrcadlení obrazovky jde taky, ale obraz chodí trochu pozdě. Zapni TV režim: všechno je větší a hra trochu pomalejší.', 'tv.on': '📺 TV režim: ZAP', 'tv.off': '📺 TV režim: VYP', 'tv.done': 'Hotovo',
    'fullscreen': 'Celá obrazovka',
    'settings': 'Nastavení', 'settings.lang': 'Jazyk',
    'hint.let.keys': 'mezerník = mávnutí · ← → zatáčka · ↑ plachti · ↓ střemhlav · Shift = turbo',
    'pose.calib': 'STŮJ ROVNĚ…', 'pose.jump': 'SKOK!', 'pose.duck': 'DŘEP',
    'pose.left': 'VLEVO', 'pose.mid': 'STŘED', 'pose.right': 'VPRAVO', 'pose.hand': ' · RUKA',
    'pose.fly': 'LETÍŠ', 'pose.flap': 'MÁVNUTÍ!', 'pose.dive': 'STŘEMHLAV', 'pose.glide': 'PLACHTÍŠ', 'pose.turbo': 'TURBO!',
    'mode.koste': 'KOŠTĚ', 'mode.koste.desc': 'závoď na koštěti a kouzli', 'hud.place': 'MÍSTO', 'res.broom': '{p}. místo z {n} · {k} kruhů · {b} balónků',
    'hint.koste.cam': 'drž neviditelné koště oběma rukama · posuň ho doleva nebo doprava = zatáčka · kousek nahoru = stoupáš · kousek dolů = klesáš · jednu ruku nahoru jako hůlku = KOUZLO',
    'hint.koste.keys': '← → zatáčka · ↑ stoupání · ↓ klesání · mezerník = kouzlo',
    'pose.broom': 'NA KOŠTĚTI', 'pose.up': 'NAHORU', 'pose.down': 'DOLŮ', 'pose.spell': 'KOUZLO!',
    'hud.points': 'BODŮ', 'hud.goal': 'CÍL {n} m', 'hud.rings': 'KRUHŮ', 'hud.need': 'POTŘEBUJEŠ {n}',
  },
  ...DALSI_SLOVNIK,
};

// Jména levelů, světů a postaviček (v kódu jsou česky) → angličtina.
const JMENA_EN = {
  'Šumava': 'Forest', 'Sahara': 'Sahara', 'Alpy': 'Alps', 'Sopka': 'Volcano', 'Měsíc': 'Moon',
  'Nekonečný běh': 'Endless Run',
  'Les': 'Woods', 'Noc': 'Night', 'Písečná bouře': 'Sandstorm', 'Ledovec': 'Glacier', 'Finále': 'Finale',
  'Údolí': 'Valley', 'Jezera': 'Lakes', 'Kaňon': 'Canyon', 'Jeskyně': 'Cave', 'Překážky': 'Obstacles', 'Sloupy': 'Pillars',
  'Vítr': 'Wind', 'Tančící kruhy': 'Dancing Rings', 'Malé kruhy': 'Tiny Rings', 'Bouře': 'Storm',
  'Volný let': 'Open Sky',
  'Fialový drak': 'Purple Dragon',
  'Kouzelná louka': 'Magic Meadow', 'Jezerní závod': 'Lake Race', 'Kamenné sloupy': 'Stone Pillars', 'Větrná pláň': 'Windy Plain', 'Bouřkový kaňon': 'Stormy Canyon', 'Velké finále': 'Grand Finale', 'Volné létání': 'Free Flying', 'Ohnivé koště': 'Fire Broom',
  'Dino': 'Dino', 'Robo': 'Robo', 'Lávový dino': 'Lava Dino', 'Zlatý robot': 'Golden Robot', 'Drak': 'Dragon',
  'Kafíno Běžíno': 'Coffino Runnino', 'Banáno Sportivo': 'Banano Sportivo', 'Žraloko Tenisko': 'Sharko Sneakero', 'Pizza Miauzza': 'Pizza Miaouzza',
  'Anička': 'Annie', 'Tomík': 'Tommy', 'Bára': 'Bella', 'Kuba': 'Jake', 'Stavař': 'Builder', 'Voják': 'Soldier',
  'Pirát': 'Pirate', 'Zombík': 'Zombie', 'Plecháč': 'Tin Bot', 'Rytíř': 'Knight', 'Ufoň': 'Alien',
  'Karatista': 'Karate Boy', 'Karatistka': 'Karate Girl', 'Modrásek': 'Blue Hero', 'Pejsek': 'Doggo', 'Husky': 'Husky', 'Alpaka': 'Alpaca', 'Kravička': 'Moo Cow', 'Koník': 'Pony', 'Jelínek': 'Little Deer', 'Slepice': 'Chicken',
  'Liška': 'Fox', 'Ninja': 'Ninja', 'Zombík': 'Zombie', 'Viking': 'Viking', 'Čaroděj': 'Wizard', 'Čarodějnice': 'Witch',
  'Zlatý rytíř': 'Golden Knight', 'Mech Stan': 'Mech Stan', 'Mech Mike': 'Mech Mike',
  'Holoubek': 'Pigeon', 'Včelka': 'Bee', 'Duch': 'Ghost', 'Pterodaktyl': 'Pterodactyl', 'Dráček': 'Little Dragon', 'Ohnivý drak': 'Fire Dragon',
  'Orel': 'Eagle', 'Vážka': 'Dragonfly', 'Fénix': 'Phoenix', 'Létající drak': 'Flying Dragon',
  'Papoušek': 'Parrot', 'Netopýr': 'Bat', 'Sněžná sova': 'Snowy Owl', 'Zlatý drak': 'Golden Dragon',
};
// jména v jednotlivých jazycích (chybějící = angličtina); světy jsou v kódu velkými písmeny
const velka = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.toUpperCase(), v.toUpperCase()]));
const JMENA = {};
for (const j of ['en', 'de', 'es', 'fr']) { const o = { ...JMENA_EN, ...(DALSI_JMENA[j] || {}) }; JMENA[j] = { ...o, ...velka(o) }; }

let ulozeny = null;
try { ulozeny = localStorage.getItem(KLIC); } catch {}
const prohlizec = (navigator.language || 'en').slice(0, 2).toLowerCase();
export let jazyk = JAZYKY[ulozeny] ? ulozeny : JAZYKY[prohlizec] ? prohlizec : 'en';

export function t(klic, prom = {}) {
  const s = SLOVNIK[jazyk][klic] ?? SLOVNIK.en[klic] ?? klic;
  return s.replace(/\{(\w+)\}/g, (_, k) => prom[k] ?? '');
}
// přeloží jméno levelu / světa / postavičky
export function tn(jmeno) {
  if (jazyk === 'cs') return jmeno;
  return JMENA[jazyk][jmeno] ?? JMENA.en[jmeno] ?? jmeno;
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
  // ozubené kolečko ukáže zkratku, když je zapnutý jazyk z nastavení
  const kolo = document.getElementById('btnNastaveni');
  if (kolo) { const jiny = jazyk !== 'en' && jazyk !== 'cs'; kolo.textContent = jiny ? jazyk.toUpperCase() + ' ⚙' : '⚙'; kolo.classList.toggle('aktivni', jiny); }
}

export function nastavJazyk(j) {
  jazyk = JAZYKY[j] ? j : 'en';
  try { localStorage.setItem(KLIC, jazyk); } catch {}
  prelozStranku();
  posluchaci.forEach(fn => fn(jazyk));
}

prelozStranku();
