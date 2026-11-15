/**
 * 題目存取層。
 */

/**
 * 依 id 取得顏色。
 * @param {any} bundle
 * @param {string} id
 */
export function colorItem(bundle, id) {
    return (bundle?.items?.colors || []).find((/** @type {any} */ c) => c.id === id) || null;
}

/**
 * 依 id 取得恐龍。
 * @param {any} bundle
 * @param {string} id
 */
export function dinoItem(bundle, id) {
    return (bundle?.items?.dinos || []).find((/** @type {any} */ d) => d.id === id) || null;
}

/**
 * 依語系取題目名稱。
 * @param {any} bundle
 * @param {string} locale
 * @param {string} id
 * @param {string} [collection] 指定集合；未指定時自動搜尋
 */
export function itemLabel(bundle, locale, id, collection = "") {
    const items = bundle?.items || {};
    const pools = collection
        ? [items[collection] || []]
        : [items.colors || [], items.shapes || [], items.animals || [], items.dinos || [], items.numbers || [], items.pitches || []];

    for (const pool of pools) {
        const found = pool.find((/** @type {any} */ it) => {
            const key = it.id ?? String(it.value);
            return key === id;
        });
        if (found) {
            return found[locale] || found["zh-TW"] || id;
        }
    }
    return id;
}

/**
 * 依關卡難度取得最小對題目。
 *
 * 難度升級路徑由 minimal-pairs.json 的 levels 定義：
 * level 1 無干擾、level 2 一個干擾、level 3 兩個干擾（且改為元音差異）。
 *
 * @param {any} bundle
 * @param {string} locale
 * @param {number} level
 */
export function minimalPairFor(bundle, locale, level) {
    const mp = bundle?.minimalPairs || {};
    const pool = mp[locale] || mp["zh-TW"] || [];
    if (!pool.length) return null;

    const tiers = mp.levels || [];
    const tier = tiers.find((/** @type {any} */ t) => t.level === level) || tiers[tiers.length - 1];
    const feature = tier?.feature || "initial";
    const distractorCount = tier?.distractors ?? 0;

    // 優先取符合難度特徵的題目
    const matching = pool.filter((/** @type {any} */ p) => p.feature === feature);
    const source = matching.length ? matching : pool;

    const picked = source[Math.floor(Math.random() * source.length)];

    // 干擾項來自題目自帶的 distractor 字串（以／分隔）
    const distractors = (picked.distractor || "")
        .split("／")
        .filter((/** @type {string} */ d) => d && !picked.pair.includes(d))
        .slice(0, distractorCount);

    return {
        id: picked.id,
        pair: picked.pair,
        feature: picked.feature,
        distractors,
        locale
    };
}

/**
 * 依 id 取得恐龍足跡。
 * @param {any} bundle
 * @param {string} id
 */
export function footprintFor(bundle, id) {
    return (bundle?.items?.footprints || []).find((/** @type {any} */ f) => f.id === id) || null;
}

/**
 * 依網格大小取得足跡配對（用於記憶翻牌）。
 * @param {any} bundle
 * @param {number} gridSize
 */
export function footprintPairs(bundle, gridSize) {
    const all = bundle?.items?.footprints || [];
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    const needed = Math.max(2, Math.ceil(gridSize / 2));
    return shuffled.slice(0, needed);
}
