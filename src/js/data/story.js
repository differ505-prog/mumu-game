/**
 * 敘事選句邏輯 — 由 content bundle 取句，避免同一句連續出現。
 */

/**
 * 依 chapter 取得該章信件。
 * @param {any} bundle 內容 bundle
 * @param {string} locale
 * @param {number} chapter
 * @returns {string}
 */
export function chapterLetter(bundle, locale, chapter) {
    const arcs = bundle?.storyArcs?.chapters || [];
    const arc = arcs.find((/** @type {any} */ a) => a.chapter === chapter);
    if (!arc) return "";
    const letter = arc.letter?.[locale] || arc.letter?.["zh-TW"] || "";
    return letter;
}

/**
 * 依語系取章節標題。
 * @param {any} bundle
 * @param {string} locale
 * @param {number} chapter
 * @returns {string}
 */
export function chapterTitle(bundle, locale, chapter) {
    const arcs = bundle?.storyArcs?.chapters || [];
    const arc = arcs.find((/** @type {any} */ a) => a.chapter === chapter);
    if (!arc) return "";
    return arc.title?.[locale] || arc.title?.["zh-TW"] || "";
}

/**
 * 決定性抽句：以 seed 為依據挑選句子，避免同一句連續出現。
 *
 * 設計重點：抽句結果只由 (context, seed) 決定，因此可重現；
 * 呼叫端以遞增 seed 呼叫，即可確保相鄰兩次不重複。
 *
 * @param {any} bundle
 * @param {string} locale
 * @param {"invite"|"encourage"|"hint"|"celebrate"|"comfort"} ctx
 * @param {number} [seed]
 * @returns {string}
 */
export function pickLine(bundle, locale, ctx, seed = 0) {
    const pool = bundle?.narrative?.contexts?.[ctx] || [];
    if (!pool.length) return "";
    const index = Math.abs(Math.floor(seed)) % pool.length;
    return pool[index];
}

/**
 * 依語系取恐龍台詞。
 * @param {any} bundle
 * @param {string} locale
 * @param {string} dinoId
 * @returns {string}
 */
export function dinoLine(bundle, locale, dinoId) {
    const entry = bundle?.narrative?.dinoLines?.[dinoId];
    if (!entry) return "";
    return entry[locale] || entry["zh-TW"] || "";
}

/**
 * 取分齡提示句。
 * @param {any} bundle
 * @param {string} locale
 * @param {"young"|"older"} band
 * @returns {string}
 */
export function ageText(bundle, locale, band) {
    const pool = bundle?.narrative?.ageVariants?.[band] || [];
    if (!pool.length) return "";
    return pool[0];
}

/**
 * 圖鑑解鎖稱讚句，支援 {name} 佔位。
 * @param {any} bundle
 * @param {string} locale
 * @param {string} dinoId
 * @returns {string}
 */
export function dexPraise(bundle, locale, dinoId) {
    const pool = bundle?.narrative?.dexPraise || [];
    if (!pool.length) return "";
    const dex = bundle?.dex || [];
    const entry = dex.find((/** @type {any} */ d) => d.id === dinoId);
    const name = entry?.name?.[locale] || entry?.name?.["zh-TW"] || dinoId;
    return pool[0].replace("{name}", name);
}
