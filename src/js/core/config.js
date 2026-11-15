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
    cacheName: "mumu-v3",
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
