/**
 * 成效評估執行器。
 *
 * 設計原則（對應 v4 備忘錄「成效研究」支柱）：
 * - 評估模式與遊戲模式完全隔離：無星級、無角色動畫、無慶祝效果。
 * - 作答記錄**不含任何可識別資訊**：不記錄姓名、時間戳精確值或裝置資訊。
 * - 前測／後測題目分離，題面不同但認知目標相同。
 */

/**
 * @typedef {"pre"|"post"} AssessmentPhase
 */

/**
 * @typedef {Object} AssessmentRecord
 * @property {string} scale 量表名
 * @property {string} itemId 題目 id（後測帶 -p 尾綴）
 * @property {boolean} correct
 * @property {number} reactionMs 反應時間
 */

/**
 * 建立評估 session。
 * @param {any} bundle 內容包
 * @param {string} locale
 * @param {AssessmentPhase} phase
 */
export function createAssessment(bundle, locale, phase) {
    /** @type {AssessmentRecord[]} */
    const records = [];
    /** @type {Map<string, number>} */
    const questionStart = new Map();

    const groups = phase === "post"
        ? bundle?.assessment?.posttest || bundle?.assessment?.scales || {}
        : bundle?.assessment?.pretest || bundle?.assessment?.scales || {};

    /** @type {string[]} */
    const scaleNames = Object.keys(groups);

    /**
     * 取得題目。
     * @param {number} scaleIndex
     * @param {number} itemIndex
     */
    function current(scaleIndex, itemIndex) {
        const scaleName = scaleNames[scaleIndex];
        if (!scaleName) return null;
        const list = groups[scaleName]?.[locale] || groups[scaleName]?.["zh-TW"] || [];
        const item = list[itemIndex];
        if (!item) return null;
        return { ...item, scale: scaleName, phase };
    }

    return {
        /**
         * 量表數。
         */
        get scaleCount() {
            return scaleNames.length;
        },

        /**
         * 量表名稱清單。
         */
        get scales() {
            return [...scaleNames];
        },

        /**
         * 取得某量表的題目數。
         * @param {number} scaleIndex
         */
        itemCount(scaleIndex) {
            const name = scaleNames[scaleIndex];
            if (!name) return 0;
            const list = groups[name]?.[locale] || groups[name]?.["zh-TW"] || [];
            return list.length;
        },

        /**
         * 取得題目。
         * @param {number} scaleIndex
         * @param {number} itemIndex
         */
        current,

        /**
         * 開始計時。
         * @param {number} scaleIndex
         * @param {number} itemIndex
         */
        startTiming(scaleIndex, itemIndex) {
            questionStart.set(`${scaleIndex}:${itemIndex}`, performance.now());
        },

        /**
         * 記錄作答。
         * @param {number} scaleIndex
         * @param {number} itemIndex
         * @param {string} answer
         * @param {number} [reactionMs] 未提供則由計時推算
         */
        record(scaleIndex, itemIndex, answer, reactionMs) {
            const item = current(scaleIndex, itemIndex);
            if (!item) return;

            const key = `${scaleIndex}:${itemIndex}`;
            const started = questionStart.get(key);
            const ms = reactionMs ?? (started ? Math.round(performance.now() - started) : 0);

            let correct = false;
            if (typeof item.answerIndex === "number") {
                const idx = Number(answer);
                correct = idx === item.answerIndex;
            } else if (typeof item.answer === "string") {
                correct = answer === item.answer;
            }

            records.push({
                scale: item.scale,
                itemId: item.id,
                correct,
                reactionMs: ms
            });
        },

        /**
         * 計算摘要。
         * @returns {{ correctRate:number, avgReactionMs:number, byScale:Record<string,number>, total:number }}
         */
        summary() {
            if (!records.length) {
                return { correctRate: 0, avgReactionMs: 0, byScale: {}, total: 0 };
            }
            const correct = records.filter((r) => r.correct).length;
            const totalMs = records.reduce((s, r) => s + r.reactionMs, 0);

            /** @type {Record<string, number>} */
            const byScale = {};
            /** @type {Record<string, {c:number,t:number}>} */
            const scaleAgg = {};
            for (const r of records) {
                scaleAgg[r.scale] = scaleAgg[r.scale] || { c: 0, t: 0 };
                scaleAgg[r.scale].t++;
                if (r.correct) scaleAgg[r.scale].c++;
            }
            for (const [k, v] of Object.entries(scaleAgg)) {
                byScale[k] = v.t ? v.c / v.t : 0;
            }

            return {
                correctRate: correct / records.length,
                avgReactionMs: Math.round(totalMs / records.length),
                byScale,
                total: records.length
            };
        },

        /**
         * 產出可寄回的研究資料（去識別化）。
         *
         * 刻意不含：時間戳、locale（改為語系代碼）、任何裝置或使用者資訊。
         * @returns {object}
         */
        export() {
            return {
                version: 1,
                phase,
                scales: scaleNames,
                items: records.map((r) => ({
                    scale: r.scale,
                    itemId: r.itemId,
                    correct: r.correct ? 1 : 0,
                    reactionMs: r.reactionMs
                })),
                summary: this.summary()
            };
        },

        /**
         * 原始作答記錄（供家長端預覽）。
         */
        get records() {
            return [...records];
        }
    };
}
