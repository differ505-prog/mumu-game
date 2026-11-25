/**
 * 場景天氣粒子 — 消費 content/scenes.json 的 `weather` 欄位。
 *
 * Step 120：每個場景的天氣都必須有對應的環境粒子；
 * 沒有對應天氣的場景，**必須**在 scenes.json 移除該欄位（不留死欄位）。
 */

/** 天氣 → 粒子種類。 @type {Record<string,string>} */
const WEATHER_KIND = {
    snow: "snow",
    mist: "mist",
    aurora: "aurora"
};

/**
 * 判斷是否為已支援的天氣。
 * @param {string} weather
 * @returns {boolean}
 */
export function isSupportedWeather(weather) {
    return Boolean(weather) && Boolean(WEATHER_KIND[weather]);
}

/**
 * 取得天氣的粒子種類。
 * @param {string} weather
 * @returns {string}
 */
export function weatherKind(weather) {
    return WEATHER_KIND[weather] || "none";
}

/**
 * 離線提示（Step 129／130）。
 *
 * SW 註冊失敗或瀏覽器離線時，必須以**可理解的 UI** 告知使用者，
 * 不得讓畫面停在空白或只印一行文字。
 *
 * @param {HTMLElement} root
 * @param {string} locale
 */
export function showOfflineNotice(root, locale) {
    if (!root) return;
    const en = locale === "en-US";
    const existing = root.querySelector("[data-offline-notice]");
    if (existing) return;

    const notice = document.createElement("div");
    notice.className = "offline-notice";
    notice.setAttribute("data-offline-notice", "1");
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.textContent = en
        ? "You are offline. The game still works with saved content."
        : "目前處於離線狀態，已載入的內容仍可繼續遊玩。";
    root.appendChild(notice);
}

/**
 * 隱藏離線提示。
 * @param {HTMLElement} root
 */
export function hideOfflineNotice(root) {
    root?.querySelector("[data-offline-notice]")?.remove();
}
