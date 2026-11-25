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
import { axisForVerb } from "./dex.js";

/**
 * @typedef {"hint-item"|"demonstrate"|"replay"} HintStage
 */

/**
 * 建立一個回合 session。
 * @param {any} [_bundle] 內容包
 * @param {string} [_locale]
 */
export function createSession(_bundle, _locale) {
    const locale = _locale || "zh-TW";
    /** @type {any} */
    let verbEngine = null;
    /** @type {any} */
    let currentLevel = null;
    /** @type {HintStage} */
    let hintStage = "hint-item";
    /** @type {boolean[]} */
    let attempts = [];    /**
     * 學習樣本（供掌握度與圖鑑解鎖判定）。
     * @type {any[]}
     */
    let samples = [];
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
    /** @type {number} */
    let roundStartedAt = 0;
    /** 等待中的計時器（離開關卡時必須清除，避免回合在背景繼續推進）。 @type {any[]} */
    let pendingTimers = [];

    /**
     * 安排一個可取消的計時器。
     * @param {() => void} fn
     * @param {number} ms
     */
    function schedule(fn, ms) {
        const id = setTimeout(() => {
            pendingTimers = pendingTimers.filter((t) => t !== id);
            fn();
        }, ms);
        pendingTimers.push(id);
        return id;
    }

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
            samples = [];
            hintCount = 0;
            hintStage = "hint-item";
            startedAt = Date.now();
            roundStartedAt = Date.now();

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
            this.nextRound().catch((err) => this.handleFatal(err));
        },

        /**
         * 回合流程發生致命錯誤時的處置。
         *
         * 絕不讓遊戲卡死在 loading —— 記錄錯誤並結束關卡。
         * @param {any} err
         */
        handleFatal(err) {
            console.error("[session] 回合流程失敗", err);
            try {
                this.finish();
            } catch (finishErr) {
                console.error("[session] finish() 亦失敗", finishErr);
            }
        },

        /**
         * 進入下一回合。
         *
         * **必須** await 引擎的 build()（build() 是 async），
         * 否則題目尚未備妥就會 emit round:listen，導致回合無法作答。
         */
        async nextRound() {
            if (roundIndex >= totalRounds) {
                this.finish();
                return;
            }
            hintStage = "hint-item";
            roundStartedAt = Date.now();
            verbEngine = currentLevel.engineFactory();
            await verbEngine.build();

            setState({
                round: roundIndex + 1,
                phase: "listening",
                locked: true,
                // 只有序列玩法才把題目序列放進公開狀態（choice／place／match 沒有「順序」）
                sequence: verbEngine.kind === "sequence" ? (verbEngine.getSequence?.() || []) : []
            });

            emit({ type: "round:listen", payload: { levelId: state.level, round: roundIndex + 1 } });
            verbEngine.playPrompt?.();

            // 聆聽結束後開放輸入
            schedule(() => {
                setState({ phase: "input", locked: false });
                emit({ type: "round:input-ready", payload: {} });
            }, paceMs + 400);
        },

        /**
         * 提交作答。
         *
         * 統一走引擎的 `submit()` 契約 —— 本方法**不對任何玩法做特判**。
         *
         * 核心規則（依 `submit()` 回傳的 status 判斷）：
         *   "wrong"                 → 答錯 → advanceHint()（錯誤時永不扣分）
         *   "correct" / "progress"  → 作答有效
         *     · result.correct === true  → 分數 +1、連擊 +1
         *     · result.done === true      → 本回合完成 → roundIndex++，發 "round:correct"
         *     · result.done === false     → 回合仍在進行（序列前進中／拼合中／配對中）
         *                                     → 不得 roundIndex++，發 "round:step"
         *                                     （獨立的進行中回饋，不得觸發 round:wrong）
         *   result.correct === false 且 status !== "wrong"
         *                                    → 發 "round:progress"（中性過程回饋，如翻牌未配對）
         *
         * @param {string|{ slot?:number, pieceIndex?:number, targetIndex?:number }} input
         * @returns {import("./verb-contract.js").SubmitResult} 本次作答結果
         */
        answer(input) {
            if (state.locked) {
                return { status: "wrong", correct: false, done: false };
            }

            const result = verbEngine?.submit?.(input) ?? { status: "wrong", correct: false, done: false };
            const itemId = typeof input === "object" && input !== null
                ? String((/** @type {any} */ (input)).slot ?? (/** @type {any} */ (input)).pieceIndex ?? "")
                : String(input);

            const status = result.status || (result.correct ? "correct" : "wrong");

            if (status === "wrong") {
                // 答錯：不扣分，只推進提示階段
                setState({ combo: 0 });
                emit({ type: "round:wrong", payload: { itemId, round: roundIndex + 1 } });
                this.advanceHint();
                return result;
            }

            attempts.push(Boolean(result.correct));

            // 學習樣本：供掌握度模型與圖鑑解鎖條件（locale／noHint）判定使用
            samples.push({
                axis: axisForVerb(currentLevel.verb),
                verb: currentLevel.verb,
                correct: result.correct ? 1 : 0,
                locale,
                hinted: hintCount > 0 ? 1 : 0,
                ms: Date.now() - roundStartedAt
            });

            if (result.correct) {
                setState({ score: state.score + 1, combo: state.combo + 1 });
                if (result.done) {
                    // 回合完成 → 完整回饋（聲音＋表情＋動態）
                    emit({ type: "round:correct", payload: { itemId, round: roundIndex + 1 } });
                } else {
                    // 回合仍在進行（序列前進中／拼合中／配對中）→ 獨立的進行中回饋
                    emit({ type: "round:step", payload: { itemId, round: roundIndex + 1, status } });
                }
            } else {
                emit({ type: "round:progress", payload: { itemId, round: roundIndex + 1, status } });
            }

            if (result.done) {
                roundIndex++;
                schedule(() => this.nextRound().catch((err) => this.handleFatal(err)), 900);
            }

            return result;
        },

        /**
         * 本回合的正確答案（委派引擎）。
         * @returns {string|null}
         */
        getFeedback() {
            return verbEngine?.getFeedback?.() ?? null;
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
                // V4：示範階段通知 UI 呈現「當題的順序大圖卡」（視覺替代）
                emit({
                    type: "round:demonstrate",
                    payload: { stage: "demonstrate", round: roundIndex + 1 }
                });
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
         * 停止關卡（中途離開，例如由工具列「回地圖」返回）。
         *
         * 清除所有待執行計時器並鎖住輸入 —— 回合不得在背景繼續推進。
         */
        stop() {
            for (const id of pendingTimers) clearTimeout(id);
            pendingTimers = [];
            verbEngine = null;
            setState({ phase: "idle", locked: true });
        },

        /**
         * 重播題目。
         */
        replay() {
            verbEngine?.replay?.();
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
                ms: Date.now() - startedAt,
                samples: samples
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
