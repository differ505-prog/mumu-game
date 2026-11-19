/**
 * 關卡地圖 — 40 關依章節分組的路徑節點。
 *
 * 規範：付費章節（4、5 章）節點須顯示「需訂閱」標示並導向付費牆。
 */

import { isChapterFree } from "../core/entitlements.js";
import { dailyChallenge, isDailyDone } from "../core/daily.js";
import { todayString } from "../core/progress.js";

/**
 * 渲染關卡地圖。
 * @param {HTMLElement} root
 * @param {any} bundle
 * @param {any} progress
 * @param {string} locale
 */
export function renderLevelMap(root, bundle, progress, locale) {
    const levels = bundle?.levels || [];
    const en = locale === "en-US";

    /** @type {Map<number, any[]>} */
    const byChapter = new Map();
    for (const l of levels) {
        const list = byChapter.get(l.chapter) || [];
        list.push(l);
        byChapter.set(l.chapter, list);
    }

    const daily = dailyChallenge(bundle, locale);
    const dailyDone = isDailyDone(progress, todayString());

    root.innerHTML = `
        <div class="levelmap">
            <div class="levelmap__top">
                <button class="mode-option levelmap__daily ${dailyDone ? "is-done" : ""}"
                        data-daily="1" type="button">
                    <div class="mode-title">${en ? "Daily Challenge" : "每日挑戰"}</div>
                    <div class="mode-desc">${dailyDone ? (en ? "Done today" : "今日已完成") : daily.title}</div>
                </button>
                <button class="mode-option" data-dex="1" type="button">
                    <div class="mode-title">${en ? "Encyclopedia" : "恐龍圖鑑"}</div>
                    <div class="mode-desc">${en ? "Collect all 24 dinosaurs" : "收集 24 隻恐龍"}</div>
                </button>
                <button class="mode-option" data-parent="1" type="button">
                    <div class="mode-title">${en ? "Parent Report" : "家長報告"}</div>
                    <div class="mode-desc">${en ? "See learning progress" : "查看學習成果"}</div>
                </button>
            </div>

            ${Array.from(byChapter.entries()).map(([chapter, list]) => {
                const free = isChapterFree(chapter);
                const letter = bundle?.storyArcs?.chapters?.find((/** @type {any} */ c) => c.chapter === chapter);
                const title = letter?.title?.[locale] || letter?.title?.["zh-TW"] || `Chapter ${chapter}`;

                return `
                    <section class="levelmap__chapter ${free ? "" : "levelmap__chapter--premium"}">
                        <h3 class="levelmap__chapter-title">
                            ${title}
                            ${free ? "" : `<span class="levelmap__badge">${en ? "Subscription required" : "需訂閱"}</span>`}
                        </h3>
                        <div class="levelmap__path">
                            ${list.map((/** @type {any} */ l) => {
                                const locked = isLevelLocked(bundle, l.id, progress);
                                const stars = progress.stars?.[String(l.id)] || 0;
                                return `
                                    <button class="levelmap__node ${locked ? "is-locked" : ""}"
                                            data-level="${l.id}" type="button"
                                            aria-label="${l.name?.[locale] || l.name?.["zh-TW"] || l.id}">
                                        <span class="levelmap__node-no">${l.id}</span>
                                        <span class="levelmap__node-stars" aria-label="${stars}/3">
                                            ${[1, 2, 3].map((n) => `<img class="levelmap__star ${n <= stars ? "is-on" : ""}" src="./assets/icons/star${n <= stars ? "-filled" : ""}.svg" alt="" width="18" height="18" />`).join("")}
                                        </span>
                                    </button>
                                `;
                            }).join("")}
                        </div>
                    </section>
                `;
            }).join("")}
        </div>
    `;

    /**
     * 綁定互動。
     * @param {(levelId:number)=>void} cb
     */
    function onSelect(cb) {
        root.querySelectorAll("[data-level]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = Number(/** @type {HTMLElement} */ (btn).dataset.level);
                const level = levels.find((/** @type {any} */ l) => l.id === id);
                if (!level) return;

                if (isLevelLocked(bundle, id, progress)) {
                    // 付費章節 → 導向付費牆；序進未解鎖 → 提示
                    if (!isChapterFree(level.chapter)) {
                        root.dispatchEvent(new CustomEvent("paywall:request", {
                            detail: { feature: `chapter${level.chapter + 1}`, levelId: id },
                            bubbles: true
                        }));
                    }
                    return;
                }
                cb(id);
            });
        });

        root.querySelector("[data-dex]")?.addEventListener("click", () => {
            root.dispatchEvent(new CustomEvent("dex:request", { bubbles: true }));
        });

        root.querySelector("[data-parent]")?.addEventListener("click", () => {
            root.dispatchEvent(new CustomEvent("parent:request", { bubbles: true }));
        });

        root.querySelector("[data-daily]")?.addEventListener("click", () => {
            if (daily.level) cb(daily.level.id);
        });
    }

    return { onSelect };
}

/**
 * 判斷關卡是否鎖住。
 *
 * 規則：序進解鎖（前關已通關）＋ 付費章節需權益。
 *
 * 序進解鎖以**進度存檔**（`progress.unlockedLevels`）為準 ——
 * `core/progress.js` 的 `recordLevelResult()` 會在完成第 N 關時解鎖第 N+1 關。
 *
 * @param {any} bundle
 * @param {number} levelId
 * @param {any} [progress]
 * @returns {boolean}
 */
export function isLevelLocked(bundle, levelId, progress) {
    const level = bundle?.levels?.find((/** @type {any} */ l) => l.id === levelId);
    if (!level) return true;

    // 付費章節（第 4、5 章，即 chapter 3、4）需權益
    if (!isChapterFree(level.chapter)) {
        const { getEntitlement } = /** @type {any} */ (window).__mumuEntitlements;
        if (getEntitlement?.() !== "premium") return true;
    }

    // 序進：第一關永遠解鎖；其餘以進度為準
    if (levelId <= 1) return false;
    const unlocked = progress?.unlockedLevels;
    if (Array.isArray(unlocked)) {
        return !unlocked.includes(levelId);
    }
    return false;
}
