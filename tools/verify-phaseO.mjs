/**
 * Phase O 回歸守門工具（純讀檔／純 import，無副作用，不啟動任何伺服器）。
 *
 * 用法：
 *   node tools/verify-phaseO.mjs            # 執行全部檢查
 *   node tools/verify-phaseO.mjs --phase 1  # 只執行 Step 65–70 的檢查
 *   node tools/verify-phaseO.mjs --phase 2  # 只執行 Step 71–78 的檢查
 *   node tools/verify-phaseO.mjs --list     # 列出所有檢查項 id
 *
 * 設計原則（對應缺陷 F）：
 *   每一條檢查都是「跨檔案契約」——單看任一檔案都合法，
 *   只有把兩個檔案放在一起比對才會發現錯誤。
 *   這正是 v6 的 check-content.mjs 漏掉而允許 bug 逃逸的原因。
 *
 * 分階段：
 *   phase 1 = Step 65–70（圖鑑解鎖三層 A1／A2／A3）
 *   phase 2 = Step 71–78（離線預快取 B ＋ 商業管道 D ＋ 序章信 C）
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
 * 檢查項
 * ------------------------------------------------------------------ */

/**
 * 1. 解鎖條件 type 契約：characters.json 的 type 必須落在 dex.js 的 case 集合內。
 */
function checkDexTypeContract() {
    const characters = readJson("content/characters.json");
    const core = readSrc("src/js/core/dex.js");
    if (!characters || !core) {
        return { ok: false, msg: "無法讀取 characters.json 或 dex.js" };
    }

    const supported = new Set(
        [...core.matchAll(/case\s+"([a-z][a-z-]*)"\s*:/g)].map((m) => m[1])
    );
    const used = [...new Set((characters.dex || []).map((d) => d.unlockCondition?.type).filter(Boolean))];
    const bad = (characters.dex || []).filter((d) => !supported.has(d.unlockCondition?.type));

    if (bad.length) {
        const detail = bad.map((d) => `${d.id}:${d.unlockCondition?.type}`).join(", ");
        return { ok: false, msg: `${bad.length} 隻的 type 不被 dex.js 支援 → ${detail}` };
    }
    return { ok: true, msg: `解鎖條件 type 契約一致（${used.length}/${used.length}）` };
}

/**
 * 1b. 條件型別與門檻健全性：count 為正整數、locale 值合法。
 */
function checkDexCondTypes() {
    const characters = readJson("content/characters.json");
    if (!characters) return { ok: false, msg: "無法讀取 characters.json" };

    const problems = [];
    for (const d of characters.dex || []) {
        const c = d.unlockCondition || {};
        if (!Number.isInteger(c.count) || c.count < 1) {
            problems.push(`${d.id} 的 count 非正整數（${c.count}）`);
        }
        if (c.locale && !["zh-TW", "en-US"].includes(c.locale)) {
            problems.push(`${d.id} 的 locale 非法（${c.locale}）`);
        }
        if (c.noHint !== undefined && typeof c.noHint !== "boolean") {
            problems.push(`${d.id} 的 noHint 非布林值`);
        }
    }
    if (problems.length) return { ok: false, msg: problems.join("；") };
    return { ok: true, msg: `24 隻條件型別健全（count 正整數／locale 合法／noHint 布林）` };
}

/**
 * 2. 圖鑑可達性：合成完美作答後必須能解鎖。
 * @param {number} [expectUnlocked] 指定期望解鎖數；未指定則至少 1
 */
