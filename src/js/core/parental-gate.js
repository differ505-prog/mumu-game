/**
 * 家長閘門 — 阻擋幼兒誤入付費牆、家長報告與設定。
 *
 * 兩種解鎖方式：
 * - 算術題（easy: 2+3；hard: 7×8）
 * - 長按 3 秒
 *
 * 解鎖有效期 15 分鐘。
 */

import { readJson, writeJson } from "./storage.js";

const STORAGE_KEY = "mumu.gate";
const VALID_MS = 15 * 60 * 1000;

/**
 * 家長閘門。
 * @param {HTMLElement} root
 * @param {{ reason?:string, difficulty?: "easy"|"hard" }} [opts]
 * @returns {Promise<boolean>}
 */
export function requireParentalGate(root, opts = {}) {
    const difficulty = opts.difficulty || "easy";
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";

    if (isGateUnlocked()) {
        return Promise.resolve(true);
    }

    const a = difficulty === "hard" ? 7 : 2;
    const b = difficulty === "hard" ? 8 : 3;
    const symbol = difficulty === "hard" ? "×" : "+";

    return new Promise((resolve) => {
        root.innerHTML = `
            <div class="gate" role="dialog" aria-modal="true" aria-label="Parental gate">
                <h2 class="gate__title">${en ? "Parent verification" : "家長驗證"}</h2>
                <p class="gate__reason">${opts.reason || (en ? "Please answer to continue" : "請完成驗證以繼續")}</p>
                <p class="gate__question" aria-live="polite">
                    ${a} ${symbol} ${b} = ?
                </p>
                <input class="gate__input" id="gate-answer" type="number" inputmode="numeric"
                       autocomplete="off" aria-label="${en ? "Answer" : "答案"}" />
                <p class="gate__error" id="gate-error" role="alert"></p>
                <button class="level-btn" id="gate-submit" type="button">
                    ${en ? "Confirm" : "確認"}
                </button>
                <button class="gate__hold" id="gate-hold" type="button">
                    ${en ? "Or press and hold for 3 seconds" : "或長按 3 秒"}
                </button>
                <button class="level-btn level-btn--secondary" id="gate-cancel" type="button">
                    ${en ? "Cancel" : "取消"}
                </button>
            </div>
        `;
        root.classList.remove("hidden");

        const input = /** @type {HTMLInputElement} */ (root.querySelector("#gate-answer"));
        const error = root.querySelector("#gate-error");
        const answer = a + b;

        const close = (/** @type {boolean} */ ok) => {
            root.classList.add("hidden");
            resolve(ok);
        };

        const submit = () => {
            const value = Number(input?.value);
            if (value === answer) {
                setGateUnlocked(root, true);
                close(true);
            } else if (error) {
                error.textContent = en ? "Incorrect, please try again" : "答案不正確，請再試一次";
                input?.select();
            }
        };

        root.querySelector("#gate-submit")?.addEventListener("click", submit);
        input?.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
            if (e.key === "Enter") submit();
        });
        root.querySelector("#gate-cancel")?.addEventListener("click", () => close(false));

        // 長按 3 秒解鎖
        const hold = root.querySelector("#gate-hold");
        if (hold) {
            let timer = 0;
            let start = 0;
            const begin = () => {
                start = Date.now();
                hold.classList.add("is-holding");
                timer = window.setTimeout(() => {
                    setGateUnlocked(root, true);
                    close(true);
                }, 3000);
            };
            const end = () => {
                window.clearTimeout(timer);
                hold.classList.remove("is-holding");
                // 未滿 3 秒即放開 → 重新計時
                if (start && Date.now() - start < 3000) {
                    hold.textContent = en ? "Hold longer" : "請長按滿 3 秒";
                }
            };
            hold.addEventListener("pointerdown", begin);
            hold.addEventListener("pointerup", end);
            hold.addEventListener("pointerleave", end);
        }

        input?.focus();
    });
}

/**
 * 設定閘門解鎖狀態（15 分鐘內有效）。
 * @param {HTMLElement} root
 * @param {boolean} unlocked
 */
export function setGateUnlocked(root, unlocked) {
    void root;
    if (unlocked) {
        writeJson(STORAGE_KEY, { until: Date.now() + VALID_MS });
    } else {
        writeJson(STORAGE_KEY, { until: 0 });
    }
}

/**
 * 閘門目前是否已解鎖。
 * @returns {boolean}
 */
export function isGateUnlocked() {
    const saved = readJson(STORAGE_KEY, { until: 0 });
    return Boolean(saved?.until && saved.until > Date.now());
}
