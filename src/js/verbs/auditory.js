/**
 * 聽覺引擎 — 序列回憶 / 最小對辨識 / 節奏 / 干擾抑制。
 *
 * 設計重點（對應 v4 備忘錄）：
 * - 最小對辨識（minimal-pair）是教育核心，答案選項只有「一樣／不一樣」兩鍵，
 *   選項本身不得洩漏線索。
 * - 干擾抑制（interference）使用語音最小對作為干擾音，而非隨機詞。
 */

import { minimalPairFor, itemLabel } from "../data/items.js";
import { pickItems } from "../data/levels.js";
import { speak, speakMinimalPair } from "../audio/voice.js";
import { playTone } from "../audio/sfx.js";

/**
 * @typedef {"sequence"|"minimal-pair"|"rhythm"|"interference"} AuditoryVerb
 */

/**
 * 依關卡難度取得最小對題目（供外部重用）。
 * @param {any} bundle
 * @param {string} locale
 * @param {number} level
 */
export function minimalPairTask(bundle, locale, level) {
    return minimalPairFor(bundle, locale, level);
}

/**
 * 依關卡難度取得干擾抑制題目。
 * @param {any} bundle
 * @param {number} level
 */
export function interferenceTask(bundle, level) {
    const pool = bundle?.items?.interference || [];
    if (!pool.length) return null;
    const item = pool[Math.floor(Math.random() * pool.length)];
    const distractorCount = Math.min(3, Math.max(0, level - 1));
    return {
        id: item.id,
        pair: item["en-US"] || item["zh-TW"] || [],
        feature: item.similarity,
        distractors: [],
        distractorCount
    };
}

/**
 * 建立聽覺引擎。
 * @param {any} bundle
 * @param {string} locale
 * @param {any} spec 關卡規格
 * @param {AuditoryVerb} kind
 */
