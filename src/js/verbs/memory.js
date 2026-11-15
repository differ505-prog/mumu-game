/**
 * 記憶力引擎 — 配對翻牌（空間位置記憶）與雙通道序列（跨感官編碼）。
 *
 * 與聽覺序列記憶的差異（重要）：
 * - 翻牌是「空間位置記憶」，沒有時間序列
 * - 雙通道是「聽覺 + 視覺」同時呈現，訓練跨感官編碼
 */

import { footprintPairs as buildFootprintPairs, itemLabel } from "../data/items.js";
import { pickItems } from "../data/levels.js";
import { speak } from "../audio/voice.js";

/**
 * 取得足跡配對。
 * @param {any} bundle
 * @param {number} gridSize
 */
export function footprintPairs(bundle, gridSize) {
    return buildFootprintPairs(bundle, gridSize);
}

/**
 * 產生雙通道序列（聽覺 + 視覺）。
 * @param {any} bundle
 * @param {number} length
 */
export function dualChannelSequence(bundle, length) {
    const picked = pickItems(bundle, "sequence", length);
    return {
        audio: picked.map((/** @type {any} */ it) => it.id),
        visual: picked.map((/** @type {any} */ it) => ({
            id: it.id,
            label: itemLabel(bundle, "zh-TW", it.id, "animals")
        }))
    };
}

/**
 * 建立記憶力引擎。
 * @param {any} bundle
 * @param {string} locale
 * @param {any} spec
 * @param {"match"|"dual"} kind
 */
export function createMemoryVerb(bundle, locale, spec, kind) {
    /** @type {any[]} */
    let cards = [];
    /** @type {any} */
    let task = null;
    void task;
    /** @type {number[]} */
    let flipped = [];
    /** @type {number} */
    let matched = 0;
    /** @type {number} */
    let attempts = 0;
    /** @type {string[]} */
    let sequence = [];

    return {
        /**
         * 產生題目。
         */
        build() {
            if (kind === "dual") {
                const len = spec?.sequenceLength ?? 3;
                const dual = dualChannelSequence(bundle, len);
                task = dual;
                sequence = dual.audio;
                return;
            }

            // match：3×3 足跡配對（位置記憶）
            const gridSize = spec?.options && spec.options >= 6 ? 9 : 6;
            const pairs = footprintPairs(bundle, gridSize);
            /** @type {any[]} */
            const deck = [];
            for (const p of pairs) {
                deck.push({ id: p.id, shape: p.shape, dinoId: p.dinoId });
                deck.push({ id: p.id, shape: p.shape, dinoId: p.dinoId });
            }
            cards = deck
                .slice(0, gridSize)
                .map((/** @type {any} */ c, /** @type {number} */ i) => ({ ...c, slot: i, flipped: false, matched: false }));
            matched = 0;
            attempts = 0;
            flipped = [];
            task = { gridSize, cards: cards.length };
        },

        /**
         * 取得卡牌。
         */
        getCards() {
            return cards;
        },

        /**
         * 取得選項（UI 用）。
         */
        getOptions() {
            return cards.map((/** @type {any} */ c) => ({
                id: String(c.slot),
                label: c.shape,
                tone: "neutral"
            }));
        },

        /**
         * 取得題目序列。
         */
        getSequence() {
            return sequence;
        },

        /**
         * 取得提示。
         */
        getPrompt() {
            if (kind === "dual") {
                return locale === "en-US" ? "Listen and look, then repeat" : "聽一看，再照順序選";
            }
            return locale === "en-US" ? "Find the matching footprints" : "找出成對的恐龍足跡";
        },

        /**
         * 翻牌。
         * @param {number} slot
         */
        flip(slot) {
            const card = cards.find((/** @type {any} */ c) => c.slot === slot);
            if (!card || card.matched || card.flipped) return { matched: false, done: false };

            card.flipped = true;
            flipped.push(slot);
            attempts++;

            if (flipped.length === 2) {
                const [a, b] = flipped;
                const cardA = cards.find((/** @type {any} */ c) => c.slot === a);
                const cardB = cards.find((/** @type {any} */ c) => c.slot === b);
                if (cardA && cardB && cardA.id === cardB.id) {
                    cardA.matched = true;
                    cardB.matched = true;
                    matched++;
                    flipped = [];
                    return { matched: true, done: matched * 2 >= cards.length, attempts };
                }
                flipped = [];
                return { matched: false, done: false, attempts, mismatch: true };
            }

            return { matched: false, done: false, attempts };
        },

        /**
         * 播放題目（雙通道會朗讀序列）。
         */
        playPrompt() {
            if (kind === "dual" && sequence.length) {
                sequence.forEach((/** @type {string} */ id, /** @type {number} */ i) => {
                    setTimeout(() => speak(itemLabel(bundle, locale, id, "animals"), { locale }), i * 1100);
                });
            }
        },

        /**
         * 示範。
         */
        demonstrate() {
            if (kind === "dual") {
                this.playPrompt();
            } else {
                // 翻牌示範：短暫亮出第一對
                const first = cards[0];
                if (first) first.flipped = true;
            }
        },

        /**
         * 重播。
         */
        replay() {
            this.playPrompt();
        },

        /**
         * 判定作答。
         *
         * 記憶玩法：check()（無參數）回傳整體完成狀態；
         * 翻牌流程完成時由 UI 以 "__memory_done__" 觸發回合結算。
         *
         * @param {string} [input]
         */
        check(input) {
            void input;
            if (input === undefined) {
                return {
                    correct: cards.length > 0 && matched * 2 >= cards.length,
                    matched,
                    attempts,
                    total: cards.length
                };
            }
            return { correct: false, hintStage: "hint-item" };
        }
    };
}
