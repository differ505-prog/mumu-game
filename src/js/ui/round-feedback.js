/**
 * 回合回饋三重奏（Step 126／128）。
 *
 * 規範：
 *   - 三種回饋各有**獨立**的視覺、聽覺與觸覺管道：
 *       correct（答對）→ 慶祝粒子 + 高音 + 強烈觸覺
 *       step（進行中）→ 點亮 + 輕音 + 輕觸覺
 *       wrong（答錯）→ 友善提示（**不得** sad、不得負面音效）
 *   - prefers-reduced-motion 下退化為靜態狀態變化
 *   - 不得使用 setInterval（一次性演出用 class + timeout）
 */

import { setMood } from "./character-render.js";
import { burst } from "./particles.js";
import { haptic } from "./haptics.js";
import { playSfx } from "../audio/sfx.js";

/**
 * 是否應降級動效。
 * @returns {boolean}
 */
export function prefersReducedMotion() {
    if (typeof window === "undefined") return false;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return true;
    return document.documentElement.dataset.reducedMotion === "on";
}

/**
 * 取得角色容器。
 * @returns {HTMLElement|null}
 */
function charMount() {
    return document.getElementById("santa-container");
}

/**
 * 取得粒子圖層。
 * @returns {HTMLElement|null}
 */
function particleLayer() {
    return document.getElementById("snow-container");
}
/**
 * 答對回饋（Step 126）。
 *
 * 視覺：角色 happy + 慶祝粒子
 * 聽覺：清脆玻璃聲（glass.chime）
 * 觸覺：強烈 correct
 *
 * @param {{ revertAfter?: number, revertTo?: string }} [opts]
 */
export function feedbackCorrect(opts = {}) {
    const mount = charMount();
    if (mount) setMood(mount, "happy");

    playSfx("glass.chime");
    haptic("correct");

    if (prefersReducedMotion()) return;

    const layer = particleLayer();
    if (layer) {
        burst(layer, { kind: "sparkle", count: 16 });
    }

    // 序列進行中的小反應：短暫後還原
    if (typeof opts.revertAfter === "number" && mount) {
        setMood(mount, "happy", {
            revertAfter: opts.revertAfter,
            revertTo: /** @type {any} */ (opts.revertTo || "listen")
        });
    }
}
/**
 * 進行中回饋（Step 126／128）—— 序列玩法的中間步驟。
 *
 * 規範：
 *   - 必須有**獨立**的回饋（不得與答對相同）
 *   - 不得顯示「答錯」、不得扣分
 *   - 角色給一個小反應後自動還原為 listen
 */
export function feedbackStep() {
    const mount = charMount();
    // 獨立的 step mood（與答對的 happy 區隔：更含蓄的小幅彈跳）
    if (mount) setMood(mount, /** @type {any} */ ("step"), { revertAfter: 900, revertTo: "listen" });

    playSfx("ui.hint");
    haptic("tap");

    if (prefersReducedMotion()) return;

    const layer = particleLayer();
    if (layer) {
        burst(layer, { kind: "dust", count: 6 });
    }
}

/**
 * 答錯回饋（Step 128）—— 友善提示，**不得**懲罰。
 *
 * 規範：
 *   - 角色 mood 必須為 hint（**不得** sad）
 *   - 不得使用負面音效（不得用 sharp／error 類音效）
 *   - 不得倒數、不得扣分、不得顯示紅色 X
 */
export function feedbackWrong() {
    const mount = charMount();
    if (mount) setMood(mount, "hint");

    playSfx("ui.soft-low");
    haptic("wrong");

    if (prefersReducedMotion()) return;

    const art = /** @type {HTMLElement|null} */ (mount?.querySelector(".char__art"));
    if (art) {
        art.classList.remove("anim-wiggle");
        void art.offsetWidth;
        art.classList.add("anim-wiggle");
        window.setTimeout(() => art.classList.remove("anim-wiggle"), 900);
    }
}

/**
 * 回合完成的慶祝回饋（關卡結算時）。
 */
export function feedbackLevelComplete() {
    const mount = charMount();
    if (mount) setMood(mount, "happy");

    playSfx("glass.chime");
    haptic("celebrate");

    if (prefersReducedMotion()) return;

    const layer = particleLayer();
    if (layer) {
        burst(layer, { kind: "firework", count: 30 });
    }
}
