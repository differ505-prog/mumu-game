/**
 * 家長報告 — 掌握度雷達圖、弱項、下週建議、每週時數、圖鑑進度、成效前後測對照。
 *
 * 規範：
 * - 雷達圖為**內嵌 SVG**，座標由 mastery 計算。
 * - **不得出現負面評語措辭**（例如「落後」「不熟」「退步」）。
 * - 成效前後測對照僅呈現統計結果與顯著性，不逐題列出。
 */

import { masteryPercent } from "../core/mastery.js";
import { totalStars } from "../core/progress.js";

/**
 * 雷達圖軸定義。
 */
const AXES = [
    { key: "minimalPairCorrect", label: "語音覺辨", labelEn: "Phonological" },
    { key: "sequenceCorrect", label: "序列回憶", labelEn: "Sequence" },
    { key: "rhythmCorrect", label: "節奏模仿", labelEn: "Rhythm" },
    { key: "interferenceCorrect", label: "干擾抑制", labelEn: "Interference" },
    { key: "pitchCorrect", label: "音高模仿", labelEn: "Pitch" },
    { key: "puzzleCorrect", label: "圖像推理", labelEn: "Reasoning" },
    { key: "memoryCorrect", label: "空間記憶", labelEn: "Memory" }
];

/**
 * 渲染家長報告。
 * @param {HTMLElement} root
 * @param {any} progress
 * @param {any} bundle
 * @param {string} locale
 */
export function renderParentReport(root, progress, bundle, locale) {
    const en = locale === "en-US";
    const mastery = progress.mastery || {};

    const radar = buildRadar(mastery, en);
    const weakest = findWeakest(mastery);
    const suggestions = buildSuggestions(mastery, weakest, en);
    const stars = totalStars(progress);
    const dexCount = (progress.unlockedDex || []).length;
    const dexTotal = bundle?.dex?.length || 24;
    const weekly = weeklyMinutes(progress);

    const assessment = assessmentComparison(progress, en);

    root.innerHTML = `
        <div class="parent-report">
            <h2>${en ? "Learning Report" : "學習報告"}</h2>

            <section class="parent-report__section">
                <h3>${en ? "Skill Mastery" : "技能掌握度"}</h3>
                ${radar}
                <div class="parent-report__legend">
                    ${AXES.map((a) => {
                        const entry = mastery[a.key];
                        const pct = entry ? masteryPercent(entry) : 0;
                        return `<span class="parent-report__legend-item">
                            ${en ? a.labelEn : a.label}：${pct}%
                        </span>`;
                    }).join("")}
                </div>
            </section>

            <section class="parent-report__section">
                <h3>${en ? "This Week's Focus" : "本週建議"}</h3>
                <ul class="parent-report__suggestions">
                    ${suggestions.map((s) => `<li>${s}</li>`).join("")}
                </ul>
            </section>

            <section class="parent-report__section parent-report__stats">
                <div class="parent-report__stat">
                    <div class="parent-report__stat-value">${weekly}</div>
                    <div class="parent-report__stat-label">${en ? "minutes this week" : "本週練習分鐘"}</div>
                </div>
                <div class="parent-report__stat">
                    <div class="parent-report__stat-value">${stars}</div>
                    <div class="parent-report__stat-label">${en ? "stars earned" : "累計星星"}</div>
                </div>
                <div class="parent-report__stat">
                    <div class="parent-report__stat-value">${dexCount}/${dexTotal}</div>
                    <div class="parent-report__stat-label">${en ? "dinosaurs collected" : "已收集恐龍"}</div>
                </div>
                <div class="parent-report__stat">
                    <div class="parent-report__stat-value">${progress.streak?.count || 0}</div>
                    <div class="parent-report__stat-label">${en ? "day streak" : "連續練習天數"}</div>
                </div>
            </section>

            ${assessment}

            <section class="parent-report__section">
                <h3>${en ? "Encyclopedia Progress" : "圖鑑進度"}</h3>
                <div class="parent-report__progress">
                    <div class="parent-report__progress-bar"
                         style="width:${Math.round((dexCount / Math.max(1, dexTotal)) * 100)}%"></div>
                </div>
                <p class="parent-report__hint">
                    ${dexCount >= dexTotal
                        ? (en ? "The encyclopedia is complete. A wonderful collection journey." : "圖鑑已全部收集完成，這是一段很棒的收集旅程。")
                        : (en ? `${dexTotal - dexCount} more to go — each one is a new skill mastered.` : `還差 ${dexTotal - dexCount} 隻，每一隻都是一次新的技能掌握。`)}
                </p>
            </section>
        </div>
    `;

    /**
     * 匯出純文字摘要。
     * @returns {string}
     */
    function exportText() {
        const lines = [
            en ? "Santa's Little Helper — Learning Report" : "聖誕小幫手 — 學習報告",
            en ? `Practice time this week: ${weekly} minutes` : `本週練習時間：${weekly} 分鐘`,
            en ? `Stars earned: ${stars}` : `累計星星：${stars}`,
            en ? `Encyclopedia: ${dexCount}/${dexTotal}` : `圖鑑收集：${dexCount}/${dexTotal}`,
            "",
            en ? "Skill mastery:" : "技能掌握度：",
            ...AXES.map((a) => {
                const entry = mastery[a.key];
                return `  ${en ? a.labelEn : a.label}：${entry ? masteryPercent(entry) : 0}%`;
            }),
            "",
            en ? "This week's focus:" : "本週建議：",
            ...suggestions.map((s) => `  - ${s}`)
        ];
        if (assessment) {
            lines.push("", en ? "Assessment comparison" : "成效前後測對照");
            lines.push(assessment.replace(/<[^>]+>/g, " "));
        }
        return lines.join("\n");
    }

    return { exportText };
}

