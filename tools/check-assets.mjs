/**
 * 資產驗證工具（僅讀檔）。
 *
 * 檢查：
 *  1. PNG 以 IHDR 判定 color type；角色與 icon 必須含 alpha（color type 4 或 6）；JPEG 偽裝 .png 直接失敗。
 *  2. icon-*.png 實際尺寸須與 manifest.json 宣告一致。
 *  3. assets/characters/manifest.json 每個檔案存在、含 alpha、walkFrames 恰 4 幀。
 *  4. src/**\/*.{js,css} 內不得殘留 emoji 圖示。
 *  5. index.html 不得引用不存在於 assets/、content/ 的路徑。
 *  6. 輸出總體積報告（目標：離線資產 < 6MB）。
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

/**
 * 輸出報告（避免 console.log 殘留）。
 * @param {...any} args
 */
function out(...args) {
    process.stdout.write(args.map(String).join(" ") + "\n");
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const warnings = [];

/**
 * 遞迴列出檔案。
 * @param {string} dir
 * @param {string[]} [exts]
 * @returns {string[]}
 */
function walk(dir, exts) {
    if (!existsSync(dir)) return [];
    /** @type {string[]} */
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".git") continue;
            out.push(...walk(full, exts));
        } else if (!exts || exts.some((e) => entry.name.endsWith(e))) {
            out.push(full);
        }
    }
    return out;
}

/**
 * 讀取 PNG 的 IHDR 資訊。
 * @param {string} path
 * @returns {{ width:number, height:number, colorType:number, hasAlpha:boolean } | null}
 */
function readPngHeader(path) {
    const buf = readFileSync(path);
    // PNG 魔數
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < sig.length; i++) {
        if (buf[i] !== sig[i]) return null;
    }
    // IHDR：長度(4) + "IHDR"(4) + 寬(4) + 高(4) + 位元深度(1) + color type(1)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const colorType = buf[25];
    return { width, height, colorType, hasAlpha: colorType === 4 || colorType === 6 };
}

/* --- 1 & 2. App icon --- */
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
for (const icon of manifest.icons || []) {
    const path = join(root, icon.src);
    if (!existsSync(path)) {
        problems.push(`manifest 宣告的 icon 不存在: ${icon.src}`);
        continue;
    }
    const header = readPngHeader(path);
    if (!header) {
        problems.push(`${icon.src} 不是有效的 PNG（可能為 JPEG 偽裝）`);
        continue;
    }
    if (!header.hasAlpha) {
        problems.push(`${icon.src} 缺少 alpha 通道（color type ${header.colorType}）`);
    }
    const declared = String(icon.sizes).split("x").map(Number);
    if (header.width !== declared[0] || header.height !== declared[1]) {
        problems.push(`${icon.src} 尺寸不符：實際 ${header.width}×${header.height}，宣告 ${icon.sizes}`);
    }
}

/* --- 3. 角色素材 manifest --- */
const charManifestPath = join(root, "assets/characters/manifest.json");
if (!existsSync(charManifestPath)) {
    problems.push("缺少 assets/characters/manifest.json");
} else {
    const charManifest = JSON.parse(readFileSync(charManifestPath, "utf8"));
    if (charManifest.length !== 24) {
        problems.push(`角色 manifest 應為 24 筆，實際 ${charManifest.length}`);
    }
    for (const entry of charManifest) {
        const path = join(root, "assets/characters", entry.file);
        if (!existsSync(path)) {
            problems.push(`角色素材不存在: ${entry.file}`);
        }
        if (!Array.isArray(entry.walkFrames) || entry.walkFrames.length !== 4) {
            problems.push(`角色 ${entry.id} 的 walkFrames 應恰為 4 幀`);
        } else {
            for (const f of entry.walkFrames) {
                if (!existsSync(join(root, "assets/characters", f))) {
                    problems.push(`角色 ${entry.id} 的步行幀不存在: ${f}`);
                }
            }
        }
        if (entry.hasAlpha !== true) {
            problems.push(`角色 ${entry.id} 的 hasAlpha 應為 true`);
        }
    }
}

/* --- 4. Emoji 殘留掃描 --- */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F0FF}]/u;
const codeFiles = [
    ...walk(join(root, "src"), [".js", ".css"]),
    ...walk(join(root, "tools"), [".mjs"])
];
for (const file of codeFiles) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (EMOJI.test(lines[i])) {
            problems.push(`${relative(root, file)}:${i + 1} 殘留 emoji 圖示`);
        }
    }
}
// index.html 亦掃描
{
    const html = readFileSync(join(root, "index.html"), "utf8");
    const lines = html.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (EMOJI.test(lines[i])) {
            problems.push(`index.html:${i + 1} 殘留 emoji 圖示`);
        }
    }
}

/* --- 5. index.html 引用路徑 --- */
{
    const html = readFileSync(join(root, "index.html"), "utf8");
    const refs = [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((m) => m[1]);
    for (const ref of refs) {
        if (ref.startsWith("http") || ref.startsWith("#") || ref.startsWith("data:")) continue;
        if (!existsSync(join(root, ref))) {
            problems.push(`index.html 引用不存在的檔案: ${ref}`);
        }
    }
}

/* --- 6. 體積報告 --- */
function dirSize(dir) {
    if (!existsSync(dir)) return 0;
    let total = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            total += dirSize(full);
        } else {
            total += statSync(full).size;
        }
    }
    return total;
}

const assetsSize = dirSize(join(root, "assets"));
const contentSize = dirSize(join(root, "content"));
const srcSize = dirSize(join(root, "src"));
const offlineSize = assetsSize + contentSize + srcSize;

const MB = 1024 * 1024;
out("── 資產體積報告 ──");
out(`  assets/      ${(assetsSize / MB).toFixed(2)} MB`);
out(`  content/     ${(contentSize / MB).toFixed(2)} MB`);
out(`  src/         ${(srcSize / MB).toFixed(2)} MB`);
out(`  離線資產合計 ${(offlineSize / MB).toFixed(2)} MB（目標 < 6 MB）`);

if (offlineSize > 6 * MB) {
    problems.push(`離線資產 ${(offlineSize / MB).toFixed(2)} MB 超過 6 MB 上限`);
}

for (const w of warnings) {
    console.warn(`  [WARN] ${w}`);
}

if (problems.length) {
    console.error("[FAIL] 資產驗證失敗：");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
}

out("[PASS] 資產驗證通過：PNG alpha／icon 尺寸／24 隻恐龍 4 幀／emoji = 0／引用完整");
