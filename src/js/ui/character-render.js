/**
 * 角色渲染 — 載入去背素材並套用情緒／動作狀態。
 *
 * 情緒回饋（Step 94）：
 * - unlock  → 短促跳躍＋星星散落（圖鑑解鎖）
 * - roar    → 放大再回彈（squash & stretch）
 * - complete→ 上下彈跳（關卡完成）
 * - hatch   → 破殼
 *
 * 所有回饋皆以 class 切換驅動（不使用 setInterval），
 * 且在 prefers-reduced-motion 下退化成靜態狀態變化。
 */

import { burst } from "./particles.js";

/**
 * @typedef {"idle"|"listen"|"happy"|"step"|"hint"|"roar"|"walk"|"hatch"} CharacterMood
 */

/**
 * @typedef {"unlock"|"roar"|"complete"|"hatch"} CharacterEmotion
 */

/**
 * 判斷使用者是否要求減少動態效果。
 * @returns {boolean}
 */
function prefersReducedMotion() {
    if (typeof window === "undefined") return false;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return true;
    return document.documentElement.dataset.reducedMotion === "on";
}

/**
 * 角色繪製後依素材比例微調接地陰影（角色越高，影子越寬越淡）。
 * @param {HTMLImageElement} img
 * @param {HTMLElement} shadow
 */
function syncShadowScale(img, shadow) {
    if (!img || !shadow) return;
    const apply = () => {
        const w = img.naturalWidth || 0;
        const h = img.naturalHeight || 0;
        if (!w || !h) return;
        // 影子寬度依角色實際高度線性放大（200px 為基準）
        const scale = Math.max(0.72, Math.min(1.35, 0.62 + (h / 512) * 0.95));
        shadow.style.setProperty("--shadow-scale", scale.toFixed(3));
        shadow.style.setProperty("--shadow-opacity", (0.34 - (h / 512) * 0.12).toFixed(3));
    };
    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener("load", apply, { once: true });
}

/**
 * 渲染角色。
 *
 * F5：`mount.className = ...` 會清掉承載版面定位的 class，
 * 改為 `classList` 增量操作（只更新 mood class）。
 *
 * @param {HTMLElement} mount
 * @param {any} character
 * @param {CharacterMood} mood
 */
export function renderCharacter(mount, character, mood = "idle") {
    if (!mount || !character) return;

    const art = character.art?.file || "";
    mount.classList.add("char");
    // 只移除既有的 mood class（保留版面定位用的 class）
    for (const cls of Array.from(mount.classList)) {
        if (cls.startsWith("char--")) mount.classList.remove(cls);
    }
    mount.classList.add(`char--${mood}`);
    mount.innerHTML = `
        <img class="char__art" src="${art}" alt="${character.name?.["zh-TW"] || character.id}" />
        <div class="char__shadow"></div>
    `;

    const img = /** @type {HTMLImageElement} */ (mount.querySelector(".char__art"));
    const shadow = /** @type {HTMLElement} */ (mount.querySelector(".char__shadow"));
    syncShadowScale(img, shadow);
}

/**
 * 各角色的 mood 還原計時器。
 *
 * 避免舊的還原計時器覆蓋較新的 mood（例如序列進行中的 happy 被
 * 900ms 後的 listen 蓋掉，而此時回合已正確完成）。
 * @type {WeakMap<HTMLElement, number>}
 */
const moodTimers = new WeakMap();

/**
 * 切換角色 mood（Step 126）。
 *
 * `renderCharacter()` 只在初次渲染時設定 mood；之後的回饋（答對／答錯／
 * 序列進行中）都靠 `setMood()` **連續切換**，不得重繪整個角色。
 *
 * @param {HTMLElement} mount
 * @param {CharacterMood} mood
 * @param {{ revertAfter?: number, revertTo?: CharacterMood }} [opts]
 */
export function setMood(mount, mood, opts) {
    if (!mount) return;

    // 取消尚未觸發的還原計時器（新的 mood 優先）
    const pending = moodTimers.get(mount);
    if (pending !== undefined) {
        window.clearTimeout(pending);
        moodTimers.delete(mount);
    }

    for (const cls of Array.from(mount.classList)) {
        if (cls.startsWith("char--")) mount.classList.remove(cls);
    }
    mount.classList.add(`char--${mood}`);

    // 需要自動還原時（例如序列進行中的小反應）
    const revertAfter = opts?.revertAfter;
    if (typeof revertAfter === "number" && revertAfter > 0) {
        const timer = window.setTimeout(() => {
            moodTimers.delete(mount);
            setMood(mount, opts?.revertTo || "listen");
        }, revertAfter);
        moodTimers.set(mount, timer);
    }
}

