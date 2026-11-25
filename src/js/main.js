/**
 * 主流程 — 載入內容 → 序章 → 角色選擇 → 關卡地圖 → 回合 → 結算。
 */

import { loadContent } from "./data/load-content.js";
import { getLevel } from "./data/levels.js";
import { playableCharacters, getAnyCharacter, anyCharacterVoice } from "./data/characters.js";
import { chapterTitle, pickLine } from "./data/story.js";
import { loadPerformances as injectPerformances, loadNarrative, applySceneCast } from "./core/performance.js";
import { createSession } from "./core/session.js";
import { createVerbForLevel } from "./verbs/index.js";
import { state, setState } from "./core/state.js";
import { on } from "./core/events.js";
import { setTimeline, play as playTimeline } from "./core/timeline.js";
import { ensureAudio } from "./audio/mixer.js";
import { speak, setVoiceProfile, getVoiceState, setSpeechEnabled } from "./audio/voice.js";
import { playSfx, playDinoRoar, setSfxMap } from "./audio/sfx.js";
import { createHud } from "./ui/hud.js";
import { renderCharacter, playRoar, playHatch, playUnlock, playComplete, lookAt } from "./ui/character-render.js";
import { haptic } from "./ui/haptics.js";
import { burst, startAmbientSnow, startAmbientWeather } from "./ui/particles.js";
import { animate } from "./ui/motion.js";
import { APP } from "./core/config.js";
import { verbLabel, verbById } from "./core/verbs.js";
import { renderLevelMap } from "./ui/levelmap.js";
import { renderDex } from "./ui/dex.js";
import { renderTeamDock } from "./ui/team-dock.js";
import { renderParentReport } from "./ui/parent-report.js";
import { runAssessment, nextPhase } from "./ui/assessment-ui.js";
import { createAudioSettings } from "./ui/settings-audio.js";
import { createPreferencesPanel, applyPreferences, showVisualFallback, hideVisualFallback, getPreferences } from "./ui/a11y.js";
import { createTutorial } from "./ui/tutorial.js";
import { showLetter as showLetterScene, showStoryScene } from "./ui/story.js";
import { showPaywall } from "./ui/paywall.js";
import { buildShareCard, shareToLine } from "./ui/share-card.js";
import { loadProgress, saveProgress, recordLevelResult, unlockDex, updateStreak, todayString } from "./core/progress.js";
import { recordLearningSample, checkDexUnlock, setChildVoice, childVoice } from "./core/dex.js";
import { requireParentalGate } from "./core/parental-gate.js";
import { requireConsent, openConsentSettings, openLegalDocument } from "./ui/consent-gate.js";
import { track, trackShare, flush as flushTelemetry } from "./core/telemetry.js";
import { referralCode, consumeReferral } from "./core/referral.js";
import { createMasteryEntry, updateMastery } from "./core/mastery.js";
import { buildScene, setParallax, applyTheme, setScenePalettes } from "./ui/parallax.js";
import { setMusicMap, playMusic, stopMusic, playSceneMusic, stopSceneMusic, hasSceneMusic } from "./audio/music.js";
import { showOfflineNotice, hideOfflineNotice } from "./ui/weather.js";
import {
    feedbackCorrect,
    feedbackStep,
    feedbackWrong,
    feedbackLevelComplete
} from "./ui/round-feedback.js";
import { safeText, escapeHtml } from "./core/sanitize-html.js";
import { safeReferralCode } from "./core/input-validate.js";
import { initVitals, trackFirstInteraction, reportVitals } from "./core/vitals.js";
import { initPwaInstall, showInstallGuide } from "./ui/pwa-install.js";

/** @type {any} */
let bundle = null;
/** @type {string} */
let locale = "zh-TW";
/** @type {any} */
let hud = null;
/** @type {any} */
let session = null;
/** @type {string} */
let selectedCharacter = "santa";
/** 遊戲是否已啟動（F7：`startGame` 只能執行一次）。 @type {boolean} */
let started = false;

/**
 * 遮罩堆疊（F8）。
 *
 * 每一層的返回**必須記錄來源**，不得假設「上一層永遠是某個畫面」。
 * @type {string[]}
 */
const overlayStack = [];

/**
 * 家長閘門是否已於本次 session 通過。
 * @type {boolean}
 */
let parentGatePassed = false;

/**
 * 推入一層遮罩（記錄來源）。
 * @param {string} id
 */
function pushOverlay(id) {
    overlayStack.push(id);
}

/**
 * 彈出一層遮罩（回到上一層）。
 *
 * 回傳上一層的 id；若堆疊已空則回傳 null。
 * @returns {string|null}
 */
function popOverlay() {
    overlayStack.pop();
    return overlayStack.length ? overlayStack[overlayStack.length - 1] : null;
}

/**
 * 關閉最上層遮罩並回到它的來源畫面。
 *
 * @param {HTMLElement} root 要關閉的遮罩元素
 * @returns {string|null} 回到的畫面 id
 */
function closeTopOverlay(root) {
    root?.classList.add("hidden");
    const top = currentOverlay();
    const source = popOverlay();
    if (source === "levelmap") {
        $("levelmap-root")?.classList.remove("hidden");
    } else if (source === "character-select") {
        $("character-select-overlay")?.classList.remove("hidden");
    }
    if (top && top !== source) {
        // 堆疊不一致（理論上不該發生）；記錄以便診斷
        console.warn("[overlay] 關閉層級與堆疊不一致", { top, source });
    }
    // W1：關閉遮罩後重新同步頁尾可見性（避免頁尾狀態與畫面不一致）
    syncAppPhase();
    return source;
}

/**
 * 目前堆疊頂層（除錯用）。
 * @returns {string|null}
 */
function currentOverlay() {
    return overlayStack.length ? overlayStack[overlayStack.length - 1] : null;
}
/** @type {number} */
let currentLevelId = 1;
/** 目前關卡的搭檔角色 id。 @type {string} */
let currentCompanionId = "santa";
/** @type {any} */
let progress = null;
/** @type {any} */
let audioSettings = null;
/** @type {any} */
let preferencesPanel = null;

/**
 * 回合選項的自繪 SVG 圖示（W2：零 Emoji 原則）。
 *
 * 3–6 歲幼兒不識字，答案鈕必須有**視覺徽章 + 圖形**才辨識得出差異。
 * 這裡以內嵌 SVG（currentColor）提供 6 種高辨識度剪影，
 * 依序套用於沒有圖片的選項鈕。
 *
 * @type {string[]}
 */
const OPTION_GLYPHS = [
    // ① 恐龍足跡
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-3 0-4 3-4 6 0 2 1 3 1 5s1 4-1 6-3 1-4-1"/><path d="M16 5c2 1 2 3 2 5"/><circle cx="6" cy="16" r="1.6"/><circle cx="18" cy="15" r="1.6"/></svg>',
    // ② 雪花
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4 7l16 10M20 7L4 17"/><path d="M12 6l2.2-2.2M12 6L9.8 3.8M12 18l2.2 2.2M12 18l-2.2 2.2"/></svg>',
    // ③ 禮物
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 12h18M12 8v13"/><path d="M12 8S9.5 8 8.5 6.5 10 3.5 12 8Zm0 0s2.5 0 3.5-1.5S14 3.5 12 8Z"/></svg>',
    // ④ 星星
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.4l5.9-.9z"/></svg>',
    // ⑤ 樹
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l5 7h-3l4 6H6l4-6H7z"/><path d="M12 16v5"/></svg>',
    // ⑥ 波浪（聲音）
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h2l2-6 3 12 3-9 2 5 2-3h2"/></svg>'
];

/**
 * 將內容型字串轉為可安全置入 HTML 屬性的形式。
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeAttr(value) {
    return escapeHtml(safeText(value));
}

/* ---------- DOM 快捷存取 ---------- */
const $ = (/** @type {string} */ id) => document.getElementById(id);

/**
 * 應用階段（控制頁尾可見性，W1）。
 *
 * "start" → 頁尾可見（開始畫面／同意閘／角色選擇／地圖等非遊玩畫面）
 * "play"  → 頁尾隱藏（回合進行中），工具列與答案鈕取得完整可視面積
 *
 * @typedef {"start"|"play"} AppPhase
 */

/**
 * 設定應用階段（同步到 body[data-app-phase]）。
 *
 * W1（Round 2 紅線）：頁尾不得遮住工具列。
 * 遊玩期間（#start-overlay 隱藏時）必須切到 "play"，讓頁尾完全隱藏；
 * 其餘畫面切回 "start"，並由 CSS 以 --footer-reserve 為工具列預留底部空間。
 *
 * @param {AppPhase} phase
 */
function setAppPhase(phase) {
    const body = document.body;
    if (!body) return;
    const next = phase === "play" ? "play" : "start";
    if (body.dataset.appPhase === next) return;
    body.dataset.appPhase = next;
}

/**
 * 依當前畫面推導應用階段。
 *
 * 判斷依據：#start-overlay 隱藏且遊戲容器可見 → 遊玩中；否則 → 非遊玩畫面。
 *
 * @returns {AppPhase}
 */
function detectAppPhase() {
    const startOverlay = $("start-overlay");
    const gameContainer = $("game-container");
    const playing = Boolean(startOverlay && startOverlay.classList.contains("hidden"))
        && Boolean(gameContainer && !gameContainer.classList.contains("hidden"));
    return playing ? "play" : "start";
}

/**
 * 重新同步應用階段（遮罩切換後呼叫）。
 */
function syncAppPhase() {
    setAppPhase(detectAppPhase());
}

/* ---------- 啟動 ---------- */
/** boot() 是否正在執行中（避免重試時重入）。 @type {boolean} */
let booting = false;

