/**
 * 建置版本常數 — 取代散落於各處的硬寫字串。
 */
export const APP = {
    name: "Santa's Little Helper",
    version: "3.0.0",
    build: "2026-11-15",
    /** @type {string[]} 支援語系 */
    locales: ["zh-TW", "en-US"],
    /** @type {string} 預設語系 */
    defaultLocale: "zh-TW",
    /** @type {number} 過關所需回合數 */
    maxScore: 3,
    /** @type {string} Service Worker 快取名稱 */
    cacheName: "mumu-v5",
    /** @type {number[]} 免費章節（序章 + 第 1–3 章） */
    freeChapters: [0, 1, 2, 3],
    /** @type {number[]} 付費章節 */
    paidChapters: [4, 5],
    /** @type {number} 圖鑑恐龍總數 */
    dinoCount: 24,
    /** @type {number} 圖鑑格數 */
    dexSlots: 24,
    /** @type {number} 免費公測上限月數 */
    betaMonths: 6
};

/**
 * 遙測外送端點（後端提供；未設定時僅本地佇列）。
 */
export const TELEMETRY = {
    /** @type {string} 外送端點（空字串 = 僅本地佇列，不外送） */
    endpoint: "",
    /** @type {number} 批次外送的事件數門檻 */
    batchSize: 20,
    /** @type {number} 退避基準（毫秒）；實際延遲為 base * 2^n */
    retryBaseMs: 2000,
    /** @type {number} 退避上限（毫秒） */
    retryMaxMs: 60000,
    /** @type {number} 連續失敗上限；達上限停止重試（但不得丟棄佇列） */
    maxRetries: 5,
    /** @type {boolean} 優先使用 navigator.sendBeacon */
    useBeacon: true
};

/**
 * 客服與法律條款入口（Step 168）。
 *
 * 必須是真實可用的值，不得留佔位符（否則商店送審會被退）。
 */
export const SUPPORT = {
    email: "support@mumu-game.example",
    privacyUrl: "./content/privacy.zh-TW.md",
    termsUrl: "./content/terms.zh-TW.md"
};
