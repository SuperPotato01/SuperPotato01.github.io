/* ============================================================
   sw.js — Service Worker：离线兜底
   策略：network-first —— 在线时永远拿最新版本，断网才用缓存。
   这样既保证"改了立刻能看到"，又能离线访问。
   升级缓存版本号即可让旧缓存自动清理。
   ============================================================ */
var CACHE = "potato-v8";
var PRECACHE = [
  "./",
  "./index.html",
  "./blog.html",
  "./resources.html",
  "./404.html",
  "./assets/style.css",
  "./assets/app.js",
  "./assets/earth-poster.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./manifest.json"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // 跨域资源不拦截

  e.respondWith(
    fetch(req).then(function (res) {
      // 命中网络：正常返回，并顺手更新缓存（视频太大不缓存）
      if (res && res.status === 200 && res.type === "basic" && !/\.mp4($|\?)/.test(url.pathname)) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, clone); });
      }
      return res;
    }).catch(function () {
      // 断网：用缓存兜底；导航类请求兜底到首页
      return caches.match(req).then(function (r) {
        if (r) return r;
        if (req.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});