async function checkDexUnlockReachable(expectUnlocked) {
    const characters = readJson("content/characters.json");
    if (!characters) return { ok: false, msg: "無法讀取 characters.json" };

    let dex;
    try {
        dex = await import(pathToFileURL(join(root, "src/js/core/dex.js")).href);
    } catch (err) {
        return { ok: false, msg: `無法載入 dex.js：${err.message}` };
    }

    const need = expectUnlocked ?? 1;
    const unlockedIds = [];
    const failed = [];

    for (const d of characters.dex || []) {
        const cond = d.unlockCondition || {};
        const axis = axisForType(cond.type);
        const count = cond.count || 1;
        const samples = [];
        for (let i = 0; i < count; i++) {
            samples.push({ axis, verb: verbForType(cond.type), correct: 1, locale: cond.locale || "zh-TW", hinted: false });
        }
        const progress = { learningSamples: samples, mastery: {}, unlockedDex: [], unlockedLevels: [] };
        const ok = dex.checkDexUnlock(characters, progress, d.id);
        if (ok) unlockedIds.push(d.id);
        else failed.push(`${d.id}(${cond.type})`);
    }

    if (unlockedIds.length < need) {
        return { ok: false, msg: `僅 ${unlockedIds.length} 隻可解鎖（期望 ≥${need}），未解鎖：${failed.slice(0, 6).join(", ")}` };
    }
    return { ok: true, msg: `合成完美作答可解鎖 ${unlockedIds.length}/${(characters.dex || []).length} 隻` };
}

/**
 * 2b. 部分作答時不應解鎖，且進度應介於 0–1。
 */
async function checkDexPartialProgress() {
    const characters = readJson("content/characters.json");
    if (!characters) return { ok: false, msg: "無法讀取 characters.json" };

    let dex;
    try {
        dex = await import(pathToFileURL(join(root, "src/js/core/dex.js")).href);
    } catch (err) {
        return { ok: false, msg: `無法載入 dex.js：${err.message}` };
    }

    const target = (characters.dex || [])[0];
    if (!target) return { ok: false, msg: "無圖鑑資料" };
    const cond = target.unlockCondition || {};
    const axis = axisForType(cond.type);
    const count = cond.count || 1;

    // 只答對一半
    const samples = [];
    for (let i = 0; i < Math.floor(count / 2); i++) {
        samples.push({ axis, verb: verbForType(cond.type), correct: 1, locale: cond.locale || "zh-TW", hinted: false });
    }
    const progress = { learningSamples: samples, mastery: {}, unlockedDex: [], unlockedLevels: [] };

    if (dex.checkDexUnlock(characters, progress, target.id)) {
        return { ok: false, msg: `${target.id} 在僅完成一半時已被解鎖（不應如此）` };
    }
    const pct = dex.dexUnlockProgress(characters, progress, target.id);
    if (!(pct > 0 && pct < 1)) {
        return { ok: false, msg: `${target.id} 部分作答的完成度為 ${pct}，應介於 0 與 1 之間` };
    }
    return { ok: true, msg: `部分作答不誤判解鎖，完成度 ${(pct * 100).toFixed(0)}%` };
}

/**
 * 3. session 必須真的產出 samples。
 */
function checkDexSamplesProduced() {
    const session = readSrc("src/js/core/session.js");
    if (!session) return { ok: false, msg: "無法讀取 session.js" };

    const hasSamplesArray = /samples\s*[:=]/.test(session);
    const pushes = /samples\.push|attempts\.push/.test(session);
    const inResult = /samples\s*[:,]/.test(session) && /result\s*=\s*\{[^}]*samples/.test(session);

    if (!hasSamplesArray || !pushes || !inResult) {
        const missing = [];
        if (!hasSamplesArray) missing.push("無 samples 陣列");
        if (!pushes) missing.push("無 push 寫入");
        if (!inResult) missing.push("finish() 的 result 未含 samples");
        return { ok: false, msg: `session 未產出學習樣本：${missing.join("、")}` };
    }
    return { ok: true, msg: "session.finish() 的 result 含 samples 陣列" };
}

/**
 * 4. locale / noHint 條件必須真的被評估。
 */