/**
 * 顯示啟動失敗的錯誤恢復面板。
 *
 * 規範（Round 1 紅線 #2）：
 *   - 必須**覆蓋／隱藏** `#start-overlay`，否則使用者只會看到空白畫面
 *   - 必須是 `role="alert"` 的可見面板（不得只寫進 status 列）
 *   - 必須提供離線檢查提示與「重新載入」按鈕
 *   - 重新載入鈕必須有 in-flight lock（防連點）
 *
 * @param {unknown} err
 */
function showBootError(err) {
    const en = locale === "en-US";
    console.error("[main] 內容載入失敗", err);

    // 隱藏開始畫面（否則會遮蔽錯誤面板 → 白屏）
    $("start-overlay")?.classList.add("hidden");
    $("consent-gate-root")?.classList.add("hidden");

    // 移除舊面板（重試時不得疊加）
    document.getElementById("boot-error-root")?.remove();

    const panel = document.createElement("div");
    panel.id = "boot-error-root";
    panel.className = "boot-error-overlay";
    panel.setAttribute("role", "alert");
    panel.setAttribute("aria-live", "assertive");

    const title = document.createElement("h1");
    title.className = "boot-error__title";
    title.textContent = en ? "Could not start the game" : "遊戲暫時無法開始";

    const desc = document.createElement("p");
    desc.className = "boot-error__desc";
    desc.textContent = en
        ? "Some game content could not be loaded. This is usually a temporary network problem."
        : "部分遊戲內容沒有載入成功，通常是暫時性的網路問題。";

    const hint = document.createElement("p");
    hint.className = "boot-error__hint";
    hint.textContent = en
        ? "Please check your internet connection, then try again. Once the game has been opened with a connection, offline mode also works."
        : "請先確認網路連線後再試一次；若先前已用網路成功開啟過，之後也能離線遊玩。";

    const actions = document.createElement("div");
    actions.className = "boot-error__actions";

    const retryBtn = document.createElement("button");
    retryBtn.className = "level-btn";
    retryBtn.id = "boot-retry-btn";
    retryBtn.type = "button";
    retryBtn.textContent = en ? "Try again" : "重新載入";

    const refreshBtn = document.createElement("button");
    refreshBtn.className = "level-btn level-btn--secondary";
    refreshBtn.id = "boot-refresh-btn";
    refreshBtn.type = "button";
    refreshBtn.textContent = en ? "Refresh page" : "重新整理頁面";

    actions.append(retryBtn, refreshBtn);

    const status = document.createElement("p");
    status.className = "boot-error__status";
    status.setAttribute("role", "status");
    status.textContent = en ? "Ready to retry." : "已準備好重新載入。";

    panel.append(title, desc, hint, actions, status);
    document.body.appendChild(panel);

    // 防連點：進行中鎖定按鈕
    const lock = (/** @type {HTMLButtonElement} */ btn) => {
        btn.disabled = true;
        btn.dataset.busy = "1";
    };
    const unlock = (/** @type {HTMLButtonElement} */ btn) => {
        btn.disabled = false;
        delete btn.dataset.busy;
    };

    retryBtn.addEventListener("click", async () => {
        if (retryBtn.dataset.busy) return;
        lock(retryBtn);
        status.textContent = en ? "Loading…" : "載入中…";
        try {
            await boot();
            if (!document.getElementById("boot-error-root")) return;
        } catch (err2) {
            console.error("[main] 重新載入失敗", err2);
        }
        unlock(retryBtn);
        status.textContent = en
            ? "Still cannot load. Please refresh the page."
            : "仍然無法載入，請改用「重新整理頁面」。";
    });

    refreshBtn.addEventListener("click", () => {
        if (refreshBtn.dataset.busy) return;
        lock(refreshBtn);
        status.textContent = en ? "Refreshing…" : "重新整理中…";
        try {
            location.reload();
        } catch (err2) {
            console.warn("[main] 無法自動重新整理", err2);
            unlock(refreshBtn);
            status.textContent = en ? "Please refresh the page manually." : "請手動重新整理頁面。";
        }
    });

    // 焦點移至重試鈕（鍵盤使用者可立即操作）
    retryBtn.focus();
}

async function boot() {
    if (booting) return;
    booting = true;
    locale = detectLocale();

    try {
        bundle = await loadContent(locale);
    } catch (err) {
        booting = false;
        showBootError(err);
        setStatus(locale === "en-US"
            ? "Content could not be loaded. Please reload the page."
            : "內容載入失敗，請重新載入頁面。");
        return;
    }

    // 進度與推薦碼
    progress = loadProgress();
    if (!progress.referralCode) {
        progress.referralCode = referralCode();
        saveProgress(progress);
    }
    const ref = safeReferralCode(new URLSearchParams(location.search).get("ref"));
    if (ref) {
        const consumed = consumeReferral(ref);
        if (consumed) track("share_install", { referralCode: consumed });
    }

    hud = createHud($("hud"));
    hud.update({ chapter: 1, chapterTitle: chapterTitle(bundle, locale, 1) });

    await loadTimeline();
    await loadSfx();
    await loadMusic();
    await loadChildVoice();
    await loadScenes();
    await loadAssessmentData();
    await loadPerformances();

    // 場景與偏好
    buildScene($("scene"));
    applyPreferences(document.body);
    setupFooter();
    // W1：初始為非遊玩畫面（頁尾可見），進入回合時才切到 "play"
    setAppPhase("start");

    // Step 205：語音偏好 → 語音層降級狀態（靜音時直接走視覺替代）
    const prefs = getPreferences();
    setSpeechEnabled(prefs.speech !== false);
    const voiceState = getVoiceState();
    if (voiceState.reason && !prefs.speech) {
        showVisualFallback(document.body, { reason: "muted", locale });
    }
    audioSettings = createAudioSettings($("audio-settings-root"));
    preferencesPanel = createPreferencesPanel($("a11y-root"), locale);

    wire();
    startAmbientSnow($("snow-container"));

    // Step 131：Web Vitals 量測（無 API 時靜默降級，不得拋錯）
    initVitals();
    const firstInteraction = () => {
        trackFirstInteraction();
        window.removeEventListener("pointerdown", firstInteraction);
        window.removeEventListener("keydown", firstInteraction);
    };
    window.addEventListener("pointerdown", firstInteraction, { once: true });
    window.addEventListener("keydown", firstInteraction, { once: true });

    // Step 129／130：SW 註冊失敗**不得**阻塞 boot()（改走離線降級）
    registerServiceWorker();

    // Step 143：頁面離開時 flush 遙測佇列（不得遺失已排入的事件）
    window.addEventListener("pagehide", () => {
        track("session_end", { chapter: 1, sessionMs: 0 });
        reportVitals();
        void flushTelemetry();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            track("session_end", { chapter: 1, sessionMs: 0 });
            void flushTelemetry();
        }
    });

    // Step 124：隊伍列在遊戲中隨時可見
    renderTeamDock($("team-dock"), bundle, progress, locale);

    track("session_start", { chapter: 1, sessionMs: 0 });

    // Step 133：未取得法定代理人家長同意前，**不得** showStart()
    // 同意閘期間先收起開始畫面（否則兩個遮罩會疊在一起）
    $("start-overlay")?.classList.add("hidden");
    const consentRoot = $("consent-gate-root");
    const consented = await requireConsent(consentRoot, locale);
    if (!consented) {
        booting = false;
        setStatus(locale === "en-US"
            ? "A parent or guardian must agree before playing."
            : "需由法定代理人家長同意後才能開始。");
        return;
    }

    // Step 167：PWA 安裝引導（已在 standalone 或冷卻期內時自動略過）
    initPwaInstall($("pwa-install-root"), locale);

    // 啟動成功：移除錯誤恢復面板（若曾出現）
    document.getElementById("boot-error-root")?.remove();
    booting = false;

    showStart();
}

/**
 * 載入音樂定義。
 */
async function loadMusic() {
    try {
        const res = await fetch("./content/music.json", { cache: "no-cache" });
        if (res.ok) setMusicMap(await res.json());
    } catch (err) {
        console.error("[main] 音樂定義載入失敗", err);
    }
}

/**
 * 載入音效定義。
 */
async function loadSfx() {
    try {
        const res = await fetch("./content/sfx-map.json", { cache: "no-cache" });
        if (res.ok) setSfxMap(await res.json());
    } catch (err) {
        console.warn("[main] 音效定義載入失敗", err);
    }
}

/**
 * 載入兒童／家長雙層文案。
 */
async function loadChildVoice() {
    try {
        const res = await fetch("./content/child-voice.json", { cache: "no-cache" });
        if (res.ok) setChildVoice(await res.json());
    } catch (err) {
        console.warn("[main] 兒童文案載入失敗", err);
    }
}

/** 目前場景（用於音樂與視覺切換）。 @type {string} */
let currentSceneId = "";

/** 場景資料（content/scenes.json），用於消費 `weather`。 @type {any} */
let scenesData = {};

/**
 * 套用場景音樂。
 *
 * 規範：若場景與目前相同則直接返回（避免重複切換）；程序化音樂不可用時
 * 回退到檔案音樂軌道；任一環節失敗都不得拋錯中斷遊戲流程。
 *
 * @param {string} scene
 * @returns {boolean} 是否成功切換
 */
function applySceneAudio(scene) {
    if (!scene || scene === currentSceneId) return false;
    currentSceneId = scene;
    // 優先走程序化場景音樂；無對應場景時回退到檔案音樂軌道
    if (!playSceneMusic(scene)) playMusic(scene);
    return true;
}

/**
 * 套用場景視覺（色票 + 視差層）。
 *
 * 色票來自 content/scenes.json（由 applyTheme 透過 setScenePalettes 注入），
 * 載入失敗時沿用 parallax.js 內建預設色票，不得中斷遊戲。
 *
 * @param {string} scene
 */
