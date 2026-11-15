/**
 * localStorage 讀寫封裝 — 解析失敗一律回退 fallback，不讓存檔毀損拖垮遊戲。
 */

/**
 * 讀取 JSON。
 * @param {string} key
 * @param {any} fallback
 * @returns {any}
 */
export function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const parsed = JSON.parse(raw);
        return parsed === null || parsed === undefined ? fallback : parsed;
    } catch {
        return fallback;
    }
}

/**
 * 寫入 JSON。
 * @param {string} key
 * @param {any} value
 */
export function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // 配額滿或隱私模式時忽略；遊戲仍可繼續（僅進度無法保存）
    }
}

/**
 * 移除 key。
 * @param {string} key
 */
export function removeKey(key) {
    try {
        localStorage.removeItem(key);
    } catch {
        // 忽略
    }
}

/**
 * 讀取字串。
 * @param {string} key
 * @param {string} fallback
 */
export function readString(key, fallback) {
    try {
        return localStorage.getItem(key) ?? fallback;
    } catch {
        return fallback;
    }
}

/**
 * 寫入字串。
 * @param {string} key
 * @param {string} value
 */
export function writeString(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // 忽略
    }
}
