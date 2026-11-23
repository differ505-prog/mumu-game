/**
 * 隊伍列 — 讓收集成果在遊戲中看得見。
 *
 * 規範（Step 124）：
 * - 由 `progress.unlockedDex` 驅動。
 * - 已解鎖 → 彩色縮圖；未解鎖 → **剪影**（同一 SVG 以 CSS filter 轉為剪影）。
 * - **不顯示未解鎖的數量**（避免孩子看到大量灰色而挫敗）。
 * - 隊伍列不得顯示任何評量構件（正確率／掌握度／雷達圖）。
 * - 不得引入圖片檔（沿用同一份 SVG，不增加離線體積）。
 */

/**
 * 渲染隊伍列。
 *
 * @param {HTMLElement} root
 * @param {any} bundle
 * @param {any} progress
 * @param {string} locale
 * @param {string[]} [justUnlocked] 本次新解鎖的 id（會播放走入動畫）
 */
export function renderTeamDock(root, bundle, progress, locale, justUnlocked = []) {
    if (!root) return;

    const dex = bundle?.dex || [];
    const unlocked = new Set(progress?.unlockedDex || []);
    const fresh = new Set(justUnlocked);

    // 只顯示已解鎖者（不顯示未解鎖的數量，也不顯示灰色剪影佔位）
    const members = dex.filter((/** @type {any} */ d) => unlocked.has(d.id));

    if (!members.length) {
        root.innerHTML = "";
        root.classList.add("is-empty");
        return;
    }
    root.classList.remove("is-empty");

    root.innerHTML = members.map((/** @type {any} */ d) => {
        const name = d.name?.[locale] || d.name?.["zh-TW"] || d.id;
        const isFresh = fresh.has(d.id);
        return `
            <div class="team-member ${isFresh ? "team-member--entering" : ""}"
                 data-team-id="${d.id}"
                 title="${name}"
                 aria-label="${name}">
                <img class="team-member__art"
                     src="./assets/characters/${d.id}.svg"
                     alt="${name}"
                     loading="lazy" />
            </div>
        `;
    }).join("");

    // 新解鎖者「走出來」
    for (const id of fresh) {
        const el = /** @type {HTMLElement|null} */ (root.querySelector(`[data-team-id="${id}"]`));
        if (!el) continue;
        el.classList.remove("team-member--entering");
        // 強制 reflow 以便重啟動畫
        void el.offsetWidth;
        el.classList.add("team-member--entering");
    }
}
