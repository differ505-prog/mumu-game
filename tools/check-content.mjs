/**
 * 內容一致性驗證工具（純讀檔，無副作用）。
 *
 * 檢查項目：
 *  1. content/*.json 皆可解析
 *  2. levels.json：40 關、id 唯一、六章齊備、每章至少一關
 *  3. characters.json：7 隻可玩、24 隻圖鑑、art 檔存在於 assets/characters/
 *  4. items.json：九軸皆非空、dinos 恰 24、footprints 與 dinos 一一對應
 *  5. 兩份 narrative 的 contexts 鍵、letters.perChapter 鍵、dinoLines 鍵完全一致
 *  6. story-arcs.json：六章、scene 對應已宣告場景
 *  7. assessment.json（若存在）與遊戲題庫題目 id 無重疊 ← 練習效應防護
 *  8. minimal-pairs.json：zh-TW ≥ 12 組、en-US ≥ 10 組
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];

/**
 * 讀取並解析 JSON。
 * @param {string} rel
 */
function readJson(rel) {
    const path = join(root, rel);
    if (!existsSync(path)) {
        problems.push(`缺少檔案: ${rel}`);
        return null;
    }
    try {
        return JSON.parse(readFileSync(path, "utf8"));
    } catch (err) {
        problems.push(`${rel} 無法解析: ${err.message}`);
        return null;
    }
}

const levels = readJson("content/levels.json");
const characters = readJson("content/characters.json");
const items = readJson("content/items.json");
const narrativeZh = readJson("content/narrative.zh-TW.json");
const narrativeEn = readJson("content/narrative.en-US.json");
const arcs = readJson("content/story-arcs.json");
const minimalPairs = readJson("content/minimal-pairs.json");
const assessment = existsSync(join(root, "content/assessment.json"))
    ? readJson("content/assessment.json")
    : null;

/* --- 2. levels --- */
if (levels) {
    if (!Array.isArray(levels) || levels.length !== 40) {
        problems.push(`levels.json 應為 40 關，實際 ${Array.isArray(levels) ? levels.length : "非陣列"}`);
    }
    const ids = (levels || []).map((/** @type {any} */ l) => l.id);
    if (new Set(ids).size !== ids.length) {
        problems.push("levels.json 的 id 有重複");
    }
    const chapters = new Set((levels || []).map((/** @type {any} */ l) => l.chapter));
    for (let c = 0; c <= 5; c++) {
        if (!chapters.has(c)) problems.push(`levels.json 缺少第 ${c} 章`);
    }
    for (const level of levels || []) {
        if (!level.objective) problems.push(`關卡 ${level.id} 缺少 objective`);
        if (!level.verb) problems.push(`關卡 ${level.id} 缺少 verb`);
        if (!level.spec) problems.push(`關卡 ${level.id} 缺少 spec`);
    }
}

/* --- 3. characters --- */
if (characters) {
    const playable = characters.playable || [];
    const dex = characters.dex || [];
    if (playable.length !== 7) problems.push(`可玩角色應為 7 隻，實際 ${playable.length}`);
    if (dex.length !== 24) problems.push(`圖鑑應為 24 隻，實際 ${dex.length}`);
    const dexIds = new Set(dex.map((/** @type {any} */ d) => d.id));
    if (dexIds.size !== dex.length) problems.push("圖鑑 id 有重複");
    for (const c of [...playable, ...dex]) {
        const file = join(root, c.art?.file || "");
        if (!existsSync(file)) {
            problems.push(`角色 ${c.id} 的素材不存在: ${c.art?.file}`);
        }
        if (!c.unlockCondition && !c.unlock) {
            problems.push(`角色 ${c.id} 缺少解鎖條件`);
        }
    }
}

/* --- 4. items --- */
if (items) {
    const axes = ["colors", "shapes", "animals", "dinos", "numbers", "pitches", "rhythms", "interference", "footprints"];
    for (const axis of axes) {
        if (!Array.isArray(items[axis]) || items[axis].length === 0) {
            problems.push(`items.json 的 ${axis} 應為非空陣列`);
        }
    }
    if (Array.isArray(items.dinos) && items.dinos.length !== 24) {
        problems.push(`items.json 的 dinos 應為 24 隻，實際 ${items.dinos.length}`);
    }
    if (Array.isArray(items.dinos) && Array.isArray(items.footprints)) {
        const dinoIds = items.dinos.map((/** @type {any} */ d) => d.id).sort().join(",");
        const footIds = items.footprints.map((/** @type {any} */ f) => f.dinoId).sort().join(",");
        if (dinoIds !== footIds) {
            problems.push("items.json 的 footprints 與 dinos 未一一對應");
        }
    }
}

