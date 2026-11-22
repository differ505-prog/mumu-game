/**
 * 主流程 — 載入內容 → 序章 → 角色選擇 → 關卡地圖 → 回合 → 結算。
 */

import { loadContent } from "./data/load-content.js";
import { getLevel } from "./data/levels.js";
import { playableCharacters, getCharacter } from "./data/characters.js";
import { chapterTitle, pickLine } from "./data/story.js";
import { createSession } from "./core/session.js";
import { createVerbForLevel } from "./verbs/index.js";
import { state, setState } from "./core/state.js";
import { on } from "./core/events.js";
import { setTimeline, play as playTimeline } from "./core/timeline.js";
import { ensureAudio } from "./audio/mixer.js";
import { speak, setVoiceProfile } from "./audio/voice.js";
import { playSfx, playDinoRoar, setSfxMap } from "./audio/sfx.js";
import { createHud } from "./ui/hud.js";
import { renderCharacter, playRoar, playHatch, playUnlock, playComplete, lookAt } from "./ui/character-render.js";
import { haptic } from "./ui/haptics.js";
import { burst, startAmbientSnow } from "./ui/particles.js";
import { animate } from "./ui/motion.js";
import { APP } from "./core/config.js";
import { verbLabel, verbById } from "./core/verbs.js";
import { renderLevelMap } from "./ui/levelmap.js";
import { renderDex } from "./ui/dex.js";
import { renderParentReport } from "./ui/parent-report.js";
import { createAudioSettings } from "./ui/settings-audio.js";
import { createPreferencesPanel, applyPreferences } from "./ui/a11y.js";
import { createTutorial } from "./ui/tutorial.js";
import { showLetter as showLetterScene } from "./ui/story.js";
import { showPaywall } from "./ui/paywall.js";
import { buildShareCard, shareToLine } from "./ui/share-card.js";
import { loadProgress, saveProgress, recordLevelResult, unlockDex, updateStreak, todayString } from "./core/progress.js";
import { recordLearningSample, checkDexUnlock, setChildVoice, childVoice } from "./core/dex.js";
import { requireParentalGate } from "./core/parental-gate.js";
import { track, trackShare } from "./core/telemetry.js";
import { referralCode, consumeReferral } from "./core/referral.js";
import { createMasteryEntry, updateMastery } from "./core/mastery.js";
import { buildScene, setParallax, applyTheme, setScenePalettes } from "./ui/parallax.js";
import { setMusicMap, playMusic, stopMusic, playSceneMusic, stopSceneMusic, hasSceneMusic } from "./audio/music.js";

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
/** @type {any} */
let progress = null;
/** @type {any} */
let audioSettings = null;
/** @type {any} */
let preferencesPanel = null;

/* ---------- DOM 快捷存取 ---------- */
const $ = (/** @type {string} */ id) => document.getElementById(id);

