/**
 * 產生 24 隻恐龍 SVG 素材（含 4 幀步行變體）與 3 隻聖誕季角色。
 *
 * 設計說明：
 * - 全部使用去背向量（512×512 viewBox，透明背景，無底色矩形）。
 * - 每隻恐龍具可辨識特徵（角、頭冠、背板、尾錘、翼膜等）。
 * - 步行變體以腳位與身體高度微幅變化形成 4 幀循環。
 * - 體型多樣化（Step 93）：骨架與特徵由 tools/dino-bodies.mjs 的
 *   BODY_TYPES 原型庫定義，24 隻分屬 20 種體型。
 * - 這些是「佔位美術」：正式素材可由插畫外包替換，替換只換檔案不改程式碼。
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { BODY_TYPES, DINO_BODY, DINO_VARIANTS, buildDinoSvg } from "./dino-bodies.mjs";

/**
 * 輸出報告（避免 console.log 殘留）。
 * @param {...any} args
 */
function out(...args) {
    process.stdout.write(args.map(String).join(" ") + "\n");
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "assets/characters");
mkdirSync(outDir, { recursive: true });

/**
 * 取得角色對應的體型原型鍵。
 * @param {string} id
 * @returns {string}
 */
function bodyTypeFor(id) {
    const key = DINO_BODY[id];
    if (!key) throw new Error(`未定義體型原型：${id}`);
    if (!BODY_TYPES[key]) throw new Error(`體型原型不存在：${key}`);
    return key;
}

/**
 * 產生單隻恐龍的 SVG 內容。
 *
 * 骨架與特徵由 tools/dino-bodies.mjs 的 BODY_TYPES 定義；
 * 每隻角色保留既有配色，並附帶漸層與接地陰影。
 *
 * @param {string} id
 * @param {string} primary
 * @param {string} secondary
 * @param {string} accent
 * @param {number} frame 步行幀（0–3）
 */
function dinoSvg(id, primary, secondary, accent, frame) {
    return buildDinoSvg(
        id,
        { primary, secondary, accent },
        bodyTypeFor(id),
        frame,
        DINO_VARIANTS[id] || []
    );
}

/**
 * 產生聖誕季角色。
 * @param {string} id
 * @param {string} primary
 * @param {string} secondary
 * @param {string} accent
 */
