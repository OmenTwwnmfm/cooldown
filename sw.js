/* 冷静一下 · service worker
   目标只有两个：装到主屏后断网也能打开、第二次打开不用重新下载。
   不做后台同步，不缓存 WebDAV 请求（那是跨域且必须实时的）。 */

const VERSION = 'cooldown-v1';
const APP = './spend-guard.html';
const SHELL = [APP, './manifest.json', './icon-1024.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 跨域（WebDAV 同步、CDN）一律走网络，不进缓存
  if (url.origin !== location.origin) return;

  // 打开页面：先用网络（保证改了 html 立刻生效），断网时退回缓存
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(APP, copy));
          return res;
        })
        .catch(() => caches.match(APP))
    );
    return;
  }

  // 静态资源：缓存优先
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});
