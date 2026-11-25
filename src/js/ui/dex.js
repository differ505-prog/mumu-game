/**
 * 恐龍圖鑑介面 — 24 格。
 *
 * 規範：未解鎖顯示剪影與**真實學習條件文字**，進度條顯示實際完成度。
 */

import { checkDexUnlock, dexUnlockProgress, unlockConditionText, childVoice } from "../core/dex.js";
import { itemLabel } from "../data/items.js";
import { escapeHtml, safeText } from "../core/sanitize-html.js";

/**
 * 單次渲染的最大節點數（Step 149：長列表分頁懶載入）。
 * @type {number}
 */
export const DEX_PAGE_SIZE = 24;

/**
 * 圖鑑分頁狀態（依 root 記住目前頁碼）。
 * @type {WeakMap<HTMLElement, number>}
 */
const dexPages = new WeakMap();

/**
 * 目前圖鑑的選取回呼（分頁重繪後仍須有效）。
 * @type {((dinoId:string)=>void)|null}
 */
let dexSelect = null;

/**
 * 渲染圖鑑。
 *
 * F8：圖鑑**必須有「關上」按鈕**（點進去就出不來是既有缺陷）。
 * 關上後回到**開啟圖鑑的那個畫面**（由呼叫端透過 `onClose` 決定）。
 *
 * @param {HTMLElement} root
 * @param {any} bundle
 * @param {any} progress
 * @param {string} locale
 * @param {() => void} [onClose]
 */
export function renderDex(root, bundle, progress, locale, onClose) {
    const dex = bundle?.dex || [];
    const voice = childVoice() || {};
    const key = locale === "en-US" ? "en-US" : "zh-TW";
    const en = locale === "en-US";

    // 分頁（單次渲染 <= 24 節點）
    const totalPages = Math.max(1, Math.ceil(dex.length / DEX_PAGE_SIZE));
    const page = Math.min(dexPages.get(root) || 0, totalPages - 1);
    dexPages.set(root, page);
    const pageItems = dex.slice(page * DEX_PAGE_SIZE, (page + 1) * DEX_PAGE_SIZE);

    // 內容型資料一律 escape（不得以模板字串直接注入未信任內容）
    const progressLabel = escapeHtml(safeText(
        voice.dexProgressLabel?.[key] || (locale === "en-US" ? "Collection" : "收集進度")
    ));
    const unlockedBadge = escapeHtml(safeText(voice.dexUnlockedBadge?.[key] || ""));
    const lockedSilhouette = escapeHtml(safeText(voice.dexLockedSilhouette?.[key] || ""));

    root.innerHTML = `
        <div class="dex-header">
            <h2>${locale === "en-US" ? "Dinosaur Encyclopedia" : "恐龍圖鑑"}</h2>
            <p class="dex-count">
                ${progressLabel}
                ${(progress.unlockedDex || []).length} / ${dex.length}
            </p>
        </div>
        ${dex.length === 0 ? `
            <div class="dex-empty" role="status">
                <p>${en ? "No dinosaurs yet. Play a level to start collecting." : "還沒有圖鑑資料，先去玩一關開始收集吧。"}</p>
            </div>
        ` : ""}
        <div class="dex-grid" data-dex-page="${page}">
            ${pageItems.map((/** @type {any} */ d) => {
                const unlocked = checkDexUnlock(bundle, progress, d.id);
                const pct = dexUnlockProgress(bundle, progress, d.id);
                const name = escapeHtml(safeText(d.name?.[locale] || d.name?.["zh-TW"] || d.id));
                const art = escapeHtml(safeText(d.art?.file || ""));
                const milestone = escapeHtml(safeText(
                    d.personality?.[locale] || d.personality?.["zh-TW"] || ""
                ));
                const condText = escapeHtml(safeText(
                    unlockConditionText(bundle, progress, d.id, locale, "child")
                ));
                const pctInt = Math.round(pct * 100);

                return `
                    <div class="dex-entry ${unlocked ? "dex-entry--unlocked" : "dex-entry--locked"}"
                         data-dino="${escapeHtml(safeText(d.id))}" role="button" tabindex="0"
                         aria-label="${name}${unlocked ? "" : "（" + condText + "）"}">
                        <div class="dex-entry__art">
                            <img src="${art}" alt="${name}"
                                 loading="lazy" decoding="async"
                                 ${unlocked ? "" : 'class="dex-entry__silhouette"'} />
                            ${unlocked ? "" : `<span class="dex-entry__lock" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" stroke-width="2"
                                     stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>`}
                        </div>
                        <div class="dex-entry__no">No.${Number(d.dexNo) || 0}</div>
                        <div class="dex-entry__name">${unlocked ? name : "???"}</div>
                        <div class="dex-entry__milestone">${unlocked
                            ? (unlockedBadge || milestone)
                            : `${lockedSilhouette} ${condText}`}</div>
                        ${unlocked ? "" : `
                            <div class="dex-entry__progress" role="progressbar"
                                 aria-valuenow="${pctInt}" aria-valuemin="0" aria-valuemax="100">
                                <div class="dex-entry__progress-bar" style="width:${pctInt}%"></div>
                            </div>
                        `}
                    </div>
                `;
            }).join("")}
        </div>
    `;

    /**
     * 綁定點擊事件。
     *
     * 分頁後每次重繪都會產生新的圖鑑節點，因此以**事件委派**掛在 root 上，
     * 確保翻頁後仍可操作（並保留鍵盤 Enter／Space 觸發）。
     *
     * @param {(dinoId:string)=>void} cb
     */
    function onSelect(cb) {
        dexSelect = cb;
        if (root.dataset.dexBound === "1") return;
        root.dataset.dexBound = "1";

        root.addEventListener("click", (/** @type {MouseEvent} */ e) => {
            const target = /** @type {HTMLElement} */ (e.target);
            if (!target) return;
            const entry = target.closest("[data-dino]");
            if (!entry) return;
            const id = /** @type {HTMLElement} */ (entry).dataset.dino || "";
            if (id) dexSelect?.(id);
        });

        root.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            const target = /** @type {HTMLElement} */ (e.target);
            if (!target) return;
            if (target.tagName === "BUTTON" || target.tagName === "INPUT") return;
            const entry = target.closest("[data-dino]");
            if (!entry) return;
            e.preventDefault();
            const id = /** @type {HTMLElement} */ (entry).dataset.dino || "";
            if (id) dexSelect?.(id);
        });
    }

    // 分頁控制（<= 24 節點／頁）
    if (totalPages > 1) {
        const nav = document.createElement("div");
        nav.className = "dex-pager";
        nav.setAttribute("role", "group");
        nav.setAttribute("aria-label", en ? "Dex pages" : "圖鑑分頁");

        const prev = document.createElement("button");
        prev.className = "level-btn level-btn--secondary dex-pager__btn";
        prev.type = "button";
        prev.id = "dex-page-prev";
        prev.textContent = en ? "Previous" : "上一頁";
        prev.disabled = page <= 0;
        prev.addEventListener("click", () => {
            dexPages.set(root, Math.max(0, page - 1));
            renderDex(root, bundle, progress, locale, onClose);
        });

        const next = document.createElement("button");
        next.className = "level-btn level-btn--secondary dex-pager__btn";
        next.type = "button";
        next.id = "dex-page-next";
        next.textContent = en ? "Next" : "下一頁";
        next.disabled = page >= totalPages - 1;
        next.addEventListener("click", () => {
            dexPages.set(root, Math.min(totalPages - 1, page + 1));
            renderDex(root, bundle, progress, locale, onClose);
        });

        const status = document.createElement("span");
        status.className = "dex-pager__status";
        status.setAttribute("aria-live", "polite");
        status.textContent = `${page + 1} / ${totalPages}`;

        nav.appendChild(prev);
        nav.appendChild(status);
        nav.appendChild(next);
        root.appendChild(nav);
    }

    // F8：關上按鈕（右上角），關上後回到開啟圖鑑的那個畫面
    const close = document.createElement("button");
    close.className = "level-btn level-btn--secondary overlay__back";
    close.id = "dex-close";
    close.type = "button";
    close.setAttribute("aria-label", locale === "en-US" ? "Close" : "關上");
    close.textContent = locale === "en-US" ? "Close" : "關上";
    const closeDex = () => {
        root.classList.add("hidden");
        onClose?.();
    };
    close.addEventListener("click", closeDex);
    root.appendChild(close);

    // Esc 可關閉圖鑑（鍵盤流完整）
    const onKeydown = (/** @type {KeyboardEvent} */ e) => {
        if (e.key === "Escape") closeDex();
    };
    root.addEventListener("keydown", onKeydown);

    return { onSelect };
}