/* ---------- 啟動 ---------- */
async function boot() {
    locale = detectLocale();

    try {
        bundle = await loadContent(locale);
    } catch (err) {
        console.error("[main] 內容載入失敗", err);
        setStatus("內容載入失敗，請重新整理頁面");
        return;
    }

    // 進度與推薦碼
    progress = loadProgress();
    if (!progress.referralCode) {
        progress.referralCode = referralCode();
        saveProgress(progress);
    }
    const ref = new URLSearchParams(location.search).get("ref");
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

    // 場景與偏好
    buildScene($("scene"));
    applyPreferences(document.body);
    audioSettings = createAudioSettings($("audio-settings-root"));
    preferencesPanel = createPreferencesPanel($("a11y-root"), locale);

    wire();
    startAmbientSnow($("snow-container"));

    track("session_start", { chapter: 1, sessionMs: 0 });
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
    setParallax($("scene"), 0);
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
async function loadScenes() {
    try {
        const res = await fetch("./content/scenes.json", { cache: "no-cache" });
        if (res.ok) setScenePalettes(await res.json());
    } catch (err) {
        console.warn("[main] 場景設定載入失敗", err);
    }
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

    const prologueRaw = bundle.narrative?.letters?.prologue;
    const letter = typeof prologueRaw === "string"
        ? prologueRaw
        : (prologueRaw?.[locale] || "");
    const char = getCharacter(bundle, selectedCharacter);
    setVoiceProfile(locale, char.voice);
    renderCharacter($("santa-container"), char, "idle");

    showLetter(letter, () => {
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

    const finish = () => {
        localStorage.setItem("mumu.tutorial.done", "1");
        root.classList.add("hidden");
        showCharacterSelect();
    };

    // 直接使用 tutorial 公開的 next()／skip()，不包裝
    tutorial.onDone(finish);
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

    showLetterScene(root, text, locale === "en-US" ? "— Santa" : "—— 聖誕老人", onClose);
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
}

/**
 * 關卡地圖。
 *
 * F8：回到地圖時必須把**遊戲畫面收起來**，否則地圖底下仍殘留回合畫面。
 */
function showLevelMap() {
    const overlay = $("levelmap-root");

    // 收起遊戲畫面（地圖是全屏遮罩）
    $("game-container")?.classList.add("hidden");
    $("level-up-overlay")?.classList.add("hidden");
    $("level-complete-container")?.classList.add("hidden");

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
}

/**
 * 開始一個關卡。
 * @param {number} levelId
 */
function startLevel(levelId) {
    currentLevelId = levelId;
    const level = getLevel(bundle, levelId);

    $("game-container").classList.remove("hidden");
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

    // 角色跟上章節
    const char = getCharacter(bundle, selectedCharacter);
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
    for (const dino of bundle.dex || []) {
        if (!checkDexUnlock(bundle, progress, dino.id)) continue;
        if (unlockDex(progress, dino.id)) {
            track("dex_unlock", { dinoId: dino.id, chapter: level.chapter });
            hud.toast(
                locale === "en-US" ? `New dinosaur: ${dino.name?.[locale] || dino.id}` : `新夥伴解鎖：${dino.name?.["zh-TW"] || dino.id}`,
                "good"
            );
            playEvent("dex:unlock");
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

/* ---------- 回合 UI ---------- */
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
    haptic("correct");
    playSfx("chime.bell");
    const engine = session?.engine;
    const opts = engine?.getOptions?.() || [];
    const btn = document.querySelector(".control-btn");
    if (btn) {
        btn.classList.add("control-btn--correct");
        setTimeout(() => btn.classList.remove("control-btn--correct"), 500);
    }
    void opts;
});

on("round:wrong", () => {
    haptic("wrong");
    playSfx("ui.soft-low");
    animate(".char__art", "shake");
    setStatus(locale === "en-US" ? "Try again!" : "再試一次！");
});

on("round:hint", () => {
    haptic("tap");
    playSfx("ui.hint");
});

on("round:progress", () => {
    // 序列／拼合的進行中回饋（回合尚未結束）
    haptic("tap");
    updateSequenceProgress();
});

on("level:complete", () => {
    haptic("celebrate");
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
        <div class="controls-grid grid-3">${options.map((/** @type {any} */ o) => `
        <button class="control-btn" data-item="${o.id}" type="button">
            ${o.image ? `<img src="${o.image}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-sm);" />` : ""}
            ${o.label ? `<span class="control-btn__label">${o.label}</span>` : ""}
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
                slot.innerHTML = piece?.dataUrl ? `<img src="${piece.dataUrl}" alt="" />` : "";
                slot.classList.add("is-filled");
                tray?.querySelector(`[data-piece-index="${pieceIndex}"]`)?.remove();
                haptic("correct");
                playSfx("chime.bell");
                burst($("particle-layer"), { kind: "sparkle", count: 10 });
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
        <div class="dex-card dex-card--memory" data-slot="${c.slot}" role="button" tabindex="0"
             aria-label="${locale === "en-US" ? "Footprint card" : "恐龍足跡卡"}">
            <div class="memory-face memory-face--back">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f7fbff"
                     stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3c-3 0-4 3-4 6 0 2 1 3 1 5s1 4-1 6-3 1-4-1" />
                    <path d="M16 5c2 1 2 3 2 5" />
                </svg>
            </div>
            <div class="memory-face memory-face--front">
                <span class="control-btn__label">${c.shape}</span>
            </div>
        </div>
    `).join("")}</div>`;

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
            playSfx("chime.bell");
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

    const replayBtn = $("replay-btn");
    replayBtn?.addEventListener("click", () => {
        session?.replay();
        playSfx("ui.listen");
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

    // 視差場景
    document.addEventListener("pointermove", (e) => {
        const offset = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 40;
        setParallax($("scene"), offset);
    });

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
        // 家長端必須通過家長閘門（算術題或長按 3 秒），避免幼兒誤入評量介面
        const gateRoot = $("parent-report-root");
        const passed = await requireParentalGate(gateRoot, {
            reason: locale === "en-US" ? "Parent verification" : "請家長先驗證"
        });
        if (!passed) return;

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
    });

    document.addEventListener("paywall:request", (/** @type {CustomEvent} */ e) => {
        const feature = e.detail?.feature || "chapter4";
        showPaywall($("share-root"), {
            id: feature,
            title: locale === "en-US" ? "Unlock the full journey" : "解鎖完整旅程",
            body: locale === "en-US"
                ? "Chapters 4 and 5, the dinosaur valley theme pack, the full parent report and cross-device sync."
                : "第 4–5 章、恐龍谷主題包、家長報告完整版與跨裝置同步。",
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

        // 面板內加上面板切換與關閉
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
            root.appendChild(toggle);

            const close = document.createElement("button");
            close.id = "settings-close";
            close.className = "level-btn level-btn--secondary";
            close.type = "button";
            close.textContent = locale === "en-US" ? "Close" : "關閉";
            close.addEventListener("click", () => root.classList.add("hidden"));
            root.appendChild(close);
        }
    });

    // 視窗改變時切換橫向提示
    const orient = $("orientation-overlay");
    const checkOrientation = () => {
        const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 500;
        orient?.classList.toggle("hidden", !portrait || !$("start-overlay").classList.contains("hidden"));
    };
    window.addEventListener("resize", checkOrientation);
    checkOrientation();
}

boot();
