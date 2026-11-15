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
 * @param {HTMLElement} root
 * @param {string} letter
 * @param {string} [signature]
 */
export function showLetter(root, letter, signature = "") {
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";

    root.innerHTML = `
        <div class="letter-wrap">
            <article class="letter" id="print-letter">
                <div class="letter__body">${letter}</div>
                ${signature ? `<div class="letter__signature">${signature}</div>` : ""}
                <button class="level-btn letter__close" id="letter-close" type="button">
                    ${en ? "Close" : "關上"}
                </button>
            </article>
        </div>
    `;
    root.classList.remove("hidden");

    root.querySelector("#letter-close")?.addEventListener("click", () => {
        root.classList.add("hidden");
    });
}
