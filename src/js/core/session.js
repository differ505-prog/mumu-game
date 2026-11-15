/**
 * 回合流程與三段式失敗機制。
 *
 * 失敗機制（hintStage）：
 *   hint-item    → 提示題目元素（例如高亮其中一個選項）
 *   demonstrate  → 角色示範一次
 *   replay       → 重播題目
 *
 * 核心原則：**錯誤時永不扣分**。幼兒練習不應有懲罰。
 */

import { emit } from "./events.js";
import { state, setState } from "./state.js";

/**
 * @typedef {"hint-item"|"demonstrate"|"replay"} HintStage
 */

/**
 * 建立一個回合 session。
 * @param {any} [_bundle] 內容包
 * @param {string} [_locale]
 */
export function createSession(_bundle, _locale) {
    /** @type {any} */
    let verbEngine = null;
    /** @type {any} */
    let currentLevel = null;
    /** @type {HintStage} */
    let hintStage = "hint-item";
    /** @type {number[]} */
    let attempts = [];
    /** @type {number} */
    let hintCount = 0;
    /** @type {number} */
    let roundIndex = 0;
    /** @type {number} */
    let totalRounds = 3;
    /** @type {number} */
    let paceMs = 2000;
    /** @type {((r:{ correct:number, total:number, hintsUsed:number, ms:number }) => void) | null} */
    let finishCb = null;
    /** @type {number} */
    let startedAt = 0;

    return {
        /**
         * 開始一個關卡。
         * @param {number} levelId
         * @param {any} verbEngineFactory 由 verbs/index.js 注入的引擎工廠
         */
        start(levelId, verbEngineFactory) {
            currentLevel = verbEngineFactory.getLevel(levelId);
            totalRounds = currentLevel.spec?.rounds ?? 3;
            roundIndex = 0;
            attempts = [];
            hintCount = 0;
            hintStage = "hint-item";
            startedAt = Date.now();

            setState({
                level: levelId,
                chapter: currentLevel.chapter,
                verb: currentLevel.verb,
                score: 0,
                round: 0,
                phase: "listening",
                locked: true
            });

            emit({ type: "level:start", payload: { levelId, chapter: currentLevel.chapter } });
            this.nextRound();
        },

        /**
         * 進入下一回合。
         */
        nextRound() {
            if (roundIndex >= totalRounds) {
                this.finish();
                return;
            }
            hintStage = "hint-item";
            verbEngine = currentLevel.engineFactory();
            verbEngine.build();

            setState({
                round: roundIndex + 1,
                phase: "listening",
                locked: true,
                sequence: verbEngine.getSequence?.() || []
            });

            emit({ type: "round:listen", payload: { levelId: state.level, round: roundIndex + 1 } });
            verbEngine.playPrompt?.();

            // 聆聽結束後開放輸入
            setTimeout(() => {
                setState({ phase: "input", locked: false });
                emit({ type: "round:input-ready", payload: {} });
            }, paceMs + 400);
        },

        /**
         * 提交作答。
         * @param {string} itemId
         */
        answer(itemId) {
            if (state.locked) return;

            // 記憶玩法由翻牌流程自行推進，完成時以 __memory_done__ 通知
            const isMemoryDone = itemId === "__memory_done__";
            const result = isMemoryDone
                ? { correct: true }
                : verbEngine.check(itemId);
            attempts.push(result.correct);

            if (result.correct) {
                setState({ score: state.score + 1, combo: state.combo + 1 });
                emit({ type: "round:correct", payload: { itemId, round: roundIndex + 1 } });
                roundIndex++;
                setTimeout(() => this.nextRound(), 900);
            } else {
                setState({ combo: 0 });
                emit({ type: "round:wrong", payload: { itemId, round: roundIndex + 1 } });
                this.advanceHint();
            }
        },

        /**
         * 依失敗次數推進提示階段。
         */
        advanceHint() {
            if (hintStage === "hint-item") {
                hintStage = "demonstrate";
            } else if (hintStage === "demonstrate") {
                hintStage = "replay";
            }
            hintCount++;
            emit({ type: "round:hint", payload: { stage: hintStage } });

            if (hintStage === "demonstrate") {
                verbEngine.demonstrate?.();
            } else if (hintStage === "replay") {
                verbEngine.replay?.();
            }
        },

        /**
         * 手動請求提示。
         */
        hint() {
            this.advanceHint();
        },

        /**
         * 重播題目。
         */
        replay() {
            verbEngine.replay?.();
        },

        /**
         * 調整節奏（慢速模式）。
         * @param {number} ms
         */
        setPace(ms) {
            paceMs = ms;
        },

        /**
         * 結束關卡，回報結果。
         */
        finish() {
            const total = attempts.length || 1;
            const correct = attempts.filter(Boolean).length;
            const result = {
                correct,
                total,
                hintsUsed: hintCount,
                ms: Date.now() - startedAt
            };
            setState({ phase: "levelup", locked: true });
            emit({ type: "level:complete", payload: { levelId: state.level, ...result } });
            finishCb?.(result);
        },

        /**
         * 註冊完成回呼。
         * @param {(r:{ correct:number, total:number, hintsUsed:number, ms:number }) => void} cb
         */
        onFinish(cb) {
            finishCb = cb;
        },

        /** 目前回合階段。 */
        get phase() {
            return state.phase;
        },

        /** 目前提示階段。 */
        get hintStage() {
            return hintStage;
        },

        /** 本次提示使用次數。 */
        get hintsUsed() {
            return hintCount;
        },

        /** 本回合的引擎。 */
        get engine() {
            return verbEngine;
        }
    };
}
