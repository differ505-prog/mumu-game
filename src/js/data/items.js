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

    // Step 162／163：滑動視窗去重抽題
    const picked = pickUnseen(source, `minimal-pairs:${locale}`);

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
 * 題庫異常時的安全預設題（Step 162：不得白屏、不得回傳空陣列）。
 * @type {any[]}
 */
const SAFE_FALLBACK_ITEMS = [
    { id: "circle", "zh-TW": "圓形", "en-US": "circle", svg: "circle" },
    { id: "square", "zh-TW": "方形", "en-US": "square", svg: "square" },
    { id: "triangle", "zh-TW": "三角形", "en-US": "triangle", svg: "triangle" },
    { id: "star", "zh-TW": "星星", "en-US": "star", svg: "star" }
];

/**
 * 取得安全預設題（題庫載入失敗時的降級來源）。
 * @param {number} count
 * @returns {any[]}
 */
export function safeFallbackItems(count = 1) {
    const n = Math.max(1, Math.min(count, SAFE_FALLBACK_ITEMS.length));
    return SAFE_FALLBACK_ITEMS.slice(0, n);
}

/**
 * 近期已出的題目 id（滑動視窗）。
 *
 * 跨回合保存，避免短期重複；視窗大小 = 題庫大小的 2/3（至少 4）。
 * @type {Map<string, string[]>}
 */
const recentBuckets = new Map();

/**
 * 近期視窗大小。
 * @param {number} poolSize
 * @returns {number}
 */
function windowSize(poolSize) {
    return Math.max(4, Math.floor(poolSize * 2 / 3));
}

/**
 * 清除近期去重記錄（重玩同一章節時可重置）。
 */
export function resetRecentItems() {
    recentBuckets.clear();
}

/**
 * 取得近期已出的題目 id（唯讀複本）。
 * @returns {string[]}
 */
export function getRecentIds() {
    /** @type {string[]} */
    const all = [];
    for (const b of recentBuckets.values()) all.push(...b);
    return all;
}

/**
 * 取得（或建立）某個題庫的近期記錄桶。
 * @param {string} key
 * @returns {string[]}
 */
function bucketFor(key) {
    let b = recentBuckets.get(key);
    if (!b) {
        b = [];
        recentBuckets.set(key, b);
    }
    return b;
}

/**
 * 滑動視窗去重抽題。
 *
 * 規範：
 *   - 優先挑選**近期未出現**的題目
 *   - 題庫將盡時**安全重置**視窗（不得卡死、不得回傳空值）
 *   - 同一回合內不得重複（由呼叫端在同回合只取一次保證）
 *
 * @param {any[]} pool
 * @returns {any}
 */
export function pickUnseen(pool, key = "default") {
    if (!Array.isArray(pool) || !pool.length) {
        return null;
    }

    const bucket = bucketFor(key);
    const size = windowSize(pool.length);
    const recent = new Set(bucket);

    // 先找未出現的
    const unseen = pool.filter((/** @type {any} */ p) => !recent.has(p.id));

    if (unseen.length) {
        const picked = unseen[Math.floor(Math.random() * unseen.length)];
        bucket.push(picked.id);
        while (bucket.length > size) bucket.shift();
        return picked;
    }

    // 題庫將盡 → 安全重置視窗（保留最後一次以避免同一回合立即重複）
    bucket.length = 0;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    bucket.push(picked.id);
    return picked;
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
