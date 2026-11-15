/**
 * 產生 24 隻恐龍 SVG 素材（含 4 幀步行變體）與 3 隻聖誕季角色。
 *
 * 設計說明：
 * - 全部使用去背向量（512×512 viewBox，透明背景，無底色矩形）。
 * - 每隻恐龍具可辨識特徵（角、頭冠、背板、尾錘、翼膜等）。
 * - 步行變體以腳位與身體高度微幅變化形成 4 幀循環。
 * - 這些是「佔位美術」：正式素材可由插畫外包替換，替換只換檔案不改程式碼。
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

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
 * 依 id 判斷造型類型。
 * @param {string} id
 */
function silhouette(id) {
    if (id.includes("triceratops") || id.includes("carnotaurus") || id.includes("ceratosaurus")) return "horned";
    if (id.includes("trex") || id.includes("tyrannosaurus") || id.includes("allosaurus")) return "theropod";
    if (id.includes("brachiosaurus") || id.includes("diplodocus") || id.includes("spinosaurus") || id.includes("mosasaurus")) return "sauropod";
    if (id.includes("pteranodon") || id.includes("dilophosaurus") || id.includes("oviraptor")) return "crested";
    if (id.includes("stegosaurus")) return "plated";
    if (id.includes("ankylosaurus")) return "clubbed";
    if (id.includes("velociraptor") || id.includes("eoraptor") || id.includes("compysognathus") || id.includes("iguanodon") || id.includes("trachodon") || id.includes("maiasaura")) return "light";
    return "basic";
}

/**
 * 產生單隻恐龍的 SVG 內容。
 * @param {string} id
 * @param {string} primary
 * @param {string} secondary
 * @param {string} accent
 * @param {number} frame 步行幀（0–3）
 */
