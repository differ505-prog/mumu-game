/**
 * 可玩性測試骨架 — 以 jsdom 建立可執行的遊戲環境。
 *
 * 匯出：
 *   createGameEnv({ locale })  建立 jsdom 環境（載入 index.html、注入 fetch、
 *                             stub Web Audio / SpeechSynthesis / matchMedia / localStorage）
 *   bootGame(env)              執行 main.js 的 boot()，回傳 { errors, warnings }
 *   clickStart(env)            模擬點擊開始畫面
 *   advanceTutorial(env)       完成教學（依 env 的教學策略）
 *   pickCharacter(env, id)     選擇角色
 *   openLevelMap(env)          開啟關卡地圖
 *   startLevel(env, id)        進入指定關卡
 *   answerRound(env, input)    作答一個回合（input 可為 id 或 { pieceIndex, targetIndex } 等物件）
 *   currentState(env)          讀取目前回合狀態（phase / locked / round / score）
 *   advanceTimers(env, ms)     推進 fake timers
 *   resetEnv(env)              重置 localStorage 與 DOM（供測試之間隔離）
 *
 * 規範（Step 109）：
 *   - **不得** import `src/js/main.js` 的私有狀態；所有操作以 DOM 與公開事件為準。
 *   - **不得**使用真實 `setTimeout` 等待；一律以 fake timers 推進。
 *   - 每個測試前必須清空 `localStorage`。
 *   - **不得**新增 jsdom 以外的任何 devDependency。
 */

import { JSDOM, VirtualConsole } from "jsdom";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const INDEX_HTML = path.join(ROOT, "index.html");
const MAIN_MODULE = path.join(ROOT, "src/js/main.js");

/** 進度存檔 key（與 core/progress.js 一致）。 */
const SAVE_KEY = "mumu.progress.v2";

/** 所有關卡 id（供測試預先解鎖）。 */
const ALL_LEVELS = Array.from({ length: 40 }, (_, i) => i + 1);

/* ------------------------------------------------------------------ */
/* 等待工具                                                            */
/* ------------------------------------------------------------------ */

/**
 * 讓事件迴圈（microtask + macrotask）跑完，讓 async 流程得以推進。
 * @param {number} [times]
 */
export async function flush(times = 25) {
    for (let i = 0; i < times; i++) {
        await new Promise((resolve) => setImmediate(resolve));
    }
}

/* ------------------------------------------------------------------ */
/* Fake timers                                                         */
/* ------------------------------------------------------------------ */

/**
 * 建立 fake clock — 取代視窗內的 setTimeout／setInterval／requestAnimationFrame。
 *
 * 測試**不得**等待真實時間；一律以 `advanceTimers()` 手動推進。
 * @param {(err:any) => void} onError
 */
function createClock(onError) {
    let now = 0;
    let seq = 0;
    /** @type {Map<number, any>} */
    const timers = new Map();

    /** @type {any} */
    const clock = {
        get now() {
            return now;
        },
        setTimeout(fn, delay = 0, ...args) {
            const id = ++seq;
            timers.set(id, {
                id,
                time: now + Math.max(0, Number(delay) || 0),
                fn,
                args,
                interval: null
            });
            return id;
        },
        clearTimeout(id) {
            timers.delete(id);
        },
        setInterval(fn, delay = 0, ...args) {
            const id = ++seq;
            const period = Math.max(1, Number(delay) || 1);
            timers.set(id, { id, time: now + period, fn, args, interval: period });
            return id;
        },
        clearInterval(id) {
            timers.delete(id);
        },
        requestAnimationFrame(fn) {
            return clock.setTimeout(() => fn(now), 16);
        },
        cancelAnimationFrame(id) {
            clock.clearTimeout(id);
        },
        pending() {
            return timers.size;
        },
        /**
         * 推進時間並執行到期回呼。
         * @param {number} ms
         */
        async advance(ms) {
            const target = now + Math.max(0, Number(ms) || 0);
            for (;;) {
                /** @type {any} */
                let next = null;
                for (const t of timers.values()) {
                    if (t.time > target) continue;
                    if (!next || t.time < next.time || (t.time === next.time && t.id < next.id)) next = t;
                }
                if (!next) break;

                now = next.time;
                if (next.interval) {
                    next.time = now + next.interval;
                } else {
                    timers.delete(next.id);
                }
                try {
                    next.fn(...next.args);
                } catch (err) {
                    onError(err);
                }
                await flush(6);
            }
            now = target;
            await flush(6);
        }
    };

    return clock;
}