/**
 * 取得圖鑑條目的解鎖狀態。 * @param {any} bundle
 * @param {any} progress
 * @param {string} dinoId
 * @returns {{ unlocked:boolean, condition:string, progressPct:number }}
 */
export function dexUnlockState(bundle, progress, dinoId) {
    return {
        unlocked: checkDexUnlock(bundle, progress, dinoId),
        condition: unlockConditionText(bundle, progress, dinoId, "zh-TW", "child"),
        progressPct: Math.round(dexUnlockProgress(bundle, progress, dinoId) * 100)
    };
}

/**
 * 取得恐龍在圖鑑中的名稱。
 * @param {any} bundle
 * @param {string} locale
 * @param {string} dinoId
 */
export function dexName(bundle, locale, dinoId) {
    const entry = bundle?.dex?.find((/** @type {any} */ d) => d.id === dinoId);
    if (entry) return entry.name?.[locale] || entry.name?.["zh-TW"] || dinoId;
    return itemLabel(bundle, locale, dinoId, "dinos");
}

/**
 * 顯示圖鑑載入骨架（Loading 狀態）。
 *
 * @param {HTMLElement} root
 * @param {number} [count] 骨架數量
 */
export function showDexSkeleton(root, count = 8) {
    if (!root) return;
    const n = Math.max(1, Math.min(count, DEX_PAGE_SIZE));
    let out = '<div class="dex-grid dex-grid--loading" aria-hidden="true">';
    for (let i = 0; i < n; i++) {
        out += '<div class="dex-entry dex-entry--skeleton"></div>';
    }
    out += "</div>";
    root.innerHTML = out;
}
