/**
 * 恐龍圖鑑介面 — 24 格。
 *
 * 規範：未解鎖顯示剪影與**真實學習條件文字**，進度條顯示實際完成度。
 */

import { checkDexUnlock, dexUnlockProgress, unlockConditionText } from "../core/dex.js";
import { itemLabel } from "../data/items.js";

/**
 * 渲染圖鑑。
 * @param {HTMLElement} root
 * @param {any} bundle
 * @param {any} progress
 * @param {string} locale
 */
export function renderDex(root, bundle, progress, locale) {
    const dex = bundle?.dex || [];

    root.innerHTML = `
        <div class="dex-header">
            <h2>${locale === "en-US" ? "Dinosaur Encyclopedia" : "恐龍圖鑑"}</h2>
            <p class="dex-count">
                ${locale === "en-US" ? "Unlocked" : "已解鎖"}
                ${(progress.unlockedDex || []).length} / ${dex.length}
            </p>
        </div>
        <div class="dex-grid">
            ${dex.map((/** @type {any} */ d) => {
                const unlocked = checkDexUnlock(bundle, progress, d.id);
                const pct = dexUnlockProgress(bundle, progress, d.id);
                const name = d.name?.[locale] || d.name?.["zh-TW"] || d.id;
                const milestone = d.personality?.[locale] || d.personality?.["zh-TW"] || "";
                const condText = unlockConditionText(bundle, progress, d.id, locale);

                return `
                    <div class="dex-entry ${unlocked ? "dex-entry--unlocked" : "dex-entry--locked"}"
                         data-dino="${d.id}" role="button" tabindex="0"
                         aria-label="${name}${unlocked ? "" : "（" + condText + "）"}">
                        <div class="dex-entry__art">
                            <img src="${d.art?.file || ""}" alt="${name}"
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
                        <div class="dex-entry__no">No.${d.dexNo}</div>
                        <div class="dex-entry__name">${unlocked ? name : "???"}</div>
                        <div class="dex-entry__milestone">${unlocked ? milestone : condText}</div>
                        ${unlocked ? "" : `
                            <div class="dex-entry__progress" role="progressbar"
                                 aria-valuenow="${Math.round(pct * 100)}" aria-valuemin="0" aria-valuemax="100">
                                <div class="dex-entry__progress-bar" style="width:${Math.round(pct * 100)}%"></div>
                            </div>
                        `}
                    </div>
                `;
            }).join("")}
        </div>
    `;

    /**
     * 綁定點擊事件。
     * @param {(dinoId:string)=>void} cb
     */
    function onSelect(cb) {
        root.querySelectorAll("[data-dino]").forEach((el) => {
            const id = /** @type {HTMLElement} */ (el).dataset.dino || "";
            const activate = () => cb(id);
            el.addEventListener("click", activate);
            el.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activate();
                }
            });
        });
    }

    return { onSelect };
}

/**
 * 取得圖鑑條目的解鎖狀態。
 * @param {any} bundle
 * @param {any} progress
 * @param {string} dinoId
 * @returns {{ unlocked:boolean, condition:string, progressPct:number }}
 */
export function dexUnlockState(bundle, progress, dinoId) {
    return {
        unlocked: checkDexUnlock(bundle, progress, dinoId),
        condition: unlockConditionText(bundle, progress, dinoId, "zh-TW"),
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
