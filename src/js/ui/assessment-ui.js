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
import { readJson, writeJson, removeKey } from "../core/storage.js";
import { escapeHtml, safeText } from "../core/sanitize-html.js";

/**
 * @typedef {"pre"|"post"} AssessmentPhase
 */

/**
 * 評量結果的**獨立**儲存鍵（Step 157）。
 *
 * 刻意與 `mumu.progress.v2` 分離 —— 評量結果不得汙染兒童遊戲進度，
 * 刪除評量資料亦不得影響遊戲存檔。
 * @type {string}
 */
export const ASSESSMENT_STORAGE_KEY = "mumu.assessment.v1";

/**
 * 讀取評量執行記錄。
 * @returns {any[]}
 */
export function loadAssessmentRuns() {
    const raw = readJson(ASSESSMENT_STORAGE_KEY, []);
    return Array.isArray(raw) ? raw : [];
}

/**
 * 寫入評量執行記錄（獨立於遊戲進度）。
 * @param {any[]} runs
 */
export function saveAssessmentRuns(runs) {
    writeJson(ASSESSMENT_STORAGE_KEY, Array.isArray(runs) ? runs : []);
}

/**
 * 清除評量記錄。
 */
export function clearAssessmentRuns() {
    removeKey(ASSESSMENT_STORAGE_KEY);
}

/**
 * 寫入一次評量執行結果。
 * @param {"pre"|"post"} phase
 * @param {any} data 匯出資料（去識別化）
 * @param {any} summary
 * @returns {any[]}
 */
export function recordAssessmentRun(phase, data, summary) {
    const runs = loadAssessmentRuns().filter((/** @type {any} */ r) => r.phase !== phase);
    runs.push({ phase, data, summary, completedAt: new Date().toISOString() });
    saveAssessmentRuns(runs);
    return runs;
}

/**
 * 取得尚未完成的階段（用於決定先做前測或後測）。
 * @returns {"pre"|"post"|null}
 */
