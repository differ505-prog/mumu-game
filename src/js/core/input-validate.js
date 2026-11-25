/**
 * 輸入驗證 — URL 參數與外部字串一律白名單驗證後才可使用。
 *
 * 規範（Step 153）：
 *   - URL 參數僅允許 `https:` 或同源相對路徑
 *   - 推薦碼僅允許英數字與底線
 *   - 驗證失敗時回退安全預設值，**不得**拋錯或白屏
 *   - 不得引入 runtime 依賴
 */

/** 推薦碼白名單（英數字與底線，長度 4–32）。 */
const REFERRAL_PATTERN = /^[A-Za-z0-9_]{4,32}$/;

/**
 * 驗證推薦碼。
 *
 * @param {unknown} code
 * @returns {string} 合法時回傳原值，否則回傳空字串
 */
export function safeReferralCode(code) {
    if (typeof code !== "string") return "";
    const trimmed = code.trim();
    if (!REFERRAL_PATTERN.test(trimmed)) return "";
    return trimmed;
}

/**
 * 驗證 URL：僅允許 `https:` 外部連結或同源相對路徑。
 *
 * @param {unknown} url
 * @returns {string} 合法時回傳原值，否則回傳空字串
 */
export function safeUrl(url) {
    if (typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";

    // 同源相對路徑（禁止以 `//` 開頭的 protocol-relative）
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
    if (trimmed.startsWith("./") || trimmed.startsWith("../")) return trimmed;
    if (trimmed.startsWith("#") || trimmed.startsWith("?")) return "";

    // 外部連結僅允許 https:
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "https:") return trimmed;
        return "";
    } catch {
        return "";
    }
}

/**
 * 驗證一般字串：限制長度並移除控制字元。
 *
 * @param {unknown} value
 * @param {number} [maxLength]
 * @returns {string}
 */
export function safeString(value, maxLength = 200) {
    if (typeof value !== "string") return "";
    // eslint-disable-next-line no-control-regex
    const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
    return cleaned.slice(0, maxLength);
}

/**
 * 從 URL 查詢字串安全地取出參數。
 *
 * @param {string} search
 * @param {string} name
 * @returns {string}
 */
export function safeQueryParam(search, name) {
    try {
        const params = new URLSearchParams(search || "");
        return safeString(params.get(name) || "", 64);
    } catch {
        return "";
    }
}
