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
import { renderCharacter, playRoar, playHatch, lookAt } from "./ui/character-render.js";
import { haptic } from "./ui/haptics.js";
import { burst, startAmbientSnow } from "./ui/particles.js";
import { animate } from "./ui/motion.js";
import { APP } from "./core/config.js";
import { VERBS, verbLabel } from "./core/verbs.js";

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
/** @type {number} */
let currentLevelId = 1;

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

    hud = createHud($("hud"));
    hud.update({ chapter: 1, chapterTitle: chapterTitle(bundle, locale, 1) });

    await loadTimeline();
    await loadSfx();
    wire();
    startAmbientSnow($("snow-container"));

    showStart();
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
function showStart() {
    const overlay = $("start-overlay");
    overlay.classList.remove("hidden");
    overlay.addEventListener("click", startGame, { once: true });
}

/**
 * 開始遊戲：解鎖音訊 → 序章信 → 角色選擇。
 */
async function startGame() {
    ensureAudio(locale);
    $("start-overlay").classList.add("hidden");

    const letter = bundle.narrative.letters.prologue?.[locale] || "";
    const char = getCharacter(bundle, selectedCharacter);
    setVoiceProfile(locale, char.voice);
    renderCharacter($("santa-container"), char, "idle");

    showLetter(letter);
    setTimeout(() => showCharacterSelect(), 2600);
}

/**
 * 顯示序章信件。
 * @param {string} text
 */
function showLetter(text) {
    const bubble = $("bubble");
    const content = $("bubble-content");
    content.textContent = text;
    bubble.classList.add("show");
    speak(text, { locale });
    burst($("snow-container"), { kind: "sparkle", count: 16 });
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

    overlay.classList.remove("hidden");
}

/**
 * 關卡地圖。
 */
function showLevelMap() {
    const overlay = $("levelmap-root");
    const levels = bundle.levels || [];

    overlay.innerHTML = `
        <h1>${locale === "en-US" ? "Choose a Level" : "選擇關卡"}</h1>
        <div class="dex-grid">
            ${levels.map((/** @type {any} */ l) => `
                <button class="mode-option" data-level="${l.id}" type="button">
                    <div class="mode-title">${l.id}. ${l.name[locale] || l.name["zh-TW"]}</div>
                    <div class="mode-desc">${VERBS[l.verb] ? verbLabel(l.verb, locale) : l.verb}</div>
                    <div class="mode-desc">${l.objective[locale] || l.objective["zh-TW"]}</div>
                </button>
            `).join("")}
        </div>
        <button class="level-btn level-btn--secondary" id="levelmap-close" type="button">
            ${locale === "en-US" ? "Back" : "返回"}
        </button>
    `;

    overlay.querySelectorAll("[data-level]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = Number(/** @type {HTMLElement} */ (btn).dataset.level);
            overlay.classList.add("hidden");
            startLevel(id);
        });
    });

    $("levelmap-close")?.addEventListener("click", () => {
        overlay.classList.add("hidden");
        showCharacterSelect();
    });

    overlay.classList.remove("hidden");
}

/**
 * 開始一個關卡。
 * @param {number} levelId
 */
function startLevel(levelId) {
    currentLevelId = levelId;
    const level = getLevel(bundle, levelId);

    $("game-container").classList.remove("hidden");
    $("mode-indicator").textContent = verbLabel(level.verb, locale);
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

    playTimeline("level:start", runTimelineStep);
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
    playTimeline("level:complete", runTimelineStep);

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
    container.classList.remove("hidden");

    console.warn("[main] 關卡完成", currentLevelId, stars, level.id);
}

/* ---------- 時間軸執行 ---------- */
/**
 * 執行時間軸步驟。
 * @param {string} track
 * @param {any} step
 */
function runTimelineStep(track, step) {
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
    animate("#character-img", "shake");
    setStatus(locale === "en-US" ? "Try again!" : "再試一次！");
});

on("round:hint", () => {
    haptic("tap");
    playSfx("ui.hint");
});

on("level:complete", () => {
    haptic("celebrate");
});

/**
 * 渲染回合選項。
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

    // 記憶力玩法：翻牌網格
    if (typeof engine.getCards === "function") {
        renderMemoryBoard(controls, engine);
        return;
    }

    controls.innerHTML = `<div class="controls-grid grid-3">${options.map((/** @type {any} */ o) => `
        <button class="control-btn" data-item="${o.id}" type="button">
            ${o.image ? `<img src="${o.image}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-sm);" />` : ""}
            ${o.label ? `<span class="control-btn__label">${o.label}</span>` : ""}
        </button>
    `).join("")}</div>`;

    controls.querySelectorAll("[data-item]").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (state.locked) return;
            haptic("tap");
            playSfx("ui.tap");
            const id = /** @type {HTMLElement} */ (btn).dataset.item || "";
            session.answer(id);
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
        const result = engine.flip(slot);
        card.classList.add("is-flipped");

        if (result.matched) {
            playSfx("chime.bell");
            haptic("correct");
            setTimeout(() => {
                card.classList.add("is-matched");
            }, 400);
        }

        if (result.done) {
            setTimeout(() => {
                session.answer("__memory_done__");
            }, 700);
        } else if (result.mismatch) {
            setTimeout(() => {
                controls.querySelectorAll(".dex-card--memory.is-flipped").forEach((/** @type {any} */ el) => {
                    if (!el.classList.contains("is-matched")) el.classList.remove("is-flipped");
                });
            }, 800);
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
            ? (locale === "en-US" ? "Slow mode on" : "慢速模式開啟")
            : (locale === "en-US" ? "Slow mode off" : "慢速模式關閉"));
    });

    const musicBtn = $("music-control-btn");
    musicBtn?.addEventListener("click", () => {
        const bgm = /** @type {HTMLAudioElement} */ ($("bgm-player"));
        if (!bgm) return;
        if (bgm.paused) {
            bgm.src = "./外部資源/jingle-bells.mp3";
            bgm.volume = 0.25;
            bgm.play().catch(() => { });
        } else {
            bgm.pause();
        }
    });

    // 視線追隨
    document.addEventListener("pointermove", (e) => {
        lookAt($("santa-container"), e.clientX, e.clientY);
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