function festiveSvg(id, primary, secondary, accent) {
    if (id === "santa") {
        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none" role="img" aria-label="santa">
  <ellipse cx="256" cy="330" rx="96" ry="104" fill="${primary}" />
  <path d="M162 300 C 200 340 312 340 350 300 L 350 400 C 312 430 200 430 162 400 Z" fill="${secondary}" />
  <circle cx="256" cy="190" r="72" fill="#f6d9c4" />
  <path d="M184 168 C 200 118 312 118 328 168 C 300 148 212 148 184 168 Z" fill="#ffffff" />
  <path d="M176 150 C 196 100 316 100 336 150 C 336 122 300 104 256 104 C 212 104 176 122 176 150 Z" fill="#ffffff" />
  <circle cx="256" cy="96" r="20" fill="#ffffff" />
  <circle cx="228" cy="192" r="7" fill="#1b1b1b" />
  <circle cx="284" cy="192" r="7" fill="#1b1b1b" />
  <ellipse cx="256" cy="228" rx="44" ry="26" fill="#ffffff" />
  <path d="M228 210 C 244 202 268 202 284 210" stroke="${accent}" stroke-width="4" fill="none" stroke-linecap="round" />
  <path d="M150 366 L 362 366 L 362 396 L 150 396 Z" fill="${accent}" />
  <rect x="244" y="352" width="24" height="28" rx="4" fill="#ffffff" />
</svg>
`;
    }
    if (id === "snowman") {
        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none" role="img" aria-label="snowman">
  <circle cx="256" cy="360" r="104" fill="#ecf0f1" />
  <circle cx="256" cy="228" r="76" fill="#f7fbff" />
  <circle cx="256" cy="132" r="54" fill="#ffffff" />
  <circle cx="236" cy="122" r="7" fill="#1b1b1b" />
  <circle cx="276" cy="122" r="7" fill="#1b1b1b" />
  <path d="M256 136 L 286 144 L 256 152 Z" fill="${primary}" />
  <circle cx="256" cy="216" r="7" fill="#1b1b1b" />
  <circle cx="256" cy="244" r="7" fill="#1b1b1b" />
  <circle cx="256" cy="272" r="7" fill="#1b1b1b" />
  <rect x="180" y="296" width="152" height="22" rx="8" fill="${primary}" />
  <path d="M200 96 L 256 76 L 312 96 L 302 108 L 256 92 L 210 108 Z" fill="${primary}" />
  <path d="M212 316 L 300 400" stroke="#795548" stroke-width="14" stroke-linecap="round" />
</svg>
`;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none" role="img" aria-label="reindeer">
  <ellipse cx="256" cy="320" rx="98" ry="82" fill="${primary}" />
  <ellipse cx="256" cy="300" rx="62" ry="52" fill="${secondary}" />
  <circle cx="256" cy="188" r="62" fill="${primary}" />
  <ellipse cx="256" cy="212" rx="34" ry="26" fill="${secondary}" />
  <circle cx="228" cy="176" r="7" fill="#1b1b1b" />
  <circle cx="284" cy="176" r="7" fill="#1b1b1b" />
  <ellipse cx="256" cy="210" rx="12" ry="9" fill="#1b1b1b" />
  <path d="M206 140 C 190 92 206 52 232 44" stroke="${secondary}" stroke-width="11" fill="none" stroke-linecap="round" />
  <path d="M306 140 C 322 92 306 52 280 44" stroke="${secondary}" stroke-width="11" fill="none" stroke-linecap="round" />
  <path d="M220 96 C 238 84 254 92 250 110 C 236 116 224 108 220 96 Z" fill="${accent}" />
  <path d="M292 96 C 274 84 258 92 262 110 C 276 116 288 108 292 96 Z" fill="${accent}" />
  <circle cx="256" cy="60" r="14" fill="${accent}" />
  <path d="M172 316 L 140 400" stroke="${secondary}" stroke-width="16" stroke-linecap="round" />
  <path d="M340 316 L 372 400" stroke="${secondary}" stroke-width="16" stroke-linecap="round" />
</svg>
`;
}

const characters = JSON.parse(readFileSync(join(root, "content/characters.json"), "utf8"));
const manifest = [];

// 圖鑑 24 隻
for (const d of characters.dex) {
    const colors = { primary: "#4a9d5f", secondary: "#2f6f45", accent: "#f39c12" };
    // 依 dexNo 微調色調，讓 24 隻視覺可區分
    const hues = ["#4a9d5f", "#2f8f8a", "#d98b28", "#8e44ad", "#5a6b7a", "#c0392b",
        "#2980b9", "#27ae60", "#e67e22", "#16a085", "#7f8c8d", "#9b59b6",
        "#d35400", "#2c3e50", "#1abc9c", "#8e44ad", "#c0392b", "#34495e",
        "#e91e63", "#f39c12", "#2980b9", "#27ae60", "#8e44ad", "#16a085"];
    const idx = (d.dexNo - 1) % hues.length;
    colors.primary = hues[idx];
    colors.secondary = hues[(idx + 5) % hues.length];
    colors.accent = "#f39c12";

    const walkFiles = [];
    for (let f = 0; f < 4; f++) {
        const file = `${d.id}-walk-${f + 1}.svg`;
        writeFileSync(join(outDir, file), dinoSvg(d.id, colors.primary, colors.secondary, colors.accent, f));
        walkFiles.push(file);
    }
    writeFileSync(join(outDir, `${d.id}.svg`), dinoSvg(d.id, colors.primary, colors.secondary, colors.accent, 0));
    manifest.push({
        id: d.id,
        file: `${d.id}.svg`,
        walkFrames: walkFiles,
        hasAlpha: true,
        bbox: { x: 100, y: 44, width: 380, height: 372 },
        palette: colors,
        roar: d.roar,
        dexNo: d.dexNo
    });
}

// 可玩角色（3 隻節慶角色 + 4 隻同時在圖鑑中的恐龍）
const festive = [
    { id: "santa", primary: "#c0392b", secondary: "#7b241c", accent: "#f1c40f" },
    { id: "snowman", primary: "#e74c3c", secondary: "#795548", accent: "#f39c12" },
    { id: "reindeer", primary: "#a0522d", secondary: "#6b3a1e", accent: "#f1c40f" }
];
for (const c of festive) {
    writeFileSync(join(outDir, `${c.id}.svg`), festiveSvg(c.id, c.primary, c.secondary, c.accent));
}

for (const c of characters.playable) {
    if (c.kind !== "dino") continue;
    const entry = manifest.find((/** @type {any} */ m) => m.id === c.id);
    if (entry) {
        writeFileSync(join(outDir, `${c.id}.svg`), dinoSvg(c.id, entry.palette.primary, entry.palette.secondary, entry.palette.accent, 0));
    }
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const total = manifest.length * 5 + festive.length;
out(`[OK] 產生 ${manifest.length} 隻恐龍（含 4 幀步行）＋ ${festive.length} 隻節慶角色，共 ${total} 個 SVG`);