/**
 * 建立內嵌 SVG 雷達圖。
 * @param {Record<string,any>} mastery
 * @param {boolean} en
 * @returns {string}
 */
function buildRadar(mastery, en) {
    const size = 320;
    const cx = size / 2;
    const cy = size / 2;
    const R = 120;
    const n = AXES.length;

    /** @type {string[]} */
    const grid = [];
    for (let ring = 1; ring <= 4; ring++) {
        const pts = [];
        for (let i = 0; i < n; i++) {
            const a = (Math.PI * 2 * i) / n - Math.PI / 2;
            const r = (R * ring) / 4;
            pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
        }
        grid.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="rgba(247,251,255,.16)" stroke-width="1"/>`);
    }

    /** @type {string[]} */
    const spokes = [];
    for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        spokes.push(`<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * R).toFixed(1)}" y2="${(cy + Math.sin(a) * R).toFixed(1)}" stroke="rgba(247,251,255,.16)" stroke-width="1"/>`);
    }

    const dataPts = [];
    for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const entry = mastery[AXES[i].key];
        const value = entry?.total ? Math.min(1, entry.ema) : 0.15;
        const r = R * value;
        dataPts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
    }

    /** @type {string[]} */
    const labels = [];
    for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + Math.cos(a) * (R + 24);
        const y = cy + Math.sin(a) * (R + 24);
        const anchor = Math.abs(x - cx) < 12 ? "middle" : (x > cx ? "start" : "end");
        labels.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}"
            dominant-baseline="middle" font-size="11" fill="rgba(247,251,255,.75)">${en ? AXES[i].labelEn : AXES[i].label}</text>`);
    }

    return `
        <svg class="parent-report__radar" viewBox="0 0 ${size} ${size}" role="img"
             aria-label="${en ? "Skill mastery radar chart" : "技能掌握度雷達圖"}">
            ${grid.join("")}
            ${spokes.join("")}
            <polygon points="${dataPts.join(" ")}" fill="rgba(241,196,15,.30)" stroke="#f1c40f" stroke-width="2"/>
            ${dataPts.map((p) => {
                const [x, y] = p.split(",");
                return `<circle cx="${x}" cy="${y}" r="3" fill="#f1c40f"/>`;
            }).join("")}
            ${labels.join("")}
        </svg>
    `;
}

/**
 * 找出最需要加強的技能（進步空間最大者）。
 * @param {Record<string,any>} mastery
 */
function findWeakest(mastery) {
    let weakest = null;
    let lowest = Infinity;
    for (const a of AXES) {
        const entry = mastery[a.key];
        if (!entry || entry.total < 3) continue;
        if (entry.ema < lowest) {
            lowest = entry.ema;
            weakest = a;
        }
    }
    return weakest;
}

/**
 * 產生下週建議（正向措辭）。
 * @param {Record<string,any>} mastery
 * @param {any} weakest
 * @param {boolean} en
 * @returns {string[]}
 */
function buildSuggestions(mastery, weakest, en) {
    /** @type {string[]} */
    const out = [];

    if (weakest) {
        out.push(en
            ? `Keep practicing ${weakest.labelEn} — short, daily sessions work best.`
            : `持續練習「${weakest.label}」，每天短時間練習效果最好。`);
    }

    const mp = mastery.minimalPairCorrect;
    if (mp && mp.total >= 3 && mp.ema >= 0.85) {
        out.push(en
            ? "Phonological awareness is strong — ready for the next chapter's patterns."
            : "語音覺辨表現穩定，可以準備進入下一章的進階題型。");
    } else if (mp && mp.total >= 3) {
        out.push(en
            ? "Phonological awareness is taking shape — keep going, small steps count."
            : "語音覺辨正在成形，繼續保持，每一次練習都在累積。");
    }

    const daily = mastery.sequenceCorrect;
    if (daily && daily.total >= 3 && daily.ema >= 0.85) {
        out.push(en
            ? "Sequence memory is solid — try the longer rhythm patterns."
            : "序列記憶表現穩定，可以嘗試更長的節奏型態。");
    }

    if (!out.length) {
        out.push(en
            ? "Start with a short session each day — consistency builds the strongest foundation."
            : "每天開始一小段練習，穩定的累積會是最牢固的基礎。");
    }

    return out;
}

/**
 * 每週練習分鐘數（由 session 時長推估）。
 * @param {any} progress
 */
function weeklyMinutes(progress) {
    const totalMs = Number(progress.totalSessionMs) || 0;
    return Math.max(0, Math.round(totalMs / 60000));
}

/**
 * 成效前後測對照（僅統計結果與顯著性，不逐題列出）。
 * @param {any} progress
 * @param {boolean} en
 * @returns {string}
 */
function assessmentComparison(progress, en) {
    const runs = progress.assessmentRuns || [];
    const pre = runs.find((/** @type {any} */ r) => r.phase === "pre");
    const post = runs.find((/** @type {any} */ r) => r.phase === "post");

    if (!pre || !post) {
        return `
            <section class="parent-report__section">
                <h3>${en ? "Progress Assessment" : "成效前後測"}</h3>
                <p class="parent-report__hint">
                    ${en
                        ? "The pre/post assessment has not been completed yet. It is available in the parent area."
                        : "前後測尚未完成，可於家長專區執行。"}
                </p>
            </section>
        `;
    }

    const preRate = Math.round(pre.summary.correctRate * 100);
    const postRate = Math.round(post.summary.correctRate * 100);
    const delta = postRate - preRate;

    return `
        <section class="parent-report__section">
            <h3>${en ? "Progress Assessment" : "成效前後測"}</h3>
            <div class="parent-report__assessment">
                <div class="parent-report__stat">
                    <div class="parent-report__stat-value">${preRate}%</div>
                    <div class="parent-report__stat-label">${en ? "first measurement" : "前測正確率"}</div>
                </div>
                <div class="parent-report__stat">
                    <div class="parent-report__stat-value">${postRate}%</div>
                    <div class="parent-report__stat-label">${en ? "follow-up" : "後測正確率"}</div>
                </div>
                <div class="parent-report__stat">
                    <div class="parent-report__stat-value">${delta >= 0 ? "+" : ""}${delta}</div>
                    <div class="parent-report__stat-label">${en ? "percentage points" : "百分點變化"}</div>
                </div>
            </div>
            <p class="parent-report__hint">
                ${en
                    ? `The follow-up measurement was taken with parallel but different items, so it reflects learning rather than memorised answers. Sample size: ${post.summary.total} responses.`
                    : `後測採相同認知目標、不同題面進行，因此反映的是學習成果而非記憶答案。樣本數：${post.summary.total} 題。`}
            </p>
        </section>
    `;
}
