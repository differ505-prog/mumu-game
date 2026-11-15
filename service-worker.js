/**
 * Service Worker — 離線優先快取。
 *
 * 策略：
 * - 導覽請求：network-first，失敗回退 index.html
 * - 其他請求：cache-first 並於背景更新
 */

const CACHE_NAME = "mumu-v3";

/** 預快取清單 */
const PRECACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./src/styles/tokens.css",
    "./src/styles/base.css",
    "./src/styles/components.css",
    "./src/styles/motion.css",
    "./src/styles/responsive.css",
    "./src/styles/a11y.css",
    "./src/js/main.js",
    "./src/js/core/events.js",
    "./src/js/core/state.js",
    "./src/js/core/config.js",
    "./src/js/core/verbs.js",
    "./src/js/core/session.js",
    "./src/js/core/timeline.js",
    "./src/js/data/load-content.js",
    "./src/js/data/characters.js",
    "./src/js/data/levels.js",
    "./src/js/data/items.js",
    "./src/js/data/story.js",
    "./src/js/audio/mixer.js",
    "./src/js/audio/sfx.js",
    "./src/js/audio/voice.js",
    "./src/js/verbs/index.js",
    "./src/js/verbs/auditory.js",
    "./src/js/verbs/puzzle.js",
    "./src/js/verbs/memory.js",
    "./src/js/ui/hud.js",
    "./src/js/ui/motion.js",
    "./src/js/ui/particles.js",
    "./src/js/ui/haptics.js",
    "./src/js/ui/character-render.js",
    "./content/characters.json",
    "./content/items.json",
    "./content/levels.json",
    "./content/minimal-pairs.json",
    "./content/narrative.zh-TW.json",
    "./content/narrative.en-US.json",
    "./content/story-arcs.json",
    "./content/timeline.json",
    "./content/sfx-map.json"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE))
            .catch(() => { /* 個別資源失敗不阻擋安裝 */ })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;

    // 導覽請求：network-first
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match("./index.html"))
        );
        return;
    }

    // 其他：cache-first + 背景更新
    event.respondWith(
        caches.match(request).then((cached) => {
            const network = fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