/* --- 5. narrative 對稱 --- */
if (narrativeZh && narrativeEn) {
    const ctxKeys = (/** @type {any} */ n) => Object.keys(n.contexts || {}).sort().join(",");
    if (ctxKeys(narrativeZh) !== ctxKeys(narrativeEn)) {
        problems.push("兩份 narrative 的 contexts 鍵集合不一致");
    }
    const perChapter = (/** @type {any} */ n) => Object.keys(n.letters?.perChapter || {}).sort().join(",");
    if (perChapter(narrativeZh) !== perChapter(narrativeEn)) {
        problems.push("兩份 narrative 的 letters.perChapter 鍵不一致");
    }
    const dinoLines = (/** @type {any} */ n) => Object.keys(n.dinoLines || {}).sort().join(",");
    if (dinoLines(narrativeZh) !== dinoLines(narrativeEn)) {
        problems.push("兩份 narrative 的 dinoLines 鍵不一致");
    }
    const countLines = (/** @type {any} */ n) =>
        Object.values(n.contexts || {}).reduce((s, x) => s + x.length, 0);
    if (countLines(narrativeZh) < 60) problems.push("zh-TW 台詞少於 60 句");
    if (countLines(narrativeEn) < 60) problems.push("en-US 台詞少於 60 句");
}

/* --- 6. story arcs --- */
if (arcs) {
    const chapters = arcs.chapters || [];
    if (chapters.length !== 6) problems.push(`story-arcs.json 應為 6 章，實際 ${chapters.length}`);
    const scenes = new Set(chapters.map((/** @type {any} */ c) => c.scene));
    const declared = new Set(
        (levels || []).map((/** @type {any} */ l) => l.scene).filter(Boolean)
    );
    for (const scene of scenes) {
        if (declared.size && !declared.has(scene)) {
            problems.push(`story-arcs 的場景 ${scene} 未在 levels.json 中出現`);
        }
    }
    for (const c of chapters) {
        if (!c.title || !c.letter || !c.verbs?.length) {
            problems.push(`章節 ${c.chapter} 缺少 title／letter／verbs`);
        }
    }
}

/* --- 7. 練習效應防護 --- */
if (assessment) {
    /** @type {Set<string>} */
    const gameIds = new Set();
    for (const axis of Object.values(items || {})) {
        if (Array.isArray(axis)) {
            for (const it of axis) {
                if (it && typeof it === "object" && it.id) gameIds.add(String(it.id));
            }
        }
    }
    for (const pair of [...(minimalPairs?.["zh-TW"] || []), ...(minimalPairs?.["en-US"] || [])]) {
        if (pair?.id) gameIds.add(String(pair.id));
    }

    const assessmentIds = new Set();
    // 支援 scales（單一測驗組）與 pretest/posttest（前測／後測分離）兩種結構
    const groups = assessment.scales
        ? { single: assessment.scales }
        : { pretest: assessment.pretest, posttest: assessment.posttest };

    for (const [groupName, scales] of Object.entries(groups)) {
        for (const [scaleName, scale] of Object.entries(scales || {})) {
            for (const [locale, list] of Object.entries(scale || {})) {
                if (!Array.isArray(list)) continue;
                for (const item of list) {
                    if (item?.id) {
                        const fullId = `${groupName}:${scaleName}:${locale}:${item.id}`;
                        assessmentIds.add(fullId);
                        if (gameIds.has(String(item.id))) {
                            problems.push(`assessment 題目 id 與遊戲題庫重疊: ${item.id}`);
                        }
                    }
                }
            }
        }
    }

    // 前測與後測題面不得完全相同（否則構成練習效應）
    if (assessment.pretest && assessment.posttest) {
        for (const [scaleName, scale] of Object.entries(assessment.pretest)) {
            const post = assessment.posttest[scaleName];
            if (!post) continue;
            for (const locale of ["zh-TW", "en-US"]) {
                const preList = scale?.[locale] || [];
                const postList = post?.[locale] || [];
                if (preList.length !== postList.length) {
                    problems.push(`assessment ${scaleName}/${locale} 前後測題數不一致`);
                }
                for (const pre of preList) {
                    const match = postList.find((/** @type {any} */ p) => p.id === `${pre.id}-p`);
                    if (!match) {
                        problems.push(`assessment ${scaleName}/${locale} 後測缺少對應題目: ${pre.id}-p`);
                        continue;
                    }
                    if (Array.isArray(pre.options) && Array.isArray(match.options)
                        && JSON.stringify(pre.options) === JSON.stringify(match.options)) {
                        problems.push(`assessment ${scaleName}/${locale} 前後測選項順序相同: ${pre.id}`);
                    }
                    if (Array.isArray(pre.sequence) && Array.isArray(match.sequence)
                        && JSON.stringify(pre.sequence) === JSON.stringify(match.sequence)) {
                        problems.push(`assessment ${scaleName}/${locale} 前後測序列內容相同: ${pre.id}`);
                    }
                }
            }
        }
    }

    const total = assessmentIds.size;
    if (total < 60) problems.push(`assessment 題目數 ${total} < 60`);
}

/* --- 8. minimal pairs --- */
if (minimalPairs) {
    if (!Array.isArray(minimalPairs["zh-TW"]) || minimalPairs["zh-TW"].length < 12) {
        problems.push("minimal-pairs.json 的 zh-TW 應至少 12 組");
    }
    if (!Array.isArray(minimalPairs["en-US"]) || minimalPairs["en-US"].length < 10) {
        problems.push("minimal-pairs.json 的 en-US 應至少 10 組");
    }
}

/* --- 輸出 --- */
if (problems.length) {
    console.error("[FAIL] 內容驗證失敗：");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
}

console.log("[PASS] 內容驗證通過：levels 40／chapters 6／characters 7+24／items 9 軸／narrative 對稱");
