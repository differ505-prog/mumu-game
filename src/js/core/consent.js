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

/**
 * 刪除所有本機資料。
 *
 * 規範：
 *   - **必須**以列舉前綴的方式清除所有 `mumu.*` key（不得硬寫 key 清單）
 *   - **必須**回報刪除結果（成功／部分失敗）
 *   - 後端刪除端點需逾時保護（5s）；逾時或失敗時回報部分失敗，
 *     **不得**中斷 UI（由呼叫端顯示錯誤與重試）
 *
 * @returns {Promise<{ ok: boolean, removed: number, failed: string[] }>}
 */
export async function deleteAllData() {
    const failed = [];
    let removed = 0;

    // ① 本機：列舉前綴清除所有 mumu.* key
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("mumu.")) keys.push(key);
        }
        for (const key of keys) {
            try {
                localStorage.removeItem(key);
                removed++;
            } catch (err) {
                failed.push(`localStorage:${key}`);
                console.warn("[consent] 無法刪除本機 key", key, err);
            }
        }
    } catch (err) {
        failed.push("localStorage:enum");
        console.warn("[consent] 無法列舉本機資料", err);
    }

    // ② 後端刪除端點（若已接）；逾時 5s
    const endpoint = getDeleteEndpoint();
    if (endpoint) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
            const res = await fetch(endpoint, {
                method: "DELETE",
                signal: controller.signal,
                keepalive: true
            });
            if (!res.ok) failed.push(`backend:${res.status}`);
        } catch (err) {
            failed.push("backend:request");
            console.warn("[consent] 後端刪除請求失敗", err);
        } finally {
            clearTimeout(timer);
        }
    }

    return { ok: failed.length === 0, removed, failed };
}

/**
 * 後端刪除端點（未設定時僅做本機清除）。
 * @returns {string}
 */
function getDeleteEndpoint() {
    try {
        const raw = localStorage.getItem("mumu.delete.endpoint");
        if (!raw) return "";
        // 僅允許同源相對路徑或 https: 端點
        if (raw.startsWith("/") || raw.startsWith("./")) return raw;
        if (/^https:\/\//.test(raw)) return raw;
        return "";
    } catch {
        return "";
    }
}
