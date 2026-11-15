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

    const sameLabel = bundle?.minimalPairs?.answers?.[0]?.[locale] || "一樣";
    const diffLabel = bundle?.minimalPairs?.answers?.[1]?.[locale] || "不一樣";

    return {
        /**
         * 產生本回合題目。
         */
        build() {
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
                    const pattern = rhythms[Math.floor(Math.random() * rhythms.length)] || { beats: 4, pattern: [1, 0, 1, 0] };
                    task = pattern;
                    answerId = String(pattern.beats);
                    options = rhythms.slice(0, 4).map((/** @type {any} */ r) => ({
                        id: String(r.beats),
                        label: String(r.beats),
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
         * 判定作答。
         * @param {string} input
         */
        check(input) {
            if (kind === "sequence") {
                // 序列模式由 UI 逐項呼叫 advance，此處僅回傳中性結果
                return { correct: false, hintStage: "hint-item" };
            }
            return { correct: input === answerId, hintStage: "hint-item" };
        },

        /**
         * 序列模式的逐項推進。
         * @param {string} itemId
         * @param {number} index
         */
        advance(itemId, index) {
            if (sequence[index] === itemId) {
                return { correct: true, done: index + 1 >= sequence.length };
            }
            return { correct: false, done: false };
        }
    };
}