function applySceneVisual(scene) {
    if (!scene) return;
    applyTheme($("scene"), scene);
    // Step 123：同時套用色票**與卡司**（演出層）
    applySceneCast(scene, $("scene"));
    setParallax($("scene"), 0, 0);

    // Step 120：消費 scenes.json 的 `weather` 欄位（無天氣則不啟動粒子）
    const weather = scenesData?.[scene]?.weather || "";
    startAmbientWeather($("snow-container"), weather);
}

/**
 * 兒童化玩法名稱。
 *
 * 優先使用 content/child-voice.json 的 verbChildLabel（動作或角色名）；
 * 載入失敗時回退到 core/verbs.js 的既有標籤。
 * @param {string} verb
 * @param {string} locale
 * @returns {string}
 */
function childVerbLabel(verb, locale) {
    const voice = childVoice() || {};
    const key = locale === "en-US" ? "en-US" : "zh-TW";
    const named = voice.verbChildLabel?.[verb]?.[key];
    if (named) return named;
    const id = verbById(verb);
    return id ? verbLabel(id, locale) : verb;
}

/**
 * 載入場景設定（色票）。
 */
/**
 * 載入成效評量題庫（content/assessment.json）。
 *
 * 載入失敗時不得影響遊戲（bundle.assessment 保持 undefined，評量入口顯示 Empty 引導）。
 */
async function loadAssessmentData() {
    try {
        const res = await fetch("./content/assessment.json", { cache: "no-cache" });
        if (res.ok) {
            const data = await res.json();
            if (bundle) {
                bundle.assessment = data;
            }
        }
    } catch (err) {
        console.warn("[main] 評量題庫載入失敗", err);
    }
}

async function loadScenes() {
    try {
        const res = await fetch("./content/scenes.json", { cache: "no-cache" });
        if (res.ok) {
            const data = await res.json();
            setScenePalettes(data);
            scenesData = data;
        }
    } catch (err) {
        console.warn("[main] 場景設定載入失敗", err);
    }
}

/**
 * 載入演出資料（content/performances.json）與敘事對白。
 */
async function loadPerformances() {
    try {
        const res = await fetch("./content/performances.json", { cache: "no-cache" });
        if (res.ok) {
            injectPerformances(await res.json());
            // 演出層的台詞來自 narrative（已載入 bundle.narrative）
            loadNarrative(bundle?.narrative);
        }
    } catch (err) {
        console.warn("[main] 演出資料載入失敗", err);
    }
}

/**
 * 綁定頁尾條款連結：於應用內開啟可捲動條款面板。
 *
 * 規範（Round 1 L3）：
 *   - 攔截 click 以避免跳出獨立模式直接看原始 `.md`
 *   - 保留 `href` 作為降級（例如 JS 失效時仍可下載文件）
 *
 * @param {HTMLElement} link
 * @param {"privacy"|"terms"} kind
 */
function bindLegalLink(link, kind) {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        // 掛在 body 上（頁尾有 z-index stacking context，會限制面板層級）
        openLegalDocument(document.body, kind, locale, () => {
            link.focus();
        });
    });
}

/**
 * 設定頁尾（Step 168）：隱私權、服務條款、版本號與聯絡信箱。
 *
 * 語系切換時更換條款文件路徑；缺欄位時降級為安全預設文案。
 */
function setupFooter() {
    const footer = document.getElementById("app-footer");
    if (!footer) return;

    const en = locale === "en-US";

    // 版本號（以建置常數為準，缺值時降級）
    const versionEl = document.getElementById("footer-version");
    if (versionEl) {
        versionEl.textContent = en
            ? `Version ${APP.version || "—"}`
            : `版本 ${APP.version || "—"}`;
    }

    // 條款文件（雙語路徑）
    const privacy = document.getElementById("footer-privacy");
    if (privacy) {
        privacy.setAttribute("href", en ? "./content/privacy.en-US.md" : "./content/privacy.zh-TW.md");
        privacy.textContent = en ? "Privacy" : "隱私權政策";
        bindLegalLink(privacy, "privacy");
    }

    const terms = document.getElementById("footer-terms");
    if (terms) {
        terms.setAttribute("href", en ? "./content/terms.en-US.md" : "./content/terms.zh-TW.md");
        terms.textContent = en ? "Terms of Service" : "服務條款";
        bindLegalLink(terms, "terms");
    }

    const support = document.getElementById("footer-support");
    if (support) {
        support.setAttribute("href", "mailto:support@mumu-game.app");
        support.textContent = en ? "Contact" : "聯絡我們";
    }

    footer.setAttribute("aria-label", en ? "About and legal" : "關於與法律資訊");
}

/**
 * 判斷語系。
 * @returns {string}
 */
function detectLocale() {
    const saved = localStorage.getItem("mumu.locale");
    if (saved && APP.locales.includes(saved)) return saved;
    const nav = (navigator.language || "zh-TW").toLowerCase();
    return nav.startsWith("en") ? "en-US" : "zh-TW";
}

/**
 * 載入感官時間軸。
 */
async function loadTimeline() {
    try {
        const res = await fetch("./content/timeline.json", { cache: "no-cache" });
        if (res.ok) setTimeline(await res.json());
    } catch (err) {
        console.warn("[main] 時間軸載入失敗，改用預設回饋", err);
    }
}

/* ---------- 離線與 Service Worker ---------- */

/**
 * 註冊 Service Worker。
 *
 * 規範（Step 129／130）：
 *   - 註冊失敗或**不被支援**時**不得**阻塞 boot()（遊戲仍可上網玩）
 *   - 離線時顯示可理解的離線提示
 *   - 配額不足時靜默降級（不得拋錯）
 */
function registerServiceWorker() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        return;
    }
    try {
        navigator.serviceWorker.register("./service-worker.js").catch((err) => {
            console.warn("[main] Service Worker 註冊失敗，改為線上模式", err);
        });
    } catch (err) {
        console.warn("[main] Service Worker 註冊失敗，改為線上模式", err);
    }

    const onOffline = () => showOfflineNotice(document.body, locale);
    const onOnline = () => hideOfflineNotice(document.body);

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    if (typeof navigator.onLine === "boolean" && !navigator.onLine) {
        onOffline();
    }
}

/* ---------- 畫面流程 ---------- */

/**
 * 顯示開始畫面。
 *
 * **只負責顯示遮罩** —— 事件綁定統一在 `wire()`（F7：
 * `showStart()` 曾自行綁 `click`，導致 `startGame` 被執行兩次）。
 */
function showStart() {
    const overlay = $("start-overlay");
    overlay.classList.remove("hidden");
    // W1：開始畫面 → 頁尾可見（法律條款與版本資訊須可讀）
    setAppPhase("start");
}

/**
 * 開始遊戲：解鎖音訊 → 序章信 → 角色選擇 → 首次教學。
 *
 * F7：加了 `started` 旗標，已啟動則直接 return。
 */
async function startGame() {
    if (started) return;
    started = true;

    ensureAudio(locale);
    // 初始場景（聖誕）：音樂、色票、視差同步
    currentSceneId = "christmas";
    if (!playSceneMusic("christmas")) playMusic("christmas");
    applyTheme($("scene"), "christmas");
    setParallax($("scene"), 0);
    $("start-overlay").classList.add("hidden");
    // W1：開始遊玩 → 頁尾隱藏（不得遮住工具列與答案鈕）
    setAppPhase("play");

    // 序章信件：優先取 story-arcs 第 0 章的完整 letter，
    // 缺漏時回退到 narrative.letters.prologue（較短的一段引言）
    const prologueRaw = bundle.narrative?.letters?.prologue;
    const prologueText = typeof prologueRaw === "string"
        ? prologueRaw
        : (prologueRaw?.[locale] || "");
    const arc0 = bundle.storyArcs?.chapters?.find((/** @type {any} */ c) => c.chapter === 0);
    const letter = arc0?.letter?.[locale]
        || arc0?.letter?.["zh-TW"]
        || prologueText
        || "";
    // 序章搭檔為聖誕老人（Step 119）
    const char = getAnyCharacter(bundle, "santa");
    setVoiceProfile(locale, anyCharacterVoice(bundle, "santa"));
    renderCharacter($("santa-container"), char, "idle");

    showLetter(letter, () => {
        // 序章信件即第 0 章的過場 —— 記錄已看過，避免進入第 1 關時重複顯示
        progress["story.0"] = 1;
        saveProgress(progress);

        // V4：關閉序章信件後立即清空殘留文字
        //（朗讀失敗時的語音降級會把長信寫進 HUD），不得滲漏到教學。
        clearRoundHud();

        // 首次啟動才跑教學；之後可從設定重播
        const firstRun = !localStorage.getItem("mumu.tutorial.done");
        if (firstRun) {
            runTutorial();
        } else {
            showCharacterSelect();
        }
    });
}

/**
 * 執行教學流程，完成後進入角色選擇。
 *
 * F4：不得包裝 `tutorial.next`、不得 fallback 到 `#levelmap-root`、
 * 不得用 `setTimeout` 推進流程。
 */
function runTutorial() {
    const root = $("tutorial-root");
    if (!root) {
        showCharacterSelect();
        return;
    }

    const tutorial = createTutorial(root, bundle, locale);

    // V4：進入教學前清空序章信件殘留的文字（不得滲漏到教學畫面）
    clearRoundHud();

    const finish = () => {
        localStorage.setItem("mumu.tutorial.done", "1");
        root.classList.add("hidden");
        // V4：教學結束時清空殘留文字（教學文案不得滲漏到後續畫面）
        clearRoundHud();
        showCharacterSelect();
    };

    // 直接使用 tutorial 公開的 next()／skip()，不包裝
    tutorial.onDone(finish);
}

