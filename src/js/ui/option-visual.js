/**
 * 選項視覺描述（Z4：答案鈕與視覺圖卡 1:1 視覺配對）。
 *
 * 舊實作有兩個獨立且互不知情的來源：
 *   1. 答案鈕（main.js）以**索引**取 OPTION_GLYPHS[i % n] —— 因此
 *      「羊」可能配上雪花、「鳥」可能配上禮物盒，與題意完全無關。
 *   2. 視覺圖卡（a11y.js）另走一套渲染，只顯示序號 + 文字／圖片。
 *
 * 兩者對同一題會畫出不同的東西，幼兒無法把「看到的圖」對到「該按的鈕」。
 *
 * 本模組是**唯一事實來源**：
 *   - 序號（no）、圖片（image）、文字（label）、剪影（glyph）皆由同一個
 *     `describeOptions()` 產生，答案鈕與視覺圖卡共用同一組描述。
 *   - glyph 由**選項 id** 雜湊決定（非索引），因此同一個選項在任何位置、
 *     任何順序下永遠是同一個圖示 —— 配對穩定且不會隨排序漂移。
 *   - 同一回合內若兩個選項雜湊到同一剪影，會以**確定性**方式（依 id 排序
 *     逐一提用空位）指派不同剪影；因指派只依賴「id 集合」而非順序，
 *     答案鈕與視覺圖卡即使收到的陣列順序略有差異也會得到**完全相同**的結果。
 *
 * 零 Emoji 原則：所有圖示皆為內嵌 SVG（currentColor）。
 */

/**
 * 回合選項的自繪 SVG 剪影（W2：零 Emoji 原則）。
 *
 * 3–6 歲幼兒不識字，答案鈕必須有**視覺徽章 + 圖形**才辨識得出差異。
 * 這裡以內嵌 SVG（currentColor）提供 6 種高辨識度剪影。
 *
 * @type {string[]}
 */
export const OPTION_GLYPHS = [
    // ① 恐龍足跡
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-3 0-4 3-4 6 0 2 1 3 1 5s1 4-1 6-3 1-4-1"/><path d="M16 5c2 1 2 3 2 5"/><circle cx="6" cy="16" r="1.6"/><circle cx="18" cy="15" r="1.6"/></svg>',
    // ② 雪花
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4 7l16 10M20 7L4 17"/><path d="M12 6l2.2-2.2M12 6L9.8 3.8M12 18l2.2 2.2M12 18l-2.2 2.2"/></svg>',
    // ③ 禮物
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 12h18M12 8v13"/><path d="M12 8S9.5 8 8.5 6.5 10 3.5 12 8Zm0 0s2.5 0 3.5-1.5S14 3.5 12 8Z"/></svg>',
    // ④ 星星
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.4l5.9-.9z"/></svg>',
    // ⑤ 樹
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l5 7h-3l4 6H6l4-6H7z"/><path d="M12 16v5"/></svg>',
    // ⑥ 波浪（聲音）
    '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h2l2-6 3 12 3-9 2 5 2-3h2"/></svg>'
];

/**
 * 以選項 id 決定穩定的剪影索引。
 *
 * **不得**改用陣列索引 —— 索引會隨選項排序漂移，
 * 造成「同一個選項在不同回合變成不同圖示」的錯亂配對。
 *
 * @param {string} id
 * @returns {number}
 */
export function glyphIndexFor(id) {
    const key = String(id ?? "");
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return hash % OPTION_GLYPHS.length;
}

/**
 * 為一組選項指派**互不重複**的剪影索引。
 *
 * 指派只依賴「id 集合」（依 id 字典序處理），因此與呼叫端收到的
 * 陣列順序無關 —— 答案鈕與視覺圖卡必定得到完全一致的結果。
 *
 * @param {string[]} ids
 * @returns {Map<string, number>}
 */
function assignGlyphs(ids) {
    /** @type {Map<string, number>} */
    const assigned = new Map();
    const used = new Set();

    // 依 id 排序處理，確保指派結果與順序無關（確定性）
    const unique = [...new Set(ids)].sort();

    for (const id of unique) {
        const base = glyphIndexFor(id);
        let slot = base;
        // 已被占用則往後探位（最多繞一圈）
        for (let i = 0; i < OPTION_GLYPHS.length; i++) {
            const candidate = (base + i) % OPTION_GLYPHS.length;
            if (!used.has(candidate)) {
                slot = candidate;
                break;
            }
        }
        used.add(slot);
        assigned.set(id, slot);
    }

    return assigned;
}

/**
 * 選項的統一視覺描述（答案鈕與視覺圖卡共用）。
 *
 * @typedef {{
 *   no: number,
 *   id: string,
 *   image: string,
 *   label: string,
 *   glyph: string,
 *   hasImage: boolean
 * }} OptionView
 */

/**
 * 產生一組選項的統一視覺描述。
 *
 * 答案鈕（main.js）與視覺圖卡（a11y.js）都呼叫本函式，
 * 因此同一題在兩處的序號、圖片與剪影必定**完全一致**。
 *
 * @param {Array<{ id?: unknown, label?: unknown, image?: unknown }>} options
 * @returns {OptionView[]}
 */
export function describeOptions(options) {
    const list = Array.isArray(options) ? options : [];
    const ids = list.map((/** @type {any} */ o, /** @type {number} */ i) => String(o?.id ?? i));
    const glyphMap = assignGlyphs(ids);

    return list.map((/** @type {any} */ o, /** @type {number} */ i) => {
        const id = ids[i];
        const image = typeof o?.image === "string" ? o.image : "";
        const label = typeof o?.label === "string" ? o.label : "";
        return {
            no: i + 1,
            id,
            image,
            label,
            glyph: OPTION_GLYPHS[glyphMap.get(id) ?? glyphIndexFor(id)],
            hasImage: Boolean(image)
        };
    });
}

/**
 * 單一選項的統一視覺描述（相容層）。
 *
 * @param {any} option
 * @param {number} index
 * @returns {OptionView}
 */
export function describeOption(option, index) {
    const [view] = describeOptions([option]);
    if (!view) {
        const id = String(option?.id ?? index);
        return {
            no: index + 1,
            id,
            image: "",
            label: "",
            glyph: OPTION_GLYPHS[glyphIndexFor(id)],
            hasImage: false
        };
    }
    return view;
}
