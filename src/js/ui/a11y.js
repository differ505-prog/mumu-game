/**
 * 無障礙與偏好設定。
 *
 * 涵蓋：螢幕閱讀器廣播、鍵盤導覽、色盲冗餘編碼、減少動態、觸覺開關。
 */

import { readJson, writeJson } from "../core/storage.js";

const SETTINGS_KEY = "mumu.a11y";

/**
 * 取得偏好設定。
 * @returns {any}
 */
export function getPreferences() {
    const saved = readJson(SETTINGS_KEY, {});
    return {
        colorBlind: Boolean(saved.colorBlind),
        reducedMotion: Boolean(saved.reducedMotion),
        haptics: saved.haptics !== false,
        speech: saved.speech !== false
    };
}

/**
 * 儲存偏好設定。
 * @param {any} patch
 */
export function setPreferences(patch) {
    const next = { ...getPreferences(), ...patch };
    writeJson(SETTINGS_KEY, next);
    return next;
}

/**
 * 寫入螢幕閱讀器即時區域。
 * @param {string} message
 * @param {"polite"|"assertive"} [level]
 */
export function announce(message, level = "polite") {
    const live = document.getElementById("sr-live");
    if (!live) return;
    live.setAttribute("aria-live", level);
    // 重設內容以確保重複訊息也會被播報
    live.textContent = "";
    window.setTimeout(() => {
        live.textContent = message;
    }, 30);
}

/**
 * 啟用鍵盤導覽：焦點可視、Tab 順序合理、Enter/Space 觸發。
 * @param {HTMLElement} root
 */
export function enableKeyboardNav(root) {
    if (!root) return;

    // 為缺少 role 的可點擊元素補上 button 語意
    root.querySelectorAll("[data-option], .control-btn, .mode-option, .dex-entry").forEach((el) => {
        if (!el.hasAttribute("tabindex") && el.getAttribute("role") !== "button") {
            el.setAttribute("tabindex", "0");
        }
    });

    root.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
        if (e.key !== "Enter" && e.key !== " ") return;

        const target = /** @type {HTMLElement} */ (e.target);
        if (!target) return;
        if (target.tagName === "BUTTON" || target.tagName === "INPUT" || target.tagName === "SELECT") return;

        const clickable = target.closest("[role='button'], [data-option], .control-btn, .mode-option, .dex-entry");
        if (clickable) {
            e.preventDefault();
            /** @type {HTMLElement} */ (clickable).click();
        }
    });
}

/**
 * 色盲模式：顏色題加符號／形狀冗餘編碼。
 * @param {HTMLElement} root
 * @param {boolean} enabled
 */
export function setColorBlindMode(root, enabled) {
    if (!root) return;
    root.dataset.colorblind = enabled ? "on" : "off";
    setPreferences({ colorBlind: enabled });
}

/**
 * 強制關閉動畫。
 * @param {HTMLElement} root
 * @param {boolean} enabled
 */
export function setReducedMotion(root, enabled) {
    if (!root) return;
    root.dataset.reducedMotion = enabled ? "on" : "off";
    root.classList.toggle("reduced-motion", enabled);
    setPreferences({ reducedMotion: enabled });
}

/**
 * 觸覺開關。
 * @param {HTMLElement} root
 * @param {boolean} enabled
 */
export function setHapticsEnabled(root, enabled) {
    if (!root) return;
    root.dataset.haptics = enabled ? "on" : "off";
    setPreferences({ haptics: enabled });
}

/**
 * 套用已保存的偏好設定。
 * @param {HTMLElement} root
 */
export function applyPreferences(root) {
    const prefs = getPreferences();
    setColorBlindMode(root, prefs.colorBlind);
    setReducedMotion(root, prefs.reducedMotion);
    setHapticsEnabled(root, prefs.haptics);
}

/**
 * 建立偏好設定介面。
 * @param {HTMLElement} root
 * @param {string} locale
 */
export function createPreferencesPanel(root, locale) {
    const prefs = getPreferences();
    const en = locale === "en-US";

    root.innerHTML = `
        <h2>${en ? "Accessibility" : "無障礙設定"}</h2>
        <div class="settings">
            <label class="settings__row">
                <span class="settings__label">${en ? "Reduce motion" : "減少動畫"}</span>
                <input type="checkbox" data-pref="reducedMotion" ${prefs.reducedMotion ? "checked" : ""} />
            </label>
            <label class="settings__row">
                <span class="settings__label">${en ? "Color-blind symbols" : "色覺輔助符號"}</span>
                <input type="checkbox" data-pref="colorBlind" ${prefs.colorBlind ? "checked" : ""} />
            </label>
            <label class="settings__row">
                <span class="settings__label">${en ? "Haptics" : "觸覺回饋"}</span>
                <input type="checkbox" data-pref="haptics" ${prefs.haptics ? "checked" : ""} />
            </label>
            <label class="settings__row">
                <span class="settings__label">${en ? "Spoken prompts" : "語音提示"}</span>
                <input type="checkbox" data-pref="speech" ${prefs.speech ? "checked" : ""} />
            </label>
        </div>
    `;

    Array.from(root.querySelectorAll("[data-pref]")).forEach((/** @type {HTMLInputElement} */ input) => {
        input.addEventListener("change", () => {
            const key = /** @type {any} */ (input.dataset.pref);
            const value = input.checked;
            setPreferences({ [key]: value });

            if (key === "reducedMotion") setReducedMotion(root, value);
            if (key === "colorBlind") setColorBlindMode(root, value);
            if (key === "haptics") setHapticsEnabled(root, value);
        });
    });

    return { applyPreferences: () => applyPreferences(root) };
}