/**
 * 進入章節過場（Step 122）。
 *
 * 順序：**過場（信件）→ 場景切換 → 進關卡**。
 * 玩家在過場中就應該看到該章的場景與搭檔。
 *
 * @param {number} chapter
 * @param {() => void} onClose
 */
function showChapterScene(chapter, onClose) {
    const arc = bundle.storyArcs?.chapters?.find((/** @type {any} */ c) => c.chapter === chapter);
    if (!arc) {
        onClose();
        return;
    }

    const root = $("story-root");
    const letter = arc.letter?.[locale] || arc.letter?.["zh-TW"] || "";

    // 搭檔立繪使用該章的 companion（Step 119）
    let art = "";
    try {
        const companion = getAnyCharacter(bundle, arc.companion);
        art = companion?.art?.file || "";
    } catch {
        art = "";
    }

    // 過場中先切到該章的場景（孩子看得到「畫面對上劇情」）
    applySceneVisual(arc.scene);
    renderCharacter($("santa-container"), getAnyCharacterSafe(bundle, arc.companion), "idle");

    if (!root) {
        onClose();
        return;
    }

    showStoryScene(root, {
        title: arc.sceneTitle?.[locale] || arc.sceneTitle?.["zh-TW"] || arc.title?.[locale] || "",
        tagline: arc.sceneTagline?.[locale] || arc.sceneTagline?.["zh-TW"] || "",
        body: letter,
        theme: arc.scene,
        art
    }, () => {
        // 記錄本章已看過（progress 鍵為 "story.<chapter>"）
        progress["story." + chapter] = 1;
        saveProgress(progress);
        // V4：關閉故事過場後立即清空殘留文字，避免長信滲漏到關卡 HUD
        clearRoundHud();
        onClose();
    });
}

/**
 * 取得角色，失敗時回傳 null（不得中斷流程）。
 * @param {any} bundle
 * @param {string} id
 */
function getAnyCharacterSafe(bundle, id) {
    try {
        return getAnyCharacter(bundle, id);
    } catch {
        return null;
    }
}

/**
 * 顯示序章信件（可關閉的劇情過場）。
 *
 * F6：序章信件**必須是一個可以關上的過場**，不是塞在氣泡裡的無按鈕文字。
 *
 * 掛載於 `#story-root`，關上後才由 `onClose` 觸發後續流程（教學 → 角色選擇 → 地圖）。
 *
 * @param {string} text
 * @param {() => void} [onClose]
 */
function showLetter(text, onClose) {
    const root = $("story-root");
    if (!root) {
        // 沒有過場容器時退回氣泡（不中斷流程）
        const bubble = $("bubble");
        const content = $("bubble-content");
        if (content) content.textContent = text;
        bubble?.classList.add("show");
        onClose?.();
        return;
    }

    // 署名 = 該章搭檔的角色名稱（Step 119）
    const companionId = bundle.storyArcs?.chapters?.[0]?.companion || "santa";
    let name = "Santa";
    try {
        const companion = getAnyCharacter(bundle, companionId);
        name = companion?.name?.[locale] || companion?.name?.["zh-TW"] || name;
    } catch {
        // 找不到角色時用預設名
    }
    const dash = locale === "en-US" ? "— " : "—— ";
    // 章節標題（第 0 章即序章）
    const arc = bundle.storyArcs?.chapters?.find((/** @type {any} */ c) => c.chapter === 0);
    const title = arc?.sceneTitle?.[locale] || arc?.sceneTitle?.["zh-TW"] || "";
    showLetterScene(root, text, dash + name, onClose, title);
}

/**
 * 角色選擇。
 */
function showCharacterSelect() {
    const overlay = $("character-select-overlay");
    const list = $("character-options");
    const chars = playableCharacters(bundle, 1);

    list.innerHTML = chars.map((/** @type {any} */ c) => `
        <button class="mode-option" data-character="${c.id}" type="button">
            <img class="mode-option__art" src="${c.art.file}" alt="${c.name[locale] || c.name["zh-TW"]}" />
            <div class="mode-title">${c.name[locale] || c.name["zh-TW"]}</div>
            <div class="mode-desc">${c.voice.blurb[locale] || c.voice.blurb["zh-TW"]}</div>
        </button>
    `).join("");

    list.querySelectorAll("[data-character]").forEach((btn) => {
        btn.addEventListener("click", () => {
            selectedCharacter = /** @type {HTMLElement} */ (btn).dataset.character || "santa";
            overlay.classList.add("hidden");
            showLevelMap();
        });
    });

    // F8：角色選擇必須有「返回」路徑（回到序章／開始畫面）
    const back = document.createElement("button");
    back.className = "level-btn level-btn--secondary overlay__back";
    back.id = "character-select-back";
    back.type = "button";
    back.setAttribute("aria-label", locale === "en-US" ? "Back" : "返回");
    back.textContent = locale === "en-US" ? "Back" : "返回";
    back.addEventListener("click", () => {
        overlay.classList.add("hidden");
        popOverlay();
        showStart();
    });
    overlay.appendChild(back);

    overlay.classList.remove("hidden");
    pushOverlay("character-select");
    // W1：角色選擇為非遊玩畫面 → 頁尾可見
    setAppPhase("start");
}

/**
 * 關卡地圖。
 *
 * F8：回到地圖時必須把**遊戲畫面收起來**，否則地圖底下仍殘留回合畫面。
 *
 * W3（Round 2 紅線）：「回地圖」不得軟鎖在空白天空 ——
 *   開啟地圖前必須**關閉所有其他遮罩**（設定／同意閘／家長報告／圖鑑／
 *   分享／付費牆／教學／故事），並**重新渲染**地圖內容（否則 overlayStack
 *   與實際 DOM 不一致會導致地圖無法再被開啟）。
 */
function showLevelMap() {
    const overlay = $("levelmap-root");

    // 收起遊戲畫面（地圖是全屏遮罩）
    $("game-container")?.classList.add("hidden");
    $("level-up-overlay")?.classList.add("hidden");
    $("level-complete-container")?.classList.add("hidden");

    // V3：工具列「回地圖」鈕回到地圖後必須停用（避免重複堆疊遮罩）
    const mapToolBtn = $("back-to-map-tool-btn");
    mapToolBtn?.setAttribute("aria-disabled", "true");

    /*
     * W3：關閉所有其他遮罩，避免疊層殘留造成軟鎖（空白天空）。
     * 這些遮罩彼此獨立，逐一隱藏並清空內容，確保地圖是唯一可見層。
     */
    const otherOverlays = [
        "audio-settings-root",
        "a11y-root",
        "consent-gate-root",
        "parent-report-root",
        "assessment-root",
        "dex-root",
        "share-root",
        "tutorial-root",
        "story-root",
        "pwa-install-root",
        "character-select-overlay",
        "mode-select-overlay",
        "level-up-overlay"
    ];
    for (const id of otherOverlays) {
        const el = $(id);
        if (!el) continue;
        el.classList.add("hidden");
        if (id !== "level-up-overlay") el.innerHTML = "";
    }

    // 疊層堆疊重置（避免殘留層級造成 closeTopOverlay 誤判）
    overlayStack.length = 0;

    // 重新渲染地圖內容（確保回到地圖時不是空白）
    const map = renderLevelMap(overlay, bundle, progress, locale);
    map.onSelect((levelId) => {
        overlay.classList.add("hidden");
        startLevel(levelId);
    });

    // F8：地圖必須有「返回」路徑（回到角色選擇）
    const back = document.createElement("button");
    back.className = "level-btn level-btn--secondary overlay__back";
    back.id = "levelmap-back";
    back.type = "button";
    back.setAttribute("aria-label", locale === "en-US" ? "Back" : "返回");
    back.textContent = locale === "en-US" ? "Back" : "返回";
    back.addEventListener("click", () => {
        overlay.classList.add("hidden");
        popOverlay();
        showCharacterSelect();
    });
    overlay.appendChild(back);

    overlay.classList.remove("hidden");
    pushOverlay("levelmap");
    // W1：地圖為非遊玩畫面 → 頁尾可見（工具列回到底部但不被遮住）
    setAppPhase("start");
}

/**
 * 開始一個關卡。
 * @param {number} levelId
 */
function startLevel(levelId) {
    currentLevelId = levelId;
    const level = getLevel(bundle, levelId);

    // Step 122：進入某章的第一個關卡時，先顯示該章過場（信件）
    // 順序：過場 → 場景切換 → 進關卡
    if (!progress["story." + level.chapter]) {
        showChapterScene(level.chapter, () => {
            startLevel(levelId);
        });
        return;
    }

    $("game-container").classList.remove("hidden");
    // V3：進入關卡後重新啟用工具列「回地圖」鈕
    $("back-to-map-tool-btn")?.setAttribute("aria-disabled", "false");
    // W1：進入回合 → 頁尾隱藏（工具列與答案鈕完整可點）
    setAppPhase("play");
    // V4：開始新關卡前清空前一回合（故事／教學）的殘留文字
    clearRoundHud();
    $("mode-indicator").textContent = childVerbLabel(level.verb, locale);
    // 三支柱整合：切換場景時，音樂（playSceneMusic）與場景色票（applyTheme）必須同步
    applySceneAudio(level.scene);
    applySceneVisual(level.scene);
    setState({ level: levelId, chapter: level.chapter, verb: level.verb });

    hud.update({
        level: levelId,
        score: 0,
        maxScore: APP.maxScore,
        chapter: level.chapter,
        chapterTitle: chapterTitle(bundle, locale, level.chapter)
    });

    // 角色跟上章節（Step 119）：孩子進關卡看到的是**該章的夥伴**，
    // 而不是自己選的那一隻。玩家選定的角色保留在隊伍中（Step 124 會讓隊伍可見）。
    const companionId = level.companion || selectedCharacter;
    currentCompanionId = companionId;
    const char = getAnyCharacter(bundle, companionId);
    renderCharacter($("santa-container"), char, "listen");

    session = createSession(bundle, locale);
    session.onFinish((/** @type {any} */ r) => {
        onLevelFinish(r);
    });

    session.start(levelId, {
        getLevel: (/** @type {number} */ id) => {
            const lvl = getLevel(bundle, id);
            return {
                ...lvl,
                engineFactory: () => createVerbForLevel(bundle, locale, lvl)
            };
        }
    });

    playEvent("level:start");
}