function dinoSvg(id, primary, secondary, accent, frame) {
    const kind = silhouette(id);
    const lift = [0, -3, -5, -2][frame];
    const rot = [0, -1.5, 0, 1.5][frame];
    const legA = [0, 4, 0, -4][frame];
    const legB = [0, -4, 0, 4][frame];

    /** @type {string[]} */
    const parts = [];

    // 尾巴（所有類型共有，方向依類型微調）
    const tailPath = kind === "theropod"
        ? "M300 330 C 380 320 440 280 470 240 C 455 300 400 350 320 372 Z"
        : "M300 340 C 370 340 430 360 470 390 C 420 396 360 380 305 362 Z";
    parts.push(`<path d="${tailPath}" fill="${secondary}" />`);

    // 身體
    const bodyPath = kind === "sauropod"
        ? "M150 250 C 150 200 190 175 245 178 C 300 180 320 210 315 265 C 310 320 280 345 230 345 C 180 345 150 315 150 250 Z"
        : kind === "light"
            ? "M160 250 C 160 212 190 192 232 194 C 275 196 292 218 288 258 C 284 300 262 322 222 322 C 182 322 160 296 160 250 Z"
            : "M150 245 C 150 195 195 165 250 168 C 305 170 328 205 322 258 C 316 312 285 340 232 340 C 178 340 150 308 150 245 Z";
    parts.push(`<path d="${bodyPath}" fill="${primary}" />`);

    // 頸與頭
    if (kind === "sauropod") {
        parts.push(`<path d="M175 240 C 140 210 132 160 148 120 C 158 96 186 92 198 114 C 210 138 200 180 205 226 Z" fill="${primary}" />`);
        parts.push(`<ellipse cx="170" cy="108" rx="42" ry="30" fill="${primary}" transform="rotate(-14 170 108)" />`);
        parts.push(`<circle cx="152" cy="98" r="6" fill="${accent}" />`);
        parts.push(`<circle cx="152" cy="98" r="2.5" fill="#1b1b1b" />`);
    } else if (kind === "theropod") {
        parts.push(`<path d="M205 200 C 200 165 218 138 252 130 C 288 122 315 140 318 168 C 320 192 300 208 268 212 Z" fill="${primary}" />`);
        parts.push(`<path d="M250 128 C 288 106 330 112 348 134 C 332 140 300 144 276 142 Z" fill="${primary}" />`);
        parts.push(`<path d="M320 122 L 344 118 L 322 132 Z" fill="${accent}" />`);
        parts.push(`<circle cx="300" cy="132" r="6" fill="${accent}" />`);
        parts.push(`<circle cx="300" cy="132" r="2.5" fill="#1b1b1b" />`);
        // 牙齒
        parts.push(`<path d="M292 142 L 298 156 L 304 141 Z" fill="#ffffff" />`);
        parts.push(`<path d="M310 140 L 315 152 L 320 139 Z" fill="#ffffff" />`);
    } else if (kind === "horned") {
        parts.push(`<path d="M196 215 C 186 180 206 152 244 146 C 280 140 302 156 302 184 C 302 208 280 222 248 226 Z" fill="${primary}" />`);
        parts.push(`<ellipse cx="252" cy="168" rx="56" ry="34" fill="${primary}" transform="rotate(-8 252 168)" />`);
        // 頭盾
        parts.push(`<path d="M206 190 C 190 200 186 220 196 236 C 216 232 230 214 232 194 Z" fill="${secondary}" />`);
        // 三支角
        parts.push(`<path d="M212 142 L 204 96 L 224 138 Z" fill="${accent}" />`);
        parts.push(`<path d="M244 134 L 244 84 L 262 134 Z" fill="${accent}" />`);
        parts.push(`<path d="M276 140 L 288 96 L 296 146 Z" fill="${accent}" />`);
        parts.push(`<circle cx="272" cy="162" r="6" fill="#ffffff" />`);
        parts.push(`<circle cx="272" cy="162" r="3" fill="#1b1b1b" />`);
    } else if (kind === "crested") {
        parts.push(`<path d="M198 214 C 190 178 214 148 254 142 C 292 136 314 154 312 182 C 310 208 286 222 252 226 Z" fill="${primary}" />`);
        parts.push(`<ellipse cx="258" cy="166" rx="48" ry="28" fill="${primary}" transform="rotate(-10 258 166)" />`);
        // 頭冠
        parts.push(`<path d="M232 140 C 240 96 280 84 300 108 C 286 116 258 128 236 148 Z" fill="${accent}" />`);
        parts.push(`<path d="M204 168 L 116 196 L 208 186 Z" fill="${secondary}" />`);
        parts.push(`<circle cx="282" cy="160" r="6" fill="#ffffff" />`);
        parts.push(`<circle cx="282" cy="160" r="3" fill="#1b1b1b" />`);
    } else if (kind === "plated") {
        parts.push(`<path d="M196 218 C 188 184 212 156 248 152 C 284 148 306 164 304 190 C 302 214 280 226 248 230 Z" fill="${primary}" />`);
        parts.push(`<ellipse cx="252" cy="176" rx="46" ry="26" fill="${primary}" transform="rotate(-12 252 176)" />`);
        parts.push(`<circle cx="276" cy="168" r="6" fill="#ffffff" />`);
        parts.push(`<circle cx="276" cy="168" r="3" fill="#1b1b1b" />`);
        // 背板
        parts.push(`<path d="M170 190 L 182 140 L 202 186 Z" fill="${secondary}" />`);
        parts.push(`<path d="M204 176 L 218 122 L 240 172 Z" fill="${secondary}" />`);
        parts.push(`<path d="M242 170 L 258 118 L 280 168 Z" fill="${secondary}" />`);
        parts.push(`<path d="M282 176 L 296 130 L 314 184 Z" fill="${secondary}" />`);
    } else if (kind === "clubbed") {
        parts.push(`<path d="M196 220 C 188 188 210 162 246 158 C 280 154 300 170 298 194 C 296 216 274 226 244 230 Z" fill="${primary}" />`);
        parts.push(`<ellipse cx="250" cy="180" rx="44" ry="26" fill="${primary}" transform="rotate(-6 250 180)" />`);
        parts.push(`<circle cx="272" cy="176" r="5" fill="#ffffff" />`);
        parts.push(`<circle cx="272" cy="176" r="2.5" fill="#1b1b1b" />`);
        // 尾錘
        parts.push(`<ellipse cx="474" cy="396" rx="26" ry="22" fill="${secondary}" />`);
        // 背刺
        parts.push(`<path d="M186 186 L 176 150 L 200 180 Z" fill="${accent}" />`);
        parts.push(`<path d="M214 176 L 208 138 L 232 172 Z" fill="${accent}" />`);
    } else {
        parts.push(`<path d="M198 216 C 190 182 214 154 250 150 C 286 146 306 164 304 190 C 302 214 278 226 248 230 Z" fill="${primary}" />`);
        parts.push(`<ellipse cx="254" cy="176" rx="44" ry="28" fill="${primary}" transform="rotate(-8 254 176)" />`);
        parts.push(`<circle cx="278" cy="168" r="6" fill="#ffffff" />`);
        parts.push(`<circle cx="278" cy="168" r="3" fill="#1b1b1b" />`);
        parts.push(`<path d="M288 182 L 306 190 L 288 190 Z" fill="${secondary}" />`);
    }

    // 腿
    const legColor = secondary;
    if (kind === "light") {
        parts.push(`<path d="M186 306 L 178 352 L 200 352 L 206 306 Z" fill="${legColor}" transform="translate(0 ${legA})" />`);
        parts.push(`<path d="M248 306 L 240 352 L 262 352 L 268 306 Z" fill="${legColor}" transform="translate(0 ${legB})" />`);
    } else if (kind === "sauropod") {
        parts.push(`<path d="M182 330 L 172 396 L 198 396 L 206 330 Z" fill="${legColor}" transform="translate(0 ${legA})" />`);
        parts.push(`<path d="M268 330 L 258 396 L 284 396 L 292 330 Z" fill="${legColor}" transform="translate(0 ${legB})" />`);
    } else {
        parts.push(`<path d="M184 320 L 176 380 L 204 380 L 212 320 Z" fill="${legColor}" transform="translate(0 ${legA})" />`);
        parts.push(`<path d="M266 320 L 258 380 L 286 380 L 294 320 Z" fill="${legColor}" transform="translate(0 ${legB})" />`);
        // 前肢
        parts.push(`<path d="M214 306 L 210 340 L 226 340 L 230 306 Z" fill="${legColor}" />`);
        parts.push(`<path d="M244 306 L 240 340 L 256 340 L 260 306 Z" fill="${legColor}" />`);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none" role="img" aria-label="${id}">
  <g transform="translate(0 ${lift}) rotate(${rot} 256 280)">
    ${parts.join("\n    ")}
  </g>
</svg>
`;
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
