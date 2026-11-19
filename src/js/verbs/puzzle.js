/**
 * 拼圖引擎 — 圖像拼合與序列推理。
 *
 * 戰略意義：拼圖完成圖是「可炫耀的視覺」，是分享成果卡的主要載體，
 * 直接支撐本案最弱的流量環節。
 */

import { pickItems } from "../data/levels.js";
import { speak } from "../audio/voice.js";

/**
 * @typedef {"assembly"|"pattern"} PuzzleKind
 */

/**
 * 以 canvas 將恐龍素材切片。
 * @param {string} src 圖片路徑
 * @param {number} pieces 切片數（2–9）
 * @returns {Promise<{ pieces: any[], grid: number }>}
 */
export function sliceArtwork(src, pieces) {
    const grid = Math.max(2, Math.min(3, Math.ceil(Math.sqrt(pieces))));
    const total = grid * grid;

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const cell = Math.floor(Math.min(img.width, img.height) / grid);
            canvas.width = cell;
            canvas.height = cell;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve({ pieces: [], grid });
                return;
            }
            /** @type {any[]} */
            const out = [];
            for (let y = 0; y < grid; y++) {
                for (let x = 0; x < grid; x++) {
                    ctx.clearRect(0, 0, cell, cell);
                    ctx.drawImage(
                        img,
                        x * cell, y * cell, cell, cell,
                        0, 0, cell, cell
                    );
                    out.push({
                        index: out.length,
                        targetX: x,
                        targetY: y,
                        dataUrl: canvas.toDataURL("image/png")
                    });
                }
            }
            resolve({ pieces: out.slice(0, total), grid });
        };
        img.onerror = () => resolve({ pieces: [], grid });
        img.src = src;
    });
}

/**
 * 依關卡難度產生序列推理題。
 * @param {any} bundle
 * @param {number} level
 */
export function patternTask(bundle, level) {
    const colors = bundle?.items?.colors || [];
    if (colors.length < 4) return null;

    /** @type {string[][]} */
    const patterns = [
        ["abab", "a", "b", "a", "b", "a"],
        ["aabb", "a", "a", "b", "b", "a"],
        ["abc", "a", "b", "c", "a", "b"],
        ["aab", "a", "a", "b", "a", "a"]
    ];
    const idx = Math.min(patterns.length - 1, Math.max(0, level - 1));
    const [type, ...seq] = patterns[idx];

    const pool = [...colors].sort(() => Math.random() - 0.5);
    const [ca, cb, cc] = pool;
    const map = { a: ca, b: cb, c: cc };

    const shown = seq.slice(0, 4).map((/** @type {string} */ k) => map[k]);
    const answer = map[seq[4]];
    const options = [...colors].sort(() => Math.random() - 0.5).slice(0, 4);

    return { type, shown, answer: answer.id, options, locale: "zh-TW" };
}

/**
 * 建立拼圖引擎。
 * @param {any} bundle
 * @param {string} locale
 * @param {any} spec
 * @param {PuzzleKind} kind
 */
