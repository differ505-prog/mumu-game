/**
 * 無障礙與偏好設定。
 *
 * 涵蓋：螢幕閱讀器廣播、鍵盤導覽、色盲冗餘編碼、減少動態、觸覺開關。
 */

import { readJson, writeJson } from "../core/storage.js";
import { safeText } from "../core/sanitize-html.js";

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
        speech: saved.speech !== false,
        // Step 205：視覺輔助（無聲可玩）—— 語音不可用時以視覺替代完成回合
        visualAssist: saved.visualAssist === true,
        // Step 206：單手大目標 —— 放大觸控目標
        largeTargets: saved.largeTargets === true
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
    setVisualAssistMode(root, prefs.visualAssist);
    setLargeTargets(root, prefs.largeTargets);
}

/**
 * 視覺輔助（無聲可玩）開關。
 *
 * 開啟後：即使瀏覽器無語音輸出，幼兒仍可僅靠大字動作卡與節奏脈衝完成回合。
 *
 * @param {HTMLElement} root
 * @param {boolean} enabled
 */
export function setVisualAssistMode(root, enabled) {
    if (!root) return;
    root.dataset.visualAssist = enabled ? "on" : "off";
    root.classList.toggle("visual-assist", enabled);
    setPreferences({ visualAssist: enabled });
}

/**
 * 單手大目標開關。
 * @param {HTMLElement} root
 * @param {boolean} enabled
 */
export function setLargeTargets(root, enabled) {
    if (!root) return;
    root.dataset.largeTargets = enabled ? "on" : "off";
    root.classList.toggle("large-targets", enabled);
    setPreferences({ largeTargets: enabled });
}

/**
 * 視覺替代提示的容器（不存在則建立）。
 * @param {HTMLElement} root
 * @returns {HTMLElement|null}
 */
function fallbackHost(root) {
    if (!root) return null;
    let host = root.querySelector("#visual-fallback");
    if (host) return /** @type {HTMLElement} */ (host);
    host = document.createElement("div");
    host.id = "visual-fallback";
    host.className = "visual-fallback";
    host.setAttribute("role", "group");
    host.setAttribute("aria-live", "polite");
    host.setAttribute("aria-label", root.getAttribute("data-locale") === "en-US"
        ? "Visual sound guide"
        : "視覺聲音提示");
    root.appendChild(host);
    return /** @type {HTMLElement} */ (host);
}

/**
 * 節奏脈衝圖示（純 CSS／SVG，禁 emoji）。
 * @param {number} count
 * @returns {string}
 */
function pulseMarkup(count) {
    const n = Math.max(1, Math.min(count, 12));
    let out = '<div class="visual-fallback__pulses" aria-hidden="true">';
    for (let i = 0; i < n; i++) {
        out += '<span class="visual-fallback__pulse"></span>';
    }
    out += "</div>";
    return out;
}

/**
 * 順序大圖卡（示範播放時的視覺替代，V4）。
 *
 * 每張卡片帶**醒目序號**，讓不識字幼兒依序號對應示範節奏。
 * 文字一律以 textContent 寫入（禁 innerHTML 注入）。
 *
 * @param {Array<string|{ label?: string, image?: string }>} steps
 * @param {number} activeIndex 目前示範到第幾張（-1 表示尚未開始）
 * @returns {HTMLElement}
 */
function buildSequenceCards(steps, activeIndex) {
    const row = document.createElement("ol");
    row.className = "visual-fallback__sequence";
    row.setAttribute("aria-label", "順序提示卡");

    steps.forEach((step, i) => {
        const item = document.createElement("li");
        item.className = "visual-fallback__step";
        if (i === activeIndex) item.classList.add("is-active");

        const no = document.createElement("span");
        no.className = "visual-fallback__step-no";
        no.setAttribute("aria-hidden", "true");
        no.textContent = String(i + 1);
        item.appendChild(no);

        const body = document.createElement("span");
        body.className = "visual-fallback__step-body";

        const image = typeof step === "object" && step ? step.image : "";
        const label = typeof step === "object" && step ? step.label : String(step ?? "");

        if (image) {
            const img = document.createElement("img");
            img.className = "visual-fallback__step-art";
            img.src = image;
            img.alt = "";
            img.loading = "lazy";
            img.decoding = "async";
            body.appendChild(img);
        }
        if (label) {
            const text = document.createElement("span");
            text.className = "visual-fallback__step-label";
            text.textContent = safeText(String(label));
            body.appendChild(text);
        }
        item.appendChild(body);
        row.appendChild(item);
    });

    return row;
}

/**
 * 回合視覺圖卡（當題的結構化選項，W2）。
 *
 * 每張卡帶**醒目序號**與（若有）圖片／標籤，
 * 讓 3–6 歲幼兒不識字也能靠序號與圖像作答。
 *
 * @param {Array<{label?:string,image?:string,id?:string}>} cards
 * @returns {HTMLElement}
 */
