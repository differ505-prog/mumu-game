/**
 * 演出層 — 把場景、角色與事件組成可執行的舞台指示。
 *
 * 這是讓素材從「零件」變成「機器」的關鍵一步：
 * 24 隻角色 × 6 個場景 × 關卡事件 → 可執行的舞台。
 *
 * 規範：
 * - **不得**使用 `Math.random()` 決定台詞（同一場景同一角色固定同一句）。
 * - 卡司渲染到 `#scene` 的 `data-layer="character"` 層，
 *   與 `#santa-container`（主角／搭檔）**分開渲染**。
 */

/**
 * @typedef {{ id:string, role:{ "zh-TW":string, "en-US":string }, entrance:string, props:string[] }} CastMember
 */

/**
 * @typedef {Object} Performance
 * @property {string} id
 * @property {{ "zh-TW":string, "en-US":string }} title
 * @property {CastMember[]} cast
 * @property {string} ambience
 * @property {string} backdrop
 */

/** 演出資料（content/performances.json）。 @type {Record<string, Performance>} */
let performances = {};

/** 敘事對白（narrative.*.json），供 lineFor() 使用。 @type {any} */
let narrative = null;

/**
 * 注入演出資料。
 * @param {any} data
 */
export function loadPerformances(data) {
    performances = data || {};
}

/**
 * 注入敘事對白。
 * @param {any} data
 */
export function loadNarrative(data) {
    narrative = data || null;
}

/**
 * 取得該場景的卡司。
 * @param {string} sceneId
 * @returns {CastMember[]}
 */
export function castFor(sceneId) {
    return performances?.[sceneId]?.cast || [];
}

/**
 * 依 entrance 排出登場順序（left → right → center）。
 * @param {string} sceneId
 * @returns {CastMember[]}
 */
export function entranceOrder(sceneId) {
    const order = { left: 0, right: 1, center: 2 };
    return [...castFor(sceneId)].sort(
        (a, b) => (order[a.entrance] ?? 3) - (order[b.entrance] ?? 3)
    );
}

/**
 * 取得某事件的舞台指示。
 *
 * @param {string} sceneId
 * @param {string} event 事件名（如 "level:start"、"level:complete"）
 * @returns {{ ambience:string, backdrop:string, title:string, entrance:string[] }}
 */
export function directiveFor(sceneId, event) {
    const perf = performances?.[sceneId];
    const cast = entranceOrder(sceneId);
    return {
        ambience: perf?.ambience || "",
        backdrop: perf?.backdrop || "",
        title: perf?.title?.["zh-TW"] || perf?.title?.["en-US"] || "",
        // 事件決定誰站上舞台中央
        entrance: event === "level:complete"
            ? cast.map((c) => c.id)
            : cast.slice(0, 2).map((c) => c.id)
    };
}

/**
 * 取得某角色在該場景的台詞。
 *
 * 讀 `narrative.*.json` 的 `dinoLines[dinoId]`（陣列），
 * 依 `sceneId` 與 `dinoId` 產生**穩定**的挑選（同一場景同一角色固定同一句）。
 *
 * @param {string} sceneId
 * @param {string} dinoId
 * @param {string} locale
 * @returns {string}
 */
export function lineFor(sceneId, dinoId, locale) {
    const lines = narrative?.dinoLines?.[dinoId];
    if (!Array.isArray(lines) || !lines.length) return "";

    // 穩定索引：以場景與角色 id 的字元碼和決定
    let hash = 0;
    const key = `${sceneId}:${dinoId}`;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    const idx = hash % lines.length;

    const line = lines[idx];
    const text = line?.[locale] || line?.["zh-TW"] || "";
    // 取代 {name} 佔位符
    return text.replace(/\{name\}/g, nameOf(dinoId));
}

/**
 * 取得角色名稱（雙語皆可）。
 * @param {string} dinoId
 * @returns {string}
 */
function nameOf(dinoId) {
    const names = narrative?.dinoNames || {};
    return names[dinoId]?.["zh-TW"] || names[dinoId]?.["en-US"] || dinoId;
}

/**
 * 把卡司渲染到場景容器。
 *
 * 渲染**多隻**角色到 `#scene` 的 `data-layer="character"` 層，
 * 並依 `entrance` 分配水平位置。
 *
 * @param {string} sceneId
 * @param {HTMLElement} mount 場景容器
 */
export function applySceneCast(sceneId, mount) {
    if (!mount) return;

    const layer = mount.querySelector('[data-layer="character"]');
    if (!layer) return;

    const cast = entranceOrder(sceneId);
    if (!cast.length) {
        layer.innerHTML = "";
        return;
    }

    // 依 entrance 分配水平位置（left／right／center）
    const slot = { left: 0, right: 1, center: 2 };
    const total = cast.length;

    layer.innerHTML = cast.map((member, i) => {
        const position = slot[member.entrance] ?? i % 3;
        const spread = total === 1 ? 50 : 20 + position * (60 / Math.max(1, total - 1));
        const left = Math.min(88, Math.max(6, spread));
        const scale = 0.62 + position * 0.06;
        const art = `./assets/characters/${member.id}.svg`;

        return `
            <div class="cast-member"
                 data-cast-id="${member.id}"
                 data-entrance="${member.entrance}"
                 style="--cast-left:${left}%; --cast-scale:${scale}">
                <img class="cast-member__art" src="${art}" alt="" loading="lazy" />
            </div>
        `;
    }).join("");
}