/**
 * 關卡完成。
 * @param {any} r
 */
function onLevelFinish(r) {
    const stars = r.correct >= r.total ? 3 : r.correct / r.total >= 0.7 ? 2 : 1;
    const level = getLevel(bundle, currentLevelId);

    hud.update({ score: r.correct, maxScore: r.total });
    burst($("snow-container"), { kind: "firework", count: 30 });
    haptic("celebrate");
    playEvent("level:complete");

    const upText = $("level-up-text");
    if (upText) {
        upText.textContent = locale === "en-US"
            ? `Level ${currentLevelId} complete!`
            : `第 ${currentLevelId} 關完成！`;
    }
    $("level-up-overlay").classList.remove("hidden");
    setTimeout(() => $("level-up-overlay").classList.add("hidden"), 2600);

    const nextId = currentLevelId + 1;
    const nextBtn = $("next-level-btn");
    const replayBtn = $("replay-level-btn");
    const container = $("level-complete-container");

    if (nextBtn) {
        nextBtn.textContent = locale === "en-US" ? "Next Level" : "下一關";
        nextBtn.onclick = () => {
            container.classList.add("hidden");
            if (nextId <= 40) {
                startLevel(nextId);
            } else {
                showLevelMap();
            }
        };
    }
    if (replayBtn) {
        replayBtn.textContent = locale === "en-US" ? "Play Again" : "再玩一次";
        replayBtn.onclick = () => {
            container.classList.add("hidden");
            startLevel(currentLevelId);
        };
    }

    // F8：關卡完成後必須有「回地圖」的路徑（否則孩子回不去選關）
    const mapBtn = $("back-to-map-btn");
    if (mapBtn) {
        mapBtn.textContent = locale === "en-US" ? "Level Map" : "回到地圖";
        mapBtn.onclick = () => {
            container.classList.add("hidden");
            $("level-up-overlay")?.classList.add("hidden");
            showLevelMap();
        };
    }
    container.classList.remove("hidden");

    // 進度、掌握度與圖鑑解鎖
    recordLevelResult(progress, currentLevelId, stars);
    updateStreak(progress, todayString());
    progress.totalSessionMs = (progress.totalSessionMs || 0) + (r.durationMs || 0);

    // 掌握度模型：以實際作答更新
    const samples = r.samples || [];
    for (const sample of samples) {
        const axis = sample.axis || "minimalPairCorrect";
        const entry = progress.mastery[axis] || createMasteryEntry(axis);
        updateMastery(entry, {
            correct: Boolean(sample.correct),
            ms: sample.ms || 0,
            hinted: Boolean(sample.hinted)
        });
        progress.mastery[axis] = entry;
        recordLearningSample(progress, {
            verb: sample.verb || "minimal-pair",
            correct: Boolean(sample.correct),
            locale: sample.locale || locale,
            hinted: Boolean(sample.hinted)
        });
    }

    // 檢查是否有新恐龍解鎖
    /** @type {string[]} */
    const justUnlocked = [];
    for (const dino of bundle.dex || []) {
        if (!checkDexUnlock(bundle, progress, dino.id)) continue;
        if (unlockDex(progress, dino.id)) {
            justUnlocked.push(dino.id);
            track("dex_unlock", { dinoId: dino.id, chapter: level.chapter });
            hud.toast(
                locale === "en-US" ? `New dinosaur: ${dino.name?.[locale] || dino.id}` : `新夥伴解鎖：${dino.name?.["zh-TW"] || dino.id}`,
                "good"
            );
            playEvent("dex:unlock");
        }
    }

    // Step 124：新解鎖的恐龍必須在隊伍列「走出來」
    if (justUnlocked.length) {
        renderTeamDock($("team-dock"), bundle, progress, locale, justUnlocked);
        for (const id of justUnlocked) {
            const dino = bundle.dex.find((/** @type {any} */ x) => x.id === id);
            burst($("snow-container"), { kind: "sparkle", count: 14 });
            playUnlock($("santa-container"), $("snow-container"));
            void dino;
        }
    }

    saveProgress(progress);
    track("level_complete", {
        levelId: currentLevelId,
        chapter: level.chapter,
        correct: r.correct,
        hintsUsed: r.hintsUsed || 0,
        sessionMs: r.durationMs || 0
    });

    console.warn("[main] 關卡完成", currentLevelId, stars, level.id);
}

/* ---------- 時間軸執行 ---------- */
/**
 * 執行時間軸步驟。
 * @param {string} eventName 事件名稱（用於判斷角色情緒回饋）
 * @param {string} track
 * @param {any} step
 */
function runTimelineStep(eventName, track, step) {
    switch (track) {
        case "motion":
            if (step.target) animate(step.target, step.anim || "pop");
            break;
        case "audio":
            if (step.clip) playSfx(step.clip);
            break;
        case "voice":
            if (step.context) {
                const line = pickLine(bundle, locale, step.context, Date.now() % 997);
                if (line) speak(line, { locale });
            }
            break;
        case "scene":
            if (step.effect === "sparkle" || step.effect === "string-lights") {
                burst($("snow-container"), { kind: "sparkle", count: step.count || 16 });
            } else if (step.effect === "egg-hatch") {
                playHatch($("santa-container"));
            } else if (step.effect === "ground-shake") {
                playDinoRoar("deep");
                playRoar($("santa-container"));
            }
            break;
    }

    // 角色情緒回饋（Step 94）：與 content/timeline.json 的事件對應
    if (track === "scene" && (step.at || 0) === 0) {
        if (eventName === "dex:unlock") {
            playUnlock($("santa-container"), $("snow-container"));
        } else if (eventName === "level:complete") {
            playComplete($("santa-container"));
        }
    }
}

/**
 * 播放時間軸事件，並把事件名稱帶入步驟執行器。
 * @param {string} eventName
 */
function playEvent(eventName) {
    playTimeline(eventName, (track, step) => runTimelineStep(eventName, track, step));
}

/* ---------- 回合回饋輔助（Step 126） ---------- */

/**
 * 播放角色專屬的慶祝音效與動作。
 *
 * 依 `content/characters.json` 的 `traits.celebrate` 決定動作
 * （目前有 "jump"／"bounce"／"roar" 等描述），並搭配對應的音效。
 *
 * @param {"celebrate"|"roar"|"idle"} trait
 */
function playCompanionSfx(trait) {
    const mount = $("santa-container");
    const character = currentCompanion();
    const motion = character?.traits?.celebrate || "jump";

    // 音效
    const map = {
        celebrate: "glass.chime",
        roar: "dino.roar.warm",
        idle: "ui.tap"
    };
    playSfx(map[trait] || "ui.tap");

    // 角色動作（依 traits 決定）
    if (trait !== "celebrate") return;
    if (motion === "roar") playRoar(mount);
    else if (motion === "bounce") playComplete(mount);
    else playHatch(mount);
}

/**
 * 取得目前的搭檔角色資料。
 * @returns {any}
 */
function currentCompanion() {
    const id = currentCompanionId;
    if (!id) return null;
    try {
        return getAnyCharacter(bundle, id);
    } catch {
        return null;
    }
}


/**
 * 標記序列玩法中「已答對的項」（持久化的視覺標記）。
 *
 * 該項必須**點亮並留在原位**，不得移走或換掉。
 */
function markSequenceStepLit() {
    const engine = session?.engine;
    const seq = engine?.getSequence?.() || [];
    if (!seq.length) return;

    const done = sequenceDoneCount();
    if (!done) return;

    const controls = $("controls-view");
    if (!controls) return;

    const buttons = Array.from(controls.querySelectorAll("[data-item]"));
    // 由引擎回饋取得最後答對的一項
    const lastId = engine.getFeedback?.() || seq[done - 1];
    for (const btn of buttons) {
        const id = /** @type {HTMLElement} */ (btn).dataset.item || "";
        if (id === lastId) {
            btn.classList.add("control-btn--lit");
            btn.classList.remove("control-btn--chosen");
        }
    }
}

/* ---------- 回合 UI ---------- */

/**
 * 清空回合 HUD 上的殘留文字（V4）。
 *
 * 故事過場（信件）朗讀失敗時會觸發 `voice:unavailable`，
 * 導致長信文字被寫進 `#visual-fallback`；若未清除，
 * 聖誕老人的長信會滲漏到教學與第 1 關的 HUD。
 *
 * 本函式一併清掉：視覺替代提示、氣泡文字、狀態列、字幕屬性。
 */
function clearRoundHud() {
    hideVisualFallback(document.body);
    hideVisualFallback(document.getElementById("tv-view") || document.body);

    const bubble = $("bubble");
    const content = $("bubble-content");
    if (content) {
        content.textContent = "";
        content.removeAttribute("data-subtitle");
    }
    bubble?.classList.remove("show");

    const status = $("status-text");
    if (status) status.textContent = "";

    const sr = $("sr-live");
    if (sr) sr.textContent = "";
}

/**
 * 目前回合的示範步驟（視覺替代用的順序大圖卡）。
 *
 * 依引擎種類取得：序列／翻牌／拼合皆提供可辨識的步驟描述。
 * @returns {Array<string|{label?:string,image?:string}>}
 */
