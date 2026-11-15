/**
 * 六個認知動詞定義表。
 *
 * 設計原則（見 task.md v6）：
 * - 每個玩法對應不同的認知目標，不共用同一套流程。
 * - 每個玩法有獨立年齡範圍，避免所有內容都對準同一年齡層。
 * - 每個玩法負責不同的引擎角色：價值 / 流量 / 深度。
 *
 * @typedef {"sequence"|"minimal-pair"|"rhythm"|"interference"|"puzzle"|"memory"} Verb
 */

/**
 * @typedef {Object} VerbDef
 * @property {Verb} id
 * @property {{ "zh-TW": string, "en-US": string }} label
 * @property {string} axis 對應的技能軸
 * @property {[number, number]} age 適齡範圍
 * @property {string} engine 執行引擎（auditory / puzzle / memory）
 * @property {string} icon 圖示 id（對應 assets/icons）
 */

/** @type {Record<Verb, VerbDef>} */
export const VERBS = {
    "sequence": {
        id: "sequence",
        label: { "zh-TW": "回聲谷", "en-US": "Echo Valley" },
        axis: "sequence",
        age: [3, 6],
        engine: "auditory",
        icon: "echo"
    },
    "minimal-pair": {
        id: "minimal-pair",
        label: { "zh-TW": "雙聲谷", "en-US": "Twin Voice Valley" },
        axis: "minimal-pair",
        age: [3, 6],
        engine: "auditory",
        icon: "twin"
    },
    "rhythm": {
        id: "rhythm",
        label: { "zh-TW": "鼓點峽谷", "en-US": "Beat Canyon" },
        axis: "rhythm",
        age: [3, 6],
        engine: "auditory",
        icon: "drum"
    },
    "interference": {
        id: "interference",
        label: { "zh-TW": "回聲迷宮", "en-US": "Echo Maze" },
        axis: "interference",
        age: [5, 8],
        engine: "auditory",
        icon: "maze"
    },
    "puzzle": {
        id: "puzzle",
        label: { "zh-TW": "拼蛋巢", "en-US": "Puzzle Nest" },
        axis: "puzzle",
        age: [3, 8],
        engine: "puzzle",
        icon: "egg"
    },
    "memory": {
        id: "memory",
        label: { "zh-TW": "足跡石林", "en-US": "Tracks Grove" },
        axis: "memory",
        age: [3, 8],
        engine: "memory",
        icon: "footprint"
    }
};

/**
 * 依 id 取得玩法定義。
 * @param {string} id
 * @returns {Verb | null}
 */
export function verbById(id) {
    return id in VERBS ? /** @type {Verb} */ (id) : null;
}

/**
 * 依語系取得玩法顯示名稱。
 * @param {Verb} verb
 * @param {string} locale
 * @returns {string}
 */
export function verbLabel(verb, locale) {
    const def = VERBS[verb];
    if (!def) return verb;
    return def.label[locale] || def.label["zh-TW"];
}

/**
 * 全部玩法的 id 清單（供選單與路由使用）。
 * @returns {Verb[]}
 */
export function allVerbs() {
    return Object.keys(VERBS).map((k) => /** @type {Verb} */ (k));
}
