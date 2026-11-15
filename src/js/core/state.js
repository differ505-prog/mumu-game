import { emit } from "./events.js";

/**
 * 六個認知動詞。每個玩法對應不同的認知目標與獨立難度曲線。
 * @typedef {"sequence"|"minimal-pair"|"rhythm"|"interference"|"puzzle"|"memory"} Verb
 */

/**
 * 回合階段。
 * @typedef {"idle"|"listening"|"input"|"feedback"|"levelup"} RoundPhase
 */

/**
 * 全域遊戲狀態。統一由 setState 更新，避免各模組各自持有重複狀態。
 */
export const state = {
    /** @type {Verb} 目前玩法 */
    verb: "sequence",
    /** @type {number} 目前關卡編號 */
    level: 1,
    /** @type {number} 目前回合序號 */
    round: 0,
    /** @type {number} 回合得分 */
    score: 0,
    /** @type {number} 過關所需回合數 */
    maxScore: 3,
    /** @type {RoundPhase} */
    phase: "idle",
    /** @type {any[]} 目前回合的題目序列 */
    sequence: [],
    /** @type {number} 玩家輸入索引 */
    inputIndex: 0,
    /** @type {boolean} 輸入是否鎖定 */
    locked: true,
    /** @type {boolean} 慢速模式 */
    slowMode: false,
    /** @type {number} 連擊數 */
    combo: 0,
    /** @type {string} 目前角色 id */
    characterId: "santa",
    /** @type {string} 目前技能軸 */
    skillAxis: "minimal-pair",
    /** @type {number} 難度層級（由掌握度驅動，非關卡編號） */
    difficulty: 1,
    /** @type {number} 目前章節（0–5） */
    chapter: 1,
    /** @type {number} 本次作答嘗試次數 */
    attempt: 0,
    /** @type {Record<string, any>} 各技能軸掌握度 */
    mastery: {},
    /** @type {number} session 開始時間戳 */
    sessionStartedAt: 0
};

/**
 * 合併式更新狀態，並廣播 "state:changed"。
 * @param {Partial<typeof state>} patch
 */
export function setState(patch) {
    Object.assign(state, patch);
    emit({ type: "state:changed", payload: { ...state } });
}

/**
 * 重設一個新的 session。
 * @param {Verb} verb
 * @param {string} characterId
 */
export function resetSession(verb, characterId) {
    Object.assign(state, {
        verb,
        characterId,
        level: 1,
        round: 0,
        score: 0,
        phase: "idle",
        sequence: [],
        inputIndex: 0,
        locked: true,
        combo: 0,
        skillAxis: verb,
        difficulty: 1,
        attempt: 0,
        sessionStartedAt: Date.now()
    });
    emit({ type: "session:reset", payload: { ...state } });
}
