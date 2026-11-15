/**
 * 事件匯流排 — 全域單一事件來源。
 * 玩法、音訊、動畫、劇情、埋點皆透過此模組解耦通訊。
 */

/**
 * @typedef {Object} GameEvent
 * @property {string} type 事件型別，例如 "round:correct"
 * @property {Record<string, unknown>} [payload] 事件資料
 * @property {number} [at] 產生時間戳（epoch ms）
 */

/** @type {Map<string, Set<(e: GameEvent) => void>>} */
const listeners = new Map();

/**
 * 訂閱事件。
 * @param {string} type 事件型別
 * @param {(e: GameEvent) => void} fn 處理函式
 * @returns {() => void} 取消訂閱的函式
 */
export function on(type, fn) {
    if (!listeners.has(type)) {
        listeners.set(type, new Set());
    }
    listeners.get(type).add(fn);
    return () => off(type, fn);
}

/**
 * 取消訂閱。
 * @param {string} type 事件型別
 * @param {(e: GameEvent) => void} fn 處理函式
 */
export function off(type, fn) {
    listeners.get(type)?.delete(fn);
}

/**
 * 發送事件。單一處理函式例外不會中斷其他訂閱者。
 * @param {GameEvent} event
 */
export function emit(event) {
    const set = listeners.get(event.type);
    if (!set) return;
    for (const fn of Array.from(set)) {
        try {
            fn(event);
        } catch (err) {
            console.error("[events]", event.type, err);
        }
    }
}

/**
 * 清空所有訂閱（僅供測試或重置使用）。
 */
export function clearAll() {
    listeners.clear();
}
