/**
 * 三支柱品質守門（純讀檔／純 import，無副作用，不啟動任何伺服器）。
 *
 * 用法：
 *   node tools/verify-quality.mjs            # 全部檢查
 *   node tools/verify-quality.mjs --list     # 列出檢查 id
 *   node tools/verify-quality.mjs --phase music | story | visual | child | scenes
 *
 * 設計原則：
 *   每一條檢查都是「跨檔案契約」——單看任一檔案都合法，
 *   只有把兩個檔案放在一起比對才會發現錯誤。
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * 輸出。
 * @param {...any} args
 */
function out(...args) {
    process.stdout.write(args.map(String).join(" ") + "\n");
}

/**
 * 讀取並解析 JSON。
 * @param {string} rel
 */
function readJson(rel) {
    const path = join(root, rel);
    if (!existsSync(path)) return null;
    try {
        return JSON.parse(readFileSync(path, "utf8"));
    } catch {
        return null;
    }
}

/**
 * 讀取原始碼。
 * @param {string} rel
 */
function readSrc(rel) {
    const path = join(root, rel);
    if (!existsSync(path)) return "";
    return readFileSync(path, "utf8");
}

/* ------------------------------------------------------------------ *
 * 音樂支柱
 * ------------------------------------------------------------------ */

/**
 * 1. 背景音必須真的接線，且不得硬編碼音檔路徑。
 */
