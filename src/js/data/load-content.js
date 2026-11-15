/**
 * 內容載入器 — 執行期以 fetch 載入 JSON 內容包。
 *
 * 設計重點：
 * - 內容檔與程式碼分離，內容更新不需要改程式。
 * - 單例快取：同一語系只載入一次。
 */

/**
 * @typedef {Object} Character
 * @property {string} id
 * @property {{ "zh-TW": string, "en-US": string }} name
 * @property {string} kind
 * @property {boolean} playable
 * @property {{ file: string, hasAlpha: boolean }} art
 * @property {{ primary: string, secondary: string, accent: string }} palette
 * @property {{ pitch: number, rate: number, blurb: { "zh-TW": string, "en-US": string } }} voice
 * @property {{ roar: string, idle: string, celebrate: string, walk: string }} traits
 */

/**
 * @typedef {Object} DexEntry
 * @property {string} id
 * @property {{ "zh-TW": string, "en-US": string }} name
 * @property {number} dexNo
 * @property {any} unlockCondition
 * @property {string} roar
 * @property {{ "zh-TW": string, "en-US": string }} personality
 * @property {number} walkFrames
 * @property {{ file: string, hasAlpha: boolean }} art
 */

/**
 * @typedef {Object} ContentBundle
 * @property {Character[]} characters
 * @property {DexEntry[]} dex
 * @property {any} items
 * @property {any[]} levels
 * @property {any} narrative
 * @property {any} minimalPairs
 * @property {{ chapters: any[] }} storyArcs
 */

/** @type {ContentBundle | null} */
let cache = null;

/**
 * 載入單一 JSON。
 * @param {string} path
 * @returns {Promise<any>}
 */
async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) {
        throw new Error(`[content] 載入失敗 ${path} → HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * 載入完整內容包。
 * @param {string} locale
 * @returns {Promise<ContentBundle>}
 */
export async function loadContent(locale) {
    if (cache) return cache;

    const [characters, items, levels, narrative, minimalPairs, storyArcs] = await Promise.all([
        fetchJson("./content/characters.json"),
        fetchJson("./content/items.json"),
        fetchJson("./content/levels.json"),
        fetchJson(`./content/narrative.${locale}.json`),
        fetchJson("./content/minimal-pairs.json"),
        fetchJson("./content/story-arcs.json")
    ]);

    const playable = characters.playable || [];
    const dex = characters.dex || [];

    cache = { characters: playable, dex, items, levels, narrative, minimalPairs, storyArcs };
    return cache;
}

/**
 * 清除快取（切換語系時使用）。
 */
export function resetContentCache() {
    cache = null;
}
