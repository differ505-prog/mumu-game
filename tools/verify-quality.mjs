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
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

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
    if (all.length < 72) {
        return { ok: false, msg: `對白總數僅 ${all.length} 句（需 ≥72）` };
    }
    return { ok: true, msg: `${ids.length} 隻各 ≥3 句、共 ${all.length} 句，無 3 隻共用` };
}

/**
 * 5b. 不同「個性類型」的恐龍，其對白不得相同。
 *
 * 個性感取自 content/characters.json 的 personality 描述所屬的語意類別：
 * 守護型／衝勁型／溫柔型／天空型／水域型／節奏型／好奇型。
 * 同類別的恐龍可以風格相近，但**對白集合不得完全相同**。
 */
const PERSONALITY_GROUPS = {
    guard: ["dino-triceratops", "dino-ankylosaurus", "dino-stegosaurus", "dino-maiasaura", "dino-oviraptor"],
    rush: ["dino-trex", "dino-velociraptor", "dino-allosaurus", "dino-tyrannosaurus", "dino-giganotosaurus", "dino-ceratosaurus"],
    gentle: ["dino-brachiosaurus", "dino-diplodocus", "dino-trachodon", "dino-eoraptor"],
    sky: ["dino-pteranodon", "dino-dilophosaurus", "dino-compysognathus"],
    water: ["dino-spinosaurus", "dino-mosasaurus"],
    rhythm: ["dino-iguanodon", "dino-parasaurolophus", "dino-carnotaurus", "dino-tyrannosaurus-scout"]
};

/**
 * 11. 不同個性類型的恐龍對白不得相同。
 */
function checkStoryDinoPersonality() {
    const narrative = readJson("content/narrative.zh-TW.json");
    if (!narrative) return { ok: false, msg: "無法讀取 narrative.zh-TW.json" };

    const lines = narrative.dinoLines || {};

    // 收集每隻恐龍的對白集合
    /** @type {Map<string, string[]>} */
    const sets = new Map();
    for (const [id, v] of Object.entries(lines)) {
        const arr = Array.isArray(v) ? v : [v];
        sets.set(
            id,
            arr.map((line) => (typeof line === "string" ? line : line?.["zh-TW"] || "")).filter(Boolean)
        );
    }

    // 同類別內：任兩隻的對白集合不得完全相同
    const clashes = [];
    for (const [group, members] of Object.entries(PERSONALITY_GROUPS)) {
        for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
                const a = sets.get(members[i]);
                const b = sets.get(members[j]);
                if (!a || !b) continue;
                const ka = [...a].sort().join("|");
                const kb = [...b].sort().join("|");
                if (ka === kb) clashes.push(`${group}: ${members[i]} ≡ ${members[j]}`);
            }
        }
    }
    if (clashes.length) {
        return { ok: false, msg: `${clashes.length} 組同類型恐龍對白完全相同：${clashes[0]}` };
    }

    // 跨類別：所有對白不得完全落入同一組（防止整份檔案被複製貼上）
    const allSets = [...sets.values()].map((s) => [...s].sort().join("|"));
    if (new Set(allSets).size !== allSets.length) {
        return { ok: false, msg: "有恐龍對白集合與其他恐龍完全相同" };
    }
    return { ok: true, msg: `${Object.keys(PERSONALITY_GROUPS).length} 類個性組別內對白皆互異` };
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
 * 12. 六章信件長度必須互不相同（避免內容複製貼上）。
 */
function checkStoryLetterArc() {
    const arcs = readJson("content/story-arcs.json");
    if (!arcs) return { ok: false, msg: "無法讀取 story-arcs.json" };

    const chapters = arcs.chapters || [];
    const lengths = chapters.map((c) => (c.letter?.["zh-TW"] || "").length);
    const uniq = new Set(lengths);
    if (uniq.size !== lengths.length) {
        const dupLen = [...uniq].find((n) => lengths.filter((x) => x === n).length > 1);
        return { ok: false, msg: `信件長度有重複（${dupLen} 字），內容疑似複製貼上` };
    }
    return { ok: true, msg: `${lengths.length} 章信件長度互不相同（${lengths.join("/")}）` };
}

/**
 * 13. 任兩章不得共用同一個 scene（診斷 B3）。
 *
 * 若確實共用，必須為該章新增獨立場景，並在 scenes.json 與 music.json 補上設定。
 */
function checkStorySceneUnique() {
    const arcs = readJson("content/story-arcs.json");
    if (!arcs) return { ok: false, msg: "無法讀取 story-arcs.json" };

    const chapters = arcs.chapters || [];
    /** @type {Map<string, number[]>} */
    const byScene = new Map();
    for (const c of chapters) {
        const s = c.scene;
        if (!s) continue;
        if (!byScene.has(s)) byScene.set(s, []);
        byScene.get(s)?.push(c.chapter);
    }
    const shared = [...byScene.entries()].filter(([, list]) => list.length > 1);
    if (shared.length) {
        const [scene, list] = shared[0];
        return { ok: false, msg: `第 ${list.join("、")} 章共用場景「${scene}」，須拆為獨立場景` };
    }

    // 拆分後：每個章節場景都必須在 scenes.json 與 music.json 有對應設定
    const scenes = readJson("content/scenes.json");
    const music = readJson("content/music.json");
    if (!scenes || !music) return { ok: false, msg: "無法讀取 scenes.json 或 music.json" };

    const missing = [];
    for (const c of chapters) {
        if (!scenes[c.scene]) missing.push(`scenes.json 缺 ${c.scene}`);
        if (!music.chapters?.[c.scene]) missing.push(`music.json 缺 ${c.scene}`);
    }
    if (missing.length) {
        return { ok: false, msg: missing.slice(0, 4).join("；") };
    }
    return { ok: true, msg: `${chapters.length} 章各有獨立場景且設定齊備` };
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

    // 強化：不得有任何兩隻角色的 path 數完全相同的比例超過 40%
    /** @type {Map<number, number>} */
    const freq = new Map();
    for (const c of counts) freq.set(c.n, (freq.get(c.n) || 0) + 1);
    let worst = 0;
    let worstN = 0;
    for (const [n, k] of freq) {
        if (k > worst) {
            worst = k;
            worstN = n;
        }
    }
    const ratio = worst / counts.length;
    if (ratio > 0.4) {
        return {
            ok: false,
            msg: `有 ${worst} 隻（${(ratio * 100).toFixed(1)}%）共用 path 數 ${worstN}，超過 40% 上限`
        };
    }
    return { ok: true, msg: `${files.length} 隻角色，${kinds.size} 種體型，最大同型群組 ${worst}/${counts.length}` };
}

