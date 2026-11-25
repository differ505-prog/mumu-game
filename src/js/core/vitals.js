/**
 * Web Vitals 量測（Step 131）。
 *
 * 規範：
 *   - 以 PerformanceObserver 量測 LCP／CLS／INP
 *   - **無 API 時降級為 null**，不得拋錯、不得白屏
 *   - 量測值不得含任何可識別資訊
 *   - 只在事件發生時讀取（不得用 setInterval 輪詢）
 */

import { track } from "./telemetry.js";

/** @type {any} */
let lcpValue = null;

/** @type {any} */
let clsValue = null;

/** @type {any} */
let inpValue = null;

/** 是否已回報過第一次互動。 @type {boolean} */
let firstInteractionTracked = false;
/**
 * 取得 PerformanceObserver（不存在時回傳 null，不得拋錯）。
 * @returns {any}
 */
function getObserver() {
    if (typeof PerformanceObserver === "undefined") return null;
    return PerformanceObserver;
}

/**
 * 啟用 Web Vitals 量測。
 *
 * 每項指標各自獨立 try/catch；任何一項失敗都不影響其他項，也不影響遊戲。
 *
 * @returns {boolean} 是否成功啟用（無 API 時回傳 false）
 */
export function initVitals() {
    const PO = getObserver();
    if (!PO) return false;

    // LCP
    try {
        new PO((/** @type {any} */ list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            if (last) lcpValue = Math.round(last.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
        // 不支援 LCP → 維持 null
    }

    // CLS
    try {
        new PO((/** @type {any} */ list) => {
            for (const entry of list.getEntries()) {
                if (entry.hadRecentInput) continue;
                clsValue = (clsValue || 0) + entry.value;
            }
        }).observe({ type: "layout-shift", buffered: true });
    } catch {
        // 不支援 CLS → 維持 null
    }

    // INP
    try {
        new PO((/** @type {any} */ list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            if (last) inpValue = Math.round(last.duration);
        }).observe({ type: "event", buffered: true, durationThreshold: 40 });
    } catch {
        // 不支援 INP → 維持 null
    }

    return true;
}
/**
 * 記錄第一次互動（Step 131）。
 *
 * - 只記錄一次
 * - 僅記錄互動**類型**（不含任何識別資訊）
 */
export function trackFirstInteraction() {
    if (firstInteractionTracked) return;
    firstInteractionTracked = true;
    track("first_interaction", { verb: "any" });
}

/**
 * 取得目前的量測值（無資料時為 null）。
 *
 * @returns {{ lcp: number|null, cls: number|null, inp: number|null }}
 */
export function getVitals() {
    return {
        lcp: lcpValue === null ? null : lcpValue,
        cls: clsValue === null ? null : Math.round(clsValue * 1000) / 1000,
        inp: inpValue === null ? null : inpValue
    };
}

/**
 * 回報目前的量測值到遙測。
 *
 * @returns {boolean} 是否成功回報
 */
export function reportVitals() {
    const v = getVitals();
    if (v.lcp === null && v.cls === null && v.inp === null) return false;
    track("vitals", { inp: v.inp ?? 0, cls: v.cls ?? 0, fcp: v.lcp ?? 0 });
    return true;
}
