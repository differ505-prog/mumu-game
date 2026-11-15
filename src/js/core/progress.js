/**
 * 進度系統 — 存檔結構、遷移與進度更新。
 */

import { readJson, writeJson } from "./storage.js";

const STORAGE_KEY = "mumu.progress.v2";
const SCHEMA_VERSION = 2;

/**
 * @typedef {Object} Progress
 * @property {number} schemaVersion
 * @property {Record<string,number>} stars
 * @property {number[]} unlockedLevels
 * @property {string[]} unlockedDex
 * @property {any[]} learningSamples
 * @property {Record<string,any>} mastery
 * @property {{ count:number, lastDate:string }} streak
 * @property {string} dailyDate
 * @property {any} settings
 * @property {string} referralCode
 * @property {number} bestCombo
 * @property {string[]} medals
 * @property {any[]} assessmentRuns
 * @property {number} totalSessionMs
 */

/**
 * 建立空白進度。
 * @returns {Progress}
 */
export function createProgress() {
    return {
        schemaVersion: SCHEMA_VERSION,
        stars: {},
        unlockedLevels: [1],
        unlockedDex: [],
        learningSamples: [],
        mastery: {},
        streak: { count: 0, lastDate: "" },
        dailyDate: "",
        settings: {},
        referralCode: "",
        bestCombo: 0,
        medals: [],
        assessmentRuns: [],
        totalSessionMs: 0
    };
}

/**
 * 讀取進度（含遷移）。
 * @returns {Progress}
 */
export function loadProgress() {
    const raw = readJson(STORAGE_KEY, null);
    if (!raw) return createProgress();
    return migrate(raw);
}

/**
 * 儲存進度。
 * @param {Progress} p
 */
export function saveProgress(p) {
    writeJson(STORAGE_KEY, p);
}

/**
 * 遷移舊版存檔。
 * @param {Progress} p
 * @returns {Progress}
 */
export function migrate(p) {
    const next = { ...createProgress(), ...p };

    // 由舊版 santaGameAchievements 遷移 totalStars / bestCombo / medals
    const legacy = readJson("santaGameAchievements", null);
    if (legacy && typeof legacy === "object") {
        if (typeof legacy.totalStars === "number") {
            next.stars = { ...(next.stars || {}), __legacy: legacy.totalStars };
        }
        if (typeof legacy.bestCombo === "number") {
            next.bestCombo = Math.max(next.bestCombo || 0, legacy.bestCombo);
        }
        if (Array.isArray(legacy.medals)) {
            next.medals = [...new Set([...(next.medals || []), ...legacy.medals])];
        }
    }

    next.schemaVersion = SCHEMA_VERSION;
    next.stars = next.stars || {};
    next.unlockedLevels = Array.isArray(next.unlockedLevels) ? next.unlockedLevels : [1];
    next.unlockedDex = Array.isArray(next.unlockedDex) ? next.unlockedDex : [];
    next.learningSamples = Array.isArray(next.learningSamples) ? next.learningSamples : [];
    next.mastery = next.mastery || {};
    next.streak = next.streak || { count: 0, lastDate: "" };
    next.settings = next.settings || {};
    next.medals = Array.isArray(next.medals) ? next.medals : [];
    next.assessmentRuns = Array.isArray(next.assessmentRuns) ? next.assessmentRuns : [];

    return next;
}

/**
 * 記錄關卡結果：累加星數（取最高）、解鎖下一關。
 * @param {Progress} p
 * @param {number} levelId
 * @param {number} stars
 * @returns {Progress}
 */
export function recordLevelResult(p, levelId, stars) {
    const key = String(levelId);
    const prev = p.stars[key] || 0;
    p.stars[key] = Math.max(prev, stars);

    const next = levelId + 1;
    if (!p.unlockedLevels.includes(next)) {
        p.unlockedLevels.push(next);
    }
    p.unlockedLevels.sort((a, b) => a - b);
    return p;
}

/**
 * 解鎖圖鑑條目。
 * @param {Progress} p
 * @param {string} dinoId
 * @returns {boolean} 是否為新解鎖
 */
export function unlockDex(p, dinoId) {
    if (p.unlockedDex.includes(dinoId)) return false;
    p.unlockedDex.push(dinoId);
    return true;
}

/**
 * 更新連續天數。
 *
 * 規範：缺漏只中斷不懲罰（不回溯補登，不扣分）。
 *
 * @param {Progress} p
 * @param {string} today YYYY-MM-DD
 * @returns {Progress}
 */
export function updateStreak(p, today) {
    const last = p.streak.lastDate;
    if (!last) {
        p.streak = { count: 1, lastDate: today };
        return p;
    }
    if (last === today) return p;

    const diff = daysBetween(last, today);
    if (diff === 1) {
        p.streak.count += 1;
    } else {
        // 中斷即重設，但不懲罰、不補登
        p.streak.count = 1;
    }
    p.streak.lastDate = today;
    return p;
}

/**
 * 兩日之間的天數差。
 * @param {string} a
 * @param {string} b
 */
function daysBetween(a, b) {
    const ta = Date.parse(`${a}T00:00:00Z`);
    const tb = Date.parse(`${b}T00:00:00Z`);
    if (Number.isNaN(ta) || Number.isNaN(tb)) return 99;
    return Math.round((tb - ta) / 86400000);
}

/**
 * 今日日期字串（UTC）。
 * @param {Date} [now]
 */
export function todayString(now = new Date()) {
    return now.toISOString().slice(0, 10);
}

/**
 * 取得總星數。
 * @param {Progress} p
 */
export function totalStars(p) {
    return Object.values(p.stars || {}).reduce((s, v) => s + (Number(v) || 0), 0);
}
