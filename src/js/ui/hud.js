/**
 * 單一 HUD 狀態列 — 取代舊有分散在四個角落的計分元件。
 *
 * 規範：關卡與分數標籤使用兒童語言（見 content/child-voice.json），
 * 不得出現「Level」等硬編碼英文字面值或任何評量指標。
 */

import { childVoice } from "../core/dex.js";

/**
 * 建立 HUD。
 * @param {HTMLElement} root
 */
export function createHud(root) {
    const chapterEl = root.querySelector(".hud__chapter");
    const levelEl = root.querySelector(".hud__level");
    const scoreEl = /** @type {HTMLElement} */ (root.querySelector(".hud__score"));
    const medalsEl = root.querySelector(".hud__medals");
    const toastLayer = document.getElementById("toast-layer");

    /**
     * 依語系取得文案。
     * @param {string} key
     */
    const t = (key) => {
        const voice = childVoice() || {};
        const loc = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US" ? "en-US" : "zh-TW";
        return voice[key]?.[loc] || "";
    };

    return {
        /**
         * 更新狀態。
         * @param {{ level?:number, score?:number, maxScore?:number, combo?:number, medals?:string[], chapter?:number, chapterTitle?:string }} s
         */
        update(s) {
            if (chapterEl) {
                chapterEl.textContent = s.chapterTitle || (s.chapter != null ? `第 ${s.chapter} 章` : "");
            }
            if (levelEl) {
                if (s.level == null) {
                    levelEl.textContent = "";
                } else {
                    const tmpl = t("hudLevelLabel");
                    levelEl.textContent = tmpl
                        ? tmpl.replace("{n}", String(s.level))
                        : String(s.level);
                }
            }
            if (scoreEl) {
                if (s.score == null || s.maxScore == null) {
                    scoreEl.textContent = "";
                } else {
                    const label = t("childScoreLabel");
                    scoreEl.textContent = label
                        ? `${label} ${s.score} / ${s.maxScore}`
                        : `${s.score} / ${s.maxScore}`;
                }
            }
            if (medalsEl) {
                const medals = s.medals || [];
                medalsEl.innerHTML = medals
                    .map((/** @type {string} */ m) => `<span class="medal-icon medal-icon--earned" title="${m}">●</span>`)
                    .join("");
            }
        },

        /**
         * 分數彈跳動畫。
         * @param {number} value
         */
        animateScore(value) {
            if (!scoreEl) return;
            scoreEl.classList.remove("anim-pop");
            void scoreEl.offsetWidth;
            scoreEl.classList.add("anim-pop");
            scoreEl.textContent = String(value);
        },

        /**
         * 顯示提示訊息。
         * @param {string} text
         * @param {"info"|"good"|"warn"} [tone]
         */
        toast(text, tone = "info") {
            if (!toastLayer) return;
            const el = document.createElement("div");
            el.className = `toast toast--${tone}`;
            el.textContent = text;
            toastLayer.appendChild(el);
            setTimeout(() => el.remove(), 2600);
        }
    };
}