/* ------------------------------------------------------------------ */
/* 瀏覽器 API stub                                                     */
/* ------------------------------------------------------------------ */

/**
 * 建立一個可連線的音訊節點。
 * @param {Record<string, any>} [extra]
 */
function audioNode(extra = {}) {
    return {
        connect() {
            return this;
        },
        disconnect() { },
        ...extra
    };
}

/**
 * 建立可被排程的音訊參數。
 * @param {number} value
 */
function audioParam(value = 0) {
    return {
        value,
        setValueAtTime() { return this; },
        exponentialRampToValueAtTime() { return this; },
        linearRampToValueAtTime() { return this; },
        cancelScheduledValues() { return this; },
        setTargetAtTime() { return this; }
    };
}

/**
 * 建立 AudioContext stub（涵蓋 mixer／sfx／music／scene-music 所需節點）。
 * @param {() => number} nowSeconds
 */
function createAudioContextStub(nowSeconds) {
    class AudioContextStub {
        constructor() {
            /** @type {any} */
            this.destination = audioNode();
            this.sampleRate = 48000;
            this.state = "running";
            this.currentTime = 0;
        }
        get currentTime() {
            return nowSeconds();
        }
        set currentTime(v) {
            void v;
        }
        createGain() {
            return audioNode({ gain: audioParam(1) });
        }
        createBufferSource() {
            return audioNode({ buffer: null, loop: false, loopStart: 0, loopEnd: 0, playbackRate: audioParam(1), start() { }, stop() { } });
        }
        createOscillator() {
            return audioNode({
                type: "sine",
                frequency: audioParam(440),
                detune: audioParam(0),
                start() { },
                stop() { }
            });
        }
        createBuffer(channels, length, sampleRate) {
            const data = [];
            for (let i = 0; i < channels; i++) data.push(new Float32Array(length));
            return {
                numberOfChannels: channels,
                length,
                sampleRate,
                duration: sampleRate ? length / sampleRate : 0,
                getChannelData(i) {
                    return data[i] || data[0];
                }
            };
        }
        createBiquadFilter() {
            return audioNode({ type: "lowpass", frequency: audioParam(800), Q: audioParam(1), gain: audioParam(0) });
        }
        createStereoPanner() {
            return audioNode({ pan: audioParam(0) });
        }
        createDynamicsCompressor() {
            return audioNode({
                threshold: audioParam(-24),
                knee: audioParam(30),
                ratio: audioParam(12),
                attack: audioParam(0.003),
                release: audioParam(0.25),
                reduction: 0
            });
        }
        createDelay() {
            return audioNode({ delayTime: audioParam(0) });
        }
        createAnalyser() {
            return audioNode({
                fftSize: 2048,
                frequencyBinCount: 1024,
                getByteFrequencyData() { },
                getFloatFrequencyData() { }
            });
        }
        createMediaElementSource(el) {
            return audioNode({ mediaElement: el });
        }
        createMediaStreamDestination() {
            return audioNode({ stream: null });
        }
        resume() {
            this.state = "running";
            return Promise.resolve();
        }
        suspend() {
            this.state = "suspended";
            return Promise.resolve();
        }
        close() {
            this.state = "closed";
            return Promise.resolve();
        }
    }

    class OfflineAudioContextStub extends AudioContextStub {
        constructor(channels = 1, length = 1, sampleRate = 48000) {
            super();
            this.numberOfChannels = channels;
            this.length = length;
            this.sampleRate = sampleRate;
        }
        startRendering() {
            return Promise.resolve(this.createBuffer(this.numberOfChannels, this.length, this.sampleRate));
        }
    }

    return { AudioContextStub, OfflineAudioContextStub };
}

/**
 * 建立 2D canvas context stub。
 *
 * 需涵蓋：share-card／particles／puzzle／scene-music 會呼叫的所有繪圖 API。
 */