function checkMusicAutoplay() {
    const main = readSrc("src/js/main.js");
    if (!main) return { ok: false, msg: "無法讀取 main.js" };

    // 有實際呼叫（不是只有 import）
    const calls = main.match(/playMusic\s*\(/g) || [];
    const sceneCalls = main.match(/playSceneMusic\s*\(/g) || [];
    const hasCall = calls.length + sceneCalls.length > 0;

    // 硬編碼音檔路徑
    const hardcoded = main.match(/外部資源__|\.m4a["'`]/g) || [];

    if (!hasCall) {
        return { ok: false, msg: "main.js 無 playMusic()/playSceneMusic() 實際呼叫，背景音不會自動播放" };
    }
    if (hardcoded.length) {
        return { ok: false, msg: `main.js 含 ${hardcoded.length} 處硬編碼音檔路徑` };
    }
    return { ok: true, msg: "背景音已接線且無硬編碼音檔" };
}

/**
 * 2. 每個章節場景必須有獨立音樂 id，不得共用同一音檔。
 */
function checkMusicPerScene() {
    const music = readJson("content/music.json");
    if (!music) return { ok: false, msg: "無法讀取 music.json" };

    const chapters = music.chapters || {};
    const entries = Object.entries(chapters);
    if (!entries.length) return { ok: false, msg: "music.json 無章節主題" };

    // 以 file 或 scene 欄位判斷是否共用
    const key = (v) => v.scene || v.file || v.id;
    const seen = new Map();
    const dup = [];
    for (const [name, v] of entries) {
        const k = key(v);
        if (seen.has(k)) dup.push(`${name} 與 ${seen.get(k)} 共用 ${k}`);
        else seen.set(k, name);
    }
    if (dup.length) {
        return { ok: false, msg: `場景共用音樂：${dup.join("；")}` };
    }
    return { ok: true, msg: `${entries.length} 個場景各有獨立音樂` };
}

/**
 * 3. music.json 的章節場景必須涵蓋 levels.json 用到的全部 scene。
 */
function checkMusicScenesMatch() {
    const music = readJson("content/music.json");
    const levels = readJson("content/levels.json");
    if (!music || !levels) return { ok: false, msg: "無法讀取 music.json 或 levels.json" };

    const used = [...new Set((levels.levels || levels || []).map((l) => l.scene).filter(Boolean))];
    const have = new Set(Object.keys(music.chapters || {}));
    const missing = used.filter((s) => !have.has(s));
    if (missing.length) {
        return { ok: false, msg: `music.json 未涵蓋場景：${missing.join(", ")}` };
    }
    return { ok: true, msg: `涵蓋全部 ${used.length} 個場景` };
}

/**
 * 4. assets/audio/ 不得有正規化後同名的重複檔。
 */
function checkAudioDupes() {
    const dir = join(root, "assets/audio");
    if (!existsSync(dir)) return { ok: false, msg: "assets/audio 不存在" };

    const files = readdirSync(dir);
    const norm = (f) => f.toLowerCase().replace(/[^a-z0-9]/g, "");
    const seen = new Map();
    const dups = [];
    for (const f of files) {
        const k = norm(f);
        if (seen.has(k)) dups.push(`${f} ≡ ${seen.get(k)}`);
        else seen.set(k, f);
    }
    if (dups.length) {
        return { ok: false, msg: `${dups.length} 組重複音檔：${dups.join("；")}` };
    }
    return { ok: true, msg: `${files.length} 個音檔無重複` };
}

/**
 * 5. 每隻恐龍的對白必須 ≥3 句，且不得有 3 隻以上共用同一句。
 */
function checkStoryDinoLines() {
    const narrative = readJson("content/narrative.zh-TW.json");
    if (!narrative) return { ok: false, msg: "無法讀取 narrative.zh-TW.json" };

    const lines = narrative.dinoLines || {};
    const ids = Object.keys(lines);
    if (!ids.length) return { ok: false, msg: "dinoLines 為空" };

    const short = [];
    const all = [];
    for (const id of ids) {
        const v = lines[id];
        const arr = Array.isArray(v) ? v : [v];
        if (arr.length < 3) short.push(`${id}(${arr.length})`);
        for (const s of arr) all.push(s);
    }
    if (short.length) {
        return { ok: false, msg: `${short.length} 隻對白少於 3 句：${short.slice(0, 6).join(", ")}` };
    }

    const count = new Map();
    for (const s of all) count.set(s, (count.get(s) || 0) + 1);
    const shared = [...count.entries()].filter(([, n]) => n >= 3);
    if (shared.length) {
        return { ok: false, msg: `${shared.length} 句被 3 隻以上共用：${shared[0][0]}` };
    }
    return { ok: true, msg: `${ids.length} 隻各 ≥3 句、共 ${all.length} 句，無 3 隻共用` };
}

/**
 * 6. 每章信件中文長度必須 ≥150 字。
 */
function checkStoryLetterLength() {
    const arcs = readJson("content/story-arcs.json");
    if (!arcs) return { ok: false, msg: "無法讀取 story-arcs.json" };

    const chapters = arcs.chapters || [];
    const short = [];
    for (const c of chapters) {
        const n = (c.letter?.["zh-TW"] || "").length;
        if (n < 150) short.push(`第${c.chapter}章(${n})`);
    }
    if (short.length) {
        return { ok: false, msg: `${short.length} 章信件不足 150 字：${short.join(", ")}` };
    }
    return { ok: true, msg: `${chapters.length} 章信件皆達 150 字` };
}

/**
 * 7. 情境台詞總數必須 ≥120 句，且雙語對稱。
 */
function checkStoryLinesCount() {
    const zh = readJson("content/narrative.zh-TW.json");
    const en = readJson("content/narrative.en-US.json");
    if (!zh || !en) return { ok: false, msg: "無法讀取 narrative 檔案" };

    const count = (o) => {
        const ctx = Object.values(o.contexts || {}).reduce((a, v) => a + v.length, 0);
        const age = (o.ageVariants?.young?.length || 0) + (o.ageVariants?.older?.length || 0);
        return ctx + age + (o.dexPraise?.length || 0);
    };
    const cz = count(zh);
    const ce = count(en);
    if (cz < 120) return { ok: false, msg: `台詞僅 ${cz} 句（需 ≥120）` };
    if (cz !== ce) return { ok: false, msg: `雙語句數不對稱：zh ${cz} / en ${ce}` };
    return { ok: true, msg: `雙語台詞各 ${cz} 句且對稱` };
}

/**
 * 8. 24 隻角色的 path 數種類必須 ≥12。
 */
function checkVisualBodyTypes() {
    const dir = join(root, "assets/characters");
    if (!existsSync(dir)) return { ok: false, msg: "assets/characters 不存在" };

    const files = readdirSync(dir).filter((f) => /^dino-.*\.svg$/.test(f) && !/walk/.test(f));
    if (!files.length) return { ok: false, msg: "找不到角色 SVG" };

    const counts = files.map((f) => ({
        f,
        n: (readFileSync(join(dir, f), "utf8").match(/<path/g) || []).length
    }));
    const kinds = new Set(counts.map((c) => c.n));
    if (kinds.size < 12) {
        return { ok: false, msg: `體型種類僅 ${kinds.size} 種（需 ≥12）：${[...kinds].sort((a, b) => a - b).join(",")}` };
    }
    return { ok: true, msg: `${files.length} 隻角色，${kinds.size} 種體型` };
}

/**
 * 9. base.css 必須定義五層視差。
 */
function checkVisualParallax() {
    const css = readSrc("src/styles/base.css");
    if (!css) return { ok: false, msg: "無法讀取 base.css" };

    const layers = ["sky", "ridge", "midground", "foreground", "character"];
    const missing = layers.filter((l) => !css.includes(`data-layer="${l}"`));
    if (missing.length) {
        return { ok: false, msg: `缺少視差層：${missing.join(", ")}` };
    }
    return { ok: true, msg: "五層視差 CSS 齊備" };
}

/**
 * 10. 場景必須有獨立的 sky 色票。
 */
function checkVisualSceneDiff() {
    const scenes = readJson("content/scenes.json");
    if (!scenes) return { ok: false, msg: "content/scenes.json 不存在（需由 Step 82 建立）" };

    const entries = Object.entries(scenes).filter(([k]) => !k.startsWith("_"));
    if (entries.length < 5) {
        return { ok: false, msg: `場景僅 ${entries.length} 個（需 ≥5）` };
    }

    const skys = entries.map(([k, v]) => `${k}=${v.palette?.sky}`);
    const uniq = new Set(skys.map((s) => s.split("=")[1]));
    if (uniq.size !== entries.length) {
        return { ok: false, msg: "場景 sky 色有重複" };
    }
    return { ok: true, msg: `${entries.length} 個場景 sky 色互不相同` };
}

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

/**
 * 遞迴走訪目錄。
 * @param {string} dir
 * @param {string} prefix
 * @returns {string[]}
 */
function walk(dir, prefix) {
    const res = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) res.push(...walk(full, join(prefix, entry)));
        else res.push(join(prefix, entry));
    }
    return res;
}

/* ------------------------------------------------------------------ *
 * 執行
 * ------------------------------------------------------------------ */

/** @type {{ id:string, phase:string, fn:() => any }[]} */
const CHECKS = [
    { id: "music-autoplay", phase: "music", fn: checkMusicAutoplay },
    { id: "music-per-scene", phase: "music", fn: checkMusicPerScene },
    { id: "music-scenes-match", phase: "music", fn: checkMusicScenesMatch },
    { id: "audio-dupes", phase: "music", fn: checkAudioDupes },
    { id: "story-dino-lines", phase: "story", fn: checkStoryDinoLines },
    { id: "story-letter-length", phase: "story", fn: checkStoryLetterLength },
    { id: "story-lines-count", phase: "story", fn: checkStoryLinesCount },
    { id: "visual-body-types", phase: "visual", fn: checkVisualBodyTypes },
    { id: "visual-parallax", phase: "visual", fn: checkVisualParallax },
    { id: "visual-scene-diff", phase: "visual", fn: checkVisualSceneDiff }
];

const args = process.argv.slice(2);

if (args.includes("--list")) {
    out("三支柱品質檢查項：");
    for (const c of CHECKS) out(`  [${c.phase}] ${c.id}`);
    out(`共 ${CHECKS.length} 項`);
    process.exit(0);
}

let phase = "";
const phaseArg = args.indexOf("--phase");
if (phaseArg >= 0) phase = String(args[phaseArg + 1]);

const selected = phase ? CHECKS.filter((c) => c.phase === phase) : CHECKS;

let pass = 0;
let fail = 0;

for (const c of selected) {
    let result;
    try {
        result = c.fn();
    } catch (err) {
        result = { ok: false, msg: `檢查執行例外：${err.message}` };
    }
    if (result.ok) {
        pass++;
        out(`[PASS] ${c.id.padEnd(22)} ${result.msg}`);
    } else {
        fail++;
        out(`[FAIL] ${c.id.padEnd(22)} ${result.msg}`);
    }
}

out("---");
out(`通過 ${pass}/${selected.length}，失敗 ${fail}`);
process.exit(fail > 0 ? 1 : 0);