/**
 * 視線追隨游標。
 * @param {HTMLElement} mount
 * @param {number} x
 * @param {number} y
 */
export function lookAt(mount, x, y) {
    if (!mount) return;
    const art = /** @type {HTMLElement} */ (mount.querySelector(".char__art"));
    if (!art) return;
    const rect = mount.getBoundingClientRect();
    const dx = (x - rect.left - rect.width / 2) / rect.width;
    const dy = (y - rect.top - rect.height / 2) / rect.height;
    art.style.transform = `translate(${dx * 8}px, ${dy * 4}px)`;
}

/**
 * 隨機眨眼（僅閒置時）。
 * @param {HTMLElement} mount
 */
export function blink(mount) {
    if (!mount) return;
    const art = /** @type {HTMLElement} */ (mount.querySelector(".char__art"));
    if (!art) return;
    art.classList.remove("anim-blink");
    void art.offsetWidth;
    art.classList.add("anim-blink");
}

/**
 * 以 class 切換播放一次性演出（不做 setInterval）。
 * @param {HTMLElement} mount
 * @param {string} className
 * @param {number} durationMs 演出結束後移除 class 的時間
 */
function playOnce(mount, className, durationMs) {
    if (!mount) return;
    mount.classList.remove(className);
    void mount.offsetWidth;
    mount.classList.add(className);
    window.setTimeout(() => mount.classList.remove(className), durationMs);
}

/**
 * 播放吼叫演出（放大再回彈，squash & stretch）。
 * @param {HTMLElement} mount
 */
export function playRoar(mount) {
    playOnce(mount, "char--roar", 1200);
}

/**
 * 播放步行循環。
 * @param {HTMLElement} mount
 */
export function playWalk(mount) {
    if (!mount) return;
    mount.classList.add("char--walk");
}

/**
 * 停止步行循環。
 * @param {HTMLElement} mount
 */
export function stopWalk(mount) {
    if (!mount) return;
    mount.classList.remove("char--walk");
}

/**
 * 播放破殼演出。
 * @param {HTMLElement} mount
 */
export function playHatch(mount) {
    playOnce(mount, "char--hatch", 900);
}

/**
 * 圖鑑解鎖回饋：短促跳躍＋星星散落。
 *
 * reduced-motion 下只做靜態狀態變化（短暫高亮），不跳躍。
 * @param {HTMLElement} mount
 * @param {HTMLElement} [particleLayer] 粒子層（通常是 #snow-container）
 */
export function playUnlock(mount, particleLayer) {
    if (!mount) return;

    if (prefersReducedMotion()) {
        playOnce(mount, "char--unlock-static", 700);
        return;
    }

    playOnce(mount, "char--unlock", 900);

    const layer = particleLayer || mount.closest("#snow-container") || mount.parentElement;
    if (!layer) return;

    // 星星從角色身上散開
    const rect = mount.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    burst(layer, {
        kind: "sparkle",
        count: 14,
        origin: {
            x: rect.left - layerRect.left + rect.width / 2,
            y: rect.top - layerRect.top + rect.height * 0.4
        }
    });
}

/**
 * 關卡完成回饋：上下彈跳。
 * @param {HTMLElement} mount
 */
export function playComplete(mount) {
    if (prefersReducedMotion()) {
        playOnce(mount, "char--complete-static", 700);
        return;
    }
    playOnce(mount, "char--complete", 1000);
}

/**
 * 依事件類型播放對應的角色情緒回饋。
 *
 * 對應 content/timeline.json 的事件：
 * - `dex:unlock`    → unlock
 * - `dino:roar`     → roar
 * - `level:complete`→ complete
 * - `puzzle:complete`→ hatch
 *
 * @param {HTMLElement} mount
 * @param {CharacterEmotion} emotion
 * @param {HTMLElement} [particleLayer]
 */
export function playEmotion(mount, emotion, particleLayer) {
    switch (emotion) {
        case "unlock":
            playUnlock(mount, particleLayer);
            break;
        case "roar":
            playRoar(mount);
            break;
        case "complete":
            playComplete(mount);
            break;
        case "hatch":
            playHatch(mount);
            break;
        default:
            break;
    }
}