function createCanvasContextStub() {
    const gradient = { addColorStop() { } };
    return {
        canvas: null,
        fillStyle: "#000",
        strokeStyle: "#000",
        lineWidth: 1,
        font: "10px sans-serif",
        textAlign: "start",
        textBaseline: "alphabetic",
        globalAlpha: 1,
        globalCompositeOperation: "source-over",
        lineCap: "butt",
        lineJoin: "miter",
        shadowBlur: 0,
        shadowColor: "transparent",
        imageSmoothingEnabled: true,
        save() { },
        restore() { },
        scale() { },
        rotate() { },
        translate() { },
        transform() { },
        setTransform() { },
        resetTransform() { },
        beginPath() { },
        closePath() { },
        moveTo() { },
        lineTo() { },
        bezierCurveTo() { },
        quadraticCurveTo() { },
        arc() { },
        arcTo() { },
        ellipse() { },
        rect() { },
        clip() { },
        fill() { },
        stroke() { },
        clearRect() { },
        fillRect() { },
        strokeRect() { },
        fillText() { },
        strokeText() { },
        drawImage() { },
        createLinearGradient() {
            return gradient;
        },
        createRadialGradient() {
            return gradient;
        },
        createPattern() {
            return null;
        },
        measureText(text) {
            const width = String(text || "").length * 8;
            return { width, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 };
        },
        getImageData(x, y, w, h) {
            return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h };
        },
        putImageData() { },
        createImageData(w, h) {
            return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h };
        }
    };
}

/**
 * 建立 SpeechSynthesis stub。
 */
function createSpeechStub() {
    class UtteranceStub {
        /** @param {string} text */
        constructor(text) {
            this.text = text;
            this.lang = "";
            this.pitch = 1;
            this.rate = 1;
            this.volume = 1;
            this.voice = null;
            this.onend = null;
            this.onerror = null;
            this.onstart = null;
        }
    }

    const synth = {
        speaking: false,
        pending: false,
        paused: false,
        speak(utterance) {
            this.speaking = true;
            try {
                utterance?.onstart?.();
                utterance?.onend?.();
            } catch {
                // stub 內的錯誤不應影響測試主流程
            }
            this.speaking = false;
        },
        cancel() {
            this.speaking = false;
        },
        pause() {
            this.paused = true;
        },
        resume() {
            this.paused = false;
        },
        getVoices() {
            return [];
        },
        addEventListener() { },
        removeEventListener() { }
    };

    return { synth, UtteranceStub };
}

/**
 * 安裝所有瀏覽器 API stub。
 * @param {any} w jsdom window
 * @param {() => number} nowSeconds
 * @param {(err:any) => void} onError
 */
function installStubs(w, nowSeconds, onError) {
    // ── Web Audio ──────────────────────────────────────────────
    const { AudioContextStub, OfflineAudioContextStub } = createAudioContextStub(nowSeconds);
    w.AudioContext = AudioContextStub;
    w.webkitAudioContext = AudioContextStub;
    w.OfflineAudioContext = OfflineAudioContextStub;

    // ── 語音 ──────────────────────────────────────────────────
    const { synth, UtteranceStub } = createSpeechStub();
    w.speechSynthesis = synth;
    w.SpeechSynthesisUtterance = UtteranceStub;

    // ── matchMedia ────────────────────────────────────────────
    w.matchMedia = (query) => ({
        media: String(query || ""),
        matches: false,
        onchange: null,
        addListener() { },
        removeListener() { },
        addEventListener() { },
        removeEventListener() { },
        dispatchEvent() {
            return false;
        }
    });

    // ── Canvas ────────────────────────────────────────────────
    const ctx2d = createCanvasContextStub();
    w.HTMLCanvasElement.prototype.getContext = function getContext() {
        ctx2d.canvas = this;
        return ctx2d;
    };
    w.HTMLCanvasElement.prototype.toDataURL = function toDataURL() {
        return "data:image/png;base64,iVBORw0KGgo=";
    };

    // ── Image（src 設定後於 microtask 觸發 onload）─────────────
    class ImageStub {
        constructor() {
            this.onload = null;
            this.onerror = null;
            this.complete = false;
            this.width = 512;
            this.height = 512;
            this.naturalWidth = 512;
            this.naturalHeight = 512;
            this._src = "";
        }
        get src() {
            return this._src;
        }
        set src(value) {
            this._src = String(value || "");
            this.complete = true;
            queueMicrotask(() => {
                try {
                    this.onload?.({ type: "load", target: this });
                } catch (err) {
                    onError(err);
                }
            });
        }
        addEventListener() { }
        removeEventListener() { }
    }
    w.Image = ImageStub;

    // ── HTMLAudioElement（jsdom 不實作 play）──────────────────
    class AudioStub {
        /** @param {string} src */
        constructor(src) {
            this.src = src;
            this.currentTime = 0;
            this.duration = 0;
            this.paused = true;
            this.loop = false;
            this.crossOrigin = null;
            this.preload = "none";
        }
        play() {
            this.paused = false;
            return Promise.resolve();
        }
        pause() {
            this.paused = true;
        }
        addEventListener() { }
        removeEventListener() { }
    }
    w.Audio = AudioStub;

    // ── performance.now（配合 fake clock）─────────────────────
    try {
        Object.defineProperty(w, "performance", {
            configurable: true,
            writable: true,
            value: { now: () => 0, timeOrigin: 0 }
        });
    } catch {
        // 部分 jsdom 版本 performance 不可覆寫，忽略即可
    }

    // ── 觸覺回饋（jsdom 無 vibrate）───────────────────────────
    try {
        if (w.navigator && !("vibrate" in w.navigator)) {
            w.navigator.vibrate = () => true;
        }
    } catch {
        // navigator 唯讀時忽略
    }
}

