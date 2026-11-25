/**
 * 關卡地圖 — 40 關依章節分組的路徑節點。
 *
 * 規範：付費章節（4、5 章）節點須顯示「需訂閱」標示並導向付費牆。
 */

import { getEntitlement, isChapterFree } from "../core/entitlements.js";
import { dailyChallenge, isDailyDone } from "../core/daily.js";
import { todayString } from "../core/progress.js";
import { escapeHtml, safeText } from "../core/sanitize-html.js";

/**
 * 單次渲染的最大關卡節點數（Step 149：分頁懶載入）。
 * @type {number}
 */
export const LEVELMAP_PAGE_SIZE = 24;

/**
 * 地圖分頁狀態。
 * @type {WeakMap<HTMLElement, number>}
 */
const mapPages = new WeakMap();

/**
 * 目前地圖的選關回呼（分頁重繪後仍須有效）。
 * @type {((levelId:number)=>void)|null}
 */
let mapSelect = null;

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

    // 分頁（單次渲染 <= 24 節點）
    // 依章節分頁：同一頁可跨章節，但每個「目前頁」內的節點總數 <= 24
    const totalPages = Math.max(1, Math.ceil(levels.length / LEVELMAP_PAGE_SIZE));
    const page = Math.min(mapPages.get(root) || 0, totalPages - 1);
    mapPages.set(root, page);

    /** @type {Map<number, any[]>} */
    const byChapter = new Map();
    for (const l of levels.slice(page * LEVELMAP_PAGE_SIZE, (page + 1) * LEVELMAP_PAGE_SIZE)) {
        const list = byChapter.get(l.chapter) || [];
        list.push(l);
        byChapter.set(l.chapter, list);
    }

    // 每章的第一關必須永遠可見（章節過場與搭檔由第一章第一關觸發）——
    // 將各章首關補進當頁，節點上限仍以 LEVELMAP_PAGE_SIZE 為準。
    /** @type {Set<number>} */
    const pageIds = new Set();
    for (const list of byChapter.values()) {
        for (const l of list) pageIds.add(l.id);
    }
    const firstOfEachChapter = levels.filter((/** @type {any} */ l) => {
        const list = levels.filter((/** @type {any} */ x) => x.chapter === l.chapter);
        return list.length && list[0].id === l.id;
    });
    for (const l of firstOfEachChapter) {
        if (pageIds.has(l.id)) continue;
        if (pageIds.size >= LEVELMAP_PAGE_SIZE) break;
        pageIds.add(l.id);
        const list = byChapter.get(l.chapter) || [];
        list.push(l);
        byChapter.set(l.chapter, list);
    }

    const daily = dailyChallenge(bundle, locale);
    const dailyDone = isDailyDone(progress, todayString());

    root.innerHTML = `
        <div class="levelmap">
            <!--
                W3：獨立導覽列 —— 為右上角的「返回」鈕保留專屬空間，
                下方卡片（每日挑戰／恐龍圖鑑／家長報告）不再被壓到。
            -->
            <div class="levelmap__nav" role="presentation">
                <span class="levelmap__nav-hint">${en ? "Pick a level" : "選一關開始"}</span>
            </div>
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
                                const nodeName = safeText(l.name?.[locale] || l.name?.["zh-TW"] || String(l.id));
                                return `
                                    <button class="levelmap__node ${locked ? "is-locked" : ""}"
                                            data-level="${l.id}" type="button"
                                            aria-label="${escapeHtml(nodeName)}">
                                        <span class="levelmap__node-no">${l.id}</span>
                                        <span class="levelmap__node-stars" aria-label="${stars}/3">
                                            ${[1, 2, 3].map((n) => `<img class="levelmap__star ${n <= stars ? "is-on" : ""}" src="./assets/icons/star${n <= stars ? "-filled" : ""}.svg" alt="" loading="lazy" decoding="async" width="18" height="18" />`).join("")}
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

    // 分頁控制
    if (totalPages > 1) {
        const nav = document.createElement("div");
        nav.className = "levelmap__pager";
        nav.setAttribute("role", "group");
        nav.setAttribute("aria-label", en ? "Level pages" : "關卡分頁");

        const prev = document.createElement("button");
        prev.className = "level-btn level-btn--secondary levelmap__pager-btn";
        prev.type = "button";
        prev.id = "levelmap-page-prev";
        prev.textContent = en ? "Previous" : "上一頁";
        prev.disabled = page <= 0;
        prev.addEventListener("click", () => {
            mapPages.set(root, Math.max(0, page - 1));
            renderLevelMap(root, bundle, progress, locale);
        });

        const next = document.createElement("button");
        next.className = "level-btn level-btn--secondary levelmap__pager-btn";
        next.type = "button";
        next.id = "levelmap-page-next";
        next.textContent = en ? "Next" : "下一頁";
        next.disabled = page >= totalPages - 1;
        next.addEventListener("click", () => {
            mapPages.set(root, Math.min(totalPages - 1, page + 1));
            renderLevelMap(root, bundle, progress, locale);
        });

        const status = document.createElement("span");
        status.className = "levelmap__pager-status";
        status.setAttribute("aria-live", "polite");
        status.textContent = `${page + 1} / ${totalPages}`;

        nav.appendChild(prev);
        nav.appendChild(status);
        nav.appendChild(next);
        root.querySelector(".levelmap")?.appendChild(nav);
    }

    /**
     * 綁定互動。
     *
     * 分頁後每次重繪都會產生新的按鈕節點，因此互動一律以**事件委派**
     * 掛在 root 上（而非逐一 addEventListener），確保翻頁後仍可操作。
     *
     * @param {(levelId:number)=>void} cb
     */
    function onSelect(cb) {
        if (root.dataset.levelmapBound === "1") {
            mapSelect = cb;
            return;
        }
        root.dataset.levelmapBound = "1";
        mapSelect = cb;

        root.addEventListener("click", (/** @type {MouseEvent} */ e) => {
            const target = /** @type {HTMLElement} */ (e.target);
            if (!target) return;

            const node = target.closest("[data-level]");
            if (node) {
                const id = Number(/** @type {HTMLElement} */ (node).dataset.level);
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
                mapSelect?.(id);
                return;
            }

            if (target.closest("[data-dex]")) {
                root.dispatchEvent(new CustomEvent("dex:request", { bubbles: true }));
                return;
            }

            if (target.closest("[data-parent]")) {
                root.dispatchEvent(new CustomEvent("parent:request", { bubbles: true }));
                return;
            }

            if (target.closest("[data-daily]")) {
                if (daily.level) mapSelect?.(daily.level.id);
            }
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
        // 直接由模組匯入取權益（不得依賴 window 全域 —— 該物件不存在會拋 TypeError）
        if (getEntitlement() !== "premium") return true;
    }

    // 序進：第一關永遠解鎖；其餘以進度為準
    if (levelId <= 1) return false;
    const unlocked = progress?.unlockedLevels;
    if (Array.isArray(unlocked)) {
        return !unlocked.includes(levelId);
    }
    return false;
}
