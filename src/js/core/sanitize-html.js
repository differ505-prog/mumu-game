/**
 * HTML 內容清理 — 供需要 innerHTML 的場景使用。
 *
 * 規範：
 *   - 不得引入 DOMPurify 等外部套件（維持零 runtime 依賴）
 *   - safeText() 對非字串一律回傳空字串
 */

/**
 * 跳過所有 HTML 標籤（escape 特殊字元）。
 *
 * @param {unknown} text
 * @returns {string}
 */
export function escapeHtml(text) {
    if (typeof text !== "string") return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * 轉為安全字串（非字串一律回傳空字串）。
 *
 * @param {unknown} value
 * @returns {string}
 */
export function safeText(value) {
    if (typeof value === "string") return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return "";
}
