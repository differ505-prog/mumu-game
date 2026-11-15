/**
 * 觸覺回饋 — 讓孩子不看螢幕也能感知對錯。
 */

/**
 * @typedef {"tap"|"correct"|"wrong"|"celebrate"|"unlock"|"snap"} HapticPattern
 */

/** 各模式的震動模式（毫秒） */
const PATTERNS = {
    tap: [10],
    correct: [12, 40, 12],
    wrong: [60],
    celebrate: [18, 50, 18, 50, 18],
    unlock: [30, 60, 30],
    snap: [8]
};

/** @type {boolean} */
let enabled = true;

/**
 * 設定觸覺開關。
 * @param {boolean} value
 */
export function setHapticsEnabled(value) {
    enabled = value;
}

/**
 * 觸覺是否啟用。
 * @returns {boolean}
 */
export function hapticsEnabled() {
    return enabled;
}

/**
 * 播放觸覺回饋。
 * @param {HapticPattern} pattern
 * @param {boolean} [force] 忽略全域開關（家長設定仍優先）
 */
export function haptic(pattern, force = false) {
    if (!enabled && !force) return;
    if (!("vibrate" in navigator)) return;
    const seq = PATTERNS[pattern] || PATTERNS.tap;
    try {
        navigator.vibrate(seq);
    } catch {
        // 部分瀏覽器在無使用者手勢時會丟出例外，忽略即可
    }
}
