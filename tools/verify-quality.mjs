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

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
 * 兒童語言層
 * ------------------------------------------------------------------ */

/**
 * 孩子層禁用術語（18 個）。
 * 家長層（parent-report / assessment）不在此限。
 */
const CHILD_BANNED = [
    "最小對辨識", "語音覺辨", "序列回憶", "干擾抑制", "音高模仿", "節奏模仿",
    "圖像推理", "空間記憶", "記憶配對", "正確率", "掌握度", "成效",
    "前測", "後測", "百分點", "技能軸", "認知", "認知動詞"
];

/**
 * 孩子可見的檔案。
 */
const CHILD_VISIBLE_FILES = [
    "src/js/core/dex.js",
    "src/js/ui/dex.js",
    "src/js/ui/share-card.js",
    "src/js/ui/hud.js",
    "src/js/main.js"
];

/**
 * 移除 JS 註解（行註解與區塊註解），只留下字串字面值可比對。
 * @param {string} src
 */
function stripComments(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

/**
 * 取出程式碼中的字串字面值。
 * @param {string} src
 */
function extractStringLiterals(src) {
    const out = [];
    const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
    let m;
    while ((m = re.exec(src))) {
        out.push(m[1] ?? m[2] ?? m[3] ?? "");
    }
    return out;
}

/**
 * 1. 孩子可見檔案的字面值不得含禁用術語。
 */
function checkChildNoJargon() {
    const hits = [];
    for (const rel of CHILD_VISIBLE_FILES) {
        const src = readSrc(rel);
        if (!src) continue;
        for (const lit of extractStringLiterals(stripComments(src))) {
            for (const bad of CHILD_BANNED) {
                if (lit.includes(bad)) hits.push(`${rel}: 「${lit.trim()}」含「${bad}」`);
            }
        }
    }
    if (hits.length) {
        return { ok: false, msg: `${hits.length} 處禁用術語：${hits.slice(0, 5).join("；")}` };
    }
    return { ok: true, msg: `${CHILD_VISIBLE_FILES.length} 個孩子可見檔案字面值無禁用術語` };
}

/**
 * 2. 孩子路徑不得出現評量構件（雷達圖、多軸圖、達成率指標）。
 */
function checkChildNoEvalWidget() {
    const problems = [];

    // 分享卡：孩子版不得產出雷達圖（多軸繪製）
    const share = readSrc("src/js/ui/share-card.js");
    if (share) {
        const cleaned = stripComments(share);
        // 找出 view === "child" 的分支
        const idx = cleaned.search(/view\s*===\s*["']child["']/);
        if (idx >= 0) {
            const branch = cleaned.slice(idx, idx + 900);
            if (/drawLearningCard|radar|Radar|AXES/.test(branch)) {
                problems.push("分享卡孩子版仍產出雷達圖／多軸圖");
            }
        }
        // 孩子版分享文字不得含雷達圖相關文案
        for (const lit of extractStringLiterals(cleaned)) {
            if (/雷達|radar|Radar/.test(lit)) problems.push(`分享卡含雷達圖文案：「${lit.trim()}」`);
        }
    }

    // 圖鑑介面不得顯示達成率／正確率指標
    const dexUi = readSrc("src/js/ui/dex.js");
    if (dexUi) {
        for (const lit of extractStringLiterals(stripComments(dexUi))) {
            if (/正確率|達成率|掌握度/.test(lit)) {
                problems.push(`圖鑑介面含評量指標：「${lit.trim()}」`);
            }
        }
    }

    // HUD 不得顯示統計指標
    const hud = readSrc("src/js/ui/hud.js");
    if (hud) {
        for (const lit of extractStringLiterals(stripComments(hud))) {
            if (/正確率|本週分鐘|連續天數|掌握度/.test(lit)) {
                problems.push(`HUD 含評量指標：「${lit.trim()}」`);
            }
        }
    }

    if (problems.length) {
        return { ok: false, msg: `${problems.length} 處評量構件：${problems.slice(0, 5).join("；")}` };
    }
    return { ok: true, msg: "孩子路徑無雷達圖／多軸圖／達成率指標" };
}

/**
 * 3. 兒童文案資料檔必須齊備。
 */
function checkChildVoiceComplete() {
    const v = readJson("content/child-voice.json");
    if (!v) return { ok: false, msg: "content/child-voice.json 不存在" };

    const verbs = ["sequence", "minimal-pair", "rhythm", "interference", "pitch", "puzzle", "memory"];
    const missing = [];
    for (const k of verbs) {
        const e = v.verbChildLabel?.[k];
        if (!e) missing.push(`verbChildLabel.${k}`);
        else if (!e["zh-TW"] || !e["en-US"]) missing.push(`verbChildLabel.${k} 雙語不全`);
    }
    for (const k of ["minimal-pair", "stars", "chapter"]) {
        if (!v.unlockChild?.[k]) missing.push(`unlockChild.${k}`);
    }
    if (missing.length) {
        return { ok: false, msg: `缺漏：${missing.slice(0, 6).join(", ")}` };
    }
    return { ok: true, msg: "7 種玩法兒童名與解鎖模板齊備" };
}

/**
 * 4. 7 種玩法的兒童名必須互不相同（中文）。
 */
function checkChildPositiveCheck() {
    const v = readJson("content/child-voice.json");
    if (!v) return { ok: false, msg: "content/child-voice.json 不存在" };

    const names = Object.values(v.verbChildLabel || {}).map((e) => e["zh-TW"]).filter(Boolean);
    const uniq = new Set(names);
    if (uniq.size !== names.length) {
        return { ok: false, msg: `玩法兒童名有重複（${names.length} 個中僅 ${uniq.size} 個相異）` };
    }
    return { ok: true, msg: `${names.length} 個玩法兒童名互不相同` };
}

/**
 * 5. 分享卡必須引用兒童文案。
 */
function checkChildShareUsesVoice() {
    const share = readSrc("src/js/ui/share-card.js");
    if (!share) return { ok: false, msg: "無法讀取 share-card.js" };
    if (!/shareChildTitle|verbChildLabel|shareChildBody/.test(share)) {
        return { ok: false, msg: "分享卡未引用兒童文案（shareChildTitle / verbChildLabel / shareChildBody）" };
    }
    return { ok: true, msg: "分享卡已引用兒童文案" };
}

/**
 * 6. 反向檢查：家長端術語必須仍在（確認沒被誤改）。
 */
function checkParentViewUntouched() {
    const parent = readSrc("src/js/ui/parent-report.js");
    const assess = readSrc("src/js/ui/assessment-ui.js");

    const parentOk = parent && /掌握度|Skill Mastery/.test(parent);
    const assessOk = assess && /成效|Assessment|前後測/.test(assess);

    if (!parentOk) {
        return { ok: false, msg: "家長端被誤改：parent-report.js 已無「掌握度／Skill Mastery」" };
    }
    if (!assessOk) {
        return { ok: false, msg: "家長端被誤改：assessment-ui.js 已無「成效／Assessment／前後測」" };
    }
    return { ok: true, msg: "家長端術語完整保留" };
}

/**
 * 7. HUD 關卡顯示不得硬編碼 Level 模板。
 */
function checkChildHudLevel() {
    const hud = readSrc("src/js/ui/hud.js");
    if (!hud) return { ok: false, msg: "無法讀取 hud.js" };
    if (/Level\s*\$\{/.test(stripComments(hud))) {
        return { ok: false, msg: "HUD 仍硬編碼 `Level ${…}` 字面值" };
    }
    return { ok: true, msg: "HUD 未硬編碼 Level 模板" };
}

/**
 * 9. 最終構件檢查 — 孩子路徑不得有任何評量構件。
 */
function checkChildNoEvalWidgetFinal() {
    const problems = [];

    // 分享卡孩子版分支不得產出雷達圖
    const share = readSrc("src/js/ui/share-card.js");
    if (share) {
        const cleaned = stripComments(share);
        const idx = cleaned.search(/view\s*===\s*["']parent["']/);
        // 找出所有 "child" 分支區塊
        const childBlocks = [];
        let m;
        const re = /view\s*===\s*["']child["']/g;
        while ((m = re.exec(cleaned))) {
            childBlocks.push(cleaned.slice(m.index, m.index + 700));
        }
        for (const b of childBlocks) {
            if (/drawParentLearningCard|radar|Radar|AXES/.test(b)) {
                problems.push("分享卡孩子版分支引用雷達圖／多軸圖");
            }
        }
        void idx;
    }

    // 圖鑑介面不得顯示達成率類指標
    const dexUi = readSrc("src/js/ui/dex.js");
    if (dexUi) {
        for (const lit of extractStringLiterals(stripComments(dexUi))) {
            if (/正確率|達成率|掌握度|百分/.test(lit)) {
                problems.push(`圖鑑介面含評量指標：「${lit.trim()}」`);
            }
        }
    }

    // HUD 不得顯示統計指標
    const hud = readSrc("src/js/ui/hud.js");
    if (hud) {
        for (const lit of extractStringLiterals(stripComments(hud))) {
            if (/正確率|本週分鐘|連續天數|掌握度|百分/.test(lit)) {
                problems.push(`HUD 含評量指標：「${lit.trim()}」`);
            }
        }
    }

    // 家長端介面不得出現在孩子路徑的 HTML 容器中
    const index = readSrc("index.html");
    if (index && /mode-options[^>]*>\s*<[^>]*>\s*(學習報告|成效|學習成果)/.test(index)) {
        problems.push("index.html 的孩子選單含家長端文案");
    }

    if (problems.length) {
        return { ok: false, msg: `${problems.length} 處評量構件：${problems.slice(0, 5).join("；")}` };
    }
    return { ok: true, msg: "孩子路徑無評量構件（雷達圖／指標／家長文案）" };
}

/**
 * 10. 家長端完整性 — 正式技能名與數據必須仍在。
 */
function checkParentViewIntact() {
    const parent = readSrc("src/js/ui/parent-report.js");
    const assess = readSrc("src/js/ui/assessment-ui.js");

    if (!parent || !/掌握度|Skill Mastery/.test(parent)) {
        return { ok: false, msg: "parent-report.js 缺少「掌握度／Skill Mastery」" };
    }
    if (!assess || !/成效|Assessment|前後測/.test(assess)) {
        return { ok: false, msg: "assessment-ui.js 缺少「成效／Assessment／前後測」" };
    }
    // 家長報告應仍含數據類型圖表
    if (!/正確率|percent|rate/.test(parent)) {
        return { ok: false, msg: "parent-report.js 缺少數據指標" };
    }
    return { ok: true, msg: "家長端正式技能名與數據完整" };
}

/**
 * 8. 資訊分層：家長端只能由家長閘門觸發，孩子流程不會自動開啟。
 */
function checkChildSingleLayer() {
    const main = readSrc("src/js/main.js");
    const index = readSrc("index.html");
    if (!main || !index) return { ok: false, msg: "無法讀取 main.js 或 index.html" };

    if (!index.includes("parent-report-root") || !index.includes("assessment-root")) {
        return { ok: false, msg: "index.html 缺少家長端容器" };
    }

    const cleaned = stripComments(main);
    // 找出所有開啟家長報告的呼叫點，確認每個都在 requireParentalGate 之後
    const openCalls = cleaned.match(/showParentReport\(|showAssessment\(|renderParentReport\(/g) || [];
    if (!openCalls.length) {
        return { ok: true, msg: "孩子流程未自動開啟家長報告" };
    }

    // 每個開啟點前 600 字元內必須有家長閘門
    const bad = [];
    const re = /showParentReport\(|showAssessment\(|renderParentReport\(/g;
    let m;
    while ((m = re.exec(cleaned))) {
        const before = cleaned.slice(Math.max(0, m.index - 600), m.index);
        if (!/requireParentalGate|parental/i.test(before)) {
            bad.push(cleaned.slice(Math.max(0, m.index - 80), m.index + 40).replace(/\s+/g, " "));
        }
    }
    if (bad.length) {
        return { ok: false, msg: `${bad.length} 處家長端開啟未經家長閘門` };
    }
    return { ok: true, msg: "家長端只能由家長閘門觸發" };
}

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

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
    { id: "visual-scene-diff", phase: "visual", fn: checkVisualSceneDiff },
    { id: "child-no-jargon", phase: "child", fn: checkChildNoJargon },
    { id: "child-no-eval-widget", phase: "child", fn: checkChildNoEvalWidget },
    { id: "child-voice-complete", phase: "child", fn: checkChildVoiceComplete },
    { id: "child-positive-check", phase: "child", fn: checkChildPositiveCheck },
    { id: "child-share-uses-voice", phase: "child", fn: checkChildShareUsesVoice },
    { id: "child-hud-level", phase: "child", fn: checkChildHudLevel },
    { id: "child-single-layer", phase: "child", fn: checkChildSingleLayer },
    { id: "parent-view-untouched", phase: "child", fn: checkParentViewUntouched },
    { id: "child-no-eval-widget-final", phase: "child", fn: checkChildNoEvalWidgetFinal },
    { id: "parent-view-intact", phase: "child", fn: checkParentViewIntact }
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
