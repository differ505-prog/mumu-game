/**
 * 遙測 — 依同意狀態決定是否送出，資料最小化。
 *
 * 規範：
 *   - 不含任何可識別資訊（無姓名、無精確時間戳、無裝置 ID、無 IP）
 *   - 未取得分析同意時一律不送出，只在本地計數
 *   - 外送失敗**不得**影響遊戲流程（不得拋錯）
 *   - 不得使用 setInterval 輪詢（用 visibilitychange + 明確 flush 觸發）
 */

import { readJson, writeJson } from "./storage.js";
import { getConsent } from "./consent.js";
import { TELEMETRY } from "./config.js";

const QUEUE_KEY = "mumu.telemetry.queue";
const MAX_QUEUE = 200;

/** @type {any[]} */
let queue = [];

/** 連續失敗次數（達上限停止重試，但不得丟棄佇列）。 @type {number} */
let failureCount = 0;

/** 重試計時器。 @type {any} */
let retryTimer = null;

/** 是否正在外送（避免重入）。 @type {boolean} */
let flushing = false;

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
 *
 * 未取得分析同意時**不寫入佇列**（僅本地計數由同意關閉時的行為決定）。
 *
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

    // 達到批次門檻即嘗試外送（失敗不影響遊戲流程）
    if (queue.length >= TELEMETRY.batchSize) {
        void flush();
    }
}

/**
 * 外送佇列（批次）。
 *
 * 規範：
 *   - 未取得分析同意 → 不外送
 *   - 未設定端點 → 僅保留於本機佇列
 *   - 失敗**保留**佇列，下次再送（不丟資料）
 *   - 連續失敗達上限 → 停止重試（但不得丟棄佇列）
 *   - 外送失敗**不得**拋錯
 *
 * @returns {Promise<{ sent: number, ok: boolean }>}
 */
export async function flush() {
    if (flushing) return { sent: 0, ok: false };
    if (!queue.length) return { sent: 0, ok: true };

    const endpoint = TELEMETRY.endpoint;
    if (!endpoint) {
        // 未接後端 → 事件僅保存在本地佇列（不外送任何資料）
        return { sent: 0, ok: true };
    }
    if (!getConsent().analytics) {
        // 撤回同意 → 不得外送
        return { sent: 0, ok: false };
    }

    flushing = true;
    const batch = queue.slice(0, TELEMETRY.batchSize);
    const payload = JSON.stringify({ events: batch });

    try {
        const ok = await sendPayload(endpoint, payload);
        if (ok) {
            queue = queue.slice(batch.length);
            writeJson(QUEUE_KEY, queue);
            failureCount = 0;
            clearRetry();
            return { sent: batch.length, ok: true };
        }
        scheduleRetry();
        return { sent: 0, ok: false };
    } catch {
        // 外送失敗不得影響遊戲流程
        scheduleRetry();
        return { sent: 0, ok: false };
    } finally {
        flushing = false;
    }
}

/**
 * 送出單一批次。
 *
 * 優先用 navigator.sendBeacon（頁面關閉不丟失），退回 fetch（keepalive）。
 *
 * @param {string} endpoint
 * @param {string} payload
 * @returns {Promise<boolean>}
 */
async function sendPayload(endpoint, payload) {
    // 優先 sendBeacon
    if (TELEMETRY.useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        try {
            const blob = new Blob([payload], { type: "application/json" });
            if (navigator.sendBeacon(endpoint, blob)) return true;
        } catch {
            // 退回 fetch
        }
    }

    // 退回 fetch
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true
        });
        return Boolean(res && res.ok);
    } catch {
        return false;
    }
}

/**
 * 安排指數退避重試。
 *
 * 連續失敗達上限時停止重試（但**不得丟棄**佇列）。
 */
function scheduleRetry() {
    failureCount++;
    if (failureCount > TELEMETRY.maxRetries) return;
    if (retryTimer) return;

    const delay = Math.min(
        TELEMETRY.retryBaseMs * Math.pow(2, failureCount - 1),
        TELEMETRY.retryMaxMs
    );
    retryTimer = setTimeout(() => {
        retryTimer = null;
        void flush();
    }, delay);
}

/**
 * 清除重試計時器。
 */
function clearRetry() {
    if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
    }
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
 *
 * 阻擋清單必須涵蓋：email／name／ip／deviceId／userId／token／secret。
 *
 * @param {Record<string, unknown>} params
 */
function sanitize(params) {
    /** @type {Record<string, unknown>} */
    const out = {};
    const blocked = ["email", "name", "ip", "deviceId", "userId", "phone", "address", "token", "secret"];
    for (const [k, v] of Object.entries(params || {})) {
        if (blocked.includes(k)) continue;
        if (typeof v === "string" && v.length > 64) continue;
        out[k] = v;
    }
    return out;
}
