/**
 * 掃描除錯輸出殘留與敏感資料外送。
 *
 * 掃描 src 下的 .js 與 tools 下的 .mjs 檔案，找出：
 *   1. console.log 呼叫（允許 console.warn 與 console.error）
 *   2. 敏感欄位直接進入 log（email／name／ip／deviceId／token／secret）
 *   3. 模板字串直接注入 innerHTML（未 escape 的內容型資料）
 *
 * 命中即列印檔案與行號並以 exit code 1 結束。
 */

import { readdirSync, readFileSync } from "node:fs";
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

/**
 * 遞迴列出檔案。
 * @param {string} dir
 * @param {string[]} exts
 * @returns {string[]}
 */
function walk(dir, exts) {
    /** @type {string[]} */
    const out = [];
    /** @type {import("node:fs").Dirent[]} */
    let entries = [];
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".git") continue;
            out.push(...walk(full, exts));
        } else if (exts.some((e) => entry.name.endsWith(e))) {
            out.push(full);
        }
    }
    return out;
}

const files = [
    ...walk(join(root, "src"), [".js"]),
    ...walk(join(root, "tools"), [".mjs"])
];

const hits = [];
const piiHits = [];
const innerHtmlHits = [];

/** 敏感欄位（不得直接進 log 或 DOM）。 */
const SENSITIVE = ["email", "name", "ip", "deviceId", "userId", "token", "secret", "phone", "address"];

/**
 * 已完成 XSS 硬化的檔案（Step 153）。
 *
 * 這些檔案**不得**再以模板字串直接注入內容型資料到 innerHTML；
 * 內容必須改用 textContent 或 escapeHtml（sanitize-html.js）。
 * sweep 針對本清單把關，防止回歸。
 */
const HARDENED_FILES = [
    "src/js/ui/story.js",
    "src/js/ui/dex.js",
    "src/js/ui/parent-report.js",
    "src/js/ui/paywall.js"
];

/**
 * 內容型欄位（文字／URL／HTML 片段）——
 * 這些欄位直接注入 innerHTML 即構成 XSS 注入點，必須改用 textContent 或 escapeHtml。
 */
const CONTENT_FIELDS = /^(title|body|text|label|name|desc|description|note|message|content|html|art|dataUrl|imageUrl|imgUrl|lineUrl|url|href|src|tagline|letter|signature|radar|prompt|reason|shape|blurb|cta)$/i;

for (const file of files) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
        // 排除註解中的 console.log 說明
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
        if (/console\.log\s*\(/.test(line)) {
            hits.push({ file: relative(root, file), line: i + 1, text: trimmed });
        }

        // ② 敏感欄位直接進 log
        if (/console\.(log|warn|error|info|debug)\s*\(/.test(line)) {
            for (const key of SENSITIVE) {
                if (new RegExp(`\\b${key}\\b`).test(line)) {
                    piiHits.push({ file: relative(root, file), line: i + 1, text: trimmed, key });
                }
            }
        }

        // ③ 模板字串直接注入 innerHTML（內容型資料未 escape）
        // 僅針對**已完成 XSS 硬化**的檔案把關（防止回歸）。
        // 以「整段模板字串」為單位掃描（可能跨多行）；
        // 只偵測**內容型資料**（文字／URL／HTML）的直接插值。
        const rel = relative(root, file);
        if (HARDENED_FILES.includes(rel) && /\.innerHTML\s*=\s*`/.test(line)) {
            const start = i;
            let block = line;
            let j = i;
            while (j + 1 < lines.length && !/`/.test(block.slice(block.indexOf("`") + 1))) {
                j++;
                block += "\n" + lines[j];
            }
            const direct = /\$\{([^}]*)\}/g;
            let m;
            while ((m = direct.exec(block))) {
                const expr = m[1];
                // 已明確 escape 的表達式（escapeHtml／safeText 呼叫）不在此列
                if (/escapeHtml\s*\(|safeText\s*\(/.test(expr)) continue;
                // 內容型欄位名（識別子 token 比對）
                const tokens = expr.match(/[A-Za-z_$][\w$]*/g) || [];
                const hit = tokens.find((t) => CONTENT_FIELDS.test(t));
                if (hit) {
                    innerHtmlHits.push({
                        file: rel,
                        line: start + 1,
                        text: expr.trim(),
                        expr: hit
                    });
                }
            }
        }
    }
}

if (hits.length) {
    console.error("[FAIL] 發現除錯輸出殘留：");
    for (const h of hits) {
        console.error(`  - ${h.file}:${h.line}  ${h.text}`);
    }
    process.exit(1);
}

if (piiHits.length) {
    console.error("[FAIL] 發現敏感欄位進入 log：");
    for (const h of piiHits) {
        console.error(`  - ${h.file}:${h.line}  [${h.key}]  ${h.text}`);
    }
    process.exit(1);
}

if (innerHtmlHits.length) {
    console.error("[FAIL] 發現模板字串直接注入 innerHTML（內容型資料未 escape）：");
    for (const h of innerHtmlHits) {
        console.error(`  - ${h.file}:${h.line}  ${h.text}`);
    }
    process.exit(1);
}

out(`[PASS] 除錯輸出掃描通過：${files.length} 個檔案，無 console.log 殘留、0 敏感 Log、0 模板 innerHTML`);