function checkDexLocaleNoHint() {
    const core = readSrc("src/js/core/dex.js");
    if (!core) return { ok: false, msg: "無法讀取 dex.js" };

    // 取出 evaluateCondition 函式本體
    const m = core.match(/function\s+evaluateCondition\s*\([\s\S]*?\n\}/);
    if (!m) return { ok: false, msg: "找不到 evaluateCondition 函式" };
    const body = m[0];

    const hasLocale = /cond\.locale|\.locale\b/.test(body);
    const hasNoHint = /noHint/.test(body);

    if (!hasLocale || !hasNoHint) {
        const missing = [];
        if (!hasLocale) missing.push("locale 條件未評估");
        if (!hasNoHint) missing.push("noHint 條件未評估");
        return { ok: false, msg: `解鎖條件缺漏：${missing.join("、")}` };
    }
    return { ok: true, msg: "locale 與 noHint 條件皆已實作評估" };
}

/**
 * 5. narrative 形狀：letters.prologue 為字串時，呼叫端不可用 [locale] 取值。
 */
function checkNarrativeShape() {
    const narrative = readJson("content/narrative.zh-TW.json");
    const main = readSrc("src/js/main.js");
    if (!narrative) return { ok: false, msg: "無法讀取 narrative.zh-TW.json" };
    if (!main) return { ok: false, msg: "無法讀取 main.js" };

    const prologue = narrative.letters?.prologue;
    const isString = typeof prologue === "string";

    if (isString && /letters\.prologue\?\.\[/.test(main)) {
        return { ok: false, msg: "letters.prologue 為字串，但 main.js 以 [locale] 取值（結果為 undefined）" };
    }
    return {
        ok: true,
        msg: isString
            ? "letters.prologue 為字串，呼叫端已改用字串安全取值"
            : "letters.prologue 為雙語物件，呼叫端可安全用 [locale]"
    };
}

/**
 * 6. SW 預快取清單中每一項都必須實際存在。
 */
function checkSwPrecacheExists() {
    const sw = readSrc("service-worker.js");
    if (!sw) return { ok: false, msg: "無法讀取 service-worker.js" };

    const list = parsePrecache(sw);
    if (!list.length) return { ok: false, msg: "無法解析 PRECACHE 清單" };

    const missing = list.filter((p) => !p.includes("*") && !existsSync(join(root, p)));
    if (missing.length) {
        return { ok: false, msg: `預快取含 ${missing.length} 個不存在路徑：${missing.join(", ")}` };
    }
    return { ok: true, msg: `預快取 ${list.length} 項全部存在` };
}

/**
 * 7. src/ 與 content/ 下的 js/json/css 都必須被預快取。
 */
function checkSwPrecacheCovers() {
    const sw = readSrc("service-worker.js");
    if (!sw) return { ok: false, msg: "無法讀取 service-worker.js" };

    const list = parsePrecache(sw);
    if (!list.length) return { ok: false, msg: "無法解析 PRECACHE 清單" };

    const covered = new Set(list.map((p) => p.replace(/^\.\//, "")));
    const actual = [];
    for (const dir of ["src", "content"]) {
        const base = join(root, dir);
        if (!existsSync(base)) continue;
        for (const rel of walk(base, dir)) {
            if (/\.(js|json|css)$/.test(rel)) actual.push(rel);
        }
    }

    const omitted = actual.filter((f) => !covered.has(f));
    if (omitted.length) {
        return { ok: false, msg: `${omitted.length} 個實際檔案未被預快取：${omitted.join(", ")}` };
    }
    return { ok: true, msg: `${actual.length} 個 js/json/css 全部被預快取` };
}

/**
 * 8. 遙測必須存在外送機制。
 */
function checkTelemetryExternal() {
    const tel = readSrc("src/js/core/telemetry.js");
    if (!tel) return { ok: false, msg: "無法讀取 telemetry.js" };

    const hasBeacon = /sendBeacon/.test(tel);
    const hasFetch = /fetch\s*\(/.test(tel);
    if (!hasBeacon && !hasFetch) {
        return { ok: false, msg: "telemetry.js 無任何外送機制（sendBeacon / fetch），事件僅存本機" };
    }
    return {
        ok: true,
        msg: hasBeacon ? "telemetry 已接上 sendBeacon 外送" : "telemetry 已接上 fetch 外送"
    };
}

/**
 * 9. 付費牆必須存在真實 IAP 呼叫（非僅 track）。
 */
function checkPaywallIap() {
    const paywall = readSrc("src/js/ui/paywall.js");
    if (!paywall) return { ok: false, msg: "無法讀取 paywall.js" };

    const patterns = /StoreKit|BillingClient|purchase\s*\(|checkout|PAYMENT_PROVIDER|createPurchase|\.purchase\b/i;
    if (!patterns.test(paywall)) {
        return { ok: false, msg: "paywall.js 無真實 IAP 呼叫（僅 track 記錄意向）" };
    }
    return { ok: true, msg: "paywall 已接上真實 IAP 呼叫" };
}

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

/**
 * 解析 service-worker.js 的 PRECACHE 陣列。
 * @param {string} src
 * @returns {string[]}
 */
function parsePrecache(src) {
    const m = src.match(/PRECACHE\s*=\s*\[([\s\S]*?)\];/);
    if (!m) return [];
    return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
}

/**
 * 遞迴走訪目錄，回傳相對於 root 的路徑。
 * @param {string} dir
 * @param {string} prefix
 * @returns {string[]}
 */
function walk(dir, prefix) {
    const res = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
            res.push(...walk(full, join(prefix, entry)));
        } else {
            res.push(join(prefix, entry));
        }
    }
    return res;
}

/**
 * 解鎖條件 type 對應的技能軸名稱。
 * @param {string} type
 */function axisForType(type) {
    const map = {
        "minimal-pair": "minimalPairCorrect",
        sequence: "sequenceCorrect",
        rhythm: "rhythmCorrect",
        interference: "interferenceCorrect",
        pitch: "pitchCorrect",
        puzzle: "puzzleCorrect",
        memory: "memoryCorrect"
    };
    return map[type] || "otherCorrect";
}

/**
 * 解鎖條件 type 對應的 verb id。
 * @param {string} type
 */
function verbForType(type) {
    const map = {
        "minimal-pair": "minimal-pair",
        sequence: "sequence",
        rhythm: "rhythm",
        interference: "interference",
        pitch: "pitch",
        puzzle: "puzzle",
        memory: "memory"
    };
    return map[type] || "minimal-pair";
}

/* ------------------------------------------------------------------ *
 * 執行
 * ------------------------------------------------------------------ */

/** @type {{ id:string, phase:number, fn:() => any }[]} */
const CHECKS = [
    { id: "dex-type-contract", phase: 1, fn: checkDexTypeContract },
    { id: "dex-cond-types", phase: 1, fn: checkDexCondTypes },
    { id: "dex-unlock-reachable", phase: 1, fn: () => checkDexUnlockReachable() },
    { id: "dex-partial-progress", phase: 1, fn: checkDexPartialProgress },
    { id: "dex-samples-produced", phase: 1, fn: checkDexSamplesProduced },
    { id: "dex-locale-nohint", phase: 1, fn: checkDexLocaleNoHint },
    { id: "narrative-shape", phase: 1, fn: checkNarrativeShape },
    { id: "sw-precache-exists", phase: 2, fn: checkSwPrecacheExists },
    { id: "sw-precache-covers", phase: 2, fn: checkSwPrecacheCovers },
    { id: "telemetry-external", phase: 2, fn: checkTelemetryExternal },
    { id: "paywall-iap", phase: 2, fn: checkPaywallIap }
];

const args = process.argv.slice(2);

if (args.includes("--list")) {
    out("Phase O 檢查項：");
    for (const c of CHECKS) out(`  [phase ${c.phase}] ${c.id}`);
    out(`共 ${CHECKS.length} 項`);
    process.exit(0);
}

let phase = 0;
const phaseArg = args.indexOf("--phase");
if (phaseArg >= 0) phase = Number(args[phaseArg + 1]);

const selected = phase ? CHECKS.filter((c) => c.phase === phase) : CHECKS;

let pass = 0;
let fail = 0;

for (const c of selected) {
    let result;
    try {
        result = await c.fn();
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