/* ------------------------------------------------------------------ */
/* fetch stub                                                          */
/* ------------------------------------------------------------------ */

/**
 * 建立 fetch stub：攔截 `./content/*.json`，直接讀本機磁碟檔案。
 * @param {string} root 專案根目錄
 */
function createFetchStub(root) {
    return async function fetchStub(input) {
        const raw = String(input || "");
        const rel = raw.replace(/^\.\//, "").split("?")[0];
        const file = path.join(root, rel);
        if (rel.startsWith("content/") && fs.existsSync(file)) {
            const text = fs.readFileSync(file, "utf8");
            return {
                ok: true,
                status: 200,
                url: raw,
                async json() {
                    return JSON.parse(text);
                },
                async text() {
                    return text;
                }
            };
        }
        return {
            ok: false,
            status: 404,
            url: raw,
            async json() {
                throw new Error(`[fetch-stub] 找不到內容: ${raw}`);
            },
            async text() {
                return "";
            }
        };
    };
}

/* ------------------------------------------------------------------ */
/* 環境建立                                                            */
/* ------------------------------------------------------------------ */

/**
 * 建立預先解鎖的進度存檔（讓測試可進入任一關卡）。
 * @param {number[]} unlocked
 */
function seedProgress(unlocked) {
    return {
        schemaVersion: 2,
        stars: {},
        unlockedLevels: unlocked,
        unlockedDex: [],
        learningSamples: [],
        mastery: {},
        streak: { count: 0, lastDate: "" },
        dailyDate: "",
        settings: {},
        referralCode: "TEST0",
        bestCombo: 0,
        medals: [],
        assessmentRuns: [],
        totalSessionMs: 0
    };
}

/**
 * 建立一個 jsdom 遊戲環境（尚未啟動）。
 *
 * @param {{ locale?: string, unlockAllLevels?: boolean, applyDomFixture?: boolean }} [options]
 */
export function createGameEnv(options = {}) {
    const locale = options.locale || "zh-TW";
    const unlockAllLevels = options.unlockAllLevels !== false;
    const applyDomFixture = options.applyDomFixture !== false;

    const html = fs.readFileSync(INDEX_HTML, "utf8");

    /** @type {any} */
    const env = {
        locale,
        errors: [],
        warnings: [],
        consoleErrors: [],
        window: null,
        document: null,
        context: null,
        clock: null,
        moduleCache: new Map(),
        handlers: []
    };

    /**
     * 記錄錯誤。
     * @param {any} err
     */
    const onError = (err) => {
        const message = err?.stack || err?.message || String(err);
        env.errors.push(message);
    };
    env.onError = onError;

    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", (...args) => {
        env.consoleErrors.push(args.map(String).join(" "));
    });
    virtualConsole.on("warn", (...args) => {
        env.warnings.push(args.map(String).join(" "));
    });
    virtualConsole.on("jsdomError", (err) => {
        const message = err?.message || String(err);
        // jsdom 未實作的 API（與本專案無關者）不視為遊戲錯誤
        if (/Not implemented/.test(message)) return;
        env.errors.push(message);
    });

    const dom = new JSDOM(html, {
        url: "http://localhost/",
        referrer: "http://localhost/",
        contentType: "text/html",
        pretendToBeVisual: true,
        virtualConsole
    });

    const w = dom.window;
    env.window = w;
    env.document = w.document;
    env.close = () => {
        try {
            w.close();
        } catch {
            // 已關閉時忽略
        }
    };

    // ── DOM 契約修補（見 docs/notes/step-109.md）────────────────
    // index.html 把 #bubble / #bubble-content 放在 #santa-container 內，
    // 但 renderCharacter() 會以 innerHTML 覆寫 #santa-container，
    // 導致序章信件（showLetter）在第一次點擊時拋出 TypeError，整條導航就此中斷。
    // 該缺陷屬 Step 115／118 的修復範圍；Step 109 只建立守門，不得修改 src/。
    // 因此守門在測試環境中把 #bubble 搬到 #game-container 底下，
    // 讓「按真實路徑玩到回合」這件事可被驗證；
    // 同時以 `play-dom-contract` 檢查項**主動回報這個缺陷**，不得掩蓋。
    env.domFixture = [];
    try {
        const bubble = w.document.getElementById("bubble");
        const content = w.document.getElementById("bubble-content");
        const container = w.document.getElementById("santa-container");
        if (bubble && content && container) {
            env.bubbleOriginallyInsideCharacter = true;
            if (applyDomFixture) {
                const game = w.document.getElementById("game-container");
                (game || w.document.body).appendChild(bubble);
                env.domFixture.push("#bubble relocated out of #santa-container");
            }
        }
    } catch {
        // DOM 契約修補失敗時忽略（後續檢查會如實回報）
    }

    // ── fake clock 注入視窗 ───────────────────────────────────
    const clock = createClock(onError);
    env.clock = clock;
    w.setTimeout = clock.setTimeout;
    w.clearTimeout = clock.clearTimeout;
    w.setInterval = clock.setInterval;
    w.clearInterval = clock.clearInterval;
    w.requestAnimationFrame = clock.requestAnimationFrame;
    w.cancelAnimationFrame = clock.cancelAnimationFrame;

    installStubs(w, () => clock.now / 1000, onError);

    // ── fetch stub ────────────────────────────────────────────
    w.fetch = createFetchStub(ROOT);

    // ── 權益 stub（讓測試可進入付費章節）────────────────────
    w.__mumuEntitlements = { getEntitlement: () => "premium" };

    // ── localStorage 預備（每個測試前必須清空）──────────────
    try {
        w.localStorage.clear();
        w.localStorage.setItem("mumu.locale", locale);
        if (unlockAllLevels) {
            w.localStorage.setItem(SAVE_KEY, JSON.stringify(seedProgress(ALL_LEVELS)));
        }
    } catch {
        // localStorage 不可用時忽略（後續測試會自然失敗）
    }

    // ── vm context（讓遊戲程式碼在 jsdom 的全域中執行）──────
    env.context = vm.createContext(w);

    // ── 程序級錯誤攔截（vm 內的未捕捉例外）─────────────────
    /** @param {any} err */
    const onUncaught = (err) => {
        env.errors.push(err?.stack || err?.message || String(err));
    };
    process.on("uncaughtException", onUncaught);
    process.on("unhandledRejection", onUncaught);
    env.handlers.push(() => {
        process.removeListener("uncaughtException", onUncaught);
        process.removeListener("unhandledRejection", onUncaught);
    });

    /**
     * 訂閱遊戲事件（透過 core/events.js 的公開 API）。
     * @param {string} type
     * @param {(payload:any) => void} cb
     */
    env.onEvent = (type, cb) => onGameEvent(env, type, cb);

    /**
     * 取得已載入模組的公開命名空間（僅限公開匯出）。
     * @param {string} relPath
     */
    env.getModule = (relPath) => moduleNamespace(env, relPath);

    /**
     * 載入額外模組（守門需要檢查非由 main.js 引入的模組時使用）。
     * @param {string} relPath
     */
    env.loadModule = (relPath) => loadExtraModule(env, relPath);

    /**
     * 取得目前回合的引擎（session 的公開 getter）。
     */
    env.getEngine = () => env.engine || null;

    return env;
}

