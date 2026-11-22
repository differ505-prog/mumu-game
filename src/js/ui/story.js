/**
 * 劇情過場 — 全屏場景與章節信件。
 */

import { applyTheme } from "./parallax.js";
import { speak } from "../audio/voice.js";

/**
 * 顯示全屏過場。
 * @param {HTMLElement} root
 * @param {{ title:string, body:string, cta:string, theme?:string, art?:string }} scene
 */
export function showStoryScene(root, scene) {
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";

    root.innerHTML = `
        <div class="story-scene" data-theme="${scene.theme || ""}">
            ${scene.art ? `<img class="story-scene__art" src="${scene.art}" alt="" />` : ""}
            <div class="story-scene__body">
                <h2 class="story-scene__title">${scene.title}</h2>
                <p class="story-scene__text">${scene.body}</p>
                <button class="level-btn" id="story-cta" type="button">${scene.cta}</button>
            </div>
        </div>
    `;
    root.classList.remove("hidden");

    if (scene.theme) {
        applyTheme(root, scene.theme);
    }

    speak(scene.body, { locale: en ? "en-US" : "zh-TW", rate: 0.85 });

    root.querySelector("#story-cta")?.addEventListener("click", () => {
        hideStoryScene(root);
    });
}

/**
 * 隱藏過場。
 * @param {HTMLElement} root
 */
export function hideStoryScene(root) {
    root.classList.add("hidden");
    root.innerHTML = "";
}

/**
 * 顯示信件（可列印）。
 *
 * F6：信件**必須是一個可以關上的過場**。
 *   - 「關上」按鈕確實觸發 `onClose`
 *   - 朗讀期間 CTA 顯示「正在說…」，`utter.onend` 後恢復為「關上」
 *   - **不得**用 `setTimeout` 猜測朗讀長度
 *
 * @param {HTMLElement} root
 * @param {string} letter
 * @param {string} [signature]
 * @param {() => void} [onClose]
 */
export function showLetter(root, letter, signature = "", onClose) {
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";
    const speakingLabel = en ? "Speaking…" : "正在說…";
    const closeLabel = en ? "Close" : "關上";

    root.innerHTML = `
        <div class="letter-wrap">
            <article class="letter" id="print-letter">
                <div class="letter__body">${letter}</div>
                ${signature ? `<div class="letter__signature">${signature}</div>` : ""}
                <button class="level-btn letter__close" id="letter-close" type="button">
                    ${speakingLabel}
                </button>
            </article>
        </div>
    `;
    root.classList.remove("hidden");

    const closeBtn = root.querySelector("#letter-close");

    // 朗讀結束（onend／onerror）後恢復 CTA 文案
    speak(letter, {
        locale: en ? "en-US" : "zh-TW",
        onEnd: () => {
            if (closeBtn) closeBtn.textContent = closeLabel;
        }
    });

    closeBtn?.addEventListener("click", () => {
        root.classList.add("hidden");
        onClose?.();
    });
}