function buildRoundCards(cards) {
    const row = document.createElement("ol");
    row.className = "visual-fallback__cards visual-fallback__cards--round";
    row.setAttribute("aria-label", "回合圖卡");

    cards.forEach((card, i) => {
        const item = document.createElement("li");
        item.className = "visual-fallback__round-card";

        const no = document.createElement("span");
        no.className = "visual-fallback__round-no";
        no.setAttribute("aria-hidden", "true");
        no.textContent = String(i + 1);
        item.appendChild(no);

        const body = document.createElement("span");
        body.className = "visual-fallback__round-body";

        const image = typeof card?.image === "string" ? card.image : "";
        const label = typeof card?.label === "string" ? card.label : "";

        if (image) {
            const img = document.createElement("img");
            img.className = "visual-fallback__round-art";
            img.src = image;
            img.alt = "";
            img.loading = "lazy";
            img.decoding = "async";
            body.appendChild(img);
        }
        if (label) {
            const text = document.createElement("span");
            text.className = "visual-fallback__round-label";
            text.textContent = safeText(label);
            body.appendChild(text);
        }
        item.appendChild(body);
        row.appendChild(item);
    });

    return row;
}

/**
 * 顯示視覺替代提示（語音不可用／靜音／無語音包時）。
 *
 * - 文字內容一律以 textContent 寫入（禁 innerHTML 注入）
 * - 最小對以兩張並列大字卡呈現，供幼兒「看」出兩個音
 * - 示範（demonstration）時以**順序大圖卡 + 醒目序號**呈現當題步驟（V4）
 * - 回合進行中可傳入 `cards`（當題結構化選項）呈現**回合視覺圖卡**（W2）
 *
 * @param {HTMLElement} root
 * @param {{ text?: string, pair?: string[], reason?: string, beats?: number, locale?: string,
 *           sequence?: Array<string|{label?:string,image?:string}>, activeIndex?: number,
 *           cards?: Array<{label?:string,image?:string,id?:string}> }} payload
 */
export function showVisualFallback(root, payload = {}) {
    const host = fallbackHost(root);
    if (!host) return;

    host.textContent = "";
    host.classList.remove("hidden");
    host.dataset.reason = payload.reason || "unsupported";

    const en = payload.locale === "en-US";
    const hint = document.createElement("p");
    hint.className = "visual-fallback__hint";
    hint.textContent = payload.reason === "muted"
        ? (en ? "Voice is off. Use the cards." : "語音已關閉，請看圖卡作答")
        : (en ? "Voice is unavailable. Use the cards." : "語音無法使用，請看圖卡作答");
    host.appendChild(hint);

    // 順序大圖卡（示範播放時）——優先於最小對並列卡
    if (Array.isArray(payload.sequence) && payload.sequence.length >= 1) {
        host.appendChild(buildSequenceCards(payload.sequence, payload.activeIndex ?? -1));
    } else if (Array.isArray(payload.cards) && payload.cards.length >= 1) {
        // W2：回合視覺圖卡（當題的結構化選項 + 醒目序號）
        host.appendChild(buildRoundCards(payload.cards));
    } else if (Array.isArray(payload.pair) && payload.pair.length >= 2) {
        const row = document.createElement("div");
        row.className = "visual-fallback__cards";
        for (const word of payload.pair.slice(0, 4)) {
            const card = document.createElement("div");
            card.className = "visual-fallback__card";
            card.textContent = safeText(String(word));
            row.appendChild(card);
        }
        host.appendChild(row);
    }

    if (typeof payload.text === "string" && payload.text) {
        const text = document.createElement("p");
        text.className = "visual-fallback__text";
        text.textContent = safeText(payload.text);
        host.appendChild(text);
    }

    if (typeof payload.beats === "number" && payload.beats > 0) {
        const wrap = document.createElement("div");
        wrap.className = "visual-fallback__beat";
        wrap.innerHTML = pulseMarkup(payload.beats);
        host.appendChild(wrap);
    }
}

/**
 * 隱藏視覺替代提示。
 * @param {HTMLElement} root
 */
export function hideVisualFallback(root) {
    const host = root?.querySelector("#visual-fallback");
    if (!host) return;
    host.textContent = "";
    host.classList.add("hidden");
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
        <div class="settings-card" role="dialog" aria-modal="true" aria-labelledby="a11y-card-title">
            <h2 class="settings-card__title" id="a11y-card-title">${en ? "Accessibility" : "無障礙設定"}</h2>
            <div class="settings settings-card__body">
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
                <label class="settings__row">
                    <span class="settings__label">${en ? "Visual assist (play without sound)" : "視覺輔助（無聲可玩）"}</span>
                    <input type="checkbox" data-pref="visualAssist" ${prefs.visualAssist ? "checked" : ""} />
                </label>
                <label class="settings__row">
                    <span class="settings__label">${en ? "Large one-hand targets" : "單手大目標"}</span>
                    <input type="checkbox" data-pref="largeTargets" ${prefs.largeTargets ? "checked" : ""} />
                </label>
            </div>
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
            if (key === "visualAssist") setVisualAssistMode(root, value);
            if (key === "largeTargets") setLargeTargets(root, value);
        });
    });

    return { applyPreferences: () => applyPreferences(root) };
}