/**
 * 釋放環境資源。
 * @param {any} env
 */
export function disposeEnv(env) {
    for (const off of env.handlers || []) {
        try {
            off();
        } catch {
            // 忽略
        }
    }
    env.handlers = [];
    env.close?.();
}

/* ------------------------------------------------------------------ */
/* 模組載入                                                            */
/* ------------------------------------------------------------------ */

/**
 * 載入並執行遊戲模組（main.js 及其依賴）。
 *
 * 使用 `vm.SourceTextModule` 於 jsdom 的全域中執行，
 * 確保每一個測試環境都有**獨立**的模組狀態（避免跨測試污染）。
 *
 * @param {any} env
 * @param {string} [entry]
 */
async function loadGameModules(env, entry = MAIN_MODULE) {
    const context = env.context;

    /**
     * @param {string} abs 絕對路徑
     */
    const load = async (abs) => {
        const cached = env.moduleCache.get(abs);
        if (cached) return cached;
        const source = fs.readFileSync(abs, "utf8");
        const mod = new vm.SourceTextModule(source, {
            context,
            identifier: abs,
            initializeImportMeta(meta) {
                meta.url = `file://${abs}`;
            }
        });
        env.moduleCache.set(abs, mod);
        return mod;
    };

    /**
     * @param {string} specifier
     * @param {any} referencing
     */
    const linker = async (specifier, referencing) => {
        const resolved = path.resolve(path.dirname(referencing.identifier), specifier);
        return load(resolved);
    };

    const root = await load(entry);
    await root.link(linker);
    await root.evaluate();
    await flush(30);
    return root;
}

