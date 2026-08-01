/* Fit or DIE! — service worker: מטמון קליפה בסיסי להתקנה כ-PWA.
   index.html תמיד network-first כדי שעדכוני גרסה יגיעו מיד (המטמון רק
   כגיבוי אופליין); נכסים סטטיים (אייקונים, מניפסט) cache-first. */
const CACHE = 'fitordie-shell-v3';
const ASSETS = ['./', './index.html', './manifest.json',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(e.request).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
    return;
  }
  // חשוב: לשמור במטמון רק תשובות תקינות. שמירת 404 "מרעילה" את המטמון —
  // קרה בפועל עם תמונות שנוספו אחרי הביקור הראשון (הן נשארו 404 לנצח).
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(nr => {
    if (nr && nr.ok) { const cp = nr.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return nr;
  })));
});
