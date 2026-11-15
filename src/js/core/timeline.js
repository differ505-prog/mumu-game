/**
 * 感官時間軸引擎 — 將事件拆成四軌（動畫／音效／語音／場景）並依時間排程。
 *
 * 設計重點：引擎本身不碰 DOM，只透過 runner 回呼交由各模組執行。
 */

/**
 * @typedef {"motion"|"audio"|"voice"|"scene"} Track
 */

/**
 * @typedef {Object} TrackStep
 * @property {number} at 相對起始毫秒
 * @property {string} [target]
 * @property {string} [anim]
 * @property {string} [duration]
 * @property {string} [easing]
 * @property {string} [clip]
 * @property {number} [gain]
 * @property {string} [context]
 * @property {string} [effect]
 * @property {number} [count]
 */

/** @type {{ events: Record<string, { tracks: Record<Track, TrackStep[]> }> }} */
let timeline = { events: {} };

/**
 * 載入時間軸資料。
 * @param {any} data
 */
export function setTimeline(data) {
    timeline = data || { events: {} };
}

/**
 * 取得某事件所有軌道的步驟，依 at 排序。
 * @param {string} name
 * @returns {TrackStep[]}
 */
export function getTrack(name) {
    const event = timeline.events?.[name];
    if (!event) return [];
    const all = [];
    for (const steps of Object.values(event.tracks || {})) {
        for (const step of steps) all.push(step);
    }
    return all.sort((a, b) => a.at - b.at);
}

/**
 * 取得某事件單一軌道的步驟。
 * @param {string} name
 * @param {Track} track
 * @returns {TrackStep[]}
 */
export function getSteps(name, track) {
    const event = timeline.events?.[name];
    if (!event) return [];
    return [...(event.tracks?.[track] || [])].sort((a, b) => a.at - b.at);
}

/**
 * 播放某事件：把四軌步驟依 at 交給 runner 排程。
 * @param {string} eventName
 * @param {(track: Track, step: TrackStep, delayMs: number) => void} runner
 * @returns {() => void} cancel 函式
 */
export function play(eventName, runner) {
    const event = timeline.events?.[eventName];
    if (!event) return () => { };

    /** @type {any[]} */
    const timers = [];

    for (const [track, steps] of Object.entries(event.tracks || {})) {
        for (const step of steps) {
            const delay = step.at || 0;
            const timer = setTimeout(() => {
                try {
                    runner(/** @type {Track} */ (track), step, delay);
                } catch (err) {
                    console.error("[timeline]", eventName, track, err);
                }
            }, delay);
            timers.push(timer);
        }
    }

    return () => {
        for (const t of timers) clearTimeout(t);
        timers.length = 0;
    };
}

/**
 * 事件清單（供驗證工具使用）。
 * @returns {string[]}
 */
export function eventNames() {
    return Object.keys(timeline.events || {});
}