/**
 * 取得已載入模組的公開命名空間（僅限公開匯出）。
 * @param {any} env
 * @param {string} relPath 相對於專案根目錄的路徑
 */
export function moduleNamespace(env, relPath) {
    const abs = path.join(ROOT, relPath);
    return env.moduleCache.get(abs)?.namespace;
}

/**
 * 載入一個額外的模組（守門需要檢查非由 main.js 引入的模組時使用）。
 *
 * @param {any} env
 * @param {string} relPath 相對於專案根目錄的路徑
 */
export async function loadExtraModule(env, relPath) {
    const abs = path.join(ROOT, relPath);
    const cached = env.moduleCache.get(abs);
    if (cached) {
        if (cached.status === "evaluated") return cached.namespace;
    }

    const source = fs.readFileSync(abs, "utf8");
    const mod = new vm.SourceTextModule(source, {
        context: env.context,
        identifier: abs,
        initializeImportMeta(meta) {
            meta.url = `file://${abs}`;
        }
    });
    env.moduleCache.set(abs, mod);

    await mod.link(async (specifier, referencing) => {
        const resolved = path.resolve(path.dirname(referencing.identifier), specifier);
        const dep = env.moduleCache.get(resolved);
        if (dep) return dep;
        return loadExtraModuleModule(env, resolved);
    });
    await mod.evaluate();
    return mod.namespace;
}

/**
 * 以絕對路徑載入模組（供 link 回调使用）。
 * @param {any} env
 * @param {string} abs
 */
async function loadExtraModuleModule(env, abs) {
    const source = fs.readFileSync(abs, "utf8");
    const mod = new vm.SourceTextModule(source, {
        context: env.context,
        identifier: abs,
        initializeImportMeta(meta) {
            meta.url = `file://${abs}`;
        }
    });
    env.moduleCache.set(abs, mod);
    await mod.link(async (specifier, referencing) => {
        const resolved = path.resolve(path.dirname(referencing.identifier), specifier);
        const dep = env.moduleCache.get(resolved);
        if (dep) return dep;
        return loadExtraModuleModule(env, resolved);
    });
    await mod.evaluate();
    return mod;
}

/**
 * 訂閱遊戲事件（透過 core/events.js 的公開 API）。
 * @param {any} env
 * @param {string} type
 * @param {(payload:any) => void} cb
 */
export function onGameEvent(env, type, cb) {
    const ns = moduleNamespace(env, "src/js/core/events.js");
    if (!ns || typeof ns.on !== "function") return () => { };
    return ns.on(type, (/** @type {any} */ event) => cb(event?.payload));
}

/* ------------------------------------------------------------------ */
/* 遊戲操作                                                            */
/* ------------------------------------------------------------------ */

