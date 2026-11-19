/**
 * 玩法制程契約 — 所有引擎必須實作以下介面。
 *
 * 選項類型（kind）：
 *   "choice"   單選：一次作答即判定（minimal-pair / rhythm / interference / puzzle-pattern）
 *   "sequence" 序列：需依序多次作答（sequence / memory-dual）
 *   "place"    拼合：需多次放置片段（puzzle-assembly）
 *   "match"    配對：需翻牌配對（memory-match）
 *
 * 引擎必須提供：
 *   kind        上述四者之一
 *   build()     Promise<void> —— 一律可 await
 *   getPrompt() string
 *   getOptions() Option[]        —— 僅 choice／sequence 使用
 *   getCards()   Card[]           —— 僅 match 使用
 *   getPieces()  Piece[]          —— 僅 place 使用
 *   submit(input, meta) SubmitResult —— 統一作答入口
 *   isComplete() boolean          —— 判定本回合是否已完成
 *   getFeedback() string | null   —— 本回合的正確選項 id（供示範與測試用）
 *   playPrompt() void
 *   demonstrate() void
 *   replay() void
 *
 * SubmitResult:
 *   { status: "correct" | "wrong" | "progress",
 *     correct: boolean, done: boolean, feedback?: string }
 *
 * 規範：
 *   - 所有引擎的 build() 一律回傳 Promise，session 必須 await
 *   - 引擎不得自行決定回合是否結束，一律由 session 依 isComplete() 判定
 *   - 引擎不得使用 Math.random() 決定答案或題目
 */

/**
 * @typedef {"choice"|"sequence"|"place"|"match"} VerbKind
 */

/**
 * @typedef {Object} SubmitResult
 * @property {"correct"|"wrong"|"progress"} status 本次作答的性質
 * @property {boolean} correct 本次作答本身是否正確
 * @property {boolean} done 本回合是否已完成
 * @property {string} [feedback] 本回合的正確答案 id（供示範與測試用）
 */

/**
 * @typedef {Object} VerbOption
 * @property {string} id
 * @property {string} [label]
 * @property {string} [image]
 * @property {string} [tone]
 */

/**
 * @typedef {Object} VerbCard
 * @property {number} slot
 * @property {string} id
 * @property {boolean} [flipped]
 * @property {boolean} [matched]
 */

/**
 * @typedef {Object} VerbPiece
 * @property {number} index
 * @property {number} targetX
 * @property {number} targetY
 * @property {boolean} [placed]
 * @property {number} [placedIndex]
 */

/** 契約要求的四種 kind。 */
export const VERB_KINDS = ["choice", "sequence", "place", "match"];

/**
 * 判定某個引擎是否符��玩法制程契約。
 *
 * 供守門（Step 110／113）與除錯使用；引擎本身不需要呼叫。
 *
 * @param {any} engine
 * @returns {{ ok: boolean, problems: string[] }}
 */
export function verifyEngineContract(engine) {
    /** @type {string[]} */
    const problems = [];

    if (!engine || typeof engine !== "object") {
        return { ok: false, problems: ["引擎不存在"] };
    }

    if (!VERB_KINDS.includes(engine.kind)) {
        problems.push(`kind 必須是 ${VERB_KINDS.join(" / ")} 之一，實際為 ${String(engine.kind)}`);
    }

    if (typeof engine.build !== "function") {
        problems.push("缺少 build()");
    } else if (!isAsyncFunction(engine.build)) {
        problems.push("build() 必須是 async（一律回傳 Promise）");
    }

    for (const name of ["getPrompt", "submit", "isComplete", "getFeedback", "playPrompt", "demonstrate", "replay"]) {
        if (typeof engine[name] !== "function") {
            problems.push(`缺少 ${name}()`);
        }
    }

    if (engine.kind === "match" && typeof engine.getCards !== "function") {
        problems.push("kind=match 必須提供 getCards()");
    }
    if (engine.kind === "place" && typeof engine.getPieces !== "function") {
        problems.push("kind=place 必須提供 getPieces()");
    }

    return { ok: problems.length === 0, problems };
}

/**
 * 判斷函式是否為 async function。
 * @param {any} fn
 * @returns {boolean}
 */
function isAsyncFunction(fn) {
    return typeof fn === "function" && fn.constructor?.name === "AsyncFunction";
}
