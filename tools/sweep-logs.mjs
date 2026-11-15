/**
 * 掃描除錯輸出殘留。
 *
 * 掃描 src 下的 .js 與 tools 下的 .mjs 檔案，找出 console.log 呼叫
 * （允許 console.warn 與 console.error），命中即列印檔案與行號並以 exit code 1 結束。
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
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
    /** @type {string[]} */
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
    }
}

if (hits.length) {
    console.error("[FAIL] 發現除錯輸出殘留：");
    for (const h of hits) {
        console.error(`  - ${h.file}:${h.line}  ${h.text}`);
    }
    process.exit(1);
}

out(`[PASS] 除錯輸出掃描通過：${files.length} 個檔案，無 console.log 殘留`);
