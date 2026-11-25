/**
 * 離線優先 Service Worker。
 *
 * - install：逐一快取 PRECACHE（單檔失敗不致整批失敗）
 * - activate：清除非 mumu-v4 快取
 * - fetch：導覽請求 network-first（失敗回退 ./index.html），其餘 cache-first 並背景更新
 */

const CACHE_NAME = "mumu-v4";

/** 預快取清單（Step 129：與磁碟實際檔案完全一致）。 */
const PRECACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./icon-1024.png",
    "./assets/characters/dino-allosaurus-walk-1.svg",
    "./assets/characters/dino-allosaurus-walk-2.svg",
    "./assets/characters/dino-allosaurus-walk-3.svg",
    "./assets/characters/dino-allosaurus-walk-4.svg",
    "./assets/characters/dino-allosaurus.svg",
    "./assets/characters/dino-ankylosaurus-walk-1.svg",
    "./assets/characters/dino-ankylosaurus-walk-2.svg",
    "./assets/characters/dino-ankylosaurus-walk-3.svg",
    "./assets/characters/dino-ankylosaurus-walk-4.svg",
    "./assets/characters/dino-ankylosaurus.svg",
    "./assets/characters/dino-brachiosaurus-walk-1.svg",
    "./assets/characters/dino-brachiosaurus-walk-2.svg",
    "./assets/characters/dino-brachiosaurus-walk-3.svg",
    "./assets/characters/dino-brachiosaurus-walk-4.svg",
    "./assets/characters/dino-brachiosaurus.svg",
    "./assets/characters/dino-carnotaurus-walk-1.svg",
    "./assets/characters/dino-carnotaurus-walk-2.svg",
    "./assets/characters/dino-carnotaurus-walk-3.svg",
    "./assets/characters/dino-carnotaurus-walk-4.svg",
    "./assets/characters/dino-carnotaurus.svg",
    "./assets/characters/dino-ceratosaurus-walk-1.svg",
    "./assets/characters/dino-ceratosaurus-walk-2.svg",
    "./assets/characters/dino-ceratosaurus-walk-3.svg",
    "./assets/characters/dino-ceratosaurus-walk-4.svg",
    "./assets/characters/dino-ceratosaurus.svg",
    "./assets/characters/dino-compysognathus-walk-1.svg",
    "./assets/characters/dino-compysognathus-walk-2.svg",
    "./assets/characters/dino-compysognathus-walk-3.svg",
    "./assets/characters/dino-compysognathus-walk-4.svg",
    "./assets/characters/dino-compysognathus.svg",
    "./assets/characters/dino-dilophosaurus-walk-1.svg",
    "./assets/characters/dino-dilophosaurus-walk-2.svg",
    "./assets/characters/dino-dilophosaurus-walk-3.svg",
    "./assets/characters/dino-dilophosaurus-walk-4.svg",
    "./assets/characters/dino-dilophosaurus.svg",
    "./assets/characters/dino-diplodocus-walk-1.svg",
    "./assets/characters/dino-diplodocus-walk-2.svg",
    "./assets/characters/dino-diplodocus-walk-3.svg",
    "./assets/characters/dino-diplodocus-walk-4.svg",
    "./assets/characters/dino-diplodocus.svg",
    "./assets/characters/dino-eoraptor-walk-1.svg",
    "./assets/characters/dino-eoraptor-walk-2.svg",
    "./assets/characters/dino-eoraptor-walk-3.svg",
    "./assets/characters/dino-eoraptor-walk-4.svg",
    "./assets/characters/dino-eoraptor.svg",
    "./assets/characters/dino-giganotosaurus-walk-1.svg",
    "./assets/characters/dino-giganotosaurus-walk-2.svg",
    "./assets/characters/dino-giganotosaurus-walk-3.svg",
    "./assets/characters/dino-giganotosaurus-walk-4.svg",
    "./assets/characters/dino-giganotosaurus.svg",
    "./assets/characters/dino-iguanodon-walk-1.svg",
    "./assets/characters/dino-iguanodon-walk-2.svg",
    "./assets/characters/dino-iguanodon-walk-3.svg",
    "./assets/characters/dino-iguanodon-walk-4.svg",
    "./assets/characters/dino-iguanodon.svg",
    "./assets/characters/dino-maiasaura-walk-1.svg",
    "./assets/characters/dino-maiasaura-walk-2.svg",
    "./assets/characters/dino-maiasaura-walk-3.svg",
    "./assets/characters/dino-maiasaura-walk-4.svg",
    "./assets/characters/dino-maiasaura.svg",
    "./assets/characters/dino-mosasaurus-walk-1.svg",
    "./assets/characters/dino-mosasaurus-walk-2.svg",
    "./assets/characters/dino-mosasaurus-walk-3.svg",
    "./assets/characters/dino-mosasaurus-walk-4.svg",
    "./assets/characters/dino-mosasaurus.svg",
    "./assets/characters/dino-oviraptor-walk-1.svg",
    "./assets/characters/dino-oviraptor-walk-2.svg",
    "./assets/characters/dino-oviraptor-walk-3.svg",
    "./assets/characters/dino-oviraptor-walk-4.svg",
    "./assets/characters/dino-oviraptor.svg",
    "./assets/characters/dino-parasaurolophus-walk-1.svg",
    "./assets/characters/dino-parasaurolophus-walk-2.svg",
    "./assets/characters/dino-parasaurolophus-walk-3.svg",
    "./assets/characters/dino-parasaurolophus-walk-4.svg",
    "./assets/characters/dino-parasaurolophus.svg",
    "./assets/characters/dino-pteranodon-walk-1.svg",
    "./assets/characters/dino-pteranodon-walk-2.svg",
    "./assets/characters/dino-pteranodon-walk-3.svg",
    "./assets/characters/dino-pteranodon-walk-4.svg",
    "./assets/characters/dino-pteranodon.svg",
    "./assets/characters/dino-spinosaurus-walk-1.svg",
    "./assets/characters/dino-spinosaurus-walk-2.svg",
    "./assets/characters/dino-spinosaurus-walk-3.svg",
    "./assets/characters/dino-spinosaurus-walk-4.svg",
    "./assets/characters/dino-spinosaurus.svg",
    "./assets/characters/dino-stegosaurus-walk-1.svg",
    "./assets/characters/dino-stegosaurus-walk-2.svg",
    "./assets/characters/dino-stegosaurus-walk-3.svg",
    "./assets/characters/dino-stegosaurus-walk-4.svg",
    "./assets/characters/dino-stegosaurus.svg",
    "./assets/characters/dino-trachodon-walk-1.svg",
    "./assets/characters/dino-trachodon-walk-2.svg",
    "./assets/characters/dino-trachodon-walk-3.svg",
    "./assets/characters/dino-trachodon-walk-4.svg",
    "./assets/characters/dino-trachodon.svg",
    "./assets/characters/dino-trex-walk-1.svg",
    "./assets/characters/dino-trex-walk-2.svg",
    "./assets/characters/dino-trex-walk-3.svg",
    "./assets/characters/dino-trex-walk-4.svg",
    "./assets/characters/dino-trex.svg",
    "./assets/characters/dino-triceratops-walk-1.svg",
    "./assets/characters/dino-triceratops-walk-2.svg",
    "./assets/characters/dino-triceratops-walk-3.svg",
    "./assets/characters/dino-triceratops-walk-4.svg",
    "./assets/characters/dino-triceratops.svg",
    "./assets/characters/dino-tyrannosaurus-scout-walk-1.svg",
    "./assets/characters/dino-tyrannosaurus-scout-walk-2.svg",
    "./assets/characters/dino-tyrannosaurus-scout-walk-3.svg",
    "./assets/characters/dino-tyrannosaurus-scout-walk-4.svg",
    "./assets/characters/dino-tyrannosaurus-scout.svg",
    "./assets/characters/dino-tyrannosaurus-walk-1.svg",
    "./assets/characters/dino-tyrannosaurus-walk-2.svg",
    "./assets/characters/dino-tyrannosaurus-walk-3.svg",
    "./assets/characters/dino-tyrannosaurus-walk-4.svg",
    "./assets/characters/dino-tyrannosaurus.svg",
    "./assets/characters/dino-velociraptor-walk-1.svg",
    "./assets/characters/dino-velociraptor-walk-2.svg",
    "./assets/characters/dino-velociraptor-walk-3.svg",
    "./assets/characters/dino-velociraptor-walk-4.svg",
    "./assets/characters/dino-velociraptor.svg",
    "./assets/characters/manifest.json",
    "./assets/characters/reindeer.svg",
    "./assets/characters/santa.svg",
    "./assets/characters/snowman.svg",
    "./assets/icons/app-icon.svg",
    "./assets/icons/back.svg",
    "./assets/icons/bell.svg",
    "./assets/icons/calendar.svg",
    "./assets/icons/candle.svg",
    "./assets/icons/chart.svg",
    "./assets/icons/check.svg",
    "./assets/icons/chevron.svg",
    "./assets/icons/close-circle.svg",
    "./assets/icons/close.svg",
    "./assets/icons/cross.svg",
    "./assets/icons/crown.svg",
    "./assets/icons/dino-egg.svg",
    "./assets/icons/dino-footprint.svg",
    "./assets/icons/drum.svg",
    "./assets/icons/echo.svg",
    "./assets/icons/gift.svg",
    "./assets/icons/heart.svg",
    "./assets/icons/hint.svg",
    "./assets/icons/home.svg",
    "./assets/icons/house.svg",
    "./assets/icons/leaf.svg",
    "./assets/icons/light.svg",
    "./assets/icons/lock.svg",
    "./assets/icons/manifest.json",
    "./assets/icons/map.svg",
    "./assets/icons/maze.svg",
    "./assets/icons/medal.svg",
    "./assets/icons/music.svg",
    "./assets/icons/parent.svg",
    "./assets/icons/pause.svg",
    "./assets/icons/play.svg",
    "./assets/icons/puzzle.svg",
    "./assets/icons/replay.svg",
    "./assets/icons/roar.svg",
    "./assets/icons/rocket.svg",
    "./assets/icons/settings.svg",
    "./assets/icons/shield.svg",
    "./assets/icons/slow.svg",
    "./assets/icons/snowflake.svg",
    "./assets/icons/speaker.svg",
    "./assets/icons/star-chart.svg",
    "./assets/icons/star-filled.svg",
    "./assets/icons/star.svg",
    "./assets/icons/tree.svg",
    "./assets/icons/trophy.svg",
    "./assets/icons/twin.svg",
    "./assets/icons/unlock.svg",
    "./assets/icons/volume-mute.svg",
    "./assets/icons/volume.svg",
    "./assets/manifest.json",
    "./content/assessment.json",
    "./content/characters.json",
    "./content/child-voice.json",
    "./content/items.json",
    "./content/levels.json",
    "./content/minimal-pairs.json",
    "./content/music.json",
    "./content/narrative.en-US.json",
    "./content/narrative.zh-TW.json",
    "./content/performances.json",
    "./content/privacy.en-US.md",
    "./content/privacy.zh-TW.md",
    "./content/terms.en-US.md",
    "./content/terms.zh-TW.md",
    "./content/scenes.json",
    "./content/sfx-map.json",
    "./content/store-listing.zh-TW.json",
    "./content/story-arcs.json",
    "./content/telemetry.json",
    "./content/timeline.json",
    "./src/js/assessment/runner.js",
    "./src/js/audio/mixer.js",
    "./src/js/audio/music.js",
    "./src/js/audio/scene-music.js",
    "./src/js/audio/sfx.js",
    "./src/js/audio/voice.js",
    "./src/js/core/config.js",
    "./src/js/core/consent.js",
    "./src/js/core/daily.js",
    "./src/js/core/dex.js",
    "./src/js/core/entitlements.js",
    "./src/js/core/events.js",
    "./src/js/core/mastery.js",
    "./src/js/core/parental-gate.js",
    "./src/js/core/performance.js",
    "./src/js/core/progress.js",
    "./src/js/core/referral.js",
    "./src/js/core/session.js",
    "./src/js/core/state.js",
    "./src/js/core/storage.js",
    "./src/js/core/telemetry.js",
    "./src/js/core/timeline.js",
    "./src/js/core/verb-contract.js",
    "./src/js/core/verbs.js",
    "./src/js/data/characters.js",
    "./src/js/data/items.js",
    "./src/js/data/levels.js",
    "./src/js/data/load-content.js",
    "./src/js/data/story.js",
    "./src/js/main.js",
    "./src/js/ui/a11y.js",
    "./src/js/ui/assessment-ui.js",
    "./src/js/ui/character-render.js",
    "./src/js/ui/consent-gate.js",
    "./src/js/ui/dex.js",
    "./src/js/ui/haptics.js",
    "./src/js/ui/hud.js",
    "./src/js/ui/levelmap.js",
    "./src/js/ui/motion.js",
    "./src/js/ui/parallax.js",
    "./src/js/ui/parent-report.js",
    "./src/js/ui/particles.js",
    "./src/js/ui/paywall.js",
    "./src/js/ui/settings-audio.js",
    "./src/js/ui/share-card.js",
    "./src/js/ui/story.js",
    "./src/js/ui/team-dock.js",
    "./src/js/ui/tutorial.js",
    "./src/js/ui/weather.js",
    "./src/js/verbs/auditory.js",
    "./src/js/verbs/index.js",
    "./src/js/verbs/memory.js",
    "./src/js/verbs/puzzle.js",
    "./src/styles/a11y.css",
    "./src/styles/base.css",
    "./src/styles/components.css",
    "./src/styles/motion.css",
    "./src/styles/responsive.css",
    "./src/styles/tokens.css",
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