/**
 * 執行 main.js 的 boot()。
 * @param {any} env
 * @returns {Promise<{ errors: string[], warnings: string[] }>}
 */
export async function bootGame(env) {
    await loadGameModules(env, MAIN_MODULE);
    await flush(30);
    return { errors: env.errors, warnings: env.warnings };
}

/**
 * 以 DOM 事件模擬點擊。
 * @param {any} env
 * @param {any} el
 */
export function clickElement(env, el) {
    if (!el) return false;
    const MouseEventCtor = env.window.MouseEvent;
    el.dispatchEvent(new MouseEventCtor("click", {
        bubbles: true,
        cancelable: true,
        view: env.window
    }));
    return true;
}

/**
 * 模擬點擊開始畫面。
 * @param {any} env
 */
export async function clickStart(env) {
    const overlay = env.document.getElementById("start-overlay");
    clickElement(env, overlay);
    await flush(20);
    return Boolean(overlay);
}

/**
 * 完成教學。
 *
 * 教學策略：逐步點擊該步驟的主要動作按鈕；若某一步無法推進（教學卡死），
 * 則記錄 `stuck` 並改用「跳過」按鈕作為後備，**不**偽裝成已完成。
 *
 * `shown` 記錄教學是否**真的出現過** —— 若教學從未顯示（例如被提前跳過），
 * 回傳 `ok: false, stuck: true`，由檢查項如實回報缺陷。
 *
 * @param {any} env
 * @returns {Promise<{ ok: boolean, stuck: boolean, skipped: boolean, shown: boolean, steps: string[] }>}
 */
export async function advanceTutorial(env) {
    const doc = env.document;
    const root = doc.getElementById("tutorial-root");
    const result = { ok: false, stuck: false, skipped: false, shown: false, steps: [] };

    if (!root) return result;

    for (let i = 0; i < 8; i++) {
        const visible = !root.classList.contains("hidden");
        if (visible) result.shown = true;

        if (root.classList.contains("hidden")) {
            // 教學已離開畫面：若從未顯示過 → 視為教學未出現（缺陷）
            result.ok = result.shown;
            result.stuck = !result.shown;
            return result;
        }

        const panel = root.querySelector(".tutorial");
        const step = panel?.dataset?.step || "";
        result.steps.push(step);

        const action = step === "listen"
            ? root.querySelector("#tut-listen")
            : step === "watch"
                ? root.querySelector("#tut-watch")
                : root.querySelector("[data-tut-option]");

        if (!action) break;

        const before = panel?.dataset?.step;
        clickElement(env, action);
        await env.clock.advance(900);
        const after = root.querySelector(".tutorial")?.dataset?.step;
        if (after === before) {
            // 該步驟無法推進 → 教學卡死
            result.stuck = true;
            break;
        }
    }

    if (!result.ok && !root.classList.contains("hidden")) {
        // 後備：使用「跳過」離開教學（但仍記錄卡死）
        clickElement(env, root.querySelector("#tut-skip"));
        await env.clock.advance(50);
        result.skipped = true;
        result.ok = result.shown && root.classList.contains("hidden");
    }

    return result;
}

/**
 * 選擇角色。
 * @param {any} env
 * @param {string} id
 */
export async function pickCharacter(env, id = "santa") {
    const btn = env.document.querySelector(`#character-options [data-character="${id}"]`);
    clickElement(env, btn);
    await flush(15);
    return Boolean(btn);
}

/**
 * 開啟關卡地圖。
 * @param {any} env
 */
export async function openLevelMap(env) {
    const root = env.document.getElementById("levelmap-root");
    if (!root) return false;
    if (root.classList.contains("hidden")) {
        // 若角色選擇尚未完成，先走完流程
        const overlay = env.document.getElementById("character-select-overlay");
        if (overlay && !overlay.classList.contains("hidden")) {
            await pickCharacter(env, "santa");
        }
    }
    await flush(15);
    return !root.classList.contains("hidden");
}

/**
 * 進入指定關卡。
 * @param {any} env
 * @param {number} id
 */
export async function startLevel(env, id) {
    const btn = env.document.querySelector(`#levelmap-root [data-level="${id}"]`);
    if (!btn) return false;
    clickElement(env, btn);
    await flush(20);
    return true;
}

