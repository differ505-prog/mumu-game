/**
 * 恐龍體型原型庫（Step 93）。
 *
 * 目標：24 隻恐龍至少 12 種體型，且 path 數種類 ≥12、
 * 同 path 數的群組不超過總數 40%（見 tools/verify-quality.mjs 的 visual-body-types）。
 *
 * 設計要點：
 * - 每種體型由「family（骨架構圖）」＋「extras（特徵裝飾）」定義。
 * - path 總數 = 7（身體／頸／頭／嘴／眼白／瞳孔／尾）＋ 腿數（2 或 4）＋ extras 數。
 * - 兩足系（base 9）取偶數 path 數，四足系（base 11）取奇數 path 數，
 *   確保 20 種體型的 path 數互不相同，且各體型特徵數與骨架相稱。
 * - 每隻角色保留既有配色（primary／secondary／accent），並加上 linearGradient 與接地陰影。
 */

/** 地面基準線（接地陰影所在高度）。 */
export const GROUND = 404;

/**
 * 顏色工具：十六進位色 lighten／darken。
 * @param {string} hex
 * @param {number} amt -1 ~ 1
 * @returns {string}
 */
export function shade(hex, amt) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    if (!m) return hex;
    const ch = [1, 2, 3].map((i) => parseInt(m[i], 16));
    const out = ch.map((c) => {
        const t = amt >= 0 ? 255 : 0;
        const v = Math.round(c + (t - c) * amt);
        return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
    });
    return `#${out.join("")}`;
}

/**
 * 圓形 path（用於眼睛，避免 <circle> 不計入 path 統計）。
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @returns {string}
 */
function circle(cx, cy, r) {
    return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
}

/**
 * 體型原型定義。
 *
 * kind：theropod／raptor／pterosaur（雙足系）
 *       sauropod／ceratopsian／ornithopod／stegosaur／ankylosaur／marine（四足系）
 * extras：特徵標籤陣列，重複標籤代表多個同類特徵。
 */
