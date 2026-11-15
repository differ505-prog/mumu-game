/**
 * 圖鑑解鎖判定與學習里程碑。
 *
 * 規範：解鎖條件**必須**基於真實學習行為（最小對答對次數、節奏複現成功率等），
 * 不得以純操作次數或遊玩時數計。
 */

/**
 * 兒童／家長雙層文案（由 main.js 注入）。
 * @type {any}
 */
let voiceData = null;

/**
 * 注入雙層文案資料。
 * @param {any} data
 */
export function setChildVoice(data) {
    voiceData = data || null;
}

/**
 * 取得雙層文案資料。
 * @returns {any}
 */
export function childVoice() {
    return voiceData;
}

/**
 * 技能軸對應的解鎖條件欄位。
 */
const AXIS_FIELD = {
    "minimal-pair": "minimalPairCorrect",
    "sequence": "sequenceCorrect",
    "rhythm": "rhythmCorrect",
    "interference": "interferenceCorrect",
    "pitch": "pitchCorrect",
    "puzzle": "puzzleCorrect",
    "memory": "memoryCorrect",
    "color": "colorCorrect",
    "shape": "shapeCorrect"
};

/**
 * 從學習樣本累積各技能軸統計。
 * @param {any} progress
 * @param {{ verb:string, correct:boolean, locale:string }} sample
 */
export function recordLearningSample(progress, sample) {
    if (!progress.learningSamples) progress.learningSamples = [];

    const axis = AXIS_FIELD[sample.verb] || "otherCorrect";
    progress.learningSamples.push({
        axis,
        verb: sample.verb,
        correct: sample.correct ? 1 : 0,
        locale: sample.locale
    });

    // 限制樣本長度，避免存檔無限膨脹（保留最近 500 筆）
    if (progress.learningSamples.length > 500) {
        progress.learningSamples = progress.learningSamples.slice(-500);
    }
    return progress;
}

/**
 * 取得某技能軸的統計。
 * @param {any} progress
 * @param {string} axis
 * @returns {{ correct:number, total:number, rate:number }}
 */
export function axisStats(progress, axis) {
    const samples = (progress.learningSamples || []).filter((/** @type {any} */ s) => s.axis === axis);
    const correct = samples.filter((/** @type {any} */ s) => s.correct).length;
    return {
        correct,
        total: samples.length,
        rate: samples.length ? correct / samples.length : 0
    };
}

/**
 * 判定某隻恐龍是否解鎖。
 * @param {any} bundle
 * @param {any} progress
 * @param {string} dinoId
 * @returns {boolean}
 */
export function checkDexUnlock(bundle, progress, dinoId) {
    const entry = bundle?.dex?.find((/** @type {any} */ d) => d.id === dinoId);
    if (!entry) return false;
    if ((progress.unlockedDex || []).includes(dinoId)) return true;

    const cond = entry.unlockCondition || entry.unlock || {};
    return evaluateCondition(cond, progress) >= 1;
}

/**
 * 取得解鎖完成度（0–1）。
 * @param {any} bundle
 * @param {any} progress
 * @param {string} dinoId
 * @returns {number}
 */
export function dexUnlockProgress(bundle, progress, dinoId) {
    const entry = bundle?.dex?.find((/** @type {any} */ d) => d.id === dinoId);
    if (!entry) return 0;
    if ((progress.unlockedDex || []).includes(dinoId)) return 1;

    const cond = entry.unlockCondition || entry.unlock || {};
    const value = evaluateCondition(cond, progress);
    return Math.max(0, Math.min(1, value));
}

/**
 * 評估解鎖條件。
 * @param {any} cond
 * @param {any} progress
 * @returns {number} 0–1
 */