function currentDemoSteps() {
    const engine = session?.engine;
    if (!engine) return [];

    const seq = engine.getSequence?.() || [];
    if (Array.isArray(seq) && seq.length) {
        const labels = seq.map((/** @type {any} */ id) => {
            const opt = (engine.getOptions?.() || []).find((/** @type {any} */ o) => o.id === id);
            return opt?.label || opt?.image || String(id);
        });
        return labels;
    }

    const options = engine.getOptions?.() || [];
    if (Array.isArray(options) && options.length) {
        return options.slice(0, 4).map((/** @type {any} */ o) => ({
            label: o?.label || "",
            image: o?.image || ""
        }));
    }
    return [];
}

/**
 * 判斷目前是否處於「回合遊玩狀態」。
 *
 * W2：只有在回合進行中（session 存在且有引擎）才允許把文字寫進
 * `#visual-fallback` —— 故事信件、教學、角色選擇等地畫面**不得**滲入。
 *
 * @returns {boolean}
 */
function isRoundPlaying() {
    return Boolean(session?.engine);
}

/**
 * 判斷故事過場（信件）目前是否開啟。
 *
 * W2：故事信件本來就顯示在畫面上，語音不可用時**不得**再把長信
 * 複製一份寫進 `#visual-fallback`（會造成長信滲入第 1 關）。
 *
 * @returns {boolean}
 */
function isStorySceneOpen() {
    const root = $("story-root");
    return Boolean(root && !root.classList.contains("hidden"));
}

/**
 * 取得當題的結構化選項（回合視覺圖卡，W2）。
 *
 * @returns {Array<{label?:string,image?:string,id?:string}>}
 */
function currentRoundCards() {
    const engine = session?.engine;
    if (!engine) return [];

    const options = engine.getOptions?.() || [];
    if (!Array.isArray(options) || !options.length) return [];

    return options.slice(0, 6).map((/** @type {any} */ o) => ({
        id: o?.id ? String(o.id) : "",
        label: o?.label ? String(o.label) : "",
        image: o?.image ? String(o.image) : ""
    }));
}

/**
 * 語音不可用／靜音／無語音包 → 顯示視覺替代提示（Step 205）。
 * 不識字幼兒僅看圖卡與脈衝即可完成回合。
 *
 * W2（Round 2 紅線）：故事長信**不得**滲入 `#visual-fallback`。
 *   - `#story-root` 開啟時（故事信件本身就在畫面上）→ 完全不寫入。
 *   - 非回合遊玩狀態（教學／角色選擇／地圖）→ 完全不寫入。
 *   - 回合進行中 → 改寫入**當題的結構化圖卡**（而非整段文字）。
 */
on("voice:unavailable", (event) => {
    const payload = /** @type {any} */ (event?.payload || {});

    // W2：故事過場中 → 不得把長信寫進視覺替代區（信件本身已在畫面上）
    if (isStorySceneOpen()) {
        hideVisualFallback(document.body);
        hideVisualFallback(document.getElementById("tv-view") || document.body);
        return;
    }

    // W2：非回合遊玩狀態 → 不得寫入視覺替代區（避免污染教學／地圖）
    if (!isRoundPlaying()) {
        hideVisualFallback(document.body);
        hideVisualFallback(document.getElementById("tv-view") || document.body);
        return;
    }

    const root = document.getElementById("tv-view") || document.body;
    const cards = currentRoundCards();
    showVisualFallback(root, {
        // 回合進行中一律只呈現圖卡；文字僅在極短（<= 24 字）時作為提示
        text: !cards.length && payload.text && String(payload.text).length <= 24
            ? String(payload.text)
            : "",
        cards: cards.length ? cards : undefined,
        reason: payload.reason ? String(payload.reason) : "unsupported",
        locale: payload.locale ? String(payload.locale) : locale
    });
    const live = document.getElementById("sr-live");
    if (live) {
        live.textContent = locale === "en-US"
            ? "Voice unavailable. Use the visual cards to answer."
            : "語音無法使用，請看視覺圖卡作答";
    }
});

/**
 * 最小對的視覺替代：兩個音並列成大字卡。
 *
 * W2：故事過場中不得呈現（信件本身已在畫面上）。
 */
on("voice:pair", (event) => {
    if (isStorySceneOpen() || !isRoundPlaying()) return;

    const payload = /** @type {any} */ (event?.payload || {});
    const root = document.getElementById("tv-view") || document.body;
    const pair = Array.isArray(payload.pair) ? payload.pair.map((/** @type {any} */ w) => String(w)) : [];
    showVisualFallback(root, {
        pair,
        locale: payload.locale ? String(payload.locale) : locale
    });
});

/**
 * 示範播放（demonstrate）時的視覺替代（V4／W2）。
 *
 * 語音不可用／視覺輔助開啟時，於 `#visual-fallback` 呈現**當題的順序大圖卡**
 * （含醒目序號與高亮節拍），而非只顯示空泛警告字。
 *
 * W2：同時傳入當題的**結構化 cards**（當回合無序列時改以圖卡呈現），
 *     並在非回合狀態下直接略過（不得污染其他畫面）。
 */
on("round:demonstrate", (event) => {
    const payload = /** @type {any} */ (event?.payload || {});
    const root = document.getElementById("tv-view") || document.body;

    // W2：非回合遊玩狀態 → 不呈現視覺替代（避免污染教學／地圖）
    if (!isRoundPlaying()) return;

    const steps = currentDemoSteps();
    const cards = currentRoundCards();
    if (!steps.length && !cards.length) return;

    showVisualFallback(root, {
        reason: payload.reason ? String(payload.reason) : "unsupported",
        locale,
        sequence: steps.length ? steps : undefined,
        cards: steps.length ? undefined : cards,
        activeIndex: typeof payload.activeIndex === "number" ? payload.activeIndex : -1,
        beats: typeof payload.beats === "number" ? payload.beats : steps.length
    });
});

on("round:listen", () => {
    setStatus(locale === "en-US" ? "Listen..." : "聽一聽…");
    $("turn-signal").classList.remove("on");
    renderRound();
});

on("round:input-ready", () => {
    setStatus(locale === "en-US" ? "Your turn!" : "換你了！");
    $("turn-signal").classList.add("on");
});

on("round:correct", () => {
    // Step 126／128：回合回饋三重奏統一由 round-feedback.js 負責
    feedbackCorrect();
    hideVisualFallback(document.body);

    // 角色專屬的慶祝音效（content/characters.json 的 traits.celebrate）
    playCompanionSfx("celebrate");

    // 選項按鈕的成功動畫（放大回彈 + 綠色描邊）
    const btn = document.querySelector(".control-btn--chosen") || document.querySelector(".control-btn");
    if (btn) {
        btn.classList.add("control-btn--correct");
        window.setTimeout(() => {
            btn.classList.remove("control-btn--correct");
            btn.classList.remove("control-btn--chosen");
        }, 600);
    }
});

on("round:wrong", () => {
    // Step 128：友善提示（hint mood，**不得** sad、不得負面音效）
    feedbackWrong();

    // 不得有倒數、扣分、負面音效
    setStatus(locale === "en-US" ? "Try again!" : "再試一次！");
});

on("round:hint", () => {
    haptic("tap");
    playSfx("ui.hint");
});

on("round:progress", () => {
    // 中性過程回饋（如記憶玩法翻牌未配對）—— 不播放慶祝也不顯示「答錯」
    haptic("tap");
    updateSequenceProgress();
});

on("round:step", () => {
    // Step 126：序列玩法的中間步驟（答對一項但回合未完成）必須有**獨立的回饋**
    //  - 該項點亮（持久化的視覺標記）
    //  - 角色給一個小反應（獨立於答對回饋）
    //  - 不得顯示「答錯」、不得扣分
    markSequenceStepLit();
    feedbackStep();
    updateSequenceProgress();
});

on("level:complete", () => {
    feedbackLevelComplete();
});

/**
 * 渲染回合選項。
 *
 * 依 `engine.kind` 分派（**不得**以玩法名稱分派）：
 *   "choice"   → 按鈕網格
 *   "sequence" → 按鈕網格 ＋ 序列進度指示（不得洩漏答案順序）
 *   "place"    → 拼合盤（目標區 ＋ 素材區）
 *   "match"    → 翻牌網格
 */
function renderRound() {
    const engine = session?.engine;
    const controls = $("controls-view");
    if (!engine || !controls) return;

    const options = engine.getOptions?.() || [];
    const prompt = engine.getPrompt?.() || "";
    $("status-text").textContent = prompt;

    const bubble = $("bubble");
    const content = $("bubble-content");
    if (prompt) {
        content.textContent = prompt;
        bubble.classList.add("show");
    }

    const kind = engine.kind;

    // 拼合玩法：拼合盤
    if (kind === "place") {
        renderPuzzleBoard(controls, engine);
        return;
    }

    // 記憶力玩法：翻牌網格
    if (kind === "match") {
        renderMemoryBoard(controls, engine);
        return;
    }

    // 單選與序列：按鈕網格（序列另加進度指示）
    controls.innerHTML = `
        ${kind === "sequence" ? renderSequenceProgress() : ""}
        <div class="controls-grid grid-3">${options.map((/** @type {any} */ o, /** @type {number} */ i) => `
        <button class="control-btn control-btn--badge" data-item="${o.id}" type="button"
                aria-label="${escapeAttr(o.label || o.id)}">
            <span class="control-btn__no" aria-hidden="true">${i + 1}</span>
            ${o.image
                ? `<img class="control-btn__art" src="${escapeAttr(o.image)}" alt="" />`
                : `<span class="control-btn__glyph" aria-hidden="true">${OPTION_GLYPHS[i % OPTION_GLYPHS.length]}</span>`}
            ${o.label ? `<span class="control-btn__label">${escapeAttr(o.label)}</span>` : ""}
        </button>
    `).join("")}</div>
    `;

    controls.querySelectorAll("[data-item]").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (state.locked) return;
            haptic("tap");
            playSfx("ui.tap");
            const id = /** @type {HTMLElement} */ (btn).dataset.item || "";
            session.answer(id);
            if (kind === "sequence") updateSequenceProgress();
        });
    });
}

