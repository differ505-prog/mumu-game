/**
 * 每日挑戰 — 以 UTC 日期 + locale 產生穩定種子，全球同題。
 */

import { todayString } from "./progress.js";

/**
 * 產生每日種子。
 * @param {string} locale
 * @param {string} [now]
 * @returns {number}
 */
export function dailySeed(locale, now = todayString()) {
    const key = `${now}:${locale}`;
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) {
        hash ^= key.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash);
}

/**
 * 產生每日挑戰。
 * @param {any} bundle
 * @param {string} locale
 * @param {string} [now]
 * @returns {{ level:any, seed:number, title:string, date:string }}
 */
export function dailyChallenge(bundle, locale, now = todayString()) {
    const seed = dailySeed(locale, now);
    const levels = bundle?.levels || [];
    if (!levels.length) {
        return { level: null, seed, title: "", date: now };
    }

    // 以種子挑選固定關卡，全世界同一天拿到同一關
    const index = seed % levels.length;
    const level = levels[index];

    const title = locale === "en-US"
        ? `Daily Challenge — ${level.name?.["en-US"] || level.name?.["zh-TW"] || ""}`
        : `每日挑戰 — ${level.name?.["zh-TW"] || level.name?.["en-US"] || ""}`;

    return { level, seed, title, date: now };
}

/**
 * 今日挑戰是否已完成。
 * @param {any} p
 * @param {string} today
 * @returns {boolean}
 */
export function isDailyDone(p, today) {
    return p?.dailyDate === today;
}

/**
 * 標記今日挑戰完成。
 * @param {any} p
 * @param {string} today
 */
export function markDailyDone(p, today) {
    p.dailyDate = today;
    return p;
}