function evaluateCondition(cond, progress) {
    if (!cond || !cond.type) return 1;

    switch (cond.type) {
        case "always":
            return 1;

        case "chapter":
            return clamp01((progress.unlockedLevels?.length || 0) / Math.max(1, cond.chapter || 1));

        case "minimal-pair":
            return ratio(axisStats(progress, "minimalPairCorrect").correct, cond.count || 1);

        case "sequence":
            return ratio(axisStats(progress, "sequenceCorrect").correct, cond.count || 1);

        case "rhythm":
            return ratio(axisStats(progress, "rhythmCorrect").correct, cond.count || 1);

        case "interference":
            return ratio(axisStats(progress, "interferenceCorrect").correct, cond.count || 1);

        case "pitch":
            return ratio(axisStats(progress, "pitchCorrect").correct, cond.count || 1);

        case "puzzle":
            return ratio(axisStats(progress, "puzzleCorrect").correct, cond.count || 1);

        case "memory":
            return ratio(axisStats(progress, "memoryCorrect").correct, cond.count || 1);

        case "accuracy": {
            const stats = axisStats(progress, cond.axis || "minimalPairCorrect");
            if (!stats.total) return 0;
            return clamp01(stats.rate / (cond.rate || 0.8));
        }

        case "stars":
            return ratio(totalStars(progress), cond.count || 1);

        default:
            return 0;
    }
}

/**
 * 產生解鎖條件的人類可讀文字。
 *
 * 規範：view = "child"（預設）時只使用兒童語言（誘因式），
 * 不得出現任何認知心理學或教育評量術語；
 * view = "parent" 時保留正式技能名，供家長端使用。
 *
 * @param {any} bundle
 * @param {any} progress
 * @param {string} dinoId
 * @param {string} locale
 * @param {"child"|"parent"} [view]
 * @returns {string}
 */
export function unlockConditionText(bundle, progress, dinoId, locale, view = "child") {
    if (view === "child") {
        return childUnlockText(bundle, progress, dinoId, locale);
    }
    return parentUnlockText(bundle, progress, dinoId, locale);
}

/**
 * 兒童版解鎖條件文字 — 誘因式，非作業指令。
 * @param {any} bundle
 * @param {any} progress
 * @param {string} dinoId
 * @param {string} locale
 * @returns {string}
 */
export function childUnlockText(bundle, progress, dinoId, locale) {
    const entry = bundle?.dex?.find((/** @type {any} */ d) => d.id === dinoId);
    const cond = entry?.unlockCondition || entry?.unlock || {};
    const voice = childVoice();
    const key = locale === "en-US" ? "en-US" : "zh-TW";

    const verbName = voice?.verbChildLabel?.[cond.type]?.[key] || "";
    const template = voice?.unlockChild?.[cond.type]?.[key];

    if (!template) {
        return voice?.childNotSet?.[key] || (key === "en-US" ? "Play a few rounds to find out" : "再玩幾場就會出現");
    }

    let n = cond.count || 0;
    if (cond.type === "minimal-pair") n = remaining(cond, axisStats(progress, "minimalPairCorrect").correct);
    else if (cond.type === "sequence") n = remaining(cond, axisStats(progress, "sequenceCorrect").correct);
    else if (cond.type === "rhythm") n = remaining(cond, axisStats(progress, "rhythmCorrect").correct);
    else if (cond.type === "interference") n = remaining(cond, axisStats(progress, "interferenceCorrect").correct);
    else if (cond.type === "pitch") n = remaining(cond, axisStats(progress, "pitchCorrect").correct);
    else if (cond.type === "puzzle") n = remaining(cond, axisStats(progress, "puzzleCorrect").correct);
    else if (cond.type === "memory") n = remaining(cond, axisStats(progress, "memoryCorrect").correct);
    else if (cond.type === "stars") n = remaining(cond, totalStars(progress));
    else if (cond.type === "chapter") n = Math.max(0, (cond.chapter || 0) - (progress?.chapter || 0));
    else if (cond.type === "accuracy") n = Math.round((cond.rate || 0.8) * 100);

    let text = template.replace(/\{n\}/g, String(n)).replace(/\{verb\}/g, verbName);

    const suffix = voice?.childSuffix?.[key];
    if (suffix) text += suffix;

    if (cond.locale) {
        const ls = voice?.localeSuffix?.[key];
        if (ls) text += ls;
    }
    if (cond.noHint === true) {
        const ns = voice?.noHintSuffix?.[key];
        if (ns) text += ns;
    }

    return text;
}

