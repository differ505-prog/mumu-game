/**
 * 關卡存取層。
 */

/**
 * 依 id 取得關卡。
 * @param {any} bundle
 * @param {number} levelId
 */
export function getLevel(bundle, levelId) {
    const found = bundle?.levels?.find((/** @type {any} */ l) => l.id === levelId);
    if (!found) {
        throw new Error(`[levels] 找不到關卡: ${levelId}`);
    }
    return found;
}

/**
 * 依章節取得關卡清單。
 * @param {any} bundle
 * @param {number} chapter
 */
export function getChapterLevels(bundle, chapter) {
    return (bundle?.levels || []).filter((/** @type {any} */ l) => l.chapter === chapter);
}

/**
 * 依玩法（技能軸）隨機取題。
 *
 * 注意：這裡取的是「題目元素」，例如某個顏色、某種動物，
 * 題目的組成規則由各玩法引擎決定。
 *
 * @param {any} bundle
 * @param {string} verb 技能軸
 * @param {number} count 需要的數量
 * @param {string} [excludeName] 需要排除的 id（避免與正解重複）
 */
export function pickItems(bundle, verb, count, excludeName = "") {
    const items = bundle?.items || {};
    /** @type {any[]} */
    let pool = [];

    switch (verb) {
        case "sequence":
        case "minimal-pair":
        case "rhythm":
        case "interference":
            pool = items.animals || [];
            break;
        case "color":
            pool = items.colors || [];
            break;
        case "shape":
            pool = items.shapes || [];
            break;
        case "number":
            pool = items.numbers || [];
            break;
        case "pitch":
            pool = items.pitches || [];
            break;
        case "dino":
            pool = items.dinos || [];
            break;
        default:
            pool = items.animals || [];
    }

    const candidates = pool.filter((/** @type {any} */ it) => {
        const id = it.id ?? String(it.value);
        return id !== excludeName;
    });

    const picked = [];
    const working = [...candidates];
    for (let i = 0; i < count && working.length; i++) {
        const idx = Math.floor(Math.random() * working.length);
        picked.push(working.splice(idx, 1)[0]);
    }
    return picked;
}

/**
 * 取得關卡的任務動機句。
 * @param {any} bundle
 * @param {number} levelId
 * @param {string} locale
 */
export function levelObjective(bundle, levelId, locale) {
    const level = getLevel(bundle, levelId);
    return level.objective?.[locale] || level.objective?.["zh-TW"] || "";
}

/**
 * 取得關卡規格。
 * @param {any} bundle
 * @param {number} levelId
 */
export function levelSpec(bundle, levelId) {
    const level = getLevel(bundle, levelId);
    return level.spec || { rounds: 3, sequenceLength: 2, options: 2, interference: 0 };
}

/**
 * 取得關卡名稱。
 * @param {any} bundle
 * @param {number} levelId
 * @param {string} locale
 */
export function levelName(bundle, levelId, locale) {
    const level = getLevel(bundle, levelId);
    return level.name?.[locale] || level.name?.["zh-TW"] || "";
}