/**
 * 作答一個回合。
 *
 * @param {any} env
 * @param {string|{ slot?:number, pieceIndex?:number, targetIndex?:number }} input
 * @returns {Promise<boolean>} 是否真的送出作答
 */
export async function answerRound(env, input) {
    const controls = env.document.getElementById("controls-view");
    if (!controls) return false;

    if (typeof input === "object" && input) {
        if (typeof input.slot === "number") {
            const card = controls.querySelector(`[data-slot="${input.slot}"]`);
            clickElement(env, card);
            await env.clock.advance(900);
            return Boolean(card);
        }
        if (typeof input.pieceIndex === "number") {
            const piece = controls.querySelector(`[data-piece-index="${input.pieceIndex}"]`);
            if (!piece) return false;
            clickElement(env, piece);
            await flush(10);
            const target = controls.querySelector(`[data-target-index="${input.targetIndex}"]`);
            if (!target) return false;
            clickElement(env, target);
            await env.clock.advance(200);
            return true;
        }
        return false;
    }

    const id = String(input);
    const btn = controls.querySelector(`[data-item="${id}"]`);
    if (!btn) return false;
    clickElement(env, btn);
    await env.clock.advance(100);
    return true;
}

/**
 * 讀取目前回合狀態。
 *
 * 以 `core/state.js` 的公開匯出為準（僅讀取，不修改）。
 * @param {any} env
 */
export function currentState(env) {
    const ns = moduleNamespace(env, "src/js/core/state.js");
    const s = ns?.state || {};
    return {
        phase: s.phase,
        locked: s.locked,
        round: s.round,
        score: s.score,
        level: s.level,
        verb: s.verb,
        combo: s.combo,
        sequence: Array.isArray(s.sequence) ? [...s.sequence] : []
    };
}

/**
 * 取得目前回合的引擎（若 session 已公開）。
 * @param {any} env
 */
export function currentEngine(env) {
    const ns = moduleNamespace(env, "src/js/core/session.js");
    void ns;
    return env.engine || null;
}

/**
 * 推進 fake timers。
 * @param {any} env
 * @param {number} ms
 */
export async function advanceTimers(env, ms) {
    await env.clock.advance(ms);
}

/**
 * 等待某個條件成立（以 fake clock 推進）。
 *
 * @param {any} env
 * @param {() => boolean} predicate
 * @param {{ timeoutMs?: number, stepMs?: number }} [options]
 */
export async function waitFor(env, predicate, options = {}) {
    const timeoutMs = options.timeoutMs ?? 15000;
    const stepMs = options.stepMs ?? 100;
    let waited = 0;
    while (waited < timeoutMs) {
        if (predicate()) return true;
        await env.clock.advance(stepMs);
        waited += stepMs;
    }
    return predicate();
}

/**
 * 重置環境（清空 localStorage、重建 DOM、重啟遊戲）。
 *
 * 每個測試之間必須呼叫，以確保互不污染。
 * @param {any} env
 */
export async function resetEnv(env) {
    const locale = env.locale;
    disposeEnv(env);
    const fresh = createGameEnv({ locale });
    for (const key of Object.keys(env)) {
        env[key] = fresh[key];
    }
    return bootGame(env);
}

/**
 * 開一個全新環境並直接進入指定關卡。
 *
 * 每個關卡都用**獨立環境**——關卡地圖在進入遊戲後會隱藏，
 * 沒有公開的「回到地圖」路徑，因此要測另一關必須重新導航。
 *
 * @param {number} levelId
 * @returns {Promise<any>}
 */
export async function openLevel(levelId) {
    const env = createGameEnv({ locale: "zh-TW" });
    await bootGame(env);
    await clickStart(env);
    await env.clock.advance(3000);
    await advanceTutorial(env);
    await pickCharacter(env, "santa");
    await startLevel(env, levelId);
    await env.clock.advance(3000);
    return env;
}

/**
 * 一次完成「開始 → 教學 → 角色 → 地圖」的完整導航。
 * @param {any} env
 */
export async function navigateToLevelMap(env) {
    await clickStart(env);
    await env.clock.advance(3000);
    await advanceTutorial(env);
    await pickCharacter(env, "santa");
    await flush(15);
    return !env.document.getElementById("levelmap-root").classList.contains("hidden");
}
