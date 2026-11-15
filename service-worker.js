/**
 * 離線優先 Service Worker。
 *
 * - install：cache.addAll(PRECACHE)
 * - activate：清除非 mumu-v3 快取
 * - fetch：導覽請求 network-first（失敗回退 ./index.html），其餘 cache-first 並背景更新
 */

const CACHE_NAME = "mumu-v3";

/** 預快取清單。 */
const PRECACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./icon-1024.png",
    "./content/levels.json",
    "./content/chapters.json",
    "./content/characters.json",
    "./content/items.json",
    "./content/minimal-pairs.json",
    "./content/narrative.json",
    "./content/story-arcs.json",
    "./content/assessment.json",
    "./content/timeline.json",
    "./content/telemetry.json",
    "./content/sfx-map.json",
    "./content/music.json",
    "./content/app.json",
    "./src/js/main.js",
    "./src/js/core/events.js",
    "./src/js/core/state.js",
    "./src/js/core/constants.js",
    "./src/js/core/timeline.js",
    "./src/js/core/mastery.js",
    "./src/js/core/progress.js",
    "./src/js/core/storage.js",
    "./src/js/core/daily.js",
    "./src/js/core/dex.js",
    "./src/js/core/referral.js",
    "./src/js/core/telemetry.js",
    "./src/js/core/consent.js",
    "./src/js/core/entitlements.js",
    "./src/js/core/parental-gate.js",
    "./src/js/data/loader.js",
    "./src/js/data/items.js",
    "./src/js/data/levels.js",
    "./src/js/audio/mixer.js",
    "./src/js/audio/sfx.js",
    "./src/js/audio/music.js",
    "./src/js/audio/voice.js",
    "./src/js/ui/hud.js",
    "./src/js/ui/motion.js",
    "./src/js/ui/particles.js",
    "./src/js/ui/haptics.js",
    "./src/js/ui/parallax.js",
    "./src/js/ui/character-render.js",
    "./src/js/ui/dex.js",
    "./src/js/ui/share-card.js",
    "./src/js/ui/levelmap.js",
    "./src/js/ui/parent-report.js",
    "./src/js/ui/settings-audio.js",
    "./src/js/ui/assessment-ui.js",
    "./src/js/ui/tutorial.js",
    "./src/js/ui/story.js",
    "./src/js/ui/paywall.js",
    "./src/js/ui/a11y.js",
    "./src/js/assessment/runner.js",
    "./src/js/game/verbs.js",
    "./src/js/game/round.js",
    "./src/js/game/router.js",
    "./src/js/styles/tokens.css",
    "./src/styles/tokens.css",
    "./src/styles/base.css",
    "./src/styles/components.css",
    "./src/styles/motion.css",
    "./src/styles/responsive.css",
    "./src/styles/dex.css",
    "./src/styles/share.css",
    "./src/styles/a11y.css"
];

/**
 * 安裝階段。
 * @param {ExtendableEvent} event
 */
self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        // 逐一加入，避免單一檔案失敗導致整批 install 失敗
        await Promise.all(PRECACHE.map(async (url) => {
            try {
                await cache.add(new Request(url, { cache: "reload" }));
            } catch {
                // 該檔案可能不存在（例如尚未建立），略過即可
            }
        }));
        await self.skipWaiting();
    })());
});

/**
 * 啟用階段：清除舊快取。
 * @param {ExtendableEvent} event
 */
self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
        await self.clients.claim();
    })());
});

/**
 * 攔截請求。
 * @param {FetchEvent} event
 */
self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // 導覽請求：network-first，失敗回退 index.html
    if (req.mode === "navigate") {
        event.respondWith((async () => {
            try {
                const fresh = await fetch(req);
                const cache = await caches.open(CACHE_NAME);
                cache.put("./index.html", fresh.clone());
                return fresh;
            } catch {
                const cache = await caches.open(CACHE_NAME);
                const cached = await cache.match("./index.html");
                if (cached) return cached;
                return new Response("Offline", { status: 503, statusText: "Offline" });
            }
        })());
        return;
    }

    // 其他資源：cache-first 並背景更新
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);

        const network = fetch(req).then((response) => {
            if (response && response.ok) {
                cache.put(req, response.clone());
            }
            return response;
        }).catch(() => null);

        if (cached) {
            // 背景更新，不阻塞回應
            network.catch(() => { });
            return cached;
        }

        const fresh = await network;
        if (fresh) return fresh;
        return new Response("Not found", { status: 404 });
    })());
});