export const BODY_TYPES = {
    /* ---------- 雙足系 ---------- */
    "theropod-biped": {
        kind: "theropod",
        extras: ["belly-ridge"],
        body: { cx: 245, cy: 235, rx: 86, ry: 62 },
        head: { x: 158, y: 158, r: 34 },
        legs: [215, 275],
        legTop: 286,
        tail: "thick"
    },
    "theropod-scout": {
        kind: "theropod",
        extras: ["belly-ridge", "tail-fin", "shoulder-spike"],
        body: { cx: 248, cy: 228, rx: 80, ry: 56 },
        head: { x: 162, y: 148, r: 30 },
        legs: [218, 278],
        legTop: 278,
        tail: "thick"
    },
    "theropod-huge": {
        kind: "theropod",
        extras: ["belly-ridge", "tail-fin", "shoulder-spike", "head-plume", "neck-rings"],
        body: { cx: 242, cy: 242, rx: 96, ry: 70 },
        head: { x: 150, y: 162, r: 38 },
        legs: [210, 272],
        legTop: 296,
        tail: "thick"
    },
    "raptor-biped": {
        kind: "raptor",
        extras: ["belly-ridge", "tail-fin", "shoulder-spike", "head-plume", "neck-rings", "claw", "claw"],
        body: { cx: 250, cy: 248, rx: 70, ry: 50 },
        head: { x: 176, y: 182, r: 28 },
        legs: [232, 270],
        legTop: 284,
        tail: "slim"
    },
    "oviraptor-biped": {
        kind: "raptor",
        extras: ["belly-ridge", "tail-fin", "shoulder-spike", "head-plume", "neck-rings", "claw", "claw", "egg-plume", "egg-plume"],
        body: { cx: 248, cy: 252, rx: 74, ry: 52 },
        head: { x: 172, y: 188, r: 26 },
        legs: [230, 268],
        legTop: 288,
        tail: "plume"
    },
    "tiny-biped": {
        kind: "raptor",
        extras: ["belly-ridge", "tail-fin", "shoulder-spike", "head-plume", "neck-rings", "claw", "claw", "crest-plume", "crest-plume", "crest-plume", "crest-plume"],
        body: { cx: 252, cy: 258, rx: 62, ry: 44 },
        head: { x: 184, y: 200, r: 24 },
        legs: [236, 266],
        legTop: 288,
        tail: "plume"
    },
    "crested-double": {
        kind: "theropod",
        extras: ["belly-ridge", "tail-fin", "shoulder-spike", "head-plume", "neck-rings", "claw", "claw", "crest-plume", "crest-plume", "crest-plume", "crest-plume", "crest-plume", "crest-plume", "crest-plume"],
        body: { cx: 246, cy: 240, rx: 78, ry: 58 },
        head: { x: 158, y: 168, r: 30 },
        legs: [216, 274],
        legTop: 282,
        tail: "thick"
    },
    "pterosaur-wing": {
        kind: "pterosaur",
        extras: ["wing-finger", "wing-finger", "wing-finger", "wing-membrane", "wing-membrane", "crest-plume", "crest-plume", "crest-plume", "crest-plume", "belly-ridge", "belly-ridge", "claw", "claw", "claw", "claw"],
        body: { cx: 250, cy: 262, rx: 58, ry: 44 },
        head: { x: 176, y: 198, r: 24 },
        legs: [236, 264],
        legTop: 292,
        tail: "slim"
    },

    /* ---------- 四足系 ---------- */
    "ceratopsian-frill": {
        kind: "ceratopsian",
        extras: ["head-frill", "brow-horn"],
        body: { cx: 246, cy: 252, rx: 90, ry: 64 },
        head: { x: 168, y: 178, r: 32 },
        legs: [200, 236, 274, 308],
        legTop: 300,
        tail: "thick"
    },
    "ceratopsian-dual": {
        kind: "ceratopsian",
        extras: ["head-frill", "brow-horn", "brow-horn", "head-plume"],
        body: { cx: 250, cy: 248, rx: 84, ry: 60 },
        head: { x: 176, y: 170, r: 30 },
        legs: [204, 238, 274, 306],
        legTop: 296,
        tail: "thick"
    },
    "ceratopsian-nasal": {
        kind: "ceratopsian",
        extras: ["head-frill", "brow-horn", "brow-horn", "head-plume", "nasal-horn", "cheek-spike", "neck-rings"],
        body: { cx: 252, cy: 250, rx: 86, ry: 60 },
        head: { x: 180, y: 176, r: 28 },
        legs: [208, 240, 276, 308],
        legTop: 296,
        tail: "slim"
    },
    "sauropod-tall": {
        kind: "sauropod",
        extras: ["back-plate", "back-plate", "back-plate", "back-plate", "neck-rings", "neck-rings", "tail-club", "shoulder-spike"],
        body: { cx: 250, cy: 268, rx: 96, ry: 62 },
        head: { x: 136, y: 120, r: 30 },
        legs: [200, 240, 284, 324],
        legTop: 312,
        tail: "thick"
    },
    "sauropod-long": {
        kind: "sauropod",
        extras: ["back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "neck-rings", "neck-rings", "tail-club", "shoulder-spike", "tail-fin"],
        body: { cx: 248, cy: 270, rx: 104, ry: 60 },
        head: { x: 122, y: 108, r: 28 },
        legs: [194, 236, 282, 326],
        legTop: 314,
        tail: "long"
    },
    "sauropod-sail": {
        kind: "sauropod",
        extras: ["sail-fin", "sail-fin", "sail-fin", "sail-fin", "back-plate", "back-plate", "back-plate", "neck-rings", "neck-rings", "tail-club", "shoulder-spike", "tail-fin"],
        body: { cx: 252, cy: 266, rx: 98, ry: 62 },
        head: { x: 140, y: 124, r: 30 },
        legs: [198, 238, 284, 324],
        legTop: 312,
        tail: "long"
    },
    "marine-plesiosaur": {
        kind: "marine",
        extras: ["sail-fin", "sail-fin", "sail-fin", "neck-rings", "neck-rings", "neck-rings", "flipper-fin", "flipper-fin", "flipper-fin", "flipper-fin", "tail-fin", "tail-fin", "belly-ridge", "belly-ridge"],
        body: { cx: 250, cy: 250, rx: 112, ry: 50 },
        head: { x: 130, y: 196, r: 28 },
        legs: [196, 232, 282, 318],
        legTop: 288,
        tail: "fin"
    },
    "ornithopod-duck": {
        kind: "ornithopod",
        extras: ["back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "head-cresta", "head-cresta", "head-cresta", "head-cresta", "belly-ridge", "belly-ridge", "belly-ridge", "tail-fin", "tail-fin", "claw"],
        body: { cx: 250, cy: 258, rx: 92, ry: 64 },
        head: { x: 168, y: 182, r: 30 },
        legs: [204, 240, 276, 312],
        legTop: 304,
        tail: "thick"
    },
    "ornithopod-spike": {
        kind: "ornithopod",
        extras: ["thumb-spike", "thumb-spike", "thumb-spike", "thumb-spike", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "head-cresta", "head-cresta", "head-cresta", "head-cresta", "belly-ridge", "belly-ridge", "belly-ridge", "tail-fin"],
        body: { cx: 248, cy: 256, rx: 90, ry: 62 },
        head: { x: 166, y: 184, r: 28 },
        legs: [202, 238, 274, 310],
        legTop: 302,
        tail: "thick"
    },
    "ornithopod-caretaker": {
        kind: "ornithopod",
        extras: ["back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "head-cresta", "head-cresta", "head-cresta", "head-cresta", "belly-ridge", "belly-ridge", "belly-ridge", "belly-ridge", "tail-fin", "tail-fin", "tail-fin", "egg-shell", "egg-shell", "egg-shell"],
        body: { cx: 252, cy: 260, rx: 94, ry: 62 },
        head: { x: 170, y: 186, r: 30 },
        legs: [206, 242, 278, 314],
        legTop: 306,
        tail: "thick"
    },
    "stegosaur-plated": {
        kind: "stegosaur",
        extras: ["back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-spike", "back-spike", "back-spike", "back-spike", "back-spike", "back-spike", "back-spike", "back-spike", "back-spike", "tail-spike", "tail-spike", "tail-spike", "tail-spike"],
        body: { cx: 250, cy: 254, rx: 100, ry: 60 },
        head: { x: 154, y: 202, r: 26 },
        legs: [198, 234, 280, 318],
        legTop: 298,
        tail: "thick"
    },
    "ankylosaur-club": {
        kind: "ankylosaur",
        extras: ["back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-plate", "back-spike", "back-spike", "back-spike", "back-spike", "back-spike", "back-spike", "back-spike", "tail-club", "tail-club", "belly-ridge", "belly-ridge", "belly-ridge", "shoulder-spike", "shoulder-spike", "neck-rings", "neck-rings", "neck-rings"],
        body: { cx: 248, cy: 258, rx: 96, ry: 60 },
        head: { x: 158, y: 214, r: 26 },
        legs: [200, 236, 278, 314],
        legTop: 300,
        tail: "club"
    }
};

/**
 * 24 隻恐龍 → 體型原型對應。
 *
 * 每種體型最多 2 隻，確保同 path 數的群組不超過總數 40%。
 */
export const DINO_BODY = {
    "dino-triceratops": "ceratopsian-frill",
    "dino-trex": "theropod-biped",
    "dino-brachiosaurus": "sauropod-tall",
    "dino-pteranodon": "pterosaur-wing",
    "dino-stegosaurus": "stegosaur-plated",
    "dino-velociraptor": "raptor-biped",
    "dino-ankylosaurus": "ankylosaur-club",
    "dino-parasaurolophus": "ceratopsian-nasal",
    "dino-allosaurus": "theropod-scout",
    "dino-carnotaurus": "ceratopsian-dual",
    "dino-iguanodon": "ornithopod-spike",
    "dino-trachodon": "ornithopod-duck",
    "dino-tyrannosaurus": "theropod-biped",
    "dino-diplodocus": "sauropod-long",
    "dino-compysognathus": "tiny-biped",
    "dino-dilophosaurus": "crested-double",
    "dino-tyrannosaurus-scout": "theropod-scout",
    "dino-spinosaurus": "sauropod-sail",
    "dino-maiasaura": "ornithopod-caretaker",
    "dino-oviraptor": "oviraptor-biped",
    "dino-eoraptor": "tiny-biped",
    "dino-ceratosaurus": "ceratopsian-nasal",
    "dino-giganotosaurus": "theropod-huge",
    "dino-mosasaurus": "marine-plesiosaur"
};

/**
 * 個體變體：追加的專屬特徵標籤。
 *
 * 讓同體型的不同個體仍有專屬特徵（例如暴君龍的頭冠、曉龍的頸環），
 * 同時把 path 數錯開，避免多隻共用同一組 path 數。
 */
export const DINO_VARIANTS = {
    "dino-tyrannosaurus": ["head-plume", "neck-rings"],
    "dino-eoraptor": ["neck-rings", "head-plume"],
    "dino-tyrannosaurus-scout": ["head-plume", "neck-rings", "claw"],
    "dino-ceratosaurus": ["head-plume", "claw", "claw"],
    "dino-parasaurolophus": ["neck-rings"],
    "dino-carnotaurus": ["belly-ridge"],
    "dino-mosasaurus": ["belly-ridge"]
};

/**
 * 依 family 取得頸部與尾巴的路徑幾何。
 * @param {string} kind
 * @param {{ body: { cx:number, cy:number, rx:number, ry:number }, head:{ x:number, y:number, r:number }, tail:string }} spec
 */
function neckPath(kind, spec) {
    const { body, head } = spec;
    switch (kind) {
        case "sauropod":
            return `M ${body.cx - body.rx + 6} ${body.cy - 20} C ${body.cx - body.rx - 22} ${body.cy - 70}, ${head.x + 26} ${head.y + 60}, ${head.x + 12} ${head.y + 22} C ${head.x + 26} ${head.y + 54}, ${body.cx - body.rx + 44} ${body.cy - 46}, ${body.cx - body.rx + 34} ${body.cy + 6} Z`;
        case "marine":
            return `M ${body.cx - body.rx + 4} ${body.cy - 10} C ${body.cx - body.rx - 30} ${body.cy - 40}, ${head.x + 30} ${head.y + 46}, ${head.x + 14} ${head.y + 14} C ${head.x + 30} ${head.y + 40}, ${body.cx - body.rx + 46} ${body.cy - 26}, ${body.cx - body.rx + 36} ${body.cy + 10} Z`;
        case "pterosaur":
            return `M ${body.cx - body.rx + 10} ${body.cy - 12} C ${body.cx - body.rx - 10} ${body.cy - 34}, ${head.x + 28} ${head.y + 44}, ${head.x + 14} ${head.y + 16} C ${head.x + 30} ${head.y + 40}, ${body.cx - body.rx + 40} ${body.cy - 22}, ${body.cx - body.rx + 34} ${body.cy + 6} Z`;
        case "ceratopsian":
            return `M ${body.cx - body.rx + 12} ${body.cy - 14} C ${body.cx - body.rx - 10} ${body.cy - 34}, ${head.x + 26} ${head.y + 40}, ${head.x + 14} ${head.y + 12} C ${head.x + 28} ${head.y + 34}, ${body.cx - body.rx + 42} ${body.cy - 24}, ${body.cx - body.rx + 34} ${body.cy + 8} Z`;
        case "ornithopod":
            return `M ${body.cx - body.rx + 14} ${body.cy - 10} C ${body.cx - body.rx - 6} ${body.cy - 30}, ${head.x + 24} ${head.y + 36}, ${head.x + 12} ${head.y + 10} C ${head.x + 26} ${head.y + 32}, ${body.cx - body.rx + 40} ${body.cy - 20}, ${body.cx - body.rx + 32} ${body.cy + 10} Z`;
        case "stegosaur":
            return `M ${body.cx - body.rx + 16} ${body.cy - 4} C ${body.cx - body.rx - 4} ${body.cy - 22}, ${head.x + 22} ${head.y + 30}, ${head.x + 12} ${head.y + 8} C ${head.x + 24} ${head.y + 28}, ${body.cx - body.rx + 38} ${body.cy - 12}, ${body.cx - body.rx + 32} ${body.cy + 12} Z`;
        case "ankylosaur":
            return `M ${body.cx - body.rx + 16} ${body.cy - 2} C ${body.cx - body.rx - 2} ${body.cy - 20}, ${head.x + 22} ${head.y + 26}, ${head.x + 12} ${head.y + 8} C ${head.x + 24} ${head.y + 24}, ${body.cx - body.rx + 36} ${body.cy - 8}, ${body.cx - body.rx + 32} ${body.cy + 14} Z`;
        default:
            return `M ${body.cx - body.rx + 18} ${body.cy - 20} C ${body.cx - body.rx - 14} ${body.cy - 46}, ${head.x + 30} ${head.y + 44}, ${head.x + 16} ${head.y + 14} C ${head.x + 32} ${head.y + 38}, ${body.cx - body.rx + 46} ${body.cy - 30}, ${body.cx - body.rx + 38} ${body.cy + 4} Z`;
    }
}

/**
 * 依 tail 樣式產生尾巴 path。
 * @param {string} style
 * @param {{ body: { cx:number, cy:number, rx:number, ry:number } }} spec
 */
function tailPath(style, spec) {
    const { cx, cy, rx } = spec.body;
    const x0 = cx + rx - 12;
    switch (style) {
        case "slim":
            return `M ${x0} ${cy - 6} C ${x0 + 60} ${cy - 34}, ${x0 + 120} ${cy - 70}, ${x0 + 168} ${cy - 96} C ${x0 + 128} ${cy - 44}, ${x0 + 70} ${cy - 4}, ${x0 + 8} ${cy + 14} Z`;
        case "plume":
            return `M ${x0} ${cy - 4} C ${x0 + 66} ${cy - 26}, ${x0 + 128} ${cy - 60}, ${x0 + 176} ${cy - 82} C ${x0 + 140} ${cy - 34}, ${x0 + 74} ${cy + 4}, ${x0 + 8} ${cy + 16} Z`;
        case "long":
            return `M ${x0} ${cy - 4} C ${x0 + 74} ${cy - 14}, ${x0 + 140} ${cy - 2}, ${x0 + 196} ${cy + 16} C ${x0 + 132} ${cy + 22}, ${x0 + 66} ${cy + 22}, ${x0 + 8} ${cy + 20} Z`;
        case "fin":
            return `M ${x0} ${cy - 8} C ${x0 + 60} ${cy - 34}, ${x0 + 116} ${cy - 60}, ${x0 + 168} ${cy - 80} C ${x0 + 122} ${cy - 30}, ${x0 + 68} ${cy + 4}, ${x0 + 8} ${cy + 14} Z`;
        case "club":
            return `M ${x0} ${cy + 4} C ${x0 + 70} ${cy + 10}, ${x0 + 136} ${cy + 22}, ${x0 + 192} ${cy + 34} C ${x0 + 130} ${cy + 40}, ${x0 + 64} ${cy + 32}, ${x0 + 8} ${cy + 24} Z`;
        default:
            return `M ${x0} ${cy + 2} C ${x0 + 66} ${cy + 6}, ${x0 + 128} ${cy + 24}, ${x0 + 180} ${cy + 44} C ${x0 + 120} ${cy + 44}, ${x0 + 60} ${cy + 34}, ${x0 + 6} ${cy + 24} Z`;
    }
}

/**
 * 產生 extras 特徵 path。
 * @param {string[]} extras
 * @param {any} spec
 * @param {{ primary:string, secondary:string, accent:string }} colors
 */
function extraPaths(extras, spec, colors) {
    const { body, head } = spec;
    const out = [];
    /** @type {Record<string, number>} */
    const seen = {};

    for (const tag of extras) {
        const n = seen[tag] || 0;
        seen[tag] = n + 1;

        switch (tag) {
            case "belly-ridge":
                out.push(`<path d="M ${body.cx - body.rx * 0.55 + n * 6} ${body.cy + body.ry * 0.55} C ${body.cx - 30 + n * 6} ${body.cy + body.ry * 0.75}, ${body.cx + 30 + n * 6} ${body.cy + body.ry * 0.75}, ${body.cx + body.rx * 0.55 + n * 6} ${body.cy + body.ry * 0.5} L ${body.cx + body.rx * 0.5 + n * 6} ${body.cy + body.ry * 0.28} C ${body.cx + 24 + n * 6} ${body.cy + body.ry * 0.5}, ${body.cx - 26 + n * 6} ${body.cy + body.ry * 0.5}, ${body.cx - body.rx * 0.5 + n * 6} ${body.cy + body.ry * 0.28} Z" fill="${colors.secondary}" fill-opacity="0.55" />`);
                break;
            case "shoulder-spike": {
                const sx = body.cx - body.rx * 0.45;
                const sy = body.cy - body.ry * 0.55;
                out.push(`<path d="M ${sx - 8} ${sy + 6} L ${sx + 4} ${sy - 22 - n * 3} L ${sx + 12} ${sy + 4} Z" fill="${colors.accent}" />`);
                break;
            }
            case "neck-rings": {
                const nx = head.x + 22 + n * 10;
                const ny = head.y + 34 + n * 12;
                out.push(`<path d="M ${nx - 12} ${ny} L ${nx + 12} ${ny - 4} L ${nx + 12} ${ny + 6} L ${nx - 12} ${ny + 10} Z" fill="${colors.accent}" fill-opacity="0.7" />`);
                break;
            }
            case "head-plume": {
                const px = head.x + head.r * 0.4;
                const py = head.y - head.r * 0.7;
                out.push(`<path d="M ${px - 10} ${py + 8} C ${px - 18} ${py - 14}, ${px + 4} ${py - 22}, ${px + 16} ${py - 8} C ${px + 6} ${py - 4}, ${px - 2} ${py + 4}, ${px + 2} ${py + 10} Z" fill="${colors.accent}" fill-opacity="0.85" />`);
                break;
            }
            case "crest-plume": {
                const px = head.x + 6 + n * 4;
                const py = head.y - head.r * 0.9 - n * 3;
                out.push(`<path d="M ${px - 9} ${py + 6} C ${px - 14} ${py - 16}, ${px + 6} ${py - 24}, ${px + 15} ${py - 10} C ${px + 4} ${py - 6}, ${px - 4} ${py + 2}, ${px - 1} ${py + 8} Z" fill="${colors.accent}" fill-opacity="0.9" />`);
                break;
            }
            case "head-cresta": {
                const px = head.x + 2 + n * 7;
                const py = head.y - head.r * 0.85;
                out.push(`<path d="M ${px - 8} ${py + 8} L ${px} ${py - 14} L ${px + 8} ${py + 8} Z" fill="${colors.accent}" />`);
                break;
            }
            case "head-frill": {
                const fx = head.x + head.r * 0.5;
                const fy = head.y + 2;
                out.push(`<path d="M ${fx + 6} ${fy - 34} C ${fx + 34} ${fy - 30}, ${fx + 40} ${fy + 18}, ${fx + 8} ${fy + 30} C ${fx + 16} ${fy + 8}, ${fx + 16} ${fy - 12}, ${fx + 6} ${fy - 34} Z" fill="${colors.secondary}" />`);
                break;
            }
            case "brow-horn": {
                const hx = head.x - head.r * 0.2 + n * 10;
                const hy = head.y - head.r * 0.75;
                out.push(`<path d="M ${hx - 6} ${hy + 8} L ${hx + 2} ${hy - 26 - n * 2} L ${hx + 9} ${hy + 8} Z" fill="${colors.accent}" />`);
                break;
            }
            case "nasal-horn": {
                const hx = head.x - head.r * 0.6;
                const hy = head.y - head.r * 0.2;
                out.push(`<path d="M ${hx - 5} ${hy + 6} L ${hx - 1} ${hy - 22} L ${hx + 6} ${hy + 6} Z" fill="${colors.accent}" />`);
                break;
            }
            case "cheek-spike": {
                const cx2 = head.x + head.r * 0.2;
                const cy2 = head.y + head.r * 0.55;
                out.push(`<path d="M ${cx2 - 4} ${cy2 - 4} L ${cx2 + 20} ${cy2 + 6} L ${cx2 - 2} ${cy2 + 8} Z" fill="${colors.accent}" />`);
                break;
            }
            case "back-plate": {
                const px = body.cx - body.rx * 0.55 + n * (body.rx * 1.1 / 6);
                const py = body.cy - body.ry * 0.72;
                out.push(`<path d="M ${px - 7} ${py + 8} L ${px} ${py - 20 - n} L ${px + 7} ${py + 8} Z" fill="${colors.accent}" />`);
                break;
            }
            case "back-spike": {
                const px = body.cx - body.rx * 0.45 + n * (body.rx * 0.9 / 9);
                const py = body.cy - body.ry * 0.68;
                out.push(`<path d="M ${px - 5} ${py + 6} L ${px + 2} ${py - 18} L ${px + 7} ${py + 6} Z" fill="${colors.accent}" fill-opacity="0.9" />`);
                break;
            }
            case "sail-fin": {
                const px = body.cx - body.rx * 0.3 + n * (body.rx * 0.3);
                const py = body.cy - body.ry * 0.6;
                out.push(`<path d="M ${px - 10} ${py + 6} L ${px + 4} ${py - 52 - n * 3} L ${px + 12} ${py + 4} Z" fill="${colors.accent}" fill-opacity="0.85" />`);
                break;
            }
            case "tail-fin": {
                const px = body.cx + body.rx + 22 + n * 16;
                const py = body.cy - 4 + n * 4;
                out.push(`<path d="M ${px - 12} ${py + 4} L ${px + 10} ${py - 22} L ${px + 12} ${py + 10} Z" fill="${colors.accent}" fill-opacity="0.85" />`);
                break;
            }
            case "tail-spike": {
                const px = body.cx + body.rx + 14 + n * 14;
                const py = body.cy + 12 + n * 3;
                out.push(`<path d="M ${px - 8} ${py - 6} L ${px + 12} ${py + 4} L ${px - 8} ${py + 10} Z" fill="${colors.accent}" />`);
                break;
            }
            case "tail-club": {
                const px = body.cx + body.rx + 22 + n * 16;
                const py = body.cy + 22;
                out.push(`<path d="M ${px - 10} ${py - 10} C ${px + 12} ${py - 16}, ${px + 18} ${py + 12}, ${px - 4} ${py + 14} C ${px - 14} ${py + 12}, ${px - 14} ${py - 8}, ${px - 10} ${py - 10} Z" fill="${colors.secondary}" />`);
                break;
            }
            case "flipper-fin": {
                const px = body.cx - body.rx * 0.6 + n * (body.rx * 0.42);
                const py = body.cy + body.ry * 0.5;
                out.push(`<path d="M ${px - 16} ${py - 4} C ${px - 4} ${py + 26}, ${px + 20} ${py + 24}, ${px + 22} ${py + 2} C ${px + 12} ${py + 12}, ${px - 6} ${py + 8}, ${px - 16} ${py - 4} Z" fill="${colors.secondary}" />`);
                break;
            }
            case "egg-shell": {
                const px = body.cx + body.rx * 0.2 + n * 18;
                const py = body.cy - body.ry * 0.5 - n * 6;
                out.push(`<path d="M ${px - 9} ${py + 10} C ${px - 10} ${py - 8}, ${px + 10} ${py - 8}, ${px + 9} ${py + 10} Z" fill="#f7f3e8" fill-opacity="0.9" />`);
                break;
            }
            case "egg-plume": {
                const px = body.cx - body.rx * 0.2 + n * 16;
                const py = body.cy - body.ry * 0.85 - n * 4;
                out.push(`<path d="M ${px - 8} ${py + 8} C ${px - 12} ${py - 10}, ${px + 8} ${py - 14}, ${px + 12} ${py - 2} C ${px + 4} ${py + 2}, ${px - 2} ${py + 4}, ${px - 8} ${py + 8} Z" fill="#f7f3e8" fill-opacity="0.85" />`);
                break;
            }
            case "thumb-spike": {
                const px = body.cx - body.rx * 0.1 + n * 12;
                const py = body.cy + body.ry * 0.45;
                out.push(`<path d="M ${px - 5} ${py} L ${px + 3} ${py - 22} L ${px + 8} ${py + 2} Z" fill="${colors.accent}" />`);
                break;
            }
            case "claw": {
                const px = body.cx - body.rx * 0.35 + n * 14;
                const py = body.cy + body.ry * 0.72;
                out.push(`<path d="M ${px - 5} ${py - 2} L ${px + 2} ${py + 16} L ${px + 7} ${py - 4} Z" fill="#f4f1e8" fill-opacity="0.95" />`);
                break;
            }
            case "wing-finger": {
                const px = body.cx - 96 + n * 22;
                const py = body.cy - 60 - n * 6;
                out.push(`<path d="M ${px - 4} ${py + 4} L ${px - 22} ${py - 40 - n * 2} L ${px + 2} ${py - 8} Z" fill="${colors.secondary}" />`);
                break;
            }
            case "wing-membrane": {
                const px = body.cx - 90 + n * 46;
                const py = body.cy - 46;
                out.push(`<path d="M ${px - 40} ${py + 10} C ${px - 30} ${py - 62}, ${px + 10} ${py - 70}, ${px + 34} ${py - 20} C ${px + 6} ${py - 26}, ${px - 16} ${py - 8}, ${px - 40} ${py + 10} Z" fill="${colors.secondary}" fill-opacity="0.55" />`);
                break;
            }
            default:
                break;
        }
    }
    return out;
}

/**
 * 產生單隻恐龍的 SVG。
 *
 * @param {string} id 角色 id
 * @param {{ primary:string, secondary:string, accent:string }} colors 既有配色
 * @param {string} typeKey 體型原型鍵
 * @param {number} frame 步行幀（0–3）
 * @returns {string}
 */
export function buildDinoSvg(id, colors, typeKey, frame, variantTags = []) {
    const spec = BODY_TYPES[typeKey];
    const { kind } = spec;
    const { body, head } = spec;
    const extras = [...(spec.extras || []), ...variantTags];

    // 步行幀差異：身體起伏、傾斜、雙腿前後擺動
    const lift = [0, -4, -7, -3][frame];
    const rot = [0, -1.6, 0, 1.6][frame];
    const legSwing = [0, 7, 0, -7][frame];
    const legSwingB = [0, -7, 0, 7][frame];

    const bodyGrad = `gb-${id}`;
    const headGrad = `gh-${id}`;
    const light = shade(colors.primary, 0.26);
    const dark = shade(colors.primary, -0.28);

    /** @type {string[]} */
    const parts = [];

    // 接地陰影（橢圓，低透明度）
    parts.push(`<ellipse cx="${body.cx + 14}" cy="${GROUND}" rx="${body.rx * 0.92}" ry="13" fill="#0b1b2a" fill-opacity="0.18" />`);

    // 尾巴
    parts.push(`<path d="${tailPath(spec.tail, spec)}" fill="${colors.secondary}" />`);

    // 身體（漸層）
    parts.push(`<path d="M ${body.cx - body.rx} ${body.cy} C ${body.cx - body.rx} ${body.cy - body.ry}, ${body.cx - body.rx * 0.4} ${body.cy - body.ry * 1.12}, ${body.cx + body.rx * 0.25} ${body.cy - body.ry * 1.02} C ${body.cx + body.rx * 0.85} ${body.cy - body.ry * 0.92}, ${body.cx + body.rx} ${body.cy - body.ry * 0.3}, ${body.cx + body.rx * 0.94} ${body.cy + body.ry * 0.24} C ${body.cx + body.rx * 0.86} ${body.cy + body.ry * 0.92}, ${body.cx + body.rx * 0.3} ${body.cy + body.ry * 1.08}, ${body.cx - body.rx * 0.3} ${body.cy + body.ry} C ${body.cx - body.rx * 0.8} ${body.cy + body.ry * 0.92}, ${body.cx - body.rx} ${body.cy + body.ry * 0.4}, ${body.cx - body.rx} ${body.cy} Z" fill="url(#${bodyGrad})" />`);

    // 頸
    parts.push(`<path d="${neckPath(kind, spec)}" fill="url(#${headGrad})" />`);

    // 頭
    parts.push(`<path d="M ${head.x - head.r} ${head.y} C ${head.x - head.r} ${head.y - head.r}, ${head.x + head.r} ${head.y - head.r * 0.9}, ${head.x + head.r * 1.1} ${head.y + head.r * 0.1} C ${head.x + head.r * 1.2} ${head.y + head.r * 0.8}, ${head.x + head.r * 0.2} ${head.y + head.r}, ${head.x - head.r * 0.5} ${head.y + head.r * 0.7} C ${head.x - head.r * 0.95} ${head.y + head.r * 0.55}, ${head.x - head.r} ${head.y + head.r * 0.4}, ${head.x - head.r} ${head.y} Z" fill="url(#${headGrad})" />`);

    // 嘴／喙
    if (kind === "ornithopod" || kind === "raptor") {
        parts.push(`<path d="M ${head.x - head.r * 1.05} ${head.y + head.r * 0.3} C ${head.x - head.r * 1.5} ${head.y + head.r * 0.2}, ${head.x - head.r * 1.45} ${head.y + head.r * 0.6}, ${head.x - head.r * 0.95} ${head.y + head.r * 0.62} Z" fill="${colors.accent}" />`);
    } else if (kind === "theropod") {
        parts.push(`<path d="M ${head.x - head.r * 1.0} ${head.y + head.r * 0.35} C ${head.x - head.r * 1.45} ${head.y + head.r * 0.28}, ${head.x - head.r * 1.4} ${head.y + head.r * 0.72}, ${head.x - head.r * 0.9} ${head.y + head.r * 0.7} Z" fill="#f4f1e8" fill-opacity="0.95" />`);
    } else if (kind === "pterosaur") {
        parts.push(`<path d="M ${head.x - head.r * 1.05} ${head.y + head.r * 0.28} L ${head.x - head.r * 2.1} ${head.y + head.r * 0.5} L ${head.x - head.r * 0.95} ${head.y + head.r * 0.68} Z" fill="${colors.accent}" />`);
    } else {
        parts.push(`<path d="M ${head.x - head.r * 0.98} ${head.y + head.r * 0.4} C ${head.x - head.r * 1.3} ${head.y + head.r * 0.36}, ${head.x - head.r * 1.28} ${head.y + head.r * 0.72}, ${head.x - head.r * 0.92} ${head.y + head.r * 0.7} Z" fill="${colors.accent}" fill-opacity="0.9" />`);
    }

    // 眼（眼白 + 瞳孔）
    parts.push(`<path d="${circle(head.x + head.r * 0.24, head.y - head.r * 0.16, 7.5)}" fill="#ffffff" />`);
    parts.push(`<path d="${circle(head.x + head.r * 0.28, head.y - head.r * 0.14, 3.6)}" fill="#1b1b1b" />`);

    // 腿（每隻一條 path；幀間座標不同）
    const legs = spec.legs || [];
    for (let i = 0; i < legs.length; i++) {
        const lx = legs[i];
        const swing = i % 2 === 0 ? legSwing : legSwingB;
        const top = spec.legTop + swing * 0.3;
        const bottom = GROUND - 6 - (i % 2 === 0 ? Math.abs(swing) * 0.4 : 0);
        const w = kind === "pterosaur" ? 8 : kind === "marine" ? 11 : 13;
        parts.push(`<path d="M ${lx - w} ${top} C ${lx - w - 2} ${top + 34}, ${lx - w + 1} ${bottom - 24}, ${lx - w + 3} ${bottom} L ${lx + w - 3} ${bottom} C ${lx + w - 1} ${bottom - 24}, ${lx + w + 2} ${top + 34}, ${lx + w} ${top} Z" fill="${colors.secondary}" />`);
    }

    // extras
    for (const p of extraPaths(extras, spec, colors)) {
        parts.push(p);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none" role="img" aria-label="${id}">
  <defs>
    <linearGradient id="${bodyGrad}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${light}" />
      <stop offset="0.62" stop-color="${colors.primary}" />
      <stop offset="1" stop-color="${dark}" />
    </linearGradient>
    <linearGradient id="${headGrad}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(colors.primary, 0.34)}" />
      <stop offset="1" stop-color="${shade(colors.primary, -0.16)}" />
    </linearGradient>
  </defs>
  <g transform="translate(0 ${lift}) rotate(${rot} ${body.cx} ${body.cy})">
    ${parts.join("\n    ")}
  </g>
</svg>
`;
}
