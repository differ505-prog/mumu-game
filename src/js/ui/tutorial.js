/**
 * 教學流程 — 由角色一邊示範一邊說，不另開靜態教學頁。
 *
 * 規範：可跳過；設定可重播。
 */

import { speak } from "../audio/voice.js";

/**
 * @typedef {"listen"|"watch"|"choose"} TutorialStep
 */

/**
 * 建立教學流程。
 * @param {HTMLElement} root
 * @param {any} bundle
 * @param {string} locale
 */
export function createTutorial(root, bundle, locale) {
    /** @type {TutorialStep[]} */
    const steps = ["listen", "watch", "choose"];
    let index = 0;

    const en = locale === "en-US";

    /** 各步驟的示範內容。 */
    const CONTENT = {
        listen: {
            title: en ? "Listen carefully" : "先聽一听",
            body: en
                ? "Press the button and the character will play a sound. Listen all the way to the end."
                : "按下按鈕，角色會播放一個聲音。請完整聽到最後。",
            hint: en ? "You can replay it as many times as you like." : "想再聽幾次都可以，隨時按重播。"
        },
        watch: {
            title: en ? "Watch the character" : "看著角色",
            body: en
                ? "The character shows you how it works first. Try to copy it."
                : "角色會先示範一次，試著跟著做。",
            hint: en ? "There is no wrong answer while you are learning." : "學習的時候沒有錯答案，放心試。"
        },
        choose: {
            title: en ? "Choose the answer" : "選出答案",
            body: en
                ? "Now it's your turn. Tap the picture or sound that matches."
                : "換你來了。點選符合的圖片或聲音。",
            hint: en ? "If you are not sure, ask for a hint." : "不確定的話，可以要求提示。"
        }
    };

    /**
     * 渲染當前步驟。
     */
    function render() {
        const step = steps[index];
        const c = CONTENT[step];

        root.innerHTML = `
            <div class="tutorial" data-step="${step}">
                <div class="tutorial__progress">
                    ${steps.map((s, i) => `<span class="tutorial__dot ${i <= index ? "is-on" : ""}"></span>`).join("")}
                </div>
                <h2 class="tutorial__title">${c.title}</h2>
                <p class="tutorial__body">${c.body}</p>
                <p class="tutorial__hint">${c.hint}</p>

                <div class="tutorial__actions">
                    ${step === "listen" ? `
                        <button class="level-btn" id="tut-listen" type="button">
                            ${en ? "Play sound" : "播放聲音"}
                        </button>
                    ` : ""}
                    ${step === "watch" ? `
                        <button class="level-btn" id="tut-watch" type="button">
                            ${en ? "Show me" : "示範給我看"}
                        </button>
                    ` : ""}
                    ${step === "choose" ? `
                        <div class="tutorial__options">
                            <button class="control-btn" data-tut-option="1" type="button">${en ? "First" : "第一個"}</button>
                            <button class="control-btn" data-tut-option="2" type="button">${en ? "Second" : "第二個"}</button>
                        </div>
                    ` : ""}

                    <button class="level-btn level-btn--secondary" id="tut-skip" type="button">
                        ${en ? "Skip" : "跳過"}
                    </button>
                </div>
            </div>
        `;

        root.classList.remove("hidden");

        // 語音朗讀說明
        speak(c.body, { locale, rate: 0.85 });

        root.querySelector("#tut-listen")?.addEventListener("click", () => {
            root.dispatchEvent(new CustomEvent("tutorial:demo", { detail: { step }, bubbles: true }));
        });

        root.querySelector("#tut-watch")?.addEventListener("click", () => {
            root.dispatchEvent(new CustomEvent("tutorial:demo", { detail: { step }, bubbles: true }));
        });

        root.querySelectorAll("[data-tut-option]").forEach((btn) => {
            btn.addEventListener("click", () => {
                // 教學中的任何選擇都視為正確（避免挫折感）
                btn.classList.add("control-btn--correct");
                window.setTimeout(() => {
                    next();
                }, 700);
            });
        });

        root.querySelector("#tut-skip")?.addEventListener("click", () => {
            skip();
        });
    }

    /**
     * 前進到下一步；已是最後一步則完成。
     * @param {(done:boolean)=>void} [onDone]
     */
    function next(onDone) {
        index++;
        if (index >= steps.length) {
            index = steps.length - 1;
            root.classList.add("hidden");
            onDone?.(true);
            return;
        }
        render();
    }

    /**
     * 跳過教學。
     * @param {(done:boolean)=>void} [onDone]
     */
    function skip(onDone) {
        root.classList.add("hidden");
        onDone?.(true);
    }

    render();

    return {
        next,
        skip,
        get current() {
            return steps[index];
        },
        get stepIndex() {
            return index;
        },
        get isFinished() {
            return index >= steps.length - 1;
        }
    };
}