/**
 * 序列玩法的進度指示。
 *
 * 只顯示「已答對幾項」，**不得**洩漏答案順序。
 * @returns {string}
 */
function renderSequenceProgress() {
    const engine = session?.engine;
    const total = engine?.getSequence?.()?.length || 0;
    const done = sequenceDoneCount();
    const dots = Array.from({ length: total }, (_, i) => `
        <span class="seq-dot${i < done ? " is-on" : ""}"></span>
    `).join("");
    return `<div class="seq-progress" data-seq-progress>${dots}</div>`;
}

/**
 * 目前序列已答對的項數。
 *
 * 以公開狀態的 `sequence` 與引擎的 `getFeedback()` 推算。
 * @returns {number}
 */
function sequenceDoneCount() {
    const engine = session?.engine;
    const seq = engine?.getSequence?.() || [];
    if (!seq.length) return 0;
    let done = 0;
    for (const id of seq) {
        if (engine.getFeedback?.() === id) break;
        done++;
    }
    return done;
}

/**
 * 更新序列進度指示。
 */
function updateSequenceProgress() {
    const box = document.querySelector("[data-seq-progress]");
    if (!box) return;
    const engine = session?.engine;
    const total = engine?.getSequence?.()?.length || 0;
    const done = sequenceDoneCount();
    box.querySelectorAll(".seq-dot").forEach((dot, i) => {
        dot.classList.toggle("is-on", i < done);
    });
    void total;
}

/**
 * 渲染拼合盤。
 *
 * 上方目標區（顯示已正確放置的切片）、下方素材區（待放置切片）。
 * 點素材切片 → 選取；點目標格 → 放置。
 *
 * @param {HTMLElement} controls
 * @param {any} engine
 */
function renderPuzzleBoard(controls, engine) {
    const pieces = engine.getPieces?.() || [];
    const grid = Math.max(1, Math.ceil(Math.sqrt(pieces.length || 1)));
    const total = grid * grid;

    controls.innerHTML = `
        <div class="puzzle-board">
            <div class="puzzle-target" data-puzzle-target>
                ${Array.from({ length: total }, (_, i) => `
                    <button class="puzzle-slot" data-target-index="${i}" type="button" aria-label=""></button>
                `).join("")}
            </div>
            <div class="puzzle-tray" data-puzzle-tray>
                ${pieces.map((/** @type {any} */ p) => `
                    <button class="puzzle-piece" data-piece-index="${p.index}" type="button">
                        <img src="${p.dataUrl}" alt="" />
                    </button>
                `).join("")}
            </div>
        </div>
    `;

    /** @type {number|null} */
    let selected = null;

    const tray = controls.querySelector("[data-puzzle-tray]");
    const target = controls.querySelector("[data-puzzle-target]");

    tray?.querySelectorAll("[data-piece-index]").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (state.locked) return;
            const idx = Number(/** @type {HTMLElement} */ (btn).dataset.pieceIndex);
            if (!Number.isFinite(idx)) return;
            selected = idx;
            haptic("tap");
            playSfx("ui.tap");
            tray.querySelectorAll(".puzzle-piece").forEach((el) => {
                el.classList.toggle("is-selected", el === btn);
            });
        });
    });

    target?.querySelectorAll("[data-target-index]").forEach((slot) => {
        slot.addEventListener("click", () => {
            if (state.locked) return;
            if (selected === null) return;
            const targetIndex = Number(/** @type {HTMLElement} */ (slot).dataset.targetIndex);
            const pieceIndex = selected;
            selected = null;
            tray?.querySelectorAll(".puzzle-piece").forEach((el) => el.classList.remove("is-selected"));

            const result = session.answer({ pieceIndex, targetIndex }) ?? { correct: false, done: false };

            if (result.correct) {
                // 正確：吸附進目標區 ＋ 粒子回饋
                const piece = pieces.find((/** @type {any} */ p) => p.index === pieceIndex);
                // 圖片以 DOM API 建立（不經 innerHTML 注入內容型資料）
                slot.textContent = "";
                if (piece?.dataUrl) {
                    const img = document.createElement("img");
                    img.src = piece.dataUrl;
                    img.alt = "";
                    slot.appendChild(img);
                }
                slot.classList.add("is-filled");
                tray?.querySelector(`[data-piece-index="${pieceIndex}"]`)?.remove();
                haptic("correct");
                playSfx("glass.chime");
                burst($("snow-container"), { kind: "sparkle", count: 10 });
            } else {
                // 錯誤：素材彈回 ＋ 低音回饋
                const btn = tray?.querySelector(`[data-piece-index="${pieceIndex}"]`);
                if (btn) {
                    btn.classList.add("is-wrong");
                    setTimeout(() => btn.classList.remove("is-wrong"), 500);
                }
                haptic("wrong");
                playSfx("ui.soft-low");
            }
        });
    });
}

/**
 * 渲染記憶翻牌網格。
 * @param {HTMLElement} controls
 * @param {any} engine
 */
function renderMemoryBoard(controls, engine) {
    const cards = engine.getCards() || [];

    controls.innerHTML = `<div class="memory-grid">${cards.map((/** @type {any} */ c) => `
        <div class="dex-card dex-card--memory" data-slot="${Number(c.slot) || 0}" role="button" tabindex="0"
             aria-label="${locale === "en-US" ? "Footprint card" : "恐龍足跡卡"}">
            <div class="memory-face memory-face--back">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f7fbff"
                     stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3c-3 0-4 3-4 6 0 2 1 3 1 5s1 4-1 6-3 1-4-1" />
                    <path d="M16 5c2 1 2 3 2 5" />
                </svg>
            </div>
            <div class="memory-face memory-face--front">
                <span class="control-btn__label"></span>
            </div>
        </div>
    `).join("")}</div>`;

    // 內容型資料（卡面圖樣）以 textContent 注入，不經 innerHTML
    controls.querySelectorAll(".dex-card--memory").forEach((card, i) => {
        const label = card.querySelector(".control-btn__label");
        if (label) label.textContent = safeText(cards[i]?.shape);
    });

    const handleFlip = (/** @type {HTMLElement} */ card) => {
        if (state.locked) return;
        const slot = Number(card.dataset.slot);
        haptic("tap");
        playSfx("paper.flip");

        // 翻牌的視覺回饋**立即**發生（不等 submit 回傳）
        card.classList.add("is-flipped");

        // 統一由 session 走引擎契約，回傳結果供 UI 決定回饋
        const result = session.answer({ slot }) ?? { correct: false, done: false };

        if (result.correct) {
            playSfx("glass.chime");
            haptic("correct");
            setTimeout(() => {
                card.classList.add("is-matched");
            }, 400);
        }
    };

    controls.querySelectorAll("[data-slot]").forEach((card) => {
        card.addEventListener("click", () => handleFlip(/** @type {HTMLElement} */ (card)));
        card.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleFlip(/** @type {HTMLElement} */ (card));
            }
        });
    });
}

/**
 * 設定狀態文字。
 * @param {string} text
 */
function setStatus(text) {
    const el = $("status-text");
    if (el) el.textContent = text;
}