/**
 * 14. 24 隻角色中至少 20 隻含漸層或多層色階。
 */
function checkVisualGradient() {
    const dir = join(root, "assets/characters");
    if (!existsSync(dir)) return { ok: false, msg: "assets/characters 不存在" };

    const files = readdirSync(dir).filter((f) => /^dino-.*\.svg$/.test(f) && !/walk/.test(f));
    if (!files.length) return { ok: false, msg: "找不到角色 SVG" };

    const plain = [];
    let withGradient = 0;
    for (const f of files) {
        const svg = readFileSync(join(dir, f), "utf8");
        const hasGradient = /linearGradient|radialGradient/.test(svg);
        // 多層色階：同一色彩出現於 ≥3 個不同 stop／色值
        const stops = [...svg.matchAll(/stop-color="(#[0-9a-fA-F]{3,8})"/g)].map((m) => m[1]);
        const hasTone = new Set(stops).size >= 3;
        if (hasGradient || hasTone) withGradient++;
        else plain.push(f);
    }
    if (withGradient < 20) {
        return {
            ok: false,
            msg: `僅 ${withGradient} 隻含漸層／多層色階（需 ≥20）：${plain.slice(0, 4).join(", ")}`
        };
    }
    return { ok: true, msg: `${withGradient}/${files.length} 隻角色含漸層或多層色階` };
}

/**
 * 15. 每隻角色的 walk-1..4 四幀內容必須不相同。
 */
function checkVisualWalkDiff() {
    const dir = join(root, "assets/characters");
    if (!existsSync(dir)) return { ok: false, msg: "assets/characters 不存在" };

    const files = readdirSync(dir).filter((f) => /^dino-.*\.svg$/.test(f) && !/walk/.test(f));
    if (!files.length) return { ok: false, msg: "找不到角色 SVG" };

    const same = [];
    for (const f of files) {
        const id = f.replace(/\.svg$/, "");
        const frames = [];
        for (let i = 1; i <= 4; i++) {
            const p = join(dir, `${id}-walk-${i}.svg`);
            if (!existsSync(p)) {
                return { ok: false, msg: `${id} 缺少 walk-${i}.svg` };
            }
            // 去掉檔名差異後比對內容
            frames.push(readFileSync(p, "utf8").split("\n").slice(1).join("\n"));
        }
        if (new Set(frames).size < 4) same.push(id);
    }
    if (same.length) {
        return { ok: false, msg: `${same.length} 隻的四幀內容有重複：${same.slice(0, 4).join(", ")}` };
    }
    return { ok: true, msg: `${files.length} 隻的四幀步行內容皆不相同` };
}

/**
 * 16. assets/characters/manifest.json 的每筆 file 與 walkFrames 都必須實際存在。
 */
