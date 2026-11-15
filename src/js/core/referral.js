/**
 * 推薦機制 — 8 字元推薦碼（含校驗位）。
 *
 * 格式：4 個識別碼（大寫英數）+ 1 個校驗碼。
 * 校驗採用模 36 加權和，任何一鍵誤植都會導致解析失敗。
 */

import { readString, writeString, removeKey } from "./storage.js";

/** 識別碼使用的字元集（去除易混淆的 0/O、1/I）。 */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** 校驗碼使用基 36。 */
const CHECK_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const STORAGE_KEY = "mumu.referral";
const CONSUMED_KEY = "mumu.referral.consumed";

/**
 * 產生推薦碼。
 * @param {string} code 可指定前綴；未指定則隨機
 * @returns {string}
 */
export function referralCode(code = "") {
    let body = code.replace(/[^0-9A-Z]/gi, "").toUpperCase().slice(0, 4);
    while (body.length < 4) {
        body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    return body + checkDigit(body);
}

/**
 * 計算校驗碼。
 * @param {string} body
 * @returns {string}
 */
function checkDigit(body) {
    let sum = 0;
    for (let i = 0; i < body.length; i++) {
        sum += (body.charCodeAt(i) - 48 + i * 7) % 36;
    }
    return CHECK_ALPHABET[sum % 36];
}

/**
 * 解析推薦碼。
 * @param {string} code
 * @returns {string | null} 有效則回傳正規化後的碼，無效回傳 null
 */
export function parseReferral(code) {
    if (!code || typeof code !== "string") return null;
    const normalized = code.replace(/[^0-9A-Z]/gi, "").toUpperCase();
    if (normalized.length !== 5) return null;

    const body = normalized.slice(0, 4);
    const check = normalized.slice(4);
    if (checkDigit(body) !== check) return null;

    for (const ch of body) {
        if (!ALPHABET.includes(ch)) return null;
    }
    return normalized;
}

/**
 * 儲存推薦碼（首次安裝時有效）。
 * @param {string} code
 * @returns {boolean} 是否成功儲存
 */
export function storeReferral(code) {
    const parsed = parseReferral(code);
    if (!parsed) return false;
    if (readString(CONSUMED_KEY, "")) return false; // 已套用過則不再覆寫
    writeString(STORAGE_KEY, parsed);
    return true;
}

/**
 * 套用推薦碼（僅首次啟動有效），套用後清除。
 * @param {string} code
 * @returns {string | null} 套用成功回傳推薦碼
 */
export function consumeReferral(code) {
    const parsed = parseReferral(code);
    if (!parsed) return null;
    if (readString(CONSUMED_KEY, "")) return null;

    writeString(CONSUMED_KEY, parsed);
    removeKey(STORAGE_KEY);
    return parsed;
}

/**
 * 讀取待套用的推薦碼。
 * @returns {string}
 */
export function pendingReferral() {
    return readString(STORAGE_KEY, "");
}

/**
 * 讀取已套用的推薦碼。
 * @returns {string}
 */
export function consumedReferral() {
    return readString(CONSUMED_KEY, "");
}