export function nextPhase() {
    const runs = loadAssessmentRuns();
    const hasPre = runs.some((/** @type {any} */ r) => r.phase === "pre");
    const hasPost = runs.some((/** @type {any} */ r) => r.phase === "post");
    if (!hasPre) return "pre";
    if (!hasPost) return "post";
    return null;
}

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
    const en = locale === "en-US";

    // 中斷保留進度（Step 157）：以獨立鍵存 scale/item 游標
    const progressKey = `${ASSESSMENT_STORAGE_KEY}.cursor.${phase}`;
    const saved = readJson(progressKey, null);

    let scaleIndex = Number(saved?.scaleIndex) || 0;
    let itemIndex = Number(saved?.itemIndex) || 0;
    let readAloud = saved?.readAloud !== false;

    // 按鈕防連點鎖（Step 157）
    //
    // 每一輪渲染會產生新的 token；作答事件只接受**最新一輪**的 token，
    // 因此：
    //   - 同一輪內連點 → 只有第一次生效
    //   - 重繪後舊按鈕（已失效）的殘留監聽 → token 不符，直接忽略
    let renderToken = 0;
    let currentToken = 0;

    /**
     * 是否可進行作答（防連點）。
     * @param {number} token 觸發事件所屬的渲染 token
     * @returns {boolean}
     */
    function canAct(token) {
        if (token !== currentToken) return false;
        currentToken = 0;
        return true;
    }

    /**
     * 儲存游標。
     */
    function saveCursor() {
        writeJson(progressKey, { scaleIndex, itemIndex, readAloud });
    }

    /**
     * 渲染當前題目。
     */
    function render() {
        if (assessment.scaleCount === 0) {
            renderEmpty();
            return;
        }

        const item = assessment.current(scaleIndex, itemIndex);
        if (!item) {
            // 該量表完成，進入下一量表
            scaleIndex++;
            itemIndex = 0;
            if (scaleIndex >= assessment.scaleCount) {
                finish();
                return;
            }
            saveCursor();
            render();
            return;
        }

        assessment.startTiming(scaleIndex, itemIndex);
        saveCursor();

        // 這一輪的作答 token
        currentToken = ++renderToken;
        const token = currentToken;

        const prompt = item.prompt || "";
        const options = item.options || [];
        const isSpatial = typeof item.answerIndex === "number";
        const isSequence = Array.isArray(item.items);

        root.innerHTML = `
            <div class="assessment" data-phase="${phase}">
                <div class="assessment__progress">
                    ${en ? "Assessment" : "成效評估"} ·
                    ${scaleIndex + 1}/${assessment.scaleCount} ·
                    ${itemIndex + 1}/${assessment.itemCount(scaleIndex)}
                </div>
                <p class="assessment__prompt">${escapeHtml(safeText(prompt))}</p>
                ${isSequence ? `
                    <div class="assessment__sequence">
                        ${item.items.map((/** @type {string} */ x) => `<span class="assessment__chip">${escapeHtml(safeText(String(x)))}</span>`).join("")}
                    </div>
                    <p class="assessment__hint">${en ? "Repeat in order" : "請照順序複誦"}</p>
                ` : ""}
                ${isSpatial ? `
                    <div class="assessment__grid" role="group">
                        ${Array.from({ length: item.grid }, (_, i) => `
                            <button class="assessment__cell" data-cell="${i}" type="button"
                                    aria-label="${en ? "Cell" : "格子"} ${i + 1}"></button>
                        `).join("")}
                    </div>
                ` : ""}
                ${!isSpatial && !isSequence ? `
                    <div class="assessment__options">
                        ${options.map((/** @type {string} */ opt, /** @type {number} */ i) => `
                            <button class="assessment__option" data-option="${i}" type="button">${escapeHtml(safeText(String(opt)))}</button>
                        `).join("")}
                    </div>
                ` : ""}
                <div class="assessment__tools">
                    <label class="assessment__toggle">
                        <input type="checkbox" id="assessment-readaloud" ${readAloud ? "checked" : ""} />
                        ${en ? "Read aloud" : "朗讀題目"}
                    </label>
                    <button class="tool-btn" id="assessment-next" type="button">
                        ${en ? "Next" : "下一題"}
                    </button>
                </div>
            </div>
        `;

        if (readAloud) speak(prompt, { locale, rate: 0.8 });

        const toggle = root.querySelector("#assessment-readaloud");
        toggle?.addEventListener("change", () => {
            readAloud = /** @type {HTMLInputElement} */ (toggle).checked;
            saveCursor();
            if (readAloud) speak(prompt, { locale, rate: 0.8 });
        });

        root.querySelectorAll("[data-option]").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (!canAct(token)) return;
                const idx = Number(/** @type {HTMLElement} */ (btn).dataset.option);
                assessment.record(scaleIndex, itemIndex, options[idx]);
                advance();
            });
        });

        root.querySelectorAll("[data-cell]").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (!canAct(token)) return;
                const idx = Number(/** @type {HTMLElement} */ (btn).dataset.cell);
                assessment.record(scaleIndex, itemIndex, String(idx));
                advance();
            });
        });

        const next = root.querySelector("#assessment-next");
        next?.addEventListener("click", () => {
            if (!canAct(token)) return;
            // 序列題由家長確認複誦完成後手動下一題（不計分）
            assessment.record(scaleIndex, itemIndex, "", 0);
            advance();
        });
    }

    /**
     * Empty 狀態：尚未施測或題庫為空時的引導。
     */
    function renderEmpty() {
        root.innerHTML = `
            <div class="assessment assessment--empty" role="status">
                <h2>${en ? "No assessment items" : "尚無評量題目"}</h2>
                <p class="assessment__hint">
                    ${en
                        ? "The assessment is not available yet. Please come back later."
                        : "成效評量尚未開放，請稍後再試。"}
                </p>
            </div>
        `;
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
        saveCursor();
        render();
    }

    /**
     * 結束並回報。
     */
    function finish() {
        const summary = assessment.summary();
        const data = assessment.export();

        // 結果寫入**獨立**儲存鍵（不得汙染兒童遊戲進度）
        recordAssessmentRun(phase, data, summary);
        removeKey(progressKey);

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