function checkVisualManifestSync() {
    const path = join(root, "assets/characters/manifest.json");
    if (!existsSync(path)) return { ok: false, msg: "assets/characters/manifest.json 不存在" };

    let manifest;
    try {
        manifest = JSON.parse(readFileSync(path, "utf8"));
    } catch {
        return { ok: false, msg: "manifest.json 無法解析" };
    }
    if (!Array.isArray(manifest) || !manifest.length) {
        return { ok: false, msg: "manifest.json 不是有效陣列" };
    }

    const missing = [];
    for (const entry of manifest) {
        if (!entry.file || !existsSync(join(root, "assets/characters", entry.file))) {
            missing.push(entry.id || entry.file || "(無 id)");
        }
        const frames = entry.walkFrames;
        if (!Array.isArray(frames) || frames.length !== 4) {
            missing.push(`${entry.id}(walkFrames)`);
            continue;
        }
        for (const fr of frames) {
            if (!existsSync(join(root, "assets/characters", fr))) {
                missing.push(`${entry.id}(${fr})`);
            }
        }
    }
    if (missing.length) {
        return { ok: false, msg: `${missing.length} 筆素材不存在：${missing.slice(0, 5).join(", ")}` };
    }
    return { ok: true, msg: `${manifest.length} 筆 manifest 素材全部存在` };
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

/**
 * 三支柱整合：切換場景時，音樂與場景色票必須在 startLevel 內同時套用。
 *
 * startLevel 透過 applySceneAudio() / applySceneVisual() 兩個具名函式委派，
 * 因此本檢查會**解析一層呼叫鏈**：確認 startLevel 本體呼叫了這兩個函式，
 * 且這兩個函式內確實分別呼叫了 playSceneMusic() 與 applyTheme()。
 *
 * 註：若只在 startLevel 內貼上字串而未真正呼叫，檢查同樣會 FAIL。
 */
function checkIntegrationSceneSwitch() {
    const main = readSrc("src/js/main.js");
    if (!main) return { ok: false, msg: "無法讀取 main.js" };

    const fn = main.match(/function startLevel[\s\S]*?\n\}/);
    if (!fn) return { ok: false, msg: "main.js 找不到 startLevel 函式" };

    const body = fn[0];

    /** 取得指定具名函式的本體（以行首 function 宣告為界）。 */
    const funcBody = (name) => {
        const m = main.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`));
        return m ? m[0] : "";
    };

    // startLevel 必須呼叫兩個具名切換函式
    if (!/applySceneAudio\s*\(/.test(body)) {
        return { ok: false, msg: "startLevel 未呼叫 applySceneAudio（場景切換時音樂不會同步）" };
    }
    if (!/applySceneVisual\s*\(/.test(body)) {
        return { ok: false, msg: "startLevel 未呼叫 applySceneVisual（場景切換時色票不會同步）" };
    }

    // 解析一層呼叫鏈：兩個函式內必須真的接上音樂與色票
    const audioBody = funcBody("applySceneAudio");
    const visualBody = funcBody("applySceneVisual");
    if (!audioBody) return { ok: false, msg: "main.js 找不到 applySceneAudio 函式" };
    if (!visualBody) return { ok: false, msg: "main.js 找不到 applySceneVisual 函式" };

    if (!/playSceneMusic\s*\(/.test(audioBody)) {
        return { ok: false, msg: "applySceneAudio 內未呼叫 playSceneMusic（場景切換時音樂不會同步）" };
    }
    if (!/applyTheme\s*\(/.test(visualBody)) {
        return { ok: false, msg: "applySceneVisual 內未呼叫 applyTheme（場景切換時色票不會同步）" };
    }

    return { ok: true, msg: "startLevel → applySceneAudio/applySceneVisual → playSceneMusic/applyTheme 完整串接" };
}

/**
 * SW 預快取清單必須與磁碟實際檔案完全一致（Step 129）。
 *
 * - PRECACHE 中**每個**路徑都必須實際存在於磁碟
 * - content/ 下**每個** .json 都必須被預快取
 */
function checkSwPrecacheValid() {
    const sw = readSrc("service-worker.js");
    if (!sw) return { ok: false, msg: "無法讀取 service-worker.js" };

    const m = sw.match(/PRECACHE\s*=\s*\[([\s\S]*?)\];/);
    if (!m) return { ok: false, msg: "service-worker.js 找不到 PRECACHE 清單" };

    const list = m[1]
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith('"'))
        .map((l) => l.replace(/^"|",?$/g, ""));

    if (!list.length) return { ok: false, msg: "PRECACHE 清單為空" };

    // 每條路徑都必須存在於磁碟
    const missing = list.filter((p) => {
        if (p === "./") return false;
        return !existsSync(join(root, p.replace(/^\.\//, "")));
    });
    if (missing.length) {
        return { ok: false, msg: `預快取指向不存在檔案：${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` 等 ${missing.length} 個` : ""}` };
    }

    // content/ 下每個 .json 都必須被預快取
    const contentFiles = readdirSync(join(root, "content"))
        .filter((f) => f.endsWith(".json"))
        .map((f) => `./content/${f}`);
    const notCached = contentFiles.filter((f) => !list.includes(f));
    if (notCached.length) {
        return { ok: false, msg: `未預快取的 content 檔：${notCached.join(", ")}` };
    }

    // 不得重複
    const dup = list.filter((p, i) => list.indexOf(p) !== i);
    if (dup.length) {
        return { ok: false, msg: `PRECACHE 有重複項目：${[...new Set(dup)].slice(0, 5).join(", ")}` };
    }

    // CACHE_NAME 必須是遞增版本（mumu-v3 → mumu-v4）
    const cacheName = /CACHE_NAME\s*=\s*["']([^"']+)["']/.exec(sw);
    if (!cacheName) return { ok: false, msg: "service-worker.js 缺少 CACHE_NAME" };

    return { ok: true, msg: `預快取清單與磁碟一致，共 ${list.length} 項（${cacheName[1]}）` };
}

/**
 * SW 註冊失敗不得阻塞 boot()（Step 129／130）。
 */function checkSwGracefulDegrade() {
    const main = readSrc("src/js/main.js");
    if (!main) return { ok: false, msg: "無法讀取 main.js" };

    if (!/registerServiceWorker/.test(main)) {
        return { ok: false, msg: "main.js 未註冊 Service Worker（離線冷啟動會失敗）" };
    }
    // 註冊失敗必須被 catch（不得拋錯中斷 boot）
    const fn = main.match(/function registerServiceWorker[\s\S]*?\n\}/);
    if (!fn) return { ok: false, msg: "main.js 找不到 registerServiceWorker 函式" };
    if (!/\.catch\s*\(/.test(fn[0])) {
        return { ok: false, msg: "registerServiceWorker 未處理註冊失敗（會阻塞 boot）" };
    }
    // 離線提示必須是 UI 呈現
    const weather = readSrc("src/js/ui/weather.js");
    if (!weather || !/showOfflineNotice/.test(weather)) {
        return { ok: false, msg: "weather.js 缺少 showOfflineNotice（離線無提示）" };
    }
    return { ok: true, msg: "SW 註冊失敗不阻塞 boot()，離線提示已接線" };
}

/**
 * 遙測外送管線（Step 143）。
 *
 * - telemetry.js 不得是空實作（`void 0;`）
 * - 必須含 sendBeacon／flush／fetch
 * - 必須含指數退避與失敗上限
 * - 事件字典必須補齊關鍵事件
 */
function checkTelemetryPipeline() {
    const t = readSrc("src/js/core/telemetry.js");
    if (!t) return { ok: false, msg: "無法讀取 telemetry.js" };

    if (/void 0;/.test(t)) {
        return { ok: false, msg: "telemetry.js 仍是空實作（事件永遠離不開瀏覽器）" };
    }
    for (const k of ["sendBeacon", "flush", "fetch"]) {
        if (!t.includes(k)) {
            return { ok: false, msg: `telemetry.js 缺少：${k}` };
        }
    }
    // 指數退避
    if (!/Math\.pow\(2/.test(t)) {
        return { ok: false, msg: "telemetry.js 缺指數退避（Math.pow(2, n)）" };
    }
    // 失敗上限（不得無限重試）
    if (!/maxRetries/.test(t)) {
        return { ok: false, msg: "telemetry.js 缺失敗上限（可能無限重試）" };
    }
    // 不得使用 setInterval 輪詢
    if (/setInterval\s*\(/.test(t)) {
        return { ok: false, msg: "telemetry.js 使用 setInterval 輪詢（應改用 visibilitychange + flush）" };
    }
    // 事件字典
    const dict = readJson("content/telemetry.json");
    if (!dict) return { ok: false, msg: "無法讀取 content/telemetry.json" };
    const names = Object.keys(dict.events || dict);
    const need = ["first_interaction", "level_fail", "purchase_success", "vitals", "crash", "session_end"];
    const missing = need.filter((k) => !names.includes(k));
    if (missing.length) {
        return { ok: false, msg: `遙測事件缺少：${missing.join(", ")}` };
    }
    // 每個事件需有 description 與 params
    const events = dict.events || {};
    const noDesc = Object.keys(events).filter((k) => !events[k]?.description);
    if (noDesc.length) {
        return { ok: false, msg: `遙測事件缺 description：${noDesc.slice(0, 5).join(", ")}` };
    }
    return { ok: true, msg: `遙測外送與事件字典齊備，事件數 ${names.length}` };
}

/**
 * 遙測不得外送可識別資訊（Step 143）。
 *
 * 阻擋清單必須涵蓋 email／name／ip／deviceId／token／secret。
 */
function checkTelemetryNoPii() {
    const t = readSrc("src/js/core/telemetry.js");
    if (!t) return { ok: false, msg: "無法讀取 telemetry.js" };

    const blockedMatch = /blocked\s*=\s*\[([^\]]*)\]/.exec(t);
    if (!blockedMatch) return { ok: false, msg: "telemetry.js 找不到阻擋清單（blocked）" };

    const blocked = blockedMatch[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
    const need = ["email", "name", "ip", "deviceId", "token", "secret"];
    const missing = need.filter((k) => !blocked.includes(k));
    if (missing.length) {
        return { ok: false, msg: `PII 阻擋清單缺少：${missing.join(", ")}` };
    }

    // 未取得同意不得外送
    if (!/getConsent\(\)\.analytics/.test(t) && !/consent\.analytics/.test(t)) {
        return { ok: false, msg: "telemetry.js 未檢查同意狀態（可能在未同意時外送）" };
    }
    return { ok: true, msg: `PII 阻擋清單齊備（${blocked.length} 項）` };
}

/**
 * CSP 安全標頭（Step 153）。
 *
 * index.html 必須含 Content-Security-Policy meta，且：
 *   - script-src 不得含 'unsafe-inline' 或 'unsafe-eval'
 *   - object-src 必須為 'none'
 *   - base-uri 必須為 'none'
 */
function checkCspBaseline() {
    const index = readSrc("index.html");
    if (!index) return { ok: false, msg: "無法讀取 index.html" };

    const m = /http-equiv=["']Content-Security-Policy["'][^>]*content=(["'])([\s\S]*?)\1/i.exec(index);
    if (!m) return { ok: false, msg: "index.html 缺少 Content-Security-Policy meta" };

    const csp = m[2];

    const scriptSrc = /script-src\s+([^;]+)/i.exec(csp);
    if (!scriptSrc) return { ok: false, msg: "CSP 缺少 script-src" };
    if (/unsafe-inline|unsafe-eval/.test(scriptSrc[1])) {
        return { ok: false, msg: `CSP script-src 含 unsafe 指令：${scriptSrc[1].trim()}` };
    }

    const objectSrc = /object-src\s+([^;]+)/i.exec(csp);
    if (!objectSrc || !/none/.test(objectSrc[1])) {
        return { ok: false, msg: "CSP object-src 必須為 'none'" };
    }

    const baseUri = /base-uri\s+([^;]+)/i.exec(csp);
    if (!baseUri || !/none/.test(baseUri[1])) {
        return { ok: false, msg: "CSP base-uri 必須為 'none'" };
    }

    if (!/default-src\s+/.test(csp)) {
        return { ok: false, msg: "CSP 缺少 default-src" };
    }

    return { ok: true, msg: `CSP 基線齊備（script-src ${scriptSrc[1].trim()}，object-src/base-uri none）` };
}

/**
 * 輸入驗證與 XSS 防護（Step 153）。
 *
 * - sanitize-html.js 必須提供 escapeHtml 與 safeText
 * - input-validate.js 必須提供 URL 白名單與推薦碼驗證
 * - 已硬化檔案不得再直接注入內容型資料
 */
function checkXssHardened() {
    const sanitize = readSrc("src/js/core/sanitize-html.js");
    if (!sanitize) return { ok: false, msg: "缺少 src/js/core/sanitize-html.js" };
    if (!/export function escapeHtml/.test(sanitize)) {
        return { ok: false, msg: "sanitize-html.js 缺少 escapeHtml" };
    }
    if (!/export function safeText/.test(sanitize)) {
        return { ok: false, msg: "sanitize-html.js 缺少 safeText" };
    }

    const validate = readSrc("src/js/core/input-validate.js");
    if (!validate) return { ok: false, msg: "缺少 src/js/core/input-validate.js" };
    for (const fn of ["safeUrl", "safeReferralCode", "safeString", "safeQueryParam"]) {
        if (!validate.includes(`export function ${fn}`)) {
            return { ok: false, msg: `input-validate.js 缺少 ${fn}` };
        }
    }
    // URL 白名單：僅允許 https: 與相對路徑
    if (!/protocol\s*===\s*"https:"/.test(validate)) {
        return { ok: false, msg: "input-validate.js 的 URL 驗證未限制為 https:" };
    }

    // 已硬化檔案必須確實使用 escapeHtml
    for (const f of ["src/js/ui/story.js", "src/js/ui/dex.js"]) {
        const src = readSrc(f);
        if (!src) return { ok: false, msg: `無法讀取 ${f}` };
        if (!/escapeHtml/.test(src)) {
            return { ok: false, msg: `${f} 未使用 escapeHtml（XSS 未硬化）` };
        }
    }

    return { ok: true, msg: "XSS 防護齊備：escapeHtml／safeText／URL 白名單／推薦碼驗證" };
}

/**
 * Web Vitals 量測（Step 131）。
 *
 * - vitals.js 必須存在且無 API 時降級為 null（不得拋錯）
 * - 必須量測 LCP／CLS／INP
 * - 必須有 trackFirstInteraction()
 */
function checkWebVitals() {
    const v = readSrc("src/js/core/vitals.js");
    if (!v) return { ok: false, msg: "缺少 src/js/core/vitals.js" };

    for (const k of ["largest-contentful-paint", "layout-shift", "event"]) {
        if (!v.includes(k)) {
            return { ok: false, msg: `vitals.js 未量測：${k}` };
        }
    }
    if (!/export function trackFirstInteraction/.test(v)) {
        return { ok: false, msg: "vitals.js 缺少 trackFirstInteraction()" };
    }
    // 無 API 時降級為 null
    if (!/PerformanceObserver\s*===\s*"undefined"/.test(v)) {
        return { ok: false, msg: "vitals.js 未處理 PerformanceObserver 缺席（會拋錯）" };
    }
    if (!/getVitals/.test(v)) {
        return { ok: false, msg: "vitals.js 缺少 getVitals()（無法降級為 null）" };
    }
    // 不得使用 setInterval 輪詢
    if (/setInterval\s*\(/.test(v)) {
        return { ok: false, msg: "vitals.js 使用 setInterval 輪詢（應以事件驅動）" };
    }

    // main.js 必須接上
    const main = readSrc("src/js/main.js");
    if (!/initVitals/.test(main)) {
        return { ok: false, msg: "main.js 未呼叫 initVitals()（Web Vitals 未啟用）" };
    }

    return { ok: true, msg: "Web Vitals 量測齊備（LCP／CLS／INP + 第一次互動），無 API 時降級 null" };
}

/**
 * 5. 程序化場景音樂：每個場景必須有獨立定義，且 (root, tempo) 互不相同。
 */
function checkMusicSceneDistinct() {
    const src = readSrc("src/js/audio/scene-music.js");
    if (!src) return { ok: false, msg: "src/js/audio/scene-music.js 不存在" };

    // 解析 SCENE_MUSIC 物件
    const start = src.indexOf("export const SCENE_MUSIC");
    if (start < 0) return { ok: false, msg: "SCENE_MUSIC 未匯出" };
    const end = src.indexOf("\n};", start);
    const block = src.slice(start, end);

    const ids = [...block.matchAll(/^\s{4}"?([a-z0-9-]+)"?:\s*\{/gm)].map((m) => m[1]);
    if (ids.length < 5) return { ok: false, msg: `場景音樂僅 ${ids.length} 個（需 ≥5）` };

    const combos = [...block.matchAll(/root:\s*(\d+)/g)].map((m) => m[1]);
    const tempos = [...block.matchAll(/tempo:\s*(\d+)/g)].map((m) => m[1]);
    if (combos.length !== ids.length || tempos.length !== ids.length) {
        return { ok: false, msg: "部分場景缺少 root 或 tempo" };
    }

    const pairs = ids.map((_, i) => `${combos[i]}/${tempos[i]}`);
    const uniq = new Set(pairs);
    if (uniq.size !== pairs.length) {
        return { ok: false, msg: `${pairs.length} 個場景只有 ${uniq.size} 組不同的 (root, tempo)` };
    }
    return { ok: true, msg: `${ids.length} 個場景音樂 (root, tempo) 互不相同` };
}

/**
 * 6. 程序化音樂必須可渲染：實跑 renderSceneMusic，確認每個場景都能產出非靜音緩衝區。
 */
function checkMusicRenderable() {
    const path = join(root, "src/js/audio/scene-music.js");
    if (!existsSync(path)) return { ok: false, msg: "scene-music.js 不存在" };

    // 以動態 import 實測（此檔案無瀏覽器相依，僅需 AudioContext 介面）
    const script = `
        class FakeCtx {
            constructor(){ this.sampleRate = 44100; }
            createBuffer(ch, len){
                const d = [new Float32Array(len), new Float32Array(len)];
                return { getChannelData(i){ return d[i]; } };
            }
        }
        globalThis.AudioContext = FakeCtx;
        const m = await import(${JSON.stringify(pathToFileURL(path).href)});
        const results = [];
        for (const k of Object.keys(m.SCENE_MUSIC)) {
            const buf = m.renderSceneMusic(new FakeCtx(), k, 4);
            if (!buf) { results.push([k, 0]); continue; }
            const L = buf.getChannelData(0);
            let peak = 0;
            for (let i = 0; i < L.length; i++) { const a = Math.abs(L[i]); if (a > peak) peak = a; }
            results.push([k, peak]);
        }
        process.stdout.write(JSON.stringify(results));
    `;
    // 同步執行：改用 child_process
    const { execFileSync } = require("node:child_process");
    let out = "";
    try {
        out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
        });
    } catch {
        return { ok: false, msg: "renderSceneMusic 實測執行失敗" };
    }

    let results;
    try {
        results = JSON.parse(out.trim().split("\n").pop() || "[]");
    } catch {
        return { ok: false, msg: "無法解析實測輸出" };
    }
    if (!results.length) return { ok: false, msg: "實測無輸出" };

    const silent = results.filter(([, peak]) => peak < 0.05);
    if (silent.length) {
        return { ok: false, msg: `${silent.length} 個場景渲染為靜音：${silent.map(([k]) => k).join(", ")}` };
    }
    return { ok: true, msg: `${results.length} 個場景皆渲染出非靜音緩衝區` };
}

/**
 * 7. content/scenes.json 的每個場景都必須在 SCENE_MUSIC 中有對應的音樂場景鍵。
 */
function checkMusicScenesDefined() {
    const scenes = readJson("content/scenes.json");
    if (!scenes) return { ok: false, msg: "content/scenes.json 不存在" };

    const src = readSrc("src/js/audio/scene-music.js");
    if (!src) return { ok: false, msg: "無法讀取 scene-music.js" };

    const start = src.indexOf("export const SCENE_MUSIC");
    if (start < 0) return { ok: false, msg: "SCENE_MUSIC 未匯出" };
    const end = src.indexOf("\n};", start);
    const block = src.slice(start, end);
    const defined = new Set(
        [...block.matchAll(/^\s{4}"?([a-z0-9-]+)"?:\s*\{/gm)].map((m) => m[1])
    );

    const missing = [];
    const sceneKeys = Object.keys(scenes).filter((k) => !k.startsWith("_"));
    for (const key of sceneKeys) {
        const v = scenes[key];
        // 場景宣告的音樂場景鍵必須存在於 SCENE_MUSIC
        const musicScene = v?.music?.scene;
        if (!musicScene) {
            missing.push(`${key}(未宣告 music.scene)`);
            continue;
        }
        if (!defined.has(musicScene)) missing.push(`${key}→${musicScene}`);
    }
    if (missing.length) {
        return { ok: false, msg: `${missing.length} 個場景無對應音樂：${missing.join(", ")}` };
    }
    return { ok: true, msg: `${sceneKeys.length} 個場景皆有對應的 SCENE_MUSIC 音樂鍵` };
}

/* ------------------------------------------------------------------ *
 * 場景設定（Step 82）
 * ------------------------------------------------------------------ */

/**
 * 12. scenes.json 必須涵蓋 levels.json 用到的全部 scene，且每個場景的 palette 完整。
 */
function checkScenesCoverLevels() {
    const scenes = readJson("content/scenes.json");
    const levels = readJson("content/levels.json");
    if (!scenes || !levels) return { ok: false, msg: "無法讀取 scenes.json 或 levels.json" };

    const used = [...new Set((levels.levels || levels || []).map((l) => l.scene).filter(Boolean))];
    const missing = used.filter((s) => !scenes[s]);
    if (missing.length) {
        return { ok: false, msg: `scenes.json 未涵蓋場景：${missing.join(", ")}` };
    }
    return { ok: true, msg: `涵蓋 levels.json 全部 ${used.length} 個場景` };
}

/**
 * 13. 每個場景的 palette 必須完整，且每個色值都是合法 6 位 hex。
 */
function checkScenesPaletteValid() {
    const scenes = readJson("content/scenes.json");
    if (!scenes) return { ok: false, msg: "content/scenes.json 不存在" };

    const required = ["sky", "glow", "fog", "ridge", "midground", "foreground"];
    const hex = /^#[0-9a-fA-F]{6}$/;
    const bad = [];
    const sceneKeys = Object.keys(scenes).filter((k) => !k.startsWith("_"));

    for (const key of sceneKeys) {
        const v = scenes[key];
        const p = v?.palette;
        if (!p) {
            bad.push(`${key}(缺 palette)`);
            continue;
        }
        for (const c of required) {
            if (!p[c]) bad.push(`${key}.${c}(缺色)`);
            else if (!hex.test(p[c])) bad.push(`${key}.${c}=${p[c]}(非法 hex)`);
        }
        if (!v?.title?.["zh-TW"] || !v?.title?.["en-US"]) bad.push(`${key}(標題缺雙語)`);
        if (!v?.music?.scene) bad.push(`${key}(缺 music.scene)`);
        if (!v?.weather) bad.push(`${key}(缺 weather)`);
    }
    if (bad.length) {
        return { ok: false, msg: `${bad.length} 項場景設定不完整：${bad.slice(0, 6).join(", ")}` };
    }
    return { ok: true, msg: `${sceneKeys.length} 個場景 palette 皆完整且為合法 hex` };
}

/**
 * 14. 場景設定不得使用 emoji 作為符號。
 */
function checkScenesNoEmoji() {
    const scenes = readJson("content/scenes.json");
    if (!scenes) return { ok: false, msg: "content/scenes.json 不存在" };

    const emoji = /\p{Extended_Pictographic}|[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u;
    for (const [key, v] of Object.entries(scenes)) {
        if (key.startsWith("_")) continue;
        if (emoji.test(JSON.stringify(v))) {
            return { ok: false, msg: `場景 ${key} 含 emoji` };
        }
    }
    return { ok: true, msg: "場景設定無 emoji" };
}

/**
 * 15. 場景連續性：每章的 story-arcs.json scene 必須與該章關卡的 scene 完全一致。
 */
function checkScenesChapterContinuity() {
    const arcs = readJson("content/story-arcs.json");
    const levels = readJson("content/levels.json");
    const scenes = readJson("content/scenes.json");
    if (!arcs || !levels || !scenes) {
        return { ok: false, msg: "無法讀取 story-arcs.json / levels.json / scenes.json" };
    }

    const list = levels.levels || levels || [];
    /** @type {Map<number, Set<string>>} */
    const byChapter = new Map();
    for (const l of list) {
        if (!l?.scene) continue;
        if (!byChapter.has(l.chapter)) byChapter.set(l.chapter, new Set());
        byChapter.get(l.chapter).add(l.scene);
    }

    const bad = [];
    for (const c of arcs.chapters || []) {
        const used = byChapter.get(c.chapter);
        if (!used || !used.size) {
            bad.push(`第${c.chapter}章無關卡`);
            continue;
        }
        if (!used.has(c.scene)) {
            bad.push(`第${c.chapter}章 arcs=${c.scene} vs levels=${[...used].join("/")}`);
        }
        if (!scenes[c.scene]) bad.push(`第${c.chapter}章場景 ${c.scene} 未定義於 scenes.json`);
    }
    if (bad.length) {
        return { ok: false, msg: `${bad.length} 項場景連續性不一致：${bad.slice(0, 5).join("；")}` };
    }
    return { ok: true, msg: `${(arcs.chapters || []).length} 章的章節場景與關卡場景完全一致` };
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
 * Round 1 上市紅線（L1–L4）
 * ------------------------------------------------------------------ */

/**
 * L1：付費牆不得假成交、不得殘留「敬請期待」、不得不實承諾。
 */
function checkPaywallHonest() {
    const paywall = readSrc("src/js/ui/paywall.js");
    if (!paywall) return { ok: false, msg: "無法讀取 paywall.js" };

    const cleaned = stripComments(paywall);

    // 不得殘留「敬請期待」
    if (/敬請期待|coming soon/i.test(cleaned)) {
        return { ok: false, msg: "paywall.js 仍殘留「敬請期待」假成交文案" };
    }

    // 不得不實承諾跨裝置同步
    if (/跨裝置同步|cross-device sync/i.test(cleaned)) {
        return { ok: false, msg: "paywall.js 含不實「跨裝置同步」承諾" };
    }

    // 必須使用 escapeHtml
    if (!/escapeHtml\s*\(/.test(cleaned)) {
        return { ok: false, msg: "paywall.js 未使用 escapeHtml（內容型插值未跳脫）" };
    }

    // 必須有 in-flight lock（防連點）
    if (!/disabled\s*=\s*true/.test(cleaned)) {
        return { ok: false, msg: "paywall.js 缺 in-flight lock（防連點）" };
    }

    // 必須有 Esc 關閉與 Focus Trap
    if (!/Escape/.test(cleaned)) return { ok: false, msg: "paywall.js 缺 Esc 關閉" };
    if (!/trapFocus/.test(cleaned)) return { ok: false, msg: "paywall.js 缺 Focus Trap" };

    // 必須有明確回饋與「我知道了」按鈕
    if (!/我知道了|Got it/.test(cleaned)) {
        return { ok: false, msg: "paywall.js 缺明確回饋與確認按鈕" };
    }

    // main.js 的付費牆文案不得含不實承諾
    const main = readSrc("src/js/main.js");
    if (main && /跨裝置同步/.test(stripComments(main))) {
        return { ok: false, msg: "main.js 付費牆文案仍含不實「跨裝置同步」" };
    }

    return { ok: true, msg: "付費牆已移除假成交與不實承諾，含 escapeHtml／防連點／Esc／Focus Trap" };
}

/**
 * L2：boot() 載入失敗必須顯示可見的錯誤恢復面板（含重試鈕）。
 */
function checkBootErrorRecovery() {
    const main = readSrc("src/js/main.js");
    if (!main) return { ok: false, msg: "無法讀取 main.js" };

    const cleaned = stripComments(main);

    if (!/showBootError/.test(cleaned)) {
        return { ok: false, msg: "main.js 缺 boot() 失敗的錯誤恢復面板" };
    }

    // 必須隱藏 start-overlay（否則面板被遮蔽 → 白屏）
    const fn = cleaned.match(/function showBootError[\s\S]*?\n\}/);
    if (!fn) return { ok: false, msg: "main.js 找不到 showBootError 函式" };
    if (!/start-overlay/.test(fn[0])) {
        return { ok: false, msg: "showBootError 未隱藏 #start-overlay（面板會被遮蔽）" };
    }
    if (!/role["']?,\s*["']alert["']/.test(fn[0]) && !/setAttribute\(\s*["']role["']\s*,\s*["']alert["']/.test(fn[0])) {
        return { ok: false, msg: "showBootError 未設定 role=\"alert\"" };
    }

    // 必須有重試鈕與 in-flight lock
    if (!/boot-retry-btn/.test(fn[0])) return { ok: false, msg: "showBootError 缺重試按鈕" };
    if (!/disabled\s*=\s*true/.test(fn[0])) {
        return { ok: false, msg: "showBootError 缺 in-flight lock（防連點）" };
    }

    // 必須有離線／網路提示
    if (!/網路|connection|offline|連線/i.test(fn[0])) {
        return { ok: false, msg: "showBootError 缺離線／網路檢查提示" };
    }

    return { ok: true, msg: "boot() 失敗已有可見錯誤恢復面板（role=alert／重試鈕／防連點／離線提示）" };
}

/**
 * L3：頁尾條款必須在應用內開啟可捲動面板（含載入失敗重試）。
 */
function checkLegalPanelInApp() {
    const main = readSrc("src/js/main.js");
    const gate = readSrc("src/js/ui/consent-gate.js");
    if (!main || !gate) return { ok: false, msg: "無法讀取 main.js 或 consent-gate.js" };

    // main.js 必須攔截頁尾條款點擊
    if (!/openLegalDocument/.test(stripComments(main))) {
        return { ok: false, msg: "main.js 未接上應用內條款面板" };
    }
    if (!/preventDefault/.test(stripComments(main))) {
        return { ok: false, msg: "main.js 頁尾條款未 preventDefault（會跳出獨立模式）" };
    }
    if (!/bindLegalLink\s*\(/.test(stripComments(main))) {
        return { ok: false, msg: "main.js 未綁定頁尾條款的應用內條款面板" };
    }
    for (const kind of ["privacy", "terms"]) {
        if (!new RegExp(`bindLegalLink\\([^)]*["']${kind}["']`).test(stripComments(main))) {
            return { ok: false, msg: `main.js 未綁定「${kind}」條款的應用內條款面板` };
        }
    }

    const cleaned = stripComments(gate);
    if (!/export function openLegalDocument/.test(cleaned)) {
        return { ok: false, msg: "consent-gate.js 未匯出 openLegalDocument" };
    }
    // 載入失敗重試
    if (!/legal-retry/.test(cleaned)) return { ok: false, msg: "條款面板缺載入失敗重試按鈕" };
    // 可捲動
    if (!/consent-policy__body/.test(cleaned)) return { ok: false, msg: "條款面板缺可捲動容器" };
    // Focus Trap + Esc
    if (!/trapFocus/.test(cleaned)) return { ok: false, msg: "條款面板缺 Focus Trap" };
    if (!/Escape/.test(cleaned)) return { ok: false, msg: "條款面板缺 Esc 關閉" };

    return { ok: true, msg: "頁尾隱私權／服務條款已改為應用內可捲動面板（骨架／重試／Focus Trap／Esc）" };
}