export function createAuditoryVerb(bundle, locale, spec, kind) {
    /** @type {any} */
    let task = null;
    /** @type {any[]} */
    let options = [];
    /** @type {string} */
    let answerId = "";
    /** @type {any[]} */
    let sequence = [];
    /** 序列玩法的作答進度（由 submit() 內部維護）。 @type {number} */
    let progressIndex = 0;
    /** 節奏題的輪替游標（引擎不得使用 Math.random() 決定答案）。 @type {number} */
    let rhythmCursor = 0;

    const sameLabel = bundle?.minimalPairs?.answers?.[0]?.[locale] || "一樣";
    const diffLabel = bundle?.minimalPairs?.answers?.[1]?.[locale] || "不一樣";

    return {
        /**
         * 玩法制程契約類型。
         *
         * - "minimal-pair"／"interference"／"rhythm" → "choice"（一次作答即判定）
         * - "sequence" → "sequence"（需依序多次作答）
         */
        kind: kind === "sequence" ? "sequence" : "choice",

        /**
         * 產生本回合題目。
         */
        async build() {
            progressIndex = 0;
            switch (kind) {
                case "minimal-pair": {
                    task = minimalPairFor(bundle, locale, spec?.options ?? 2);
                    answerId = "different";
                    options = [
                        { id: "same", label: sameLabel, tone: "positive" },
                        { id: "different", label: diffLabel, tone: "neutral" }
                    ];
                    sequence = task ? task.pair : [];
                    break;
                }
                case "interference": {
                    task = interferenceTask(bundle, spec?.interference ?? 1);
                    answerId = "target";
                    options = [
                        { id: "target", label: locale === "en-US" ? "This one" : "這個", tone: "positive" },
                        { id: "distractor", label: locale === "en-US" ? "Not this one" : "不是這個", tone: "neutral" }
                    ];
                    sequence = task ? task.pair : [];
                    break;
                }
                case "rhythm": {
                    const rhythms = bundle?.items?.rhythms || [];
                    // 引擎不得使用 Math.random() 決定答案 —— 以回合序號輪替，答案必定在選項內
                    const cursor = rhythmCursor++ % Math.max(1, rhythms.length);
                    const pattern = rhythms[cursor] || { beats: 4, pattern: [1, 0, 1, 0] };
                    task = pattern;
                    answerId = String(pattern.beats);
                    // 選項必須包含正解：以正解為中心取 4 個不同拍數
                    const beats = rhythms.map((/** @type {any} */ r) => Number(r.beats));
                    const ordered = [Number(pattern.beats)];
                    for (const b of beats) {
                        if (ordered.length >= 4) break;
                        if (!ordered.includes(b)) ordered.push(b);
                    }
                    options = ordered.map((b) => ({
                        id: String(b),
                        label: String(b),
                        tone: "neutral"
                    }));
                    sequence = pattern.pattern.map((/** @type {number} */ b) => b);
                    break;
                }
                default: {
                    // sequence：聽→記→按序複誦
                    const picked = pickItems(bundle, "sequence", spec?.sequenceLength ?? 3);
                    task = picked;
                    sequence = picked.map((/** @type {any} */ it) => it.id);
                    answerId = "";
                    options = picked.map((/** @type {any} */ it) => ({
                        id: it.id,
                        label: itemLabel(bundle, locale, it.id, "animals"),
                        tone: "neutral"
                    }));
                    break;
                }
            }
        },

        /**
         * 取得目前的選項。
         */
        getOptions() {
            return options;
        },

        /**
         * 取得題目序列（供 UI 顯示）。
         */
        getSequence() {
            return sequence;
        },

        /**
         * 取得提示內容。
         */
        getPrompt() {
            if (!task) return "";
            switch (kind) {
                case "minimal-pair":
                    return locale === "en-US" ? "Same or different?" : "一樣還是不一樣？";
                case "interference":
                    return locale === "en-US" ? "Which is the target sound?" : "哪一個是目標聲音？";
                case "rhythm":
                    return locale === "en-US" ? "How many beats?" : "這是幾拍？";
                default:
                    return locale === "en-US" ? "Listen and repeat in order" : "聽一聽，照順序按回去";
            }
        },

        /**
         * 播放題目。
         */
        playPrompt() {
            switch (kind) {
                case "minimal-pair":
                    if (task?.pair) speakMinimalPair(locale, task.pair);
                    break;
                case "interference":
                    if (task?.pair) speakMinimalPair(locale, task.pair, 1100);
                    break;
                case "rhythm":
                    if (task?.pattern) {
                        task.pattern.forEach((/** @type {number} */ beat, /** @type {number} */ i) => {
                            setTimeout(() => {
                                if (beat) playTone(300, 140, -10);
                            }, i * 500);
                        });
                    }
                    break;
                default:
                    if (task) {
                        task.forEach((/** @type {any} */ it, /** @type {number} */ i) => {
                            setTimeout(() => speak(itemLabel(bundle, locale, it.id, "animals"), { locale }), i * 1100);
                        });
                    }
                    break;
            }
        },

        /**
         * 示範（失敗第二階段）。
         */
        demonstrate() {
            this.playPrompt();
        },

        /**
         * 重播（失敗第三階段）。
         */
        replay() {
            this.playPrompt();
        },

        /**
         * 統一作答入口（玩法制程契約）。
         *
         * - "choice"：比對 answerId → { status:"correct"|"wrong", correct, done:true }
         * - "sequence"：內部維護 progressIndex，每次比對 sequence[progressIndex]；
         *   正確則 progressIndex++ → { status:"progress", correct:true, done: progressIndex >= sequence.length }
         *
         * @param {string} input
         * @param {any} [_meta]
         * @returns {import("../core/verb-contract.js").SubmitResult}
         */
        submit(input, _meta) {
            if (kind === "sequence") {
                const expected = sequence[progressIndex];
                if (expected === undefined) {
                    return { status: "progress", correct: false, done: true, feedback: expected };
                }
                if (String(input) !== String(expected)) {
                    return { status: "wrong", correct: false, done: false, feedback: expected };
                }
                progressIndex++;
                const done = progressIndex >= sequence.length;
                return { status: done ? "correct" : "progress", correct: true, done, feedback: expected };
            }

            const correct = String(input) === String(answerId);
            return {
                status: correct ? "correct" : "wrong",
                correct,
                done: true,
                feedback: answerId
            };
        },

        /**
         * 判定本回合是否已完成。
         * @returns {boolean}
         */
        isComplete() {
            if (kind === "sequence") {
                return sequence.length > 0 && progressIndex >= sequence.length;
            }
            return Boolean(answerId);
        },

        /**
         * 本回合的正確選項 id（供示範與測試用）。
         * @returns {string|null}
         */
        getFeedback() {
            if (kind === "sequence") {
                return sequence[progressIndex] ?? null;
            }
            return answerId || null;
        },

        /**
         * 相容層：舊的 check() 改為委派 submit()。
         *
         * @param {string} input
         */
        check(input) {
            const result = this.submit(input);
            return { correct: result.correct, hintStage: "hint-item", done: result.done };
        },

        /**
         * 相容層：舊的 advance() 改由 submit() 內部處理進度。
         *
         * @param {string} itemId
         * @param {number} index
         */
        advance(itemId, index) {
            const expected = sequence[index];
            return {
                correct: expected !== undefined && String(itemId) === String(expected),
                done: expected !== undefined && index + 1 >= sequence.length
            };
        }
    };
}