/**
 * 家長版解鎖條件文字 — 正式技能名與數據。
 * @param {any} bundle
 * @param {any} progress
 * @param {string} dinoId
 * @param {string} locale
 * @returns {string}
 */
export function parentUnlockText(bundle, progress, dinoId, locale) {
    const entry = bundle?.dex?.find((/** @type {any} */ d) => d.id === dinoId);
    const cond = entry?.unlockCondition || entry?.unlock || {};
    const en = locale === "en-US";
    const voice = childVoice();
    const key = en ? "en-US" : "zh-TW";
    const formal = voice?.parentVerbLabel?.[cond.type]?.[key] || "";
    const parentRateLabel = voice?.parentRateLabel?.[key] || "";
    const puzzleUnit = voice?.parentPuzzleUnit?.[key] || "";
    const memoryUnit = voice?.parentMemoryUnit?.[key] || "";

    switch (cond.type) {
        case "chapter":
            return en
                ? `Reach chapter ${cond.chapter}`
                : `抵達第 ${cond.chapter} 章`;
        case "minimal-pair":
            return en
                ? `Get ${cond.count} minimal-pair answers right`
                : `再答對 ${remaining(cond, axisStats(progress, "minimalPairCorrect").correct)} 次${formal}`;
        case "sequence":
            return en
                ? `Get ${cond.count} sequences right`
                : `再答對 ${remaining(cond, axisStats(progress, "sequenceCorrect").correct)} 次${formal}`;
        case "rhythm":
            return en
                ? `Get ${cond.count} rhythms right`
                : `再答對 ${remaining(cond, axisStats(progress, "rhythmCorrect").correct)} 次${formal}`;
        case "interference":
            return en
                ? `Get ${cond.count} interference tasks right`
                : `再答對 ${remaining(cond, axisStats(progress, "interferenceCorrect").correct)} 次${formal}`;
        case "pitch":
            return en
                ? `Get ${cond.count} pitch matches right`
                : `再答對 ${remaining(cond, axisStats(progress, "pitchCorrect").correct)} 次${formal}`;
        case "puzzle":
            return en
                ? `Complete ${cond.count} puzzles`
                : `再完成 ${remaining(cond, axisStats(progress, "puzzleCorrect").correct)} 個${puzzleUnit}`;
        case "memory":
            return en
                ? `Complete ${cond.count} memory games`
                : `再完成 ${remaining(cond, axisStats(progress, "memoryCorrect").correct)} 個${memoryUnit}`;
        case "accuracy":
            return en
                ? `Reach ${Math.round((cond.rate || 0.8) * 100)}% accuracy`
                : `達到 ${Math.round((cond.rate || 0.8) * 100)}% ${parentRateLabel}`;
        case "stars":
            return en
                ? `Collect ${cond.count} stars`
                : `再收集 ${remaining(cond, totalStars(progress))} 顆星星`;
        default:
            return en ? "Ready to unlock" : "已可解鎖";
    }
}

/**
 * 剩餘次數文字。
 * @param {any} cond
 * @param {number} current
 */
function remaining(cond, current) {
    return Math.max(0, (cond.count || 1) - current);
}

/**
 * 比率。
 * @param {number} value
 * @param {number} target
 */
function ratio(value, target) {
    if (!target) return 0;
    return clamp01(value / target);
}

/**
 * 夾在 0–1。
 * @param {number} n
 */
function clamp01(n) {
    return Math.max(0, Math.min(1, n));
}

/**
 * 總星數。
 * @param {any} progress
 */
export function totalStars(progress) {
    const stars = progress.stars || {};
    return Object.values(stars).reduce((s, v) => s + (Number(v) || 0), 0);
}
