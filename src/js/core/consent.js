/**
 * 同意管理 — 兒少隱私的核心機制。
 *
 * 預設全部 false（選擇性加入），每項可獨立撤回。
 * 美國 COPPA 定向廣告需獨立同意；本案一律 false。
 */

import { readJson, writeJson } from "./storage.js";

/**
 * @typedef {Object} Consent
 * @property {boolean} analytics
 * @property {boolean} personalization
 * @property {boolean} marketing
 * @property {string} updatedAt
 */

const STORAGE_KEY = "mumu.consent";

/**
 * 取得同意狀態。
 * @returns {Consent}
 */
export function getConsent() {
    const saved = readJson(STORAGE_KEY, null);
    if (!saved) {
        return { analytics: false, personalization: false, marketing: false, updatedAt: "" };
    }
    return {
        analytics: Boolean(saved.analytics),
        personalization: Boolean(saved.personalization),
        marketing: Boolean(saved.marketing),
        updatedAt: String(saved.updatedAt || "")
    };
}

/**
 * 更新同意狀態。
 * @param {Partial<Consent>} patch
 */
export function setConsent(patch) {
    const next = { ...getConsent(), ...patch, updatedAt: new Date().toISOString() };
    writeJson(STORAGE_KEY, next);
    return next;
}

/**
 * 撤回某一項同意。
 * @param {keyof Consent} key
 */
export function revokeConsent(key) {
    if (key === "updatedAt") return getConsent();
    return setConsent({ [key]: false });
}

/**
 * 家長可讀摘要。
 * @param {Consent} consent
 * @returns {string}
 */
export function consentSummary(consent) {
    const c = consent || getConsent();
    const yn = (v) => (v ? "是" : "否");
    return [
        `分析用途（了解功能使用狀況）：${yn(c.analytics)}`,
        `個人化內容（依表現調整難度）：${yn(c.personalization)}`,
        `行銷用途：${yn(c.marketing)}`,
        `最後更新：${c.updatedAt || "尚未設定"}`,
        "定向廣告：本 App 一律不進行兒少行為式廣告定向。"
    ].join("\n");
}

/**
 * 是否可進行定向廣告。
 *
 * COPPA 2025 修正案（2026/4/22 生效）要求對兒少取得獨立同意；
 * 本案產品定位為幼兒教育 App，一律回傳 false。
 *
 * @param {Consent} consent
 * @returns {boolean}
 */
export function canTargetedAdvertise(consent) {
    void consent;
    return false;
}
