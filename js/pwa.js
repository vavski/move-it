// PWA helpers: register the service worker only in a top-level window,
// and show an Install button when the browser fires beforeinstallprompt.
// Nothing here may throw into the game loop.
import { t, poZmene } from './i18n.js';

function vRamci() {
  try { return window.self !== window.top; } catch { return true; }
}

function registrovatSW() {
  if (vRamci()) return;
  if (!('serviceWorker' in navigator)) return;
  const url = new URL('sw.js', document.baseURI);
  const scope = new URL('./', document.baseURI);
  navigator.serviceWorker.register(url.href, { scope: scope.href }).catch(() => {});
}

function ukazInstalaci(zobrazit) {
  const btn = document.getElementById('btnInstalovat');
  if (!btn) return;
  btn.classList.toggle('skryt', !zobrazit);
  if (zobrazit) btn.textContent = t('install');
}

function pripravInstalaci() {
  let promptUdalost = window.__pwaInstall || null;
  if (promptUdalost) ukazInstalaci(true);

  window.addEventListener('moveit-installable', () => {
    promptUdalost = window.__pwaInstall || promptUdalost;
    if (promptUdalost) ukazInstalaci(true);
  });

  window.addEventListener('beforeinstallprompt', e => {
    // fallback if the early head listener did not run
    try { e.preventDefault(); } catch {}
    promptUdalost = e;
    window.__pwaInstall = e;
    ukazInstalaci(true);
  });

  window.addEventListener('appinstalled', () => {
    promptUdalost = null;
    window.__pwaInstall = null;
    ukazInstalaci(false);
  });

  const btn = document.getElementById('btnInstalovat');
  if (btn) {
    btn.addEventListener('click', async () => {
      const ev = promptUdalost || window.__pwaInstall;
      if (!ev || typeof ev.prompt !== 'function') return;
      try {
        await ev.prompt();
        await ev.userChoice;
      } catch {}
      promptUdalost = null;
      window.__pwaInstall = null;
      ukazInstalaci(false);
    });
  }
  poZmene(() => { if (promptUdalost || window.__pwaInstall) ukazInstalaci(true); });
}

function pripravNoveOkno() {
  const btn = document.getElementById('btnNoveOkno');
  if (!btn) return;
  if (!vRamci()) return;
  btn.classList.remove('skryt');
  btn.textContent = t('embed.window');
  btn.addEventListener('click', () => {
    try {
      const w = window.open(location.href, '_blank', 'noopener');
      if (!w) window.open('https://vavski.github.io/move-it/', '_blank', 'noopener');
    } catch {
      try { window.open('https://vavski.github.io/move-it/', '_blank', 'noopener'); } catch {}
    }
  });
  poZmene(() => { if (!btn.classList.contains('skryt')) btn.textContent = t('embed.window'); });
}

try { registrovatSW(); } catch {}
try { pripravInstalaci(); } catch {}
try { pripravNoveOkno(); } catch {}