export function createPuzzleVerb(bundle, locale, spec, kind) {
    /** @type {any} */
    let task = null;
    /** @type {any[]} */
    let options = [];
    /** @type {any[]} */
    let pieces = [];
    /** @type {number} */
    let placed = 0;
    /** 序列推理題的正解 id。 @type {string} */
    let answerId = "";
    /** 拼合玩法的作答進度（由 submit() 內部維護）。 @type {number} */
    let progressIndex = 0;

    return {
        /**
         * 玩法制程契約類型。
         *
         * - "assembly"（拼合）→ "place"（需多次放置片段）
         * - "pattern"（序列推理）→ "choice"（從選項選答案）
         */
        kind: kind === "pattern" ? "choice" : "place",

        /**
         * 產生題目。
         */
        async build() {
            progressIndex = 0;
            if (kind === "pattern") {
                task = patternTask(bundle, spec?.options ?? 2);
                if (task) {
                    answerId = task.answer || "";
                    options = task.options.map((/** @type {any} */ c) => ({
                        id: c.id,
                        label: locale === "en-US" ? c["en-US"] : c["zh-TW"],
                        color: c.hex,
                        tone: "neutral"
                    }));
                }
                return;
            }

            // assembly：從圖鑑取一隻恐龍切片
            const dinos = pickItems(bundle, "dino", 1);
            const dino = dinos[0];
            const entry = bundle?.dex?.find((/** @type {any} */ d) => d.id === dino?.id);
            const count = Math.min(9, Math.max(2, spec?.options ?? 4));
            const sliced = await sliceArtwork(entry?.art?.file || "", count);
            pieces = sliced.pieces.map((/** @type {any} */ p) => ({
                ...p,
                placed: false,
                placedIndex: -1
            }));
            options = pieces.map((/** @type {any} */ p) => ({
                id: String(p.index),
                label: "",
                image: p.dataUrl,
                tone: "neutral"
            }));
            task = { dinoId: dino?.id, grid: sliced.grid };
            placed = 0;
            answerId = "";
        },

        /**
         * 取得選項。
         */
        getOptions() {
            return options;
        },

        /**
         * 取得拼圖切片（供 UI 渲染）。
         */
        getPieces() {
            return pieces;
        },

        /**
         * 取得題目提示。
         */
        getPrompt() {
            if (kind === "pattern") {
                return locale === "en-US" ? "What comes next?" : "接下來是哪一個？";
            }
            return locale === "en-US" ? "Put the picture back together" : "把圖片拼回去";
        },

        /**
         * 播放題目。
         *
         * assembly（拼合）沒有語音提示；pattern（序列推理）朗讀題目文字。
         */
        playPrompt() {
            if (kind === "pattern") {
                speak(this.getPrompt());
            }
        },

        /**
         * 放置拼圖片段。
         * @param {number} pieceIndex
         * @param {number} targetIndex
         */
        place(pieceIndex, targetIndex) {
            const piece = pieces.find((/** @type {any} */ p) => p.index === pieceIndex);
            if (!piece) return { correct: false, progress: 0 };
            const expected = piece.targetY * (task?.grid || 1) + piece.targetX;
            const correct = expected === targetIndex;
            if (correct) {
                piece.placed = true;
                piece.placedIndex = targetIndex;
                placed++;
            }
            return { correct, progress: pieces.length ? placed / pieces.length : 0 };
        },

        /**
         * 統一作答入口（玩法制程契約）。
         *
         * - "choice"（pattern）：比對 answerId → { status:"correct"|"wrong", correct, done:true }
         * - "place"（assembly）：接收 { pieceIndex, targetIndex }，呼叫既有 place() 邏輯 →
         *   { status:"progress", correct: 全部已放置, done: placed === pieces.length }
         *
         * @param {string|{ pieceIndex?:number, targetIndex?:number }} input
         * @param {any} [_meta]
         * @returns {import("../core/verb-contract.js").SubmitResult}
         */
        submit(input, _meta) {
            if (kind === "pattern") {
                const correct = String(input) === String(answerId);
                return {
                    status: correct ? "correct" : "wrong",
                    correct,
                    done: true,
                    feedback: answerId
                };
            }

            const pieceIndex = Number(/** @type {any} */ (input)?.pieceIndex);
            const targetIndex = Number(/** @type {any} */ (input)?.targetIndex);
            if (!Number.isFinite(pieceIndex) || !Number.isFinite(targetIndex)) {
                return { status: "wrong", correct: false, done: false };
            }

            const result = this.place(pieceIndex, targetIndex);
            const done = pieces.length > 0 && placed === pieces.length;
            return {
                status: result.correct ? "progress" : "wrong",
                correct: Boolean(result.correct),
                done
            };        },

        /**
         * 判定本回合是否已完成。
         * @returns {boolean}
         */
        isComplete() {
            if (kind === "pattern") {
                return progressIndex > 0 || Boolean(answerId);
            }
            return pieces.length > 0 && placed === pieces.length;
        },

        /**
         * 本回合的正確選項 id（供示範與測試用）。
         * @returns {string|null}
         */
        getFeedback() {
            if (kind === "pattern") return answerId || null;
            if (!pieces.length) return null;
            const next = pieces.find((/** @type {any} */ p) => !p.placed);
            if (!next) return null;
            const grid = task?.grid || 1;
            return String(next.targetY * grid + next.targetX);
        },

        /**
         * 相容層：舊的 check() 保留（拼合的整體完成狀態）。
         */
        check() {
            return {
                correct: pieces.length > 0 && placed === pieces.length,
                progress: pieces.length ? placed / pieces.length : 0
            };
        },

        /**
         * 產生完成圖（供分享卡使用）。
         * @returns {string}
         */
        resultCanvas() {
            if (!pieces.length) return "";
            const grid = task?.grid || 1;
            const size = 240;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) return "";
            ctx.fillStyle = "#16294f";
            ctx.fillRect(0, 0, size, size);

            const cell = size / grid;
            void cell;
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, size, size);
            };
            img.src = pieces[0].dataUrl;
            return canvas.toDataURL("image/png");
        },

        /**
         * 示範。
         */
        demonstrate() {
            // 拼圖示範：讓其中一片短暫發光
            const first = pieces[0];
            if (first) first.placed = true;
        },

        /**
         * 重播。
         */
        replay() { }
    };
}