/**
 * L4：無障礙縮放合規與中英品牌標題統一。
 */
function checkBrandAndViewport() {
    const index = readSrc("index.html");
    const manifest = readJson("manifest.json");
    if (!index || !manifest) return { ok: false, msg: "無法讀取 index.html 或 manifest.json" };

    // 不得 user-scalable=no（WCAG 縮放違規）
    if (/user-scalable\s*=\s*no/i.test(index)) {
        return { ok: false, msg: "index.html 仍含 user-scalable=no（違反 WCAG 縮放規範）" };
    }
    if (!/name=["']viewport["']/.test(index)) {
        return { ok: false, msg: "index.html 缺 viewport meta" };
    }

    // 品牌標題統一
    const title = /<title>([^<]*)<\/title>/.exec(index);
    if (!title) return { ok: false, msg: "index.html 缺 <title>" };
    if (!/木木遊戲/.test(title[1]) || !/聖誕小幫手/.test(title[1])) {
        return { ok: false, msg: `index.html <title> 未統一為「木木遊戲：聖誕小幫手」：${title[1]}` };
    }
    if (!/木木遊戲/.test(String(manifest.name || ""))) {
        return { ok: false, msg: `manifest.json name 未統一為木木遊戲：${manifest.name}` };
    }
    if (!/木木遊戲/.test(String(manifest.short_name || ""))) {
        return { ok: false, msg: `manifest.json short_name 未統一為木木遊戲：${manifest.short_name}` };
    }

    // 過關微文案不得殘留英文預設 "Level Up!"
    if (/Level Up!/i.test(index)) {
        return { ok: false, msg: "index.html 過關微文案仍為英文「Level Up!」" };
    }
    if (!/過關了/.test(index)) {
        return { ok: false, msg: "index.html 過關微文案未改為中文預設「過關了！」" };
    }

    return { ok: true, msg: "viewport 縮放合規、品牌標題統一、過關微文案已中文化" };
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
    { id: "music-scene-distinct", phase: "music", fn: checkMusicSceneDistinct },
    { id: "music-renderable", phase: "music", fn: checkMusicRenderable },
    { id: "music-scenes-defined", phase: "music", fn: checkMusicScenesDefined },
    { id: "story-dino-lines", phase: "story", fn: checkStoryDinoLines },
    { id: "story-letter-length", phase: "story", fn: checkStoryLetterLength },
    { id: "story-lines-count", phase: "story", fn: checkStoryLinesCount },
    { id: "story-dino-personality", phase: "story", fn: checkStoryDinoPersonality },
    { id: "story-letter-arc", phase: "story", fn: checkStoryLetterArc },
    { id: "story-scene-unique", phase: "story", fn: checkStorySceneUnique },
    { id: "visual-body-types", phase: "visual", fn: checkVisualBodyTypes },
    { id: "visual-gradient", phase: "visual", fn: checkVisualGradient },
    { id: "visual-walk-diff", phase: "visual", fn: checkVisualWalkDiff },
    { id: "visual-manifest-sync", phase: "visual", fn: checkVisualManifestSync },
    { id: "visual-parallax", phase: "visual", fn: checkVisualParallax },
    { id: "visual-scene-diff", phase: "visual", fn: checkVisualSceneDiff },
    { id: "scenes-cover-levels", phase: "scenes", fn: checkScenesCoverLevels },
    { id: "scenes-palette-valid", phase: "scenes", fn: checkScenesPaletteValid },
    { id: "scenes-no-emoji", phase: "scenes", fn: checkScenesNoEmoji },
    { id: "scenes-chapter-continuity", phase: "scenes", fn: checkScenesChapterContinuity },
    { id: "integration-scene-switch", phase: "integration", fn: checkIntegrationSceneSwitch },
    { id: "sw-precache-valid", phase: "integration", fn: checkSwPrecacheValid },
    { id: "sw-graceful-degrade", phase: "integration", fn: checkSwGracefulDegrade },
    { id: "telemetry-pipeline", phase: "integration", fn: checkTelemetryPipeline },
    { id: "telemetry-no-pii", phase: "security", fn: checkTelemetryNoPii },
    { id: "csp-baseline", phase: "security", fn: checkCspBaseline },
    { id: "xss-hardened", phase: "security", fn: checkXssHardened },
    { id: "web-vitals", phase: "integration", fn: checkWebVitals },
    { id: "child-no-jargon", phase: "child", fn: checkChildNoJargon },
    { id: "child-no-eval-widget", phase: "child", fn: checkChildNoEvalWidget },
    { id: "child-voice-complete", phase: "child", fn: checkChildVoiceComplete },
    { id: "child-positive-check", phase: "child", fn: checkChildPositiveCheck },
    { id: "child-share-uses-voice", phase: "child", fn: checkChildShareUsesVoice },
    { id: "child-hud-level", phase: "child", fn: checkChildHudLevel },
    { id: "child-single-layer", phase: "child", fn: checkChildSingleLayer },
    { id: "parent-view-untouched", phase: "child", fn: checkParentViewUntouched },
    { id: "child-no-eval-widget-final", phase: "child", fn: checkChildNoEvalWidgetFinal },
    { id: "parent-view-intact", phase: "child", fn: checkParentViewIntact },
    { id: "paywall-honest", phase: "compliance", fn: checkPaywallHonest },
    { id: "boot-error-recovery", phase: "resilience", fn: checkBootErrorRecovery },
    { id: "legal-panel-in-app", phase: "compliance", fn: checkLegalPanelInApp },
    { id: "brand-viewport-a11y", phase: "compliance", fn: checkBrandAndViewport }
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
