/**
 * 掌握度模型與難度自適應。
 *
 * 規範：難度不得以 `level + 1` 決定，必須由掌握度驅動（無天花板）。
 */

/**
 * @typedef {Object} MasteryEntry
 * @property {string} axis
 * @property {number} ema 指數移動平均的答對率（0–1）
 * @property {number} correct 累計答對
 * @property {number} total 累計作答
 * @property {number} avgMs 平均反應時間
 * @property {number} hintsUsed 累計提示使用
 */

/**
 * 玩法到技能軸的對應。
 */
const VERB_AXES = {
    "sequence": ["sequenceCorrect"],
    "minimal-pair": ["minimalPairCorrect"],
    "rhythm": ["rhythmCorrect"],
    "interference": ["interferenceCorrect"],
    "pitch": ["pitchCorrect"],
    "puzzle": ["puzzleCorrect"],
    "memory": ["memoryCorrect"],
    "color": ["colorCorrect"],
    "shape": ["shapeCorrect"]
};

/**
 * 建立空的掌握度條目。
 * @param {string} axis
 * @returns {MasteryEntry}
 */
export function createMasteryEntry(axis) {
    return {
        axis,
        ema: 0.5,
        correct: 0,
        total: 0,
        avgMs: 0,
        hintsUsed: 0
    };
}

/**
 * 更新掌握度。
 *
 * EMA：ema = ema * (1 - α) + score * α，α 預設 0.3。
 * score 為 0（答錯）、1（答對且無提示）、0.5（答對但用了提示）。
 *
 * @param {MasteryEntry} entry
 * @param {{ correct:boolean, ms:number, hinted:boolean, alpha?:number }} sample
 * @returns {MasteryEntry}
 */
export function updateMastery(entry, sample) {
    const alpha = sample.alpha ?? 0.3;

    let score = 0;
    if (sample.correct) {
        score = sample.hinted ? 0.5 : 1;
    }

    entry.ema = entry.ema * (1 - alpha) + score * alpha;
    entry.total++;
    if (sample.correct) entry.correct++;
    if (sample.hinted) entry.hintsUsed++;

    // 反應時間採 EMA
    const ms = Math.max(0, sample.ms || 0);
    entry.avgMs = entry.total === 1 ? ms : entry.avgMs * 0.8 + ms * 0.2;

    return entry;
}

/**
 * 建議難度。
 *
 * 規則：ema < 0.5 → 降階；ema > 0.85 且無提示 → 升階；其餘維持。
 *
 * @param {MasteryEntry} entry
 * @returns {"down"|"stay"|"up"}
 */
export function suggestDifficulty(entry) {
    if (!entry || entry.total < 3) return "stay";
    if (entry.ema < 0.5) return "down";
    if (entry.ema > 0.85 && entry.hintsUsed === 0) return "up";
    return "stay";
}

/**
 * 取得某技能軸的掌握度。
 * @param {Record<string, MasteryEntry>} mastery
 * @param {string} axis
 * @returns {MasteryEntry}
 */
export function axisMastery(mastery, axis) {
    return mastery?.[axis] || createMasteryEntry(axis);
}

/**
 * 彙整某玩法的整體掌握度。
 * @param {Record<string, MasteryEntry>} mastery
 * @param {string} verb
 * @returns {MasteryEntry}
 */
export function verbMastery(mastery, verb) {
    const axes = VERB_AXES[verb] || [verb];
    /** @type {MasteryEntry} */
    const agg = createMasteryEntry(verb);

    let weighted = 0;
    let weightSum = 0;
    for (const axis of axes) {
        const entry = mastery?.[axis];
        if (!entry || entry.total === 0) continue;
        weighted += entry.ema * entry.total;
        weightSum += entry.total;
        agg.correct += entry.correct;
        agg.total += entry.total;
        agg.hintsUsed += entry.hintsUsed;
    }

    agg.ema = weightSum ? weighted / weightSum : 0.5;
    agg.avgMs = weightSum ? axes.reduce((s, a) => s + (mastery?.[a]?.avgMs || 0) * (mastery?.[a]?.total || 0), 0) / weightSum : 0;
    return agg;
}

/**
 * 由掌握度推導題目難度參數（無天花板）。
 *
 * 回傳值可超過 1，讓難度持續上升而非鎖死在關卡編號。
 *
 * @param {Record<string, MasteryEntry>} mastery
 * @param {string} verb
 * @param {number} baseDifficulty 關卡本身的基準難度
 * @returns {{ difficulty:number, sequenceLength:number, options:number, distractorCount:number }}
 */
export function deriveDifficulty(mastery, verb, baseDifficulty) {
    const entry = verbMastery(mastery, verb);
    // 以掌握度作為偏移量：掌握度越高，難度越高（無上限）
    const bonus = (entry.ema - 0.5) * 2;
    const difficulty = Math.max(0.5, baseDifficulty + bonus);

    return {
        difficulty,
        sequenceLength: Math.max(2, Math.round(2 + difficulty)),
        options: Math.max(2, Math.min(6, Math.round(2 + difficulty))),
        distractorCount: Math.max(0, Math.min(4, Math.round(difficulty - 1)))
    };
}

/**
 * 掌握度轉為 0–100 的百分比（供 UI 顯示）。
 * @param {MasteryEntry} entry
 */
export function masteryPercent(entry) {
    return Math.round((entry?.ema ?? 0) * 100);
}
