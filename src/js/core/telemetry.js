/**
 * 遙測 — 依同意狀態決定是否送出，資料最小化。
 *
 * 規範：不含任何可識別資訊（無姓名、無精確時間戳、無裝置 ID、無 IP）。
 * 未取得分析同意時一律不送出，只在本地計數。
 */

import { readJson, writeJson } from "./storage.js";
import { getConsent } from "./consent.js";

const QUEUE_KEY = "mumu.telemetry.queue";
const MAX_QUEUE = 200;

/** @type {any[]} */
let queue = [];

/**
 * 載入待送出佇列。
 */
export function loadQueue() {
    queue = readJson(QUEUE_KEY, []);
    if (!Array.isArray(queue)) queue = [];
}

/**
 * 設定遙測同意。
 * @param {any} consent
 */
export function setTelemetryConsent(consent) {
    writeJson("mumu.telemetry.consent", {
        analytics: Boolean(consent?.analytics),
        updatedAt: consent?.updatedAt || ""
    });
}

/**
 * 追蹤事件。
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 */
export function track(name, params = {}) {
    const consent = getConsent();
    if (!consent.analytics) return;

    const event = {
        name,
        params: sanitize(params),
        // 只記錄 UTC 日期，不記錄精確時間（無法回推單次行為）
        day: new Date().toISOString().slice(0, 10)
    };

    queue.push(event);
    if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
    writeJson(QUEUE_KEY, queue);

    // 未接上後端時，事件僅保存在本地佇列（不外送任何資料）
    void 0;
}

/**
 * 分享事件。
 * @param {string} name
 * @param {Record<string, unknown>} params
 */
export function trackShare(name, params = {}) {
    track(name, {
        cardKind: params.cardKind,
        channel: params.channel,
        referralCode: params.referralCode
    });
}

/**
 * 推薦安裝歸因。
 * @param {string} code
 */
export function trackReferralInstall(code) {
    track("referral_install", { referralCode: code });
}

/**
 * 取得待送出佇列（家長端可檢視與清除）。
 */
export function getQueue() {
    return [...queue];
}

/**
 * 清除佇列。
 */
export function clearQueue() {
    queue = [];
    writeJson(QUEUE_KEY, queue);
}

/**
 * 移除可能帶有可識別資訊的欄位。
 * @param {Record<string, unknown>} params
 */
function sanitize(params) {
    /** @type {Record<string, unknown>} */
    const out = {};
    const blocked = ["email", "name", "ip", "deviceId", "userId", "phone", "address"];
    for (const [k, v] of Object.entries(params || {})) {
        if (blocked.includes(k)) continue;
        if (typeof v === "string" && v.length > 64) continue;
        out[k] = v;
    }
    return out;
}