/* ---------- 事件綁定 ---------- */
function wire() {
    const startOverlay = $("start-overlay");
    if (startOverlay) {
        startOverlay.addEventListener("click", startGame, { once: true });
    }

    /*
     * W4：開始畫面主 CTA（#start-cta）為真正的按鈕 ——
     * 明確綁定點擊並把焦點移入遊戲流程，鍵盤 Enter／Space 亦可啟動。
     * （事件會冒泡到 #start-overlay，但明確綁定可確保語意正確。）
     */
    const startCta = $("start-cta");
    if (startCta) {
        startCta.addEventListener("click", (event) => {
            // 阻止冒泡到 #start-overlay（避免重複呼叫；startGame 另有 started 旗標防護）
            event.stopPropagation();
            startGame();
        });
        // 焦點落在主 CTA 上（鍵盤／螢幕閱讀器使用者可直接 Enter 開始）
        try {
            startCta.focus({ preventScroll: true });
        } catch {
            startCta.focus();
        }
    }

    const replayBtn = $("replay-btn");
    replayBtn?.addEventListener("click", () => {
        session?.replay();
        playSfx("ui.listen");
    });

    // 工具列「回地圖」（V3）：關卡進行中隨時可回選關畫面
    const mapToolBtn = $("back-to-map-tool-btn");
    mapToolBtn?.addEventListener("click", () => {
        if (mapToolBtn.getAttribute("aria-disabled") === "true") return;
        hideVisualFallback(document.body);
        clearRoundHud();
        session?.stop?.();
        showLevelMap();
    });

    const slowBtn = $("slow-mode-btn");
    slowBtn?.addEventListener("click", () => {
        state.slowMode = !state.slowMode;
        session?.setPace(state.slowMode ? 3500 : 2000);
        slowBtn.textContent = state.slowMode ? "◑" : "◔";
        hud?.toast(state.slowMode
            ? (locale === "en-US" ? "Let's go slow" : "我們慢慢來")
            : (locale === "en-US" ? "Let's go fast!" : "快一點出發！"));
    });

    const musicBtn = $("music-control-btn");
    musicBtn?.addEventListener("click", () => {
        const scene = currentSceneId || "daily";
        const playing = hasSceneMusic(scene);
        if (playing && !musicBtn.getAttribute("aria-pressed")) {
            // 目前未在播放 → 播放當前場景主題曲
            playSceneMusic(scene);
            musicBtn.setAttribute("aria-pressed", "true");
        } else {
            stopSceneMusic(600);
            stopMusic(600);
            musicBtn.setAttribute("aria-pressed", "false");
        }
    });

    // 視線追隨
    document.addEventListener("pointermove", (e) => {
        lookAt($("santa-container"), e.clientX, e.clientY);
    });

    // 視差場景（Step 120：水平 + 垂直位移）
    document.addEventListener("pointermove", (e) => {
        const x = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 40;
        const y = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 24;
        setParallax($("scene"), x, y);
    });

    // 觸控視差（Step 120）：觸控裝置的等效視差來源，必須 passive
    document.addEventListener("touchmove", (e) => {
        const touch = e.touches?.[0];
        if (!touch) return;
        const x = (touch.clientX / Math.max(1, window.innerWidth) - 0.5) * 40;
        const y = (touch.clientY / Math.max(1, window.innerHeight) - 0.5) * 24;
        setParallax($("scene"), x, y);
    }, { passive: true });

    // 圖鑑 / 家長報告 / 付費牆 事件（由關卡地圖與 HUD 觸發）
    document.addEventListener("dex:request", () => {
        const root = $("dex-root");
        // F8：圖鑑自帶「關上」按鈕，關上後回到**開啟圖鑑的那個畫面**
        renderDex(root, bundle, progress, locale, () => {
            closeTopOverlay(root);
        });
        root.classList.remove("hidden");
        pushOverlay("dex");
        track("level_map_view", { chapter: 0 });
    });

    document.addEventListener("parent:request", async () => {
        await openParentReportView();
    });

    /**
     * 開啟家長報告。
     *
     * 家長端**必須**通過家長閘門（算術題或長按 3 秒），避免幼兒誤入評量介面。
     * 同一 session 已通過閘門者不重複詢問（評量完成後回填報告時使用）。
     *
     * @param {boolean} [forceGate] 強制重新詢問閘門
     * @returns {Promise<boolean>}
     */
    async function openParentReportView(forceGate = false) {
        const gateRoot = $("parent-report-root");
        if (forceGate || !parentGatePassed) {
            const passed = await requireParentalGate(gateRoot, {
                reason: locale === "en-US" ? "Parent verification" : "請家長先驗證"
            });
            if (!passed) return false;
            parentGatePassed = true;
        }

        const root = $("parent-report-root");
        renderParentReport(root, progress, bundle, locale);
        // F8：家長報告必須有「關上」路徑（仍需經過家長閘門才能進入，此處只是離開）
        const back = document.createElement("button");
        back.className = "level-btn level-btn--secondary overlay__back";
        back.id = "parent-report-close";
        back.type = "button";
        back.setAttribute("aria-label", locale === "en-US" ? "Close" : "關上");
        back.textContent = locale === "en-US" ? "Close" : "關上";
        back.addEventListener("click", () => {
            closeTopOverlay(root);
        });
        root.appendChild(back);
        root.classList.remove("hidden");
        pushOverlay("parent-report");
        track("parent_report_view", {});

        // 成效評量入口
        root.querySelector("#parent-assessment-start")?.addEventListener("click", () => {
            root.dispatchEvent(new CustomEvent("assessment:request", { bubbles: true }));
        });
        return true;
    }

    /**
     * 成效評量入口（Step 157）：經家長閘門驗證後方可進入前／後測。
     *
     * 評量結果寫入獨立儲存鍵，不得汙染兒童遊戲進度。
     */
    document.addEventListener("assessment:request", async () => {
        const gateRoot = $("parent-report-root");
        const passed = await requireParentalGate(gateRoot, {
            reason: locale === "en-US" ? "Parent verification" : "請家長先驗證"
        });
        if (!passed) return;

        const phase = nextPhase();
        if (!phase) return;

        const root = $("assessment-root");
        $("parent-report-root").classList.add("hidden");

        root.innerHTML = "";
        root.classList.remove("hidden");
        pushOverlay("assessment");

        runAssessment(root, bundle, locale, phase, (summary) => {
            track("assessment_complete", { phase, correctRate: summary?.correctRate ?? 0 });
            // 完成後回到家長報告以檢視閉環結果
            root.classList.add("hidden");
            const idx = overlayStack.indexOf("assessment");
            if (idx >= 0) overlayStack.splice(idx, 1);
            void openParentReportView();
        });
    });

    document.addEventListener("paywall:request", (/** @type {CustomEvent} */ e) => {
        const feature = e.detail?.feature || "chapter4";
        showPaywall($("share-root"), {
            id: feature,
            title: locale === "en-US" ? "Unlock the full journey" : "解鎖完整旅程",
            body: locale === "en-US"
                ? "Chapters 4 and 5, the dinosaur valley theme pack and the full parent report. Your data stays on this device; nothing is uploaded to a server."
                : "第 4–5 章、恐龍谷主題包與家長報告完整版。所有資料僅儲存於本機裝置，不會上傳到伺服器。",
            cta: locale === "en-US" ? "Subscribe annually" : "訂閱年方案",
            price: "NT$790 / 年",
            features: []
        });
    });

    // 分享成果卡
    document.addEventListener("share:request", (/** @type {CustomEvent} */ e) => {
        const kind = e.detail?.kind || "learning";
        const card = buildShareCard(bundle, progress, kind, {
            referralCode: progress.referralCode,
            dinoId: e.detail?.dinoId
        });
        const share = shareToLine(card.dataUrl, card.text, { code: progress.referralCode });

        const root = $("share-root");
        root.innerHTML = `
            <div class="share-panel">
                <h2>${locale === "en-US" ? "Share the achievement" : "分享這份成果"}</h2>
                <img class="share-panel__card" src="${card.dataUrl}" alt="" />
                <p class="share-panel__text">${card.text}</p>
                <a class="level-btn" id="share-line" href="${share.lineUrl}" target="_blank" rel="noopener">
                    ${locale === "en-US" ? "Share on LINE" : "分享到 LINE"}
                </a>
                <button class="level-btn level-btn--secondary" id="share-close" type="button">
                    ${locale === "en-US" ? "Close" : "關閉"}
                </button>
            </div>
        `;
        root.classList.remove("hidden");
        trackShare("share_click", {
            cardKind: kind,
            channel: "line",
            referralCode: progress.referralCode
        });
        root.querySelector("#share-close")?.addEventListener("click", () => {
            root.classList.add("hidden");
        });
    });

    // 設定按鈕：開啟音量設定與無障礙偏好
    const settingsBtn = $("settings-btn");
    settingsBtn?.addEventListener("click", () => {
        const root = $("audio-settings-root");
        root.classList.remove("hidden");
        audioSettings?.reload();

        // 面板內加上面板切換與關閉（V3：集中於卡片底部動作列）
        const actions = root.querySelector("#settings-card-actions") || root;
        if (!root.querySelector("#settings-a11y")) {
            const toggle = document.createElement("button");
            toggle.id = "settings-a11y";
            toggle.className = "level-btn level-btn--secondary";
            toggle.type = "button";
            toggle.textContent = locale === "en-US" ? "Accessibility" : "無障礙設定";
            toggle.addEventListener("click", () => {
                const a11yRoot = $("a11y-root");
                a11yRoot.classList.remove("hidden");
                preferencesPanel?.applyPreferences();
            });
            actions.appendChild(toggle);

            // Step 167：家長可隨時開啟安裝引導
            if (!root.querySelector("#settings-install")) {
                const installToggle = document.createElement("button");
                installToggle.id = "settings-install";
                installToggle.className = "level-btn level-btn--secondary";
                installToggle.type = "button";
                installToggle.textContent = locale === "en-US" ? "Add to Home Screen" : "加入主畫面";
                installToggle.addEventListener("click", () => {
                    root.classList.add("hidden");
                    showInstallGuide($("pwa-install-root"), locale);
                });
                actions.appendChild(installToggle);
            }

            // Step 133／134：家長可隨時開啟同意設定（撤回個別同意）
            if (!root.querySelector("#settings-consent")) {
                const consentToggle = document.createElement("button");
                consentToggle.id = "settings-consent";
                consentToggle.className = "level-btn level-btn--secondary";
                consentToggle.type = "button";
                consentToggle.textContent = locale === "en-US" ? "Privacy consent" : "隱私權同意";
                consentToggle.addEventListener("click", async () => {
                    root.classList.add("hidden");
                    await openConsentSettings($("consent-gate-root"), locale);
                    root.classList.remove("hidden");
                });
                actions.appendChild(consentToggle);
            }

            // V3：設定卡內的「回到地圖」——家長調整完設定可直接回到選關畫面
            if (!root.querySelector("#settings-back-to-map")) {
                const mapToggle = document.createElement("button");
                mapToggle.id = "settings-back-to-map";
                mapToggle.className = "level-btn level-btn--secondary";
                mapToggle.type = "button";
                mapToggle.textContent = locale === "en-US" ? "Level Map" : "回到地圖";
                mapToggle.addEventListener("click", () => {
                    root.classList.add("hidden");
                    // W3：關閉設定後回到地圖不得軟鎖 —— showLevelMap() 會關閉
                    // 所有其他遮罩並重新渲染地圖內容。
                    showLevelMap();
                });
                actions.appendChild(mapToggle);
            }

            const close = document.createElement("button");
            close.id = "settings-close";
            close.className = "level-btn";
            close.type = "button";
            close.textContent = locale === "en-US" ? "Close" : "關閉";
            close.addEventListener("click", () => root.classList.add("hidden"));
            actions.appendChild(close);
        }
    });

    // 裝置方向：直向已支援單欄遊玩（responsive.css portrait 規則），
    // 因此**不再**鎖死畫面要求轉橫；此處僅確保方向遮罩保持關閉。
    const orient = $("orientation-overlay");
    const checkOrientation = () => {
        orient?.classList.add("hidden");
    };
    window.addEventListener("resize", checkOrientation);
    checkOrientation();
}

boot();
