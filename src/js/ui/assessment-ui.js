/**
 * 成效評估介面（家長端）。
 *
 * 規範：
 * - 評估模式**不得**顯示星級、角色動畫或慶祝效果（避免情緒影響作答）。
 * - 以大按鈕呈現，單題或逐量表完成。
 * - 語音朗讀可由家長關閉。
 */

import { createAssessment } from "../assessment/runner.js";
import { speak } from "../audio/voice.js";

/**
 * @typedef {"pre"|"post"} AssessmentPhase
 */

/**
 * 執行評估流程。
 * @param {HTMLElement} root
 * @param {any} bundle
 * @param {string} locale
 * @param {AssessmentPhase} phase
 * @param {(summary:object)=>void} onFinish
 */
export function runAssessment(root, bundle, locale, phase, onFinish) {
    const assessment = createAssessment(bundle, locale, phase);

    let scaleIndex = 0;
    let itemIndex = 0;
    let readAloud = true;

    /**
     * 渲染當前題目。
     */
    function render() {
        const item = assessment.current(scaleIndex, itemIndex);
        if (!item) {
            // 該量表完成，進入下一量表
            scaleIndex++;
            itemIndex = 0;
            if (scaleIndex >= assessment.scaleCount) {
                finish();
                return;
            }
            render();
            return;
        }

        assessment.startTiming(scaleIndex, itemIndex);

        const prompt = item.prompt || "";
        const options = item.options || [];
        const isSpatial = typeof item.answerIndex === "number";
        const isSequence = Array.isArray(item.items);

        root.innerHTML = `
            <div class="assessment" data-phase="${phase}">
                <div class="assessment__progress">
                    ${locale === "en-US" ? "Assessment" : "成效評估"} ·
                    ${scaleIndex + 1}/${assessment.scaleCount} ·
                    ${itemIndex + 1}/${assessment.itemCount(scaleIndex)}
                </div>
                <p class="assessment__prompt">${prompt}</p>
                ${isSequence ? `
                    <div class="assessment__sequence">
                        ${item.items.map((/** @type {string} */ x) => `<span class="assessment__chip">${x}</span>`).join("")}
                    </div>
                    <p class="assessment__hint">${locale === "en-US" ? "Repeat in order" : "請照順序複誦"}</p>
                ` : ""}
                ${isSpatial ? `
                    <div class="assessment__grid" role="group">
                        ${Array.from({ length: item.grid }, (_, i) => `
                            <button class="assessment__cell" data-cell="${i}" type="button"
                                    aria-label="${locale === "en-US" ? "Cell" : "格子"} ${i + 1}"></button>
                        `).join("")}
                    </div>
                ` : ""}
                ${!isSpatial && !isSequence ? `
                    <div class="assessment__options">
                        ${options.map((/** @type {string} */ opt, /** @type {number} */ i) => `
                            <button class="assessment__option" data-option="${i}" type="button">${opt}</button>
                        `).join("")}
                    </div>
                ` : ""}
                <div class="assessment__tools">
                    <label class="assessment__toggle">
                        <input type="checkbox" id="assessment-readaloud" ${readAloud ? "checked" : ""} />
                        ${locale === "en-US" ? "Read aloud" : "朗讀題目"}
                    </label>
                    <button class="tool-btn" id="assessment-next" type="button">
                        ${locale === "en-US" ? "Next" : "下一題"}
                    </button>
                </div>
            </div>
        `;

        if (readAloud) speak(prompt, { locale, rate: 0.8 });

        const toggle = root.querySelector("#assessment-readaloud");
        toggle?.addEventListener("change", () => {
            readAloud = /** @type {HTMLInputElement} */ (toggle).checked;
            if (readAloud) speak(prompt, { locale, rate: 0.8 });
        });

        root.querySelectorAll("[data-option]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = Number(/** @type {HTMLElement} */ (btn).dataset.option);
                assessment.record(scaleIndex, itemIndex, options[idx]);
                advance();
            });
        });

        root.querySelectorAll("[data-cell]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = Number(/** @type {HTMLElement} */ (btn).dataset.cell);
                assessment.record(scaleIndex, itemIndex, String(idx));
                advance();
            });
        });

        const next = root.querySelector("#assessment-next");
        next?.addEventListener("click", () => {
            // 序列題由家長確認複誦完成後手動下一題（不計分）
            assessment.record(scaleIndex, itemIndex, "", 0);
            advance();
        });
    }

    /**
     * 前進到下一題。
     */
    function advance() {
        itemIndex++;
        const count = assessment.itemCount(scaleIndex);
        if (itemIndex >= count) {
            scaleIndex++;
            itemIndex = 0;
            if (scaleIndex >= assessment.scaleCount) {
                finish();
                return;
            }
        }
        render();
    }

    /**
     * 結束並回報。
     */
    function finish() {
        const summary = assessment.summary();
        const data = assessment.export();
        root.innerHTML = `
            <div class="assessment assessment--done">
                <h2>${locale === "en-US" ? "Assessment complete" : "評估完成"}</h2>
                <p class="assessment__score">
                    ${locale === "en-US" ? "Accuracy" : "正確率"}：
                    ${Math.round(summary.correctRate * 100)}%
                </p>
                <p class="assessment__hint">
                    ${locale === "en-US" ? "Average response" : "平均反應時間"}：${summary.avgReactionMs} ms
                </p>
                <pre class="assessment__data" id="assessment-export"></pre>
            </div>
        `;
        const pre = root.querySelector("#assessment-export");
        if (pre) pre.textContent = JSON.stringify(data, null, 2);
        onFinish?.(summary);
    }

    render();
}
