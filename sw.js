const CACHE_NAME = 'resume-portfolio-cache-v12';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './portfolio.html',
  './print.html',
  './assets/css/site.css',
  './assets/css/portfolio.css',
  './assets/css/print-booklet.css',
  './assets/js/content.js',
  './assets/js/qrcode.js',
  './assets/js/editor.js',
  './assets/js/resume.js',
  './assets/js/portfolio.js',
  './assets/images/photo01.webp',
  './assets/images/photo02.webp',
  './assets/images/work/miao_motion.gif',
  './assets/images/work/owl_cover.webp',
  './assets/images/work/owl_typography.webp',
  './assets/images/work/coffee_taste.webp',
  './assets/images/work/coffee_menu.webp',
  './assets/images/work/line_menu.webp',
  './assets/images/work/zt_dm_01.webp',
  './assets/images/work/zt_dm_02.webp',
  './assets/images/work/zt_dm_03.webp',
  './assets/images/work/zt_dm_04.webp',
  './assets/images/work/zt_dm_05.webp',
  './assets/images/work/zt_dm_06.webp',
  './assets/images/work/devfest_01.webp',
  './assets/images/work/devfest_02.webp',
  './assets/images/work/kotlin_fb.webp',
  './assets/images/work/kotlin_sponsor.webp',
  './assets/images/work/sijimian_fb.webp',
  './assets/images/work/sijimian_sleep.webp',
  './assets/images/work/sijimian_sign.webp',
  './assets/images/work/artis_資產_1.webp',
  './assets/images/work/artis_資產_2.webp',
  './assets/images/work/artis_資產_3.webp',
  './assets/images/work/artis_資產_4.webp',
  './assets/images/work/artis_資產_6.webp',
  './assets/images/work/artis_資產_7.webp',
  './assets/images/work/artis_資產_8.webp',
  './assets/images/work/artis_資產_9.webp',
  './assets/images/work/behavior_資產_1.webp',
  './assets/images/work/behavior_資產_1_2.webp',
  './assets/images/work/behavior_資產_2.webp',
  './assets/images/work/behavior_資產_2_2.webp',
  './assets/images/work/interior_01.webp',
  './assets/images/work/interior_02.webp',
  './assets/images/work/interior_03.webp',
  './assets/packaging/卡蘭索.webp',
  './assets/packaging/蜜月花魁.webp',
  './assets/packaging/班薩.webp',
  './assets/packaging/莫札特.webp',
  './assets/packaging/米拉蘇.webp',
  './assets/packaging/坎貝朵.webp',
  './assets/packaging/巨石.webp',
  './assets/packaging/沛拉爾塔-中淺.webp',
  './assets/packaging/拉斯拉哈斯.webp',
  './assets/packaging/阿朵斯.webp',
  './assets/packaging/阿里歐.webp',
  './assets/packaging/科契爾.webp',
  './assets/packaging/美麗境莊園.webp',
  './assets/packaging/烏拉嘎紅蜜.webp',
  './assets/packaging/黑靈魂.webp',
  './assets/packaging/摩爾.webp',
  './assets/packaging/蕭邦.webp',
  './assets/packaging/藍火山.webp',
  './assets/packaging/大同_大同道.webp',
  './assets/packaging/大同_孔子像.webp',
  './assets/packaging/大同_藍色操場.webp',
  './assets/packaging/大同_鳳園.webp',
  './assets/packaging/大同_龍池.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // 對 HTML, CSS, JS 等程式檔案優先使用 Network-First，以確保修改後立即生效
  const isCodeAsset = url.pathname.endsWith('.html') ||
                      url.pathname.endsWith('.js') ||
                      url.pathname.endsWith('.css') ||
                      url.pathname === '/' ||
                      url.pathname.endsWith('/');

  if (isCodeAsset) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // 圖片等靜態資產使用 Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
