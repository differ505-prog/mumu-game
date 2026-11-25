/**
 * 劇情過場 — 全屏場景與章節信件。
 */

import { applyTheme } from "./parallax.js";
import { speak } from "../audio/voice.js";
import { escapeHtml, safeText } from "../core/sanitize-html.js";

/**
 * 顯示全屏過場。
 *
 * Step 122：過場是章節信件的呈現方式 —— 含標題、正文、搭檔立繪與 CTA。
 *   - 信件**必須**朗讀，且朗讀期間 CTA 顯示「正在說…」
 *   - 關上後才由 `onClose` 觸發後續流程（切場景 → 進關卡）
 *
 * @param {HTMLElement} root
 * @param {{ title:string, body:string, cta?:string, theme?:string, art?:string, tagline?:string }} scene
 * @param {() => void} [onClose]
 */
export function showStoryScene(root, scene, onClose) {
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";
    const speakingLabel = en ? "Speaking\u2026" : "正在說\u2026";
    const ctaLabel = scene.cta || (en ? "Continue" : "繼續");

    // 內容型資料一律 escape（不得以模板字串直接注入）
    const theme = escapeHtml(safeText(scene.theme));
    const art = safeText(scene.art);
    const title = escapeHtml(safeText(scene.title));
    const tagline = escapeHtml(safeText(scene.tagline));
    const body = escapeHtml(safeText(scene.body));

    root.innerHTML = `
        <div class="story-scene" data-theme="${theme}">
            ${art ? `<img class="story-scene__art" src="${escapeHtml(art)}" alt="" />` : ""}
            <div class="story-scene__body">
                <h2 class="story-scene__title">${title}</h2>
                ${tagline ? `<p class="story-scene__tagline">${tagline}</p>` : ""}
                <p class="story-scene__text">${body}</p>
                <button class="level-btn" id="story-cta" type="button">${speakingLabel}</button>
            </div>
        </div>
    `;
    root.classList.remove("hidden");

    if (scene.theme) {
        applyTheme(root, scene.theme);
    }

    const cta = root.querySelector("#story-cta");

    // 朗讀結束（onend／onerror）後恢復 CTA 文案
    speak(scene.body, {
        locale: en ? "en-US" : "zh-TW",
        rate: 0.85,
        onEnd: () => {
            if (cta) cta.textContent = ctaLabel;
        }
    });

    cta?.addEventListener("click", () => {
        hideStoryScene(root);
        onClose?.();
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
 * @param {string} [title] 章節標題（雙語由呼叫端決定）
 */
export function showLetter(root, letter, signature = "", onClose, title = "") {
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";
    const speakingLabel = en ? "Speaking…" : "正在說…";
    const closeLabel = en ? "Close" : "關上";

    // 內容型資料一律 escape（信件為長文字，必須完整顯示不得截斷）
    const safeTitle = escapeHtml(safeText(title));
    const safeLetter = escapeHtml(safeText(letter));
    const safeSignature = escapeHtml(safeText(signature));

    root.innerHTML = `
        <div class="letter-wrap">
            <article class="letter" id="print-letter">
                ${safeTitle ? `<h2 class="letter__title">${safeTitle}</h2>` : ""}
                <div class="letter__body">${safeLetter}</div>
                ${safeSignature ? `<div class="letter__signature">${safeSignature}</div>` : ""}
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
