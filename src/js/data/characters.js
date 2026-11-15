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
