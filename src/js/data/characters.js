/**
 * 角色存取層。
 */

/**
 * 依 id 取得可玩角色。
 * @param {any} bundle
 * @param {string} id
 */
export function getCharacter(bundle, id) {
    const found = bundle?.characters?.find((/** @type {any} */ c) => c.id === id);
    if (!found) {
        throw new Error(`[characters] 找不到角色: ${id}`);
    }
    return found;
}

/**
 * 依 id 取得角色（可玩角色或圖鑑角色皆可）。
 *
 * Step 119：章節搭檔可能來自 `playable`（如 santa）或 `dex`（如 dino-mosasaurus），
 * 兩者資料結構不同但都有 `id` / `name` / `art`，故提供此合併查詢。
 *
 * @param {any} bundle
 * @param {string} id
 * @returns {any}
 */
export function getAnyCharacter(bundle, id) {
    const playable = bundle?.characters?.find((/** @type {any} */ c) => c.id === id);
    if (playable) return playable;
    const dex = bundle?.dex?.find((/** @type {any} */ d) => d.id === id);
    if (dex) return dex;
    throw new Error(`[characters] 找不到角色: ${id}`);
}

/**
 * 依 id 取得角色語音設定（可玩角色或圖鑑角色皆可）。
 *
 * 圖鑑角色沒有 `voice` 欄位 → 使用預設音高與語速。
 *
 * @param {any} bundle
 * @param {string} id
 * @returns {{ pitch: number, rate: number }}
 */
export function anyCharacterVoice(bundle, id) {
    const c = getAnyCharacter(bundle, id);
    const voice = c.voice || {};
    return { pitch: voice.pitch ?? 1, rate: voice.rate ?? 0.85 };
}

/**
 * 依 id 取得圖鑑條目。未解鎖時仍回傳條目本身，解鎖狀態由 dex 模組判定。
 * @param {any} bundle
 * @param {string} id
 */
export function getDexEntry(bundle, id) {
    return bundle?.dex?.find((/** @type {any} */ d) => d.id === id) || null;
}

/**
 * 依目前章節取得可選角色。
 * @param {any} bundle
 * @param {number} chapter
 */
export function playableCharacters(bundle, chapter) {
    const list = bundle?.characters || [];
    return list.filter((/** @type {any} */ c) => {
        const unlock = c.unlock || {};
        if (unlock.type === "start") return true;
        if (unlock.type === "chapter") return chapter >= (unlock.chapter || 0);
        return false;
    });
}

/**
 * 取得角色語音設定。
 * @param {any} bundle
 * @param {string} id
 */
export function characterVoice(bundle, id) {
    const voice = getCharacter(bundle, id).voice || {};
    return { pitch: voice.pitch ?? 1, rate: voice.rate ?? 0.85 };
}

/**
 * 取得角色特徵（吼聲音色、動作）。
 * @param {any} bundle
 * @param {string} id
 */
export function characterTraits(bundle, id) {
    const traits = getCharacter(bundle, id).traits || {};
    return {
        roar: traits.roar || "mid",
        idle: traits.idle || "sway",
        celebrate: traits.celebrate || "jump",
        walk: traits.walk || "heavy"
    };
}
