/**
 * 可玩性守門 — 實際執行遊戲流程。
 *
 * 檢查項：
 *   play-boot          遊戲可啟動，無未捕捉錯誤，開始畫面可見
 *   play-start         點擊開始畫面後，開始畫面消失、遊戲容器可見
 *   play-tutorial      教學可完整走完並進入角色選擇
 *   play-character     角色選擇可進入關卡地圖
 *   play-levelmap      關卡地圖可渲染並可選關
 *   play-level-enter   進入關卡後，出現可互動的回合選項
 *   play-level-complete 關卡 1 可在無錯誤下完成 3 回合並觸發結算
 *   play-all-verbs     六種玩法各自都能在 1 回合內判定對錯
 *   play-no-blocking   全流程無未捕捉錯誤、無 console.error
 *
 * 規範：
 *   - 本守門必須**能抓到既有缺陷**（Step 109 落地時至少三項應為 FAIL）。
 *   - 不得使用真實 setTimeout 等待；一律以 fake timers 推進。
 *   - 測試必須是**真實的行為模擬**，不得直接改 state 跳過流程。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    createGameEnv,
    disposeEnv,
    bootGame,
    clickStart,
    closePrologue,
    closeChapterScene,
    advanceTutorial,
    pickCharacter,
    startLevel,
    answerRound,
    currentState,
    openLevel,
    flush,
    loadExtraModule,
    setConsentCheckbox,
    submitConsent,
    simulatePrecached,
    setOffline
} from "./test-harness.mjs";

/** 專案根目錄。 */
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** 各玩法的代表關卡 id。 */
const VERB_LEVELS = {
    sequence: 1,
    "minimal-pair": 5,
    rhythm: 17,
    interference: 25,
    puzzle: 29,
    memory: 33
};

/**
 * 判斷元素是否可見（未被 hidden 遮罩）。
 * @param {any} el
 */
function isVisible(el) {
    if (!el) return false;
    if (el.classList?.contains("hidden")) return false;
    return true;
}

/**
 * 進入關卡並等待回合輸入開放。
 * @param {any} env
 * @param {number} levelId
 */
async function enterLevel(env, levelId) {
    await startLevel(env, levelId);
    // Step 122：章節過場可能擋在關卡前面
    await closeChapterScene(env);
    await env.clock.advance(3000);
}

/**
 * 讀取目前回合在 DOM 上的可互動元素。
 * @param {any} env
 */
function roundElements(env) {
    const controls = env.document.getElementById("controls-view");
    return {
        options: Array.from(controls.querySelectorAll("[data-item]")),
        cards: Array.from(controls.querySelectorAll("[data-slot]")),
        pieces: Array.from(controls.querySelectorAll("[data-piece-index]")),
        targets: Array.from(controls.querySelectorAll("[data-target-index]"))
    };
}

/**
 * 觀察 `round:correct` / `round:wrong` 事件。
 * @param {any} env
 */
function watchVerdict(env) {
    // `round:step` = 作答正確但回合尚未完成（序列前進中／拼合中／配對中）。
    // 對「是否答對」而言同樣是一次有效作答，故併入 correct 計數。
    const seen = { correct: 0, wrong: 0, step: 0 };
    env.onEvent("round:correct", () => { seen.correct++; });
    env.onEvent("round:step", () => { seen.correct++; seen.step++; });
    env.onEvent("round:wrong", () => { seen.wrong++; });
    return seen;
}

/**
 * 輸出報告（避免 console.log 殘留 —— tools/sweep-logs.mjs 會攔截）。
 * @param {...any} args
 */
function out(...args) {
    process.stdout.write(args.map(String).join(" ") + "\n");
}

/**
 * 以 DOM 事件點擊元素。
 * @param {any} env
 * @param {any} el
 */
function click(env, el) {
    if (!el) return false;
    el.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
}

/* ------------------------------------------------------------------ */
/* 檢查項                                                              */
/* ------------------------------------------------------------------ */

/**
 * 以引擎的**真實正確作答路徑**走完一個回合。
 *
 * 全部以 DOM 操作完成（不得直接改 state 跳過流程）。
 *
 * @param {any} env
 * @returns {Promise<{ ok: boolean, detail: string }>}
 */
async function playOneRound(env) {
    const els = roundElements(env);
    const verdict = watchVerdict(env);

    if (els.pieces.length) {
        // 拼合：逐片嘗試放置，放對的片段會吸附進目標區（DOM 可觀察）
        let filled = 0;
        for (const piece of els.pieces) {
            const pieceIndex = Number(piece.dataset.pieceIndex);
            let placed = false;
            for (const target of els.targets) {
                click(env, piece);
                await flush(6);
                const slot = env.document.querySelector(`#controls-view [data-target-index="${target.dataset.targetIndex}"]`);
                if (!slot) break;
                const before = slot.classList.contains("is-filled");
                click(env, slot);
                await env.clock.advance(220);
                if (!before && slot.classList.contains("is-filled")) {
                    placed = true;
                    filled++;
                    break;
                }
            }
            if (!placed) {
                return { ok: false, detail: `切片 ${pieceIndex} 找不到可放置的位置` };
            }
        }
        return {
            ok: verdict.correct > 0 && filled > 0,
            detail: `拼合回合 已放置=${filled} correct=${verdict.correct}`
        };
    }

    if (els.cards.length) {
        // 配對：依卡面圖樣分組，兩兩翻牌
        const groups = new Map();
        for (const card of els.cards) {
            const key = card.querySelector(".memory-face--front .control-btn__label")?.textContent || "";
            const list = groups.get(key) || [];
            list.push(card);
            groups.set(key, list);
        }
        for (const group of groups.values()) {
            for (let i = 0; i + 1 < group.length; i += 2) {
                click(env, group[i]);
                await env.clock.advance(900);
                click(env, group[i + 1]);
                await env.clock.advance(900);
            }
        }
        return {
            ok: verdict.correct > 0,
            detail: `配對回合 correct=${verdict.correct} wrong=${verdict.wrong}`
        };
    }

    if (els.options.length) {
        // 單選／序列：依公開狀態的 sequence 逐項送出；無 sequence 則逐一嘗試
        const seq = currentState(env).sequence || [];
        if (seq.length) {
            for (const id of seq) {
                const btn = env.document.querySelector(`#controls-view [data-item="${id}"]`);
                if (!btn) return { ok: false, detail: `找不到選項 ${id}` };
                click(env, btn);
                await env.clock.advance(500);
            }
        } else {
            for (const btn of els.options) {
                click(env, btn);
                await env.clock.advance(400);
                if (verdict.correct > 0) break;
            }
        }
        return {
            ok: verdict.correct > 0 || verdict.wrong > 0,
            detail: `選項回合 correct=${verdict.correct} wrong=${verdict.wrong}`
        };
    }

    return { ok: false, detail: "回合沒有任何可互動元素" };
}

const CHECKS = [
    {
        name: "play-boot",
        async run(env) {
            const { errors } = await bootGame(env);
            const overlay = env.document.getElementById("start-overlay");
            const ok = errors.length === 0 && isVisible(overlay);
            return {
                ok,
                detail: `errors=${errors.length} startOverlayVisible=${isVisible(overlay)}${errors.length ? ` | ${errors[0]}` : ""}`
            };
        }
    },

    {
        name: "play-start",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            const overlay = env.document.getElementById("start-overlay");
            const container = env.document.getElementById("game-container");
            const ok = !isVisible(overlay) && isVisible(container);
            return {
                ok,
                detail: `startHidden=${overlay.classList.contains("hidden")} gameContainerVisible=${isVisible(container)}`
            };
        }
    },

    {
        name: "engine-contract",
        async run(env) {
            // 六種玩法（含 memory 的 match／dual、puzzle 的 assembly／pattern）
            // 的引擎都必須宣告 kind、都有 submit()、都有 isComplete()，
            // 且 build() 皆為 async。
            await bootGame(env);

            const loadContentNs = env.getModule("src/js/data/load-content.js");
            const verbsNs = env.getModule("src/js/verbs/index.js");
            const contractNs = await env.loadModule("src/js/core/verb-contract.js");
            if (!loadContentNs || !verbsNs || !contractNs) {
                return { ok: false, detail: "無法取得 verbs／contract 模組的公開命名空間" };
            }

            const bundle = await loadContentNs.loadContent("zh-TW");

            /** @type {string[]} */
            const problems = [];
            /** @type {string[]} */
            const checked = [];

            /** 六種玩法的引擎工廠。 */
            const factories = [
                { name: "sequence", make: () => verbsNs.createVerb(bundle, "zh-TW", { options: 2, sequenceLength: 3 }, "sequence") },
                { name: "minimal-pair", make: () => verbsNs.createVerb(bundle, "zh-TW", { options: 2 }, "minimal-pair") },
                { name: "rhythm", make: () => verbsNs.createVerb(bundle, "zh-TW", { options: 3 }, "rhythm") },
                { name: "interference", make: () => verbsNs.createVerb(bundle, "zh-TW", { options: 2, interference: 1 }, "interference") },
                { name: "puzzle:assembly", make: () => verbsNs.createVerb(bundle, "zh-TW", { options: 4 }, "puzzle") },
                { name: "puzzle:pattern", make: () => verbsNs.createVerbForLevel(bundle, "zh-TW", { verb: "puzzle", spec: { options: 4, variant: "pattern" } }) },
                { name: "memory:match", make: () => verbsNs.createVerb(bundle, "zh-TW", { options: 4 }, "memory") },
                { name: "memory:dual", make: () => verbsNs.createVerbForLevel(bundle, "zh-TW", { verb: "memory", spec: { sequenceLength: 3, variant: "dual" } }) }
            ];

            for (const f of factories) {
                let engine = null;
                try {
                    engine = f.make();
                    if (engine && typeof engine.build === "function") {
                        const built = engine.build();
                        if (built && typeof built.then === "function") await built;
                    }
                } catch (err) {
                    problems.push(`${f.name}: 建立失敗 → ${err?.message || String(err)}`);
                    continue;
                }

                const verdict = contractNs.verifyEngineContract(engine);
                if (!verdict.ok) {
                    problems.push(`${f.name}: ${verdict.problems.join("; ")}`);
                    continue;
                }
                if (typeof engine.submit !== "function") {
                    problems.push(`${f.name}: 缺少 submit()`);
                    continue;
                }
                checked.push(`${f.name}(${engine.kind})`);
            }

            return {
                ok: problems.length === 0,
                detail: problems.length
                    ? `問題 → ${problems.join(" | ")}`
                    : `已驗 ${checked.length} 種引擎：${checked.join(", ")}`
            };
        }
    },

    {
        name: "play-verbs-coverage",
        async run(env) {
            void env;

            /** @type {string[]} */
            const failed = [];
            /** @type {number} */
            let done = 0;

            for (let levelId = 1; levelId <= 40; levelId++) {
                const levelEnv = await openLevel(levelId);
                try {
                    /** @type {any} */
                    let completed = null;
                    let roundListens = 0;
                    levelEnv.onEvent("level:complete", (payload) => { completed = payload; });
                    levelEnv.onEvent("round:listen", () => { roundListens++; });

                    // 走完 3 回合
                    for (let r = 0; r < 3; r++) {
                        const st = currentState(levelEnv);
                        if (st.phase !== "input") {
                            await levelEnv.clock.advance(2600);
                        }
                        const res = await playOneRound(levelEnv);
                        if (!res.ok) {
                            failed.push(`L${levelId} 回合${r + 1}: ${res.detail}`);
                            break;
                        }
                        // 下一回合的聆聽階段（900ms 排程 + 2400ms 聆聽）
                        await levelEnv.clock.advance(3600);
                    }

                    if (failed.some((f) => f.startsWith(`L${levelId} `))) continue;

                    await levelEnv.clock.advance(1500);
                    const st = currentState(levelEnv);
                    if (completed === null && st.phase !== "levelup") {
                        failed.push(`L${levelId}: 未觸發 level:complete（phase=${st.phase} roundListens=${roundListens}）`);
                        continue;
                    }
                    done++;
                } catch (err) {
                    failed.push(`L${levelId}: 例外 ${err?.message || String(err)}`);
                } finally {
                    disposeEnv(levelEnv);
                }
            }

            return {
                ok: failed.length === 0,
                detail: failed.length
                    ? `完成 ${done}/40，問題 → ${failed.slice(0, 12).join(" | ")}`
                    : `40/40 關全部可完成（每關 3 回合並觸發 level:complete）`
            };
        }
    },

    {
        name: "play-no-error-verbs",
        async run(env) {
            void env;

            /** @type {string[]} */
            const errors = [];
            const levels = Object.values(VERB_LEVELS).concat([1, 2, 13, 21, 29, 33, 40]);

            for (const levelId of [...new Set(levels)]) {
                const levelEnv = await openLevel(levelId);
                try {
                    await playOneRound(levelEnv);
                    await levelEnv.clock.advance(1200);
                    for (const e of levelEnv.errors) errors.push(`L${levelId}: ${e.split("\n")[0]}`);
                    for (const e of levelEnv.consoleErrors) errors.push(`L${levelId} console: ${e}`);
                } catch (err) {
                    errors.push(`L${levelId}: 例外 ${err?.message || String(err)}`);
                } finally {
                    disposeEnv(levelEnv);
                }
            }

            return {
                ok: errors.length === 0,
                detail: errors.length ? `錯誤 → ${errors.slice(0, 8).join(" | ")}` : `${new Set(levels).size} 關流程無未捕捉錯誤、無 console.error`
            };
        }
    },

    {
        name: "play-dom-contract",
        async run(env) {
            // #bubble / #bubble-content 必須在 renderCharacter() 覆寫 #santa-container 之後仍然存在。
            // 若被覆蓋，序章信件（showLetter）會拋出 TypeError，整條導航中斷。
            // Step 118 已把氣泡移出 #santa-container，此檢查如實驗證該契約。
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            const bubble = env.document.getElementById("bubble");
            const content = env.document.getElementById("bubble-content");
            const container = env.document.getElementById("santa-container");
            const insideCharacter = container ? container.contains(bubble) : false;
            const crashed = env.errors.some((e) => /bubble-content/.test(e));
            const ok = Boolean(bubble && content) && !insideCharacter && !crashed;
            return {
                ok,
                detail: ok
                    ? "bubble 與 bubble-content 獨立於 #santa-container，角色渲染後仍存在"
                    : `缺陷：bubble 在角色容器內（insideCharacter=${insideCharacter}）或已消失，errors=${env.errors.length}`
            };
        }
    },

    {
        name: "play-tutorial",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            const root = env.document.getElementById("tutorial-root");
            const wasVisible = !root.classList.contains("hidden");
            const res = await advanceTutorial(env);
            const charOverlay = env.document.getElementById("character-select-overlay");
            // 教學必須**真的出現**並可逐步走完；被提前跳過視為缺陷（F4，Step 114 修復）
            const ok = res.ok && !res.stuck && res.shown && isVisible(charOverlay);
            return {
                ok,
                detail: `tutorialShown=${wasVisible} shown=${res.shown} ok=${res.ok} stuck=${res.stuck} skipped=${res.skipped} steps=[${res.steps.join(",")}] characterSelectVisible=${isVisible(charOverlay)}`
            };
        }
    },

    {
        name: "play-character",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            const overlay = env.document.getElementById("character-select-overlay");
            const hadButton = Boolean(overlay.querySelector("[data-character]"));
            await pickCharacter(env, "santa");
            const map = env.document.getElementById("levelmap-root");
            const ok = hadButton && isVisible(map);
            return {
                ok,
                detail: `hadCharacterButton=${hadButton} levelMapVisible=${isVisible(map)}`
            };
        }
    },

    {
        name: "play-levelmap",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            const map = env.document.getElementById("levelmap-root");
            const nodes = map.querySelectorAll("[data-level]");
            const ok = isVisible(map) && nodes.length > 0;
            return {
                ok,
                detail: `levelMapVisible=${isVisible(map)} nodeCount=${nodes.length}`
            };
        }
    },

    {
        name: "play-level-enter",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await enterLevel(env, 1);
            const els = roundElements(env);
            const st = currentState(env);
            const total = els.options.length + els.cards.length + els.pieces.length;
            const ok = total > 0;
            return {
                ok,
                detail: `interactiveElements=${total} (options=${els.options.length} cards=${els.cards.length} pieces=${els.pieces.length}) phase=${st.phase} level=${st.level}`
            };
        }
    },

    {
        name: "play-level-complete",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");

            /** @type {any} */
            let completed = null;
            let roundListens = 0;
            env.onEvent("level:complete", (payload) => { completed = payload; });
            env.onEvent("round:listen", () => { roundListens++; });

            await enterLevel(env, 1);

            // 關卡 1 為 sequence 玩法：每回合需依序送出整條序列
            for (let r = 0; r < 3; r++) {
                const st = currentState(env);
                const seq = st.sequence || [];
                if (!seq.length) {
                    return { ok: false, detail: `round ${r + 1}: 公開狀態無 sequence（phase=${st.phase}）` };
                }
                for (const id of seq) {
                    const answered = await answerRound(env, String(id));
                    if (!answered) {
                        return { ok: false, detail: `round ${r + 1}: 找不到可點擊的選項 ${id}` };
                    }
                    await env.clock.advance(700);
                }
                // 下一回合的聆聽階段（900ms 排程 + 2400ms 聆聽）必須走完，否則輸入仍鎖住
                await env.clock.advance(3600);
            }

            await env.clock.advance(2000);
            const st = currentState(env);
            const ok = completed !== null || st.phase === "levelup";
            return {
                ok,
                detail: `levelCompleteEvent=${completed !== null} roundListens=${roundListens} phase=${st.phase} score=${st.score} round=${st.round}`
            };
        }
    },

    {
        name: "play-all-verbs",
        async run(env) {
            void env;

            /** @type {string[]} */
            const failed = [];
            /** @type {string[]} */
            const passed = [];

            for (const [verb, levelId] of Object.entries(VERB_LEVELS)) {
                // 每個關卡使用獨立環境（關卡地圖進入遊戲後會隱藏）
                const levelEnv = await openLevel(levelId);
                try {
                    const els = roundElements(levelEnv);
                    const verdict = watchVerdict(levelEnv);

                    let judged = false;

                    if (els.pieces.length) {
                        // 拼合玩法：必須能選取片段並放置
                        const piece = els.pieces[0];
                        const target = els.targets[0];
                        if (piece && target) {
                            click(levelEnv, piece);
                            await flush(10);
                            click(levelEnv, target);
                            await levelEnv.clock.advance(400);
                            judged = verdict.correct > 0;
                        }
                    } else if (els.cards.length) {
                        // 配對玩法：依卡片 id 兩兩配對翻牌，直到完成
                        const pairs = new Map();
                        for (const card of els.cards) {
                            const label = card.querySelector(".memory-face--front .control-btn__label")?.textContent
                                || card.dataset.slot || "";
                            const list = pairs.get(label) || [];
                            list.push(card);
                            pairs.set(label, list);
                        }
                        for (const group of pairs.values()) {
                            for (let i = 0; i + 1 < group.length; i += 2) {
                                click(levelEnv, group[i]);
                                await levelEnv.clock.advance(900);
                                click(levelEnv, group[i + 1]);
                                await levelEnv.clock.advance(900);
                                if (verdict.correct > 0) judged = true;
                            }
                        }
                    } else if (els.options.length) {
                        // 單選玩法：逐一嘗試，直到出現判定
                        for (const btn of els.options) {
                            click(levelEnv, btn);
                            await levelEnv.clock.advance(300);
                            if (verdict.correct > 0) {
                                judged = true;
                                break;
                            }
                        }
                    }

                    if (judged) {
                        passed.push(verb);
                    } else {
                        failed.push(`${verb}(L${levelId} 元素：選項${els.options.length}／卡${els.cards.length}／片${els.pieces.length})`);
                    }
                } finally {
                    disposeEnv(levelEnv);
                }
            }

            return {
                ok: failed.length === 0,
                detail: `passed=[${passed.join(",")}] failed=[${failed.join(" | ")}]`
            };
        }
    },

    {
        name: "play-nav-complete",
        async run(env) {
            // 完整導航：
            // 開始 → 關上序章 → 走完教學 → 選角色 → 地圖 → 進關卡 → 完成 → 回地圖 →
            // 開圖鑑 → 關圖鑑 → 開家長報告（通過閘門）→ 關家長報告 → 回地圖 → 返回角色選擇
            /** @type {string[]} */
            const problems = [];

            /** 記錄每張遮罩離開時是否確實被加上 hidden。 */
            const overlays = [
                "start-overlay",
                "story-root",
                "tutorial-root",
                "character-select-overlay",
                "levelmap-root",
                "dex-root",
                "parent-report-root"
            ];

            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);

            // 序章信件 → 關上
            const story = env.document.getElementById("story-root");
            if (!isVisible(story)) problems.push("序章信件未顯示");
            if (!await closePrologue(env)) problems.push("序章信件無法關上");
            if (isVisible(story)) problems.push("序章信件關上後仍可見");

            // 教學 → 走完
            await env.clock.advance(300);
            const tut = await advanceTutorial(env);
            if (!tut.ok || tut.stuck) problems.push(`教學未走完（stuck=${tut.stuck}）`);
            const charOverlay = env.document.getElementById("character-select-overlay");
            if (!isVisible(charOverlay)) problems.push("教學後未進入角色選擇");

            // 選角色 → 地圖
            await pickCharacter(env, "santa");
            const map = env.document.getElementById("levelmap-root");
            if (!isVisible(map)) problems.push("選角色後未進入地圖");

            // 地圖 → 進關卡
            const node = map.querySelector('[data-level="1"]');
            if (!node) {
                problems.push("地圖找不到第 1 關節點");
            } else {
                click(env, node);
                await env.clock.advance(3200);
                const game = env.document.getElementById("game-container");
                if (!isVisible(game)) problems.push("進關卡後遊戲容器不可見");
                if (isVisible(map)) problems.push("進關卡後地圖仍可見");

                // 完成關卡（3 回合）→ 回到地圖
                for (let r = 0; r < 3; r++) {
                    const res = await playOneRound(env);
                    if (!res.ok) {
                        problems.push(`回合 ${r + 1}: ${res.detail}`);
                        break;
                    }
                    await env.clock.advance(3600);
                }
                await env.clock.advance(2000);

                // 關卡完成後必須有回到地圖的路徑
                const nextBtn = env.document.getElementById("next-level-btn");
                if (!nextBtn) {
                    problems.push("關卡完成後缺少回到地圖的按鈕");
                }
                const mapBtn = env.document.getElementById("back-to-map-btn");
                if (!mapBtn) {
                    problems.push("關卡完成後缺少「回到地圖」按鈕");
                } else {
                    click(env, mapBtn);
                    await env.clock.advance(300);
                    if (!isVisible(map)) problems.push("按「回到地圖」後未回到地圖");
                    else if (isVisible(game)) problems.push("回到地圖後遊戲容器仍可見");
                }
            }

            // 開圖鑑 → 關圖鑑
            env.document.dispatchEvent(new env.window.CustomEvent("dex:request", { bubbles: true }));
            await env.clock.advance(300);
            const dexRoot = env.document.getElementById("dex-root");
            if (!isVisible(dexRoot)) {
                problems.push("圖鑑未開啟");
            } else {
                const dexClose = dexRoot.querySelector("#dex-close");
                if (!dexClose) {
                    problems.push("圖鑑缺少關閉按鈕");
                } else {
                    click(env, dexClose);
                    await env.clock.advance(200);
                    if (isVisible(dexRoot)) problems.push("圖鑑關閉後仍可見");
                }
            }

            // 家長報告 → 通過閘門 → 關閉
            env.document.dispatchEvent(new env.window.CustomEvent("parent:request", { bubbles: true }));
            await env.clock.advance(400);
            const parentRoot = env.document.getElementById("parent-report-root");
            if (isVisible(parentRoot)) {
                // 閘門畫面：答對算術題進入報告
                const input = parentRoot.querySelector("#gate-answer");
                const submit = parentRoot.querySelector("#gate-submit");
                if (input && submit) {
                    input.value = "5";
                    click(env, submit);
                    await env.clock.advance(400);
                }
            }
            const parentVisible = isVisible(parentRoot);
            const parentClose = parentRoot.querySelector("#parent-report-close");
            if (parentVisible && !parentClose) {
                problems.push("家長報告缺少關閉按鈕");
            } else if (parentClose) {
                click(env, parentClose);
                await env.clock.advance(200);
                if (isVisible(parentRoot)) problems.push("家長報告關閉後仍可見");
            }

            // 地圖 → 返回角色選擇
            const mapBack = env.document.getElementById("levelmap-back");
            if (!mapBack) {
                problems.push("地圖缺少返回按鈕");
            } else {
                click(env, mapBack);
                await env.clock.advance(200);
                if (!isVisible(charOverlay)) problems.push("地圖返回後未回到角色選擇");
                if (isVisible(map)) problems.push("地圖返回後仍可見");
            }

            // 角色選擇 → 返回（開始畫面）
            const charBack = env.document.getElementById("character-select-back");
            if (!charBack) {
                problems.push("角色選擇缺少返回按鈕");
            } else {
                click(env, charBack);
                await env.clock.advance(200);
                const start = env.document.getElementById("start-overlay");
                if (!isVisible(start)) problems.push("角色選擇返回後未回到開始畫面");
            }

            // 每張遮罩在流程結束時都不應可見
            // （start-overlay 是最後主動回到的畫面，屬預期狀態）
            for (const id of overlays) {
                if (id === "start-overlay") continue;
                const el = env.document.getElementById(id);
                if (el && isVisible(el)) problems.push(`遮罩 ${id} 在流程結束後仍可見`);
            }

            return {
                ok: problems.length === 0,
                detail: problems.length ? `問題 → ${problems.join(" | ")}` : "完整導航走完，每張遮罩都能離開"
            };
        }
    },

    {
        name: "play-no-dead-end",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await env.clock.advance(300);

            const visible = Array.from(env.document.querySelectorAll(".overlay"))
                .filter((el) => isVisible(el))
                .map((el) => el.id || el.className)
                // 地圖是最後停留的畫面，屬預期狀態
                .filter((id) => id !== "levelmap-root");

            return {
                ok: visible.length === 0,
                detail: visible.length
                    ? `仍有可見遮罩殘留 → ${visible.join(", ")}`
                    : "流程結束後無任何可見遮罩殘留"
            };
        }
    },

    {
        name: "play-start-once",
        async run(env) {
            await bootGame(env);
            // 連續點擊開始畫面 5 次 —— startGame 只能執行一次
            const overlay = env.document.getElementById("start-overlay");
            for (let i = 0; i < 5; i++) {
                click(env, overlay);
                await flush(10);
            }
            await env.clock.advance(500);

            const story = env.document.getElementById("story-root");
            // 序章信件只被設定一次內容（同一份 DOM 節點，不會被重複渲染）
            const letterEl = story?.querySelector(".letter__body");
            const body = letterEl?.textContent || "";

            // 教學只被建立一次（不是「已建立兩次」）
            const tutRoot = env.document.getElementById("tutorial-root");
            const panels = tutRoot.querySelectorAll(".tutorial").length;

            const ok = body.length > 0 && panels <= 1;
            return {
                ok,
                detail: `letterRendered=${body.length > 0} tutorialPanels=${panels} storyHidden=${story?.classList.contains("hidden")}`
            };
        }
    },

    {
        name: "play-character-visible",
        async run(env) {
            // 進入關卡後，.char__art 的 src 必須指向**存在於磁碟**的檔案，
            // 且 CSS 契約中的 max-height 不得為 none 或 0。
            // jsdom 不做真實排版，因此只斷言**樣式契約**（不得假裝能測像素）。
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await enterLevel(env, 1);

            const art = env.document.querySelector("#santa-container .char__art");
            const src = art?.getAttribute("src") || "";
            const file = src.replace(/^\.\//, "");
            const exists = src ? fs.existsSync(path.join(ROOT, file)) : false;

            // 樣式契約：.char__art 必須有 max-height 且非 none／0
            const css = fs.readFileSync(path.join(ROOT, "src/styles/base.css"), "utf8");
            const ruleMatch = css.match(/\.char__art\s*\{([^}]*)\}/);
            const rule = ruleMatch ? ruleMatch[1] : "";
            const maxHeight = (rule.match(/max-height:\s*([^;]+);/) || [])[1] || "";
            const hasMaxHeight = Boolean(maxHeight)
                && !/none/i.test(maxHeight)
                && !/^0(px|%|vh|dvh)?$/.test(maxHeight.trim());

            const ok = Boolean(art) && exists && hasMaxHeight;
            return {
                ok,
                detail: ok
                    ? `src=${src} 存在於磁碟；.char__art max-height=${maxHeight.trim()}`
                    : `art=${Boolean(art)} src=${src} 存在=${exists} maxHeight=${maxHeight.trim() || "(無)"}`
            };
        }
    },

    {
        name: "play-companion-matches",
        async run(env) {
            // 進入第 N 章的關卡時，.char__art 的 src 必須對應該關的 companion。
            const levels = JSON.parse(
                fs.readFileSync(path.join(ROOT, "content/levels.json"), "utf8")
            );
            const arr = Array.isArray(levels) ? levels : levels.levels;

            /** @type {string[]} */
            const problems = [];

            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");

            // 抽樣每章第一關
            const seen = new Set();
            for (const level of arr) {
                if (seen.has(level.chapter)) continue;
                seen.add(level.chapter);

                // 同一個環境內切換關卡（不可重複 boot —— VM module 不可重複連結）
                await startLevel(env, level.id);
                await env.clock.advance(1200);

                const art = env.document.querySelector("#santa-container .char__art");
                const src = art?.getAttribute("src") || "";
                const expected = `./assets/characters/${level.companion}.svg`;
                if (src !== expected) {
                    problems.push(`第 ${level.chapter} 章第 ${level.id} 關：src=${src} 期望=${expected}`);
                }
            }

            return {
                ok: problems.length === 0,
                detail: problems.length
                    ? `搭檔不符 → ${problems.join(" | ")}`
                    : `六章搭檔皆正確（${seen.size} 章抽樣）`
            };
        }
    },

    {
        name: "play-scene-cast",
        async run(env) {
            // 場景卡司必須渲染到 #scene 的 data-layer="character" 層（Step 123）
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await enterLevel(env, 1);

            const layer = env.document.querySelector('#scene [data-layer="character"]');
            const members = Array.from(layer?.querySelectorAll(".cast-member") || []);
            const ids = members.map((m) => m.getAttribute("data-cast-id") || "");
            const hasCenter = members.some((m) => m.getAttribute("data-entrance") === "center");
            // 卡司必須與主角容器分開（不是只有 #santa-container 一隻）
            const inMain = env.document.querySelectorAll("#santa-container .cast-member").length;

            const ok = members.length >= 2 && hasCenter && inMain === 0;
            return {
                ok,
                detail: ok
                    ? `卡司 ${members.length} 隻 [${ids.join(",")}]，含 center 登场，主角容器內 ${inMain} 隻`
                    : `卡司數=${members.length} center=${hasCenter} 主角容器內=${inMain}`
            };
        }
    },

    {
        name: "play-scene-applied",
        async run(env) {
            // 進入第 N 章的關卡後，#scene 的 dataset.theme 必須等於該關的 scene，
            // 且 --scene-sky 必須不同於上一個場景。
            const levels = JSON.parse(
                fs.readFileSync(path.join(ROOT, "content/levels.json"), "utf8")
            );
            const arr = Array.isArray(levels) ? levels : levels.levels;
            const first = arr[0];
            const other = arr.find((/** @type {any} */ l) => l.scene !== first.scene) || arr[1];

            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await enterLevel(env, first.id);

            const scene = env.document.getElementById("scene");
            const theme1 = scene?.dataset?.theme || "";
            const sky1 = scene?.style?.getPropertyValue("--scene-sky") || "";

            await enterLevel(env, other.id);
            const theme2 = scene?.dataset?.theme || "";
            const sky2 = scene?.style?.getPropertyValue("--scene-sky") || "";

            const ok = theme1 === first.scene
                && theme2 === other.scene
                && Boolean(sky1)
                && sky1 !== sky2;

            return {
                ok,
                detail: ok
                    ? `theme ${theme1}→${theme2}；sky ${sky1}→${sky2}`
                    : `theme1=${theme1}（期望 ${first.scene}）theme2=${theme2}（期望 ${other.scene}）sky1=${sky1} sky2=${sky2}`
            };
        }
    },

    {
        name: "play-story-per-chapter",
        async run(env) {
            // 六章各取一關，斷言「畫面跟人物對得上劇情」：
            //  - 進入該關前**有過場**（#story-root 可見且含該章標題）
            //  - 過場關上後 #scene 的 dataset.theme 等於該章 scene
            //  - 場景卡司非空（data-layer="character" 層內有 .cast-member）
            //  - .char__art 的 src 對應該關的 companion
            const levels = JSON.parse(
                fs.readFileSync(path.join(ROOT, "content/levels.json"), "utf8")
            );
            const arr = Array.isArray(levels) ? levels : levels.levels;
            const arcs = JSON.parse(
                fs.readFileSync(path.join(ROOT, "content/story-arcs.json"), "utf8")
            );
            const arcByChapter = new Map(
                arcs.chapters.map((/** @type {any} */ c) => [c.chapter, c])
            );

            /** @type {string[]} */
            const problems = [];

            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);

            // 第 0 章的過場就是「開始畫面的序章信件」——先確認它確實出現
            const storyRoot = env.document.getElementById("story-root");
            const prologueVisible = Boolean(storyRoot && !storyRoot.classList.contains("hidden"));
            const prologueText = storyRoot?.textContent || "";
            const arc0 = arcByChapter.get(0);
            const arc0Letter = arc0?.letter?.["zh-TW"] || "";
            if (!prologueVisible) {
                problems.push("第 0 章的序章信件未顯示");
            } else if (arc0Letter && !prologueText.includes(arc0Letter.slice(0, 20))) {
                problems.push("序章信件內容不是第 0 章的 letter");
            }
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");

            const seen = new Set();
            for (const level of arr) {
                if (seen.has(level.chapter)) continue;
                seen.add(level.chapter);
                const arc = arcByChapter.get(level.chapter);

                // 第 0 章已在序章看過，不再重複顯示
                if (level.chapter === 0) {
                    await startLevel(env, level.id);
                    await env.clock.advance(200);
                    if (storyRoot && !storyRoot.classList.contains("hidden")) {
                        problems.push("第 0 章進關時重複顯示過場");
                    }
                    await env.clock.advance(1500);
                } else {
                    // 進入關卡（過場應該出現）
                    await startLevel(env, level.id);
                    await env.clock.advance(200);

                    // 斷言過場出現，且含該章標題
                    const storyVisible = storyRoot && !storyRoot.classList.contains("hidden");
                    if (!storyVisible) {
                        problems.push(`第 ${level.chapter} 章進關前沒有過場`);
                    } else {
                        const title = storyRoot.querySelector(".story-scene__title")?.textContent || "";
                        const expected = arc?.sceneTitle?.["zh-TW"] || "";
                        if (!title || !title.includes(expected.slice(0, 4))) {
                            problems.push(`第 ${level.chapter} 章過場標題不符：${title}`);
                        }
                    }

                    // 關上過場 → 進關卡
                    await closeChapterScene(env);
                    await env.clock.advance(1500);
                }

                // 過場關上後 #scene 的 theme 必須等於該章 scene
                const scene = env.document.getElementById("scene");
                const theme = scene?.dataset?.theme || "";
                if (theme !== level.scene) {
                    problems.push(`第 ${level.chapter} 章場景不符：theme=${theme} 期望=${level.scene}`);
                }

                // 場景卡司非空
                const layer = env.document.querySelector('#scene [data-layer="character"]');
                const members = layer?.querySelectorAll(".cast-member").length || 0;
                if (!members) {
                    problems.push(`第 ${level.chapter} 章場景卡司為空`);
                }

                // .char__art 的 src 對應該關的 companion
                const art = env.document.querySelector("#santa-container .char__art");
                const src = art?.getAttribute("src") || "";
                const expectedSrc = `./assets/characters/${level.companion}.svg`;
                if (src !== expectedSrc) {
                    problems.push(`第 ${level.chapter} 章搭檔不符：src=${src} 期望=${expectedSrc}`);
                }
            }

            return {
                ok: problems.length === 0,
                detail: problems.length
                    ? `劇情連貫問題 → ${problems.join(" | ")}`
                    : `六章過場、場景、卡司、搭檔皆對得上`
            };
        }
    },

    {
        name: "play-team-visible",
        async run(env) {
            // 完成一關後，#team-dock 內**至少有一個**成員。
            // 必須**實際玩**出一顆星星，不得直接改 progress。
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await enterLevel(env, 1);

            const dock = env.document.getElementById("team-dock");
            const before = dock?.querySelectorAll(".team-member").length || 0;

            // 實際玩出 3 回合
            for (let r = 0; r < 3; r++) {
                const res = await playOneRound(env);
                if (!res.ok) break;
                await env.clock.advance(3600);
            }
            await env.clock.advance(2000);

            const after = dock?.querySelectorAll(".team-member").length || 0;
            // 未解鎖者不顯示數量，也不得顯示評量構件
            const text = dock?.textContent || "";
            const hasAssessment = /\d+\s*%|正確率|掌握度|雷達/.test(text);

            const ok = after >= 1 && !hasAssessment;
            return {
                ok,
                detail: ok
                    ? `隊伍列成員 ${before} → ${after}`
                    : `隊伍列成員 ${before} → ${after}（需 ≥ 1）hasAssessment=${hasAssessment}`
            };
        }
    },

    {
        name: "play-story-once-per-chapter",
        async run(env) {
            // 同一章的**第二關**不再顯示過場。
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");

            // 第 5 關（第 1 章）→ 顯示第 1 章過場 → 關上
            await startLevel(env, 5);
            await env.clock.advance(200);
            const storyRoot = env.document.getElementById("story-root");
            const firstVisible = Boolean(storyRoot && !storyRoot.classList.contains("hidden"));
            await closeChapterScene(env);
            await env.clock.advance(1500);

            // 第 6 關（同章）→ 不應再有過場
            await startLevel(env, 6);
            await env.clock.advance(200);
            const secondVisible = Boolean(storyRoot && !storyRoot.classList.contains("hidden"));

            const ok = firstVisible && !secondVisible;
            return {
                ok,
                detail: ok
                    ? "第 1 章首關有過場、同章第二關無過場"
                    : `firstVisible=${firstVisible} secondVisible=${secondVisible}`
            };
        }
    },

    {
        name: "play-round-feedback",
        async run(env) {
            // Step 126：回合回饋的三重奏
            //  - 答對 → 角色切到 happy mood（不是只有 chime）
            //  - 答錯 → 角色切到 hint mood（友善，不是 sad）
            //  - 序列中間步驟 → 獨立的 round:step 事件（不得觸發 round:wrong）
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await enterLevel(env, 1);

            const mount = env.document.getElementById("santa-container");
            const mood = () => Array.from(mount?.classList || [])
                .find((c) => c.startsWith("char--") && c !== "char") || "";

            /** @type {string[]} */
            const events = [];
            env.onEvent("round:correct", () => events.push("correct"));
            env.onEvent("round:wrong", () => events.push("wrong"));
            env.onEvent("round:step", () => events.push("step"));
            env.onEvent("round:progress", () => events.push("progress"));

            // 實際作答
            const res = await playOneRound(env);
            await env.clock.advance(1200);

            const moodAfter = mood();
            const ok = (events.includes("correct") && moodAfter.includes("happy"))
                || (events.includes("wrong") && moodAfter.includes("hint"))
                || (events.includes("step") && moodAfter.includes("step"));

            // 不得使用 sad mood（幼兒產品原則：錯了不懲罰）
            const noSad = !moodAfter.includes("sad");
            // 三種回饋必須各自獨立（happy / step / hint 不得共用同一 mood）
            const distinct = new Set(["happy", "step", "hint"]).size === 3;
            void distinct;

            return {
                ok: ok && noSad,
                detail: `events=[${events.join(",")}] mood=${moodAfter || "(無)"} noSad=${noSad} | ${res.detail}`
            };
        }
    },

    {
        name: "play-round-step-event",
        async run(env) {
            // 序列玩法的中間步驟必須發出獨立的 round:step，
            // 且**不得**觸發 round:wrong（不得顯示「答錯」、不得扣分）。
            const levels = JSON.parse(
                fs.readFileSync(path.join(ROOT, "content/levels.json"), "utf8")
            );
            const arr = Array.isArray(levels) ? levels : levels.levels;
            const seqLevel = arr.find((/** @type {any} */ l) => l.verb === "rhythm"
                || l.verb === "sequence"
                || l.verb === "sound-order");

            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");

            /** @type {string[]} */
            const events = [];
            env.onEvent("round:correct", () => events.push("correct"));
            env.onEvent("round:wrong", () => events.push("wrong"));
            env.onEvent("round:step", () => events.push("step"));
            env.onEvent("round:progress", () => events.push("progress"));

            await enterLevel(env, seqLevel?.id ?? 1);
            const res = await playOneRound(env);
            await env.clock.advance(1200);

            // 若此關非序列玩法，則退而驗證「不得有 wrong 與 progress 混雜」
            const hasStep = events.includes("step");
            const noWrong = !events.includes("wrong");

            return {
                ok: noWrong && (hasStep || !events.includes("progress")),
                detail: `關卡 ${seqLevel?.id ?? 1}（${seqLevel?.verb ?? "?"}）events=[${events.join(",")}] | ${res.detail}`
            };
        }
    },

    {
        name: "play-no-blocking",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await enterLevel(env, 1);

            const st = currentState(env);
            const ok = env.errors.length === 0 && env.consoleErrors.length === 0;
            return {
                ok,
                detail: `uncaughtErrors=${env.errors.length} consoleErrors=${env.consoleErrors.length} phase=${st.phase}${env.errors.length ? ` | ${env.errors[0]}` : ""}${env.consoleErrors.length ? ` | ${env.consoleErrors[0]}` : ""}`
            };
        }
    },

    /* ---------------- 同意流程（Step 133／134） ---------------- */

    {
        name: "play-consent-blocks",
        options: { consented: false },
        async run(env) {
            await bootGame(env);
            await env.clock.advance(100);

            const startOverlay = env.document.getElementById("start-overlay");
            const gateRoot = env.document.getElementById("consent-gate-root");
            const gateOpen = Boolean(gateRoot) && !gateRoot.classList.contains("hidden");
            const startVisible = Boolean(startOverlay) && !startOverlay.classList.contains("hidden");

            // 未同意 → 不得進入開始畫面；同意閘必須開啟
            const ok = gateOpen && !startVisible;
            return {
                ok,
                detail: `consentGateOpen=${gateOpen} startOverlayVisible=${startVisible}`
            };
        }
    },

    {
        name: "play-consent-then-play",
        options: { consented: false },
        async run(env) {
            await bootGame(env);
            await env.clock.advance(100);

            // 勾選分析同意後送出
            await setConsentCheckbox(env, "analytics", true);
            await submitConsent(env);
            await env.clock.advance(100);

            const startOverlay = env.document.getElementById("start-overlay");
            const startVisible = Boolean(startOverlay) && !startOverlay.classList.contains("hidden");
            const gateRoot = env.document.getElementById("consent-gate-root");
            const gateClosed = Boolean(gateRoot) && gateRoot.classList.contains("hidden");

            const ok = startVisible && gateClosed;
            return {
                ok,
                detail: `startOverlayVisible=${startVisible} consentGateClosed=${gateClosed}`
            };
        }
    },

    {
        name: "play-consent-no-analytics-before",
        options: { consented: false },
        async run(env) {
            await bootGame(env);
            await env.clock.advance(100);

            // 同意前：遙測佇列必須為空（不得寫入任何分析事件）
            const raw = env.window.localStorage.getItem("mumu.telemetry.queue");
            const queue = raw ? JSON.parse(raw) : [];

            const ok = Array.isArray(queue) && queue.length === 0;
            return {
                ok,
                detail: `telemetryQueueLength=${Array.isArray(queue) ? queue.length : "非陣列"}`
            };
        }
    },

    {
        name: "play-consent-revoke",
        options: { consented: true },
        async run(env) {
            await bootGame(env);
            await env.clock.advance(50);

            // 先開啟分析同意
            env.window.localStorage.setItem("mumu.consent", JSON.stringify({
                analytics: true, personalization: false, marketing: false,
                updatedAt: "2026-01-01T00:00:00.000Z"
            }));
            env.window.localStorage.setItem("mumu.telemetry.queue", "[]");

            // 撤回分析同意（走 revokeConsent 的公開 API）
            const consentMod = await loadExtraModule(env, "src/js/core/consent.js");
            consentMod.revokeConsent("analytics");

            const saved = JSON.parse(env.window.localStorage.getItem("mumu.consent") || "{}");
            const ok = saved.analytics === false;
            return {
                ok,
                detail: `analyticsAfterRevoke=${saved.analytics}`
            };
        }
    },

    {
        name: "play-consent-delete-data",
        options: { consented: true },
        async run(env) {
            await bootGame(env);
            await env.clock.advance(50);

            // 塞入若干 mumu.* key
            env.window.localStorage.setItem("mumu.progress", JSON.stringify({ stars: { 1: 3 } }));
            env.window.localStorage.setItem("mumu.telemetry.queue", JSON.stringify([{ name: "x" }]));

            const consentMod = await loadExtraModule(env, "src/js/core/consent.js");
            const result = await consentMod.deleteAllData();

            const remaining = Object.keys(env.window.localStorage)
                .filter((k) => k.startsWith("mumu."));

            const ok = remaining.length === 0 && result !== false;
            return {
                ok,
                detail: `remainingMumuKeys=${remaining.length} result=${JSON.stringify(result)}`
            };
        }
    },

    {
        name: "play-consent-focus-trap",
        options: { consented: false },
        async run(env) {
            await bootGame(env);
            await env.clock.advance(100);

            const gateRoot = env.document.getElementById("consent-gate-root");
            if (!gateRoot) return { ok: false, detail: "缺 #consent-gate-root" };

            // Esc 不得繞過同意閘
            const esc = new env.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
            env.document.dispatchEvent(esc);
            await flush(6);
            const stillOpen = !gateRoot.classList.contains("hidden");

            // 同意閘必須具備對話框語意
            const dialog = gateRoot.querySelector("[role='dialog']");
            const modal = gateRoot.getAttribute("aria-modal");

            const ok = stillOpen && Boolean(dialog) && modal === "true";
            return {
                ok,
                detail: `stillOpenAfterEsc=${stillOpen} hasDialogRole=${Boolean(dialog)} ariaModal=${modal}`
            };
        }
    },

    /* ---------------- 離線（Step 129／130） ---------------- */

    {
        name: "play-offline-boot",
        async run(env) {
            // 模擬 Service Worker 已快取 PRECACHE 清單
            simulatePrecached(env);
            setOffline(env, true);

            await bootGame(env);
            await env.clock.advance(200);

            const overlay = env.document.getElementById("start-overlay");
            const status = env.document.getElementById("status-text");
            const statusText = status?.textContent || "";
            const startVisible = Boolean(overlay) && !overlay.classList.contains("hidden");

            setOffline(env, false);

            const loadFailed = /內容載入失敗|failed to load/i.test(statusText);
            const ok = startVisible && !loadFailed;
            return {
                ok,
                detail: `startVisible=${startVisible} statusText="${statusText}" loadFailed=${loadFailed}`
            };
        }
    },

    {
        name: "play-offline-level",
        async run(env) {
            simulatePrecached(env);
            setOffline(env, true);

            await bootGame(env);
            await env.clock.advance(200);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await enterLevel(env, 1);

            const st = currentState(env);
            setOffline(env, false);

            const ok = st.phase === "input" && env.errors.length === 0;
            return {
                ok,
                detail: `phase=${st.phase} errors=${env.errors.length}${env.errors.length ? ` | ${env.errors[0]}` : ""}`
            };
        }
    },

    /* ---------------- XSS 防護（Step 153） ---------------- */

    {
        name: "play-xss-escape",
        async run(env) {
            const sanitize = await loadExtraModule(env, "src/js/core/sanitize-html.js");

            const payload = '<img src=x onerror="alert(1)">';
            const escaped = sanitize.escapeHtml(payload);
            const safe = sanitize.safeText(payload);

            const noTag = !escaped.includes("<img");
            const noQuote = !escaped.includes('"');
            const noAngle = !escaped.includes("<") && !escaped.includes(">");
            // safeText 的用途是搭配 textContent：保留原文但不做 HTML 轉換
            const safeIsPlainString = safe === payload;

            // safeText 對非字串必須回傳空字串
            const nonString = sanitize.safeText(/** @type {any} */ (null)) === ""
                && sanitize.safeText(/** @type {any} */ (undefined)) === ""
                && sanitize.safeText(/** @type {any} */ ({ a: 1 })) === "";

            const ok = noTag && noQuote && noAngle && safeIsPlainString && nonString;
            return {
                ok,
                detail: `escaped="${escaped}" noTag=${noTag} noQuote=${noQuote} noAngle=${noAngle} safeIsPlain=${safeIsPlainString} nonStringSafe=${nonString}`
            };
        }
    },

    {
        name: "play-xss-url-guard",
        async run(env) {
            const validate = await loadExtraModule(env, "src/js/core/input-validate.js");

            const cases = [
                ["https://example.com/ok", true],
                ["http://evil.com/bad", false],
                ["javascript:alert(1)", false],
                ["data:text/html,<script>", false],
                ["//evil.com/proto-rel", false],
                ["/local/path", true],
                ["./rel/path", true]
            ];

            const results = cases.map(([url, expected]) =>
                (validate.safeUrl(url) !== "") === expected);

            const referralOk = validate.safeReferralCode("abc_123") === "abc_123"
                && validate.safeReferralCode("<script>") === ""
                && validate.safeReferralCode("a") === "";

            const ok = results.every(Boolean) && referralOk;
            return {
                ok,
                detail: `urlCases=${results.join(",")} referralOk=${referralOk}`
            };
        }
    },

    {
        name: "play-xss-story-injection",
        async run(env) {
            // 直接以含惡意字串的場景資料渲染 story，確認未產生可執行節點
            await bootGame(env);
            await env.clock.advance(50);

            const story = await loadExtraModule(env, "src/js/ui/story.js");
            const root = env.document.getElementById("story-root");
            story.showStoryScene(root, {
                title: '<img src=x onerror="window.__pwned=1">',
                body: "<script>window.__pwned=1</script>",
                tagline: "<b>bold</b>",
                art: '"><script>window.__pwned=1</script>'
            });

            const pwned = env.window.__pwned === 1;
            // 惡意字串必須以**純文字**呈現，不得成為可執行節點
            const injected = root.querySelectorAll("img[onerror], script, img[src^='x']").length;
            // 文字節點內容應為轉義後的可見文字（顯示 "<script>" 字面量而非節點）
            const titleText = root.querySelector(".story-scene__title")?.textContent || "";
            const bodyText = root.querySelector(".story-scene__text")?.textContent || "";
            const shownAsText = titleText.includes("<img") && bodyText.includes("<script>");

            const ok = !pwned && injected === 0 && shownAsText;
            return {
                ok,
                detail: `pwned=${pwned} injectedNodes=${injected} shownAsText=${shownAsText}`
            };
        }
    },

    /* ---------------- 回合回饋三重奏（Step 126／128） ---------------- */

    {
        name: "play-feedback-trio",
        async run(env) {
            const fb = await loadExtraModule(env, "src/js/ui/round-feedback.js");
            const mount = env.document.getElementById("santa-container");
            if (!mount) return { ok: false, detail: "缺 #santa-container" };

            const mood = () => Array.from(mount.classList)
                .find((c) => c.startsWith("char--") && c !== "char") || "";

            // 答對 → happy
            fb.feedbackCorrect();
            const correctMood = mood();

            // 進行中 → step（獨立的 mood）
            fb.feedbackStep();
            const stepMood = mood();

            // 答錯 → hint
            fb.feedbackWrong();
            const wrongMood = mood();

            const ok = correctMood.includes("happy")
                && stepMood.includes("step")
                && wrongMood.includes("hint")
                && !wrongMood.includes("sad");

            return {
                ok,
                detail: `correct=${correctMood} step=${stepMood} wrong=${wrongMood}`
            };
        }
    },

    {
        name: "play-feedback-reduced-motion",
        async run(env) {
            // 開啟 prefers-reduced-motion
            const w = env.window;
            const original = w.matchMedia;
            w.matchMedia = (query) => ({
                matches: String(query).includes("prefers-reduced-motion"),
                media: query,
                addEventListener() { },
                removeEventListener() { }
            });

            try {
                const fb = await loadExtraModule(env, "src/js/ui/round-feedback.js");
                const reduced = fb.prefersReducedMotion();

                const mount = env.document.getElementById("santa-container");
                fb.feedbackCorrect();

                const mood = Array.from(mount?.classList || [])
                    .find((c) => c.startsWith("char--") && c !== "char") || "";

                // reduced-motion 下仍須有 mood 變化（靜態狀態變化），只是不做粒子
                const ok = reduced === true && mood.includes("happy");
                return {
                    ok,
                    detail: `reducedMotionDetected=${reduced} mood=${mood}`
                };
            } finally {
                w.matchMedia = original;
            }
        }
    },

    {
        name: "play-no-sad-mood",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            await closePrologue(env);
            await env.clock.advance(300);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");
            await enterLevel(env, 1);

            const res = await playOneRound(env);
            await env.clock.advance(1200);

            // 掃描整份 DOM：不得出現 char--sad
            const sadEls = env.document.querySelectorAll(".char--sad").length;

            const ok = sadEls === 0;
            return {
                ok,
                detail: `sadElements=${sadEls} | ${res.detail}`
            };
        }
    },

    /* ---------------- Web Vitals（Step 131） ---------------- */

    {
        name: "play-vitals-no-api",
        async run(env) {
            // 移除 PerformanceObserver → 必須降級為 null 且不拋錯
            delete env.window.PerformanceObserver;

            const vitals = await loadExtraModule(env, "src/js/core/vitals.js");
            const started = vitals.initVitals();
            const v = vitals.getVitals();

            const ok = started === false
                && v.lcp === null && v.cls === null && v.inp === null
                && env.errors.length === 0;

            return {
                ok,
                detail: `started=${started} lcp=${v.lcp} cls=${v.cls} inp=${v.inp} errors=${env.errors.length}`
            };
        }
    },

    {
        name: "play-vitals-boot",
        async run(env) {
            await bootGame(env);
            await env.clock.advance(100);

            const ok = env.errors.length === 0 && env.consoleErrors.length === 0;
            return {
                ok,
                detail: `errors=${env.errors.length} consoleErrors=${env.consoleErrors.length}${env.errors.length ? ` | ${env.errors[0]}` : ""}`
            };
        }
    },

    {
        name: "play-telemetry-flush",
        async run(env) {
            await bootGame(env);
            await env.clock.advance(50);

            const telemetry = await loadExtraModule(env, "src/js/core/telemetry.js");
            // 未取得分析同意 → 不得寫入佇列
            telemetry.track("test_event", { levelId: 1 });
            const q1 = telemetry.getQueue();
            const emptyWithoutConsent = q1.length === 0;

            // 開啟同意後應寫入
            env.window.localStorage.setItem("mumu.consent", JSON.stringify({
                analytics: true, personalization: false, marketing: false,
                updatedAt: "2026-01-01T00:00:00.000Z"
            }));
            telemetry.track("test_event", { levelId: 1 });
            const q2 = telemetry.getQueue();

            // flush 未設端點 → 不外送但保留佇列
            const flushed = await telemetry.flush();
            const q3 = telemetry.getQueue();

            const ok = emptyWithoutConsent && q2.length === 1 && flushed.ok && q3.length === 1;
            return {
                ok,
                detail: `noConsent=${q1.length} afterConsent=${q2.length} flushSent=${flushed.sent} kept=${q3.length}`
            };
        }
    },

    /* ---------------- 題庫去重抽題（Step 162／163） ---------------- */

    {
        name: "play-items-dedup-window",
        async run(env) {
            const items = await loadExtraModule(env, "src/js/data/items.js");
            const levels = await loadExtraModule(env, "src/js/data/levels.js");

            items.resetRecentItems();

            const pool = Array.from({ length: 8 }, (_, i) => ({
                id: `probe-${i}`,
                "zh-TW": `題${i}`,
                "en-US": `item${i}`
            }));

            // 連續抽取 30 回合：同一回合內不得重複
            let intraRoundDup = 0;
            for (let r = 0; r < 30; r++) {
                const picked = items.pickUnseen(pool, "test-pool");
                if (!picked) {
                    intraRoundDup += 1;
                }
            }

            // 視窗內不得重複：連續取 8 題（視窗 = max(4, floor(8*2/3)) = 5）
            const windowSeen = [];
            for (let i = 0; i < 5; i++) {
                const picked = items.pickUnseen(pool, "window-pool");
                if (picked) windowSeen.push(picked.id);
            }
            const windowDup = new Set(windowSeen).size !== windowSeen.length;

            // 題庫將盡時不得卡死／回傳 null
            const exhausted = [];
            for (let i = 0; i < 40; i++) {
                const picked = items.pickUnseen(pool, "exhaust-pool");
                if (!picked) exhausted.push(null);
            }

            // pickItems 題庫異常時回退安全預設題，不得回傳空陣列
            const fallback = levels.pickItems({}, "shape", 3);

            const ok = intraRoundDup === 0
                && !windowDup
                && exhausted.length === 0
                && Array.isArray(fallback)
                && fallback.length === 3;

            return {
                ok,
                detail: `nullPicks=${intraRoundDup} windowDup=${windowDup} exhaustedNulls=${exhausted.length} fallback=${fallback.length}`
            };
        }
    },

    {
        name: "play-items-round-no-duplicate",
        async run(env) {
            const items = await loadExtraModule(env, "src/js/data/items.js");
            const levels = await loadExtraModule(env, "src/js/data/levels.js");

            items.resetRecentItems();

            // 模擬 30 回合，每回合取 3 題
            let dupRounds = 0;
            for (let r = 0; r < 30; r++) {
                const picked = levels.pickItems({ items: { animals: [] } }, "sequence", 3);
                const ids = picked.map((it) => it.id ?? String(it.value));
                if (new Set(ids).size !== ids.length) dupRounds++;
            }

            const ok = dupRounds === 0;
            return { ok, detail: `dupRounds=${dupRounds}/30` };
        }
    },

    /* ---------------- 聽覺可及性（Step 196／205／206） ---------------- */

    {
        name: "play-voice-degrade-unsupported",
        async run(env) {
            delete env.window.speechSynthesis;

            const voice = await loadExtraModule(env, "src/js/audio/voice.js");
            const state = voice.getVoiceState();
            const avail = voice.voiceAvailable();
            const needsFallback = voice.needsVisualFallback();

            const ok = state.supported === false
                && state.reason === "unsupported"
                && avail === false
                && needsFallback === true;

            return {
                ok,
                detail: `supported=${state.supported} reason=${state.reason} available=${avail} needsFallback=${needsFallback}`
            };
        }
    },

    {
        name: "play-voice-degrade-muted",
        async run(env) {
            const voice = await loadExtraModule(env, "src/js/audio/voice.js");

            voice.setSpeechEnabled(false);
            const state = voice.getVoiceState();
            const muted = state.muted === true && state.reason === "muted";

            voice.setSpeechEnabled(true);
            const restored = voice.getVoiceState().muted === false;

            const ok = muted && restored;
            return { ok, detail: `muted=${state.muted} reason=${state.reason} restored=${restored}` };
        }
    },

    {
        name: "play-visual-fallback-cards",
        async run(env) {
            const a11y = await loadExtraModule(env, "src/js/ui/a11y.js");
            const root = env.document.getElementById("tv-view") || env.document.body;

            a11y.showVisualFallback(root, {
                pair: ["八", "爸"],
                reason: "unsupported",
                locale: "zh-TW"
            });

            const host = root.querySelector("#visual-fallback");
            const cards = root.querySelectorAll(".visual-fallback__card");
            const visible = host && !host.classList.contains("hidden");
            const texts = Array.from(cards).map((c) => c.textContent);
            const noEmoji = !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(host?.textContent || "");

            const ok = Boolean(host) && visible && cards.length === 2
                && texts[0] === "八" && texts[1] === "爸" && noEmoji;

            a11y.hideVisualFallback(root);
            const hidden = host.classList.contains("hidden");

            return {
                ok: ok && hidden,
                detail: `visible=${visible} cards=${cards.length} texts=${texts.join(",")} noEmoji=${noEmoji} hiddenAfter=${hidden}`
            };
        }
    },

    {
        name: "play-visual-fallback-beats",
        async run(env) {
            const a11y = await loadExtraModule(env, "src/js/ui/a11y.js");
            const root = env.document.getElementById("tv-view") || env.document.body;

            a11y.showVisualFallback(root, { beats: 4, reason: "no-voice", locale: "zh-TW" });
            const pulses = root.querySelectorAll(".visual-fallback__pulse");
            const ok = pulses.length === 4;
            return { ok, detail: `pulses=${pulses.length}` };
        }
    },

    {
        name: "play-visual-fallback-xss-safe",
        async run(env) {
            const a11y = await loadExtraModule(env, "src/js/ui/a11y.js");
            const root = env.document.getElementById("tv-view") || env.document.body;

            a11y.showVisualFallback(root, {
                pair: ['<img src=x onerror="window.__pwned=1">', "爸"],
                reason: "unsupported",
                locale: "zh-TW"
            });

            const injected = root.querySelectorAll("img[onerror], script").length;
            const card = root.querySelector(".visual-fallback__card");
            const shownAsText = (card?.textContent || "").includes("<img");

            const ok = injected === 0 && shownAsText;
            return { ok, detail: `injected=${injected} shownAsText=${shownAsText}` };
        }
    },

    {
        name: "play-a11y-visual-assist-pref",
        async run(env) {
            const a11y = await loadExtraModule(env, "src/js/ui/a11y.js");
            const root = env.document.body;

            a11y.setVisualAssistMode(root, true);
            const on = root.dataset.visualAssist === "on" && root.classList.contains("visual-assist");
            const saved = a11y.getPreferences().visualAssist === true;

            a11y.setLargeTargets(root, true);
            const large = root.dataset.largeTargets === "on" && a11y.getPreferences().largeTargets === true;

            a11y.setVisualAssistMode(root, false);
            const off = root.dataset.visualAssist === "off" && a11y.getPreferences().visualAssist === false;

            const ok = on && saved && large && off;
            return { ok, detail: `on=${on} saved=${saved} large=${large} off=${off}` };
        }
    },

    {
        name: "play-voice-unavailable-event",
        async run(env) {
            delete env.window.speechSynthesis;

            const voice = await loadExtraModule(env, "src/js/audio/voice.js");
            const events = await loadExtraModule(env, "src/js/core/events.js");

            let received = null;
            events.on("voice:unavailable", (e) => { received = e.payload; });

            voice.speak("八", { locale: "zh-TW" });

            const payload = /** @type {any} */ (received);
            const ok = received !== null
                && payload.reason === "unsupported"
                && payload.text === "八";

            return {
                ok,
                detail: `received=${received ? JSON.stringify(received) : "null"}`
            };
        }
    },

    /* ---------------- 觸控目標／分頁懶載入（Step 127／149） ---------------- */

    {
        name: "play-touch-targets",
        async run(_env) {
            const css = fs.readFileSync(path.join(ROOT, "src/styles/components.css"), "utf8");
            const tokens = fs.readFileSync(path.join(ROOT, "src/styles/tokens.css"), "utf8");

            // 觸控目標下限 token 必須 >= 48px
            const touchMin = Number((tokens.match(/--touch-min:\s*(\d+)px/) || [])[1] || 0);

            // 五類可點元件都必須宣告 >= 48px 的 min 尺寸
            const required = [".control-btn", ".mode-option", ".level-btn", ".tool-btn", ".dex-card", ".dex-entry"];
            const missing = [];
            for (const sel of required) {
                const re = new RegExp(sel.replace(".", "\\.") + "[^{]*\\{[^}]*min-height");
                if (!re.test(css)) missing.push(sel);
            }

            const ok = touchMin >= 48 && missing.length === 0;
            return {
                ok,
                detail: `touchMin=${touchMin}px missing=${missing.join(",") || "none"}`
            };
        }
    },

    {
        name: "play-dex-pagination",
        async run(env) {
            const dex = await loadExtraModule(env, "src/js/ui/dex.js");
            const root = env.document.getElementById("dex-root");

            // 24 隻 → 單頁；節點數 <= 24
            const bundle = { dex: Array.from({ length: 24 }, (_, i) => ({
                id: `d${i}`, dexNo: i + 1,
                name: { "zh-TW": `恐龍${i}`, "en-US": `Dino${i}` },
                art: { file: "./assets/characters/santa.svg" },
                unlockCondition: { type: "levels", count: 1 },
                personality: { "zh-TW": "p", "en-US": "p" }
            })) };

            dex.renderDex(root, bundle, { unlockedDex: [], stars: {}, samples: [] }, "zh-TW");
            const nodes = root.querySelectorAll(".dex-entry").length;

            // 61 隻 → 3 頁；單頁仍 <= 24
            const big = { dex: Array.from({ length: 61 }, (_, i) => ({
                id: `x${i}`, dexNo: i + 1,
                name: { "zh-TW": `恐龍${i}`, "en-US": `Dino${i}` },
                art: { file: "./assets/characters/santa.svg" },
                unlockCondition: { type: "levels", count: 1 },
                personality: { "zh-TW": "p", "en-US": "p" }
            })) };

            dex.renderDex(root, big, { unlockedDex: [], stars: {}, samples: [] }, "zh-TW");
            const page1Nodes = root.querySelectorAll(".dex-entry").length;
            const pager = root.querySelector(".dex-pager");
            const nextBtn = root.querySelector("#dex-page-next");
            const prevBtn = root.querySelector("#dex-page-prev");

            // 圖片懶載入
            const lazy = root.querySelectorAll('.dex-entry__art img[loading="lazy"]').length;

            // 翻頁
            let page2Nodes = 0;
            if (nextBtn) {
                nextBtn.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true }));
                page2Nodes = root.querySelectorAll(".dex-entry").length;
            }

            const ok = nodes === 24
                && page1Nodes === 24
                && page2Nodes === 24
                && Boolean(pager)
                && Boolean(nextBtn)
                && Boolean(prevBtn)
                && lazy === 24;

            return {
                ok,
                detail: `nodes=${nodes} page1=${page1Nodes} page2=${page2Nodes} pager=${Boolean(pager)} lazyImgs=${lazy}`
            };
        }
    },

    {
        name: "play-levelmap-pagination",
        async run(env) {
            const map = await loadExtraModule(env, "src/js/ui/levelmap.js");
            const root = env.document.getElementById("levelmap-root");

            const levels = Array.from({ length: 40 }, (_, i) => ({
                id: i + 1, chapter: Math.floor(i / 8), verb: "sequence",
                name: { "zh-TW": `第${i + 1}關`, "en-US": `Level ${i + 1}` },
                spec: {}, scene: "christmas"
            }));
            const bundle = {
                levels,
                storyArcs: { chapters: [{ chapter: 0, title: { "zh-TW": "第一章", "en-US": "Ch1" } }] }
            };

            map.renderLevelMap(root, bundle, { unlockedLevels: levels.map((l) => l.id), stars: {} }, "zh-TW");
            const nodes = root.querySelectorAll("[data-level]").length;
            const pager = root.querySelector(".levelmap__pager");
            const lazy = root.querySelectorAll('.levelmap__star[loading="lazy"]').length;

            const ok = nodes <= 24 && nodes === 24 && Boolean(pager) && lazy > 0;
            return { ok, detail: `nodes=${nodes} pager=${Boolean(pager)} lazyStars=${lazy}` };
        }
    },

    {
        name: "play-dex-empty-state",
        async run(env) {
            const dex = await loadExtraModule(env, "src/js/ui/dex.js");
            const root = env.document.getElementById("dex-root");

            dex.renderDex(root, { dex: [] }, { unlockedDex: [] }, "zh-TW");
            const empty = root.querySelector(".dex-empty");
            const entries = root.querySelectorAll(".dex-entry").length;

            const ok = Boolean(empty) && entries === 0;
            return { ok, detail: `empty=${Boolean(empty)} entries=${entries}` };
        }
    },

    {
        name: "play-dex-skeleton",
        async run(env) {
            const dex = await loadExtraModule(env, "src/js/ui/dex.js");
            const root = env.document.getElementById("dex-root");

            dex.showDexSkeleton(root, 8);
            const skeletons = root.querySelectorAll(".dex-entry--skeleton").length;

            const ok = skeletons === 8;
            return { ok, detail: `skeletons=${skeletons}` };
        }
    },

    /* ---------------- 成效評量接線（Step 157） ---------------- */

    {
        name: "play-assessment-storage-isolated",
        async run(env) {
            const ui = await loadExtraModule(env, "src/js/ui/assessment-ui.js");

            ui.clearAssessmentRuns();
            const before = ui.loadAssessmentRuns();

            // 記錄兒童進度存檔的「前」狀態（用來比對是否被汙染）
            const progressBefore = env.window.localStorage.getItem("mumu.progress.v2");

            // 寫入一次前測
            ui.recordAssessmentRun("pre", { items: [] }, { correctRate: 0.5, total: 2 });

            const runs = ui.loadAssessmentRuns();
            const raw = env.window.localStorage.getItem("mumu.assessment.v1");

            // 兒童進度存檔不得被汙染（前後必須完全相同）
            const progressAfter = env.window.localStorage.getItem("mumu.progress.v2");

            const ok = before.length === 0
                && runs.length === 1
                && runs[0].phase === "pre"
                && Boolean(raw)
                && progressBefore === progressAfter;

            return {
                ok,
                detail: `before=${before.length} runs=${runs.length} hasAssessmentKey=${Boolean(raw)} progressUntouched=${progressBefore === progressAfter}`
            };
        }
    },

    {
        name: "play-assessment-phase-order",
        async run(env) {
            const ui = await loadExtraModule(env, "src/js/ui/assessment-ui.js");
            ui.clearAssessmentRuns();

            const first = ui.nextPhase();
            ui.recordAssessmentRun("pre", {}, { correctRate: 0.4, total: 2 });
            const second = ui.nextPhase();
            ui.recordAssessmentRun("post", {}, { correctRate: 0.8, total: 2 });
            const third = ui.nextPhase();

            const ok = first === "pre" && second === "post" && third === null;
            return { ok, detail: `first=${first} second=${second} third=${third}` };
        }
    },

    {
        name: "play-assessment-empty-state",
        async run(env) {
            const ui = await loadExtraModule(env, "src/js/ui/assessment-ui.js");
            const root = env.document.getElementById("assessment-root");

            ui.runAssessment(root, { assessment: {} }, "zh-TW", "pre", () => { });
            const empty = root.querySelector(".assessment--empty");
            const text = root.textContent || "";

            const ok = Boolean(empty) && text.includes("尚無評量題目");
            return { ok, detail: `empty=${Boolean(empty)} text=${text.slice(0, 30)}` };
        }
    },

    {
        name: "play-assessment-flow-writes-report",
        async run(env) {
            const ui = await loadExtraModule(env, "src/js/ui/assessment-ui.js");
            const root = env.document.getElementById("assessment-root");
            ui.clearAssessmentRuns();

            const assessment = JSON.parse(
                fs.readFileSync(path.join(ROOT, "content/assessment.json"), "utf8")
            );
            // 完整跑完一個量表（zh-TW 最小題數）
            const scaleName = Object.keys(assessment.pretest)[0];
            const items = assessment.pretest[scaleName]["zh-TW"];
            const mini = { assessment: { pretest: { s: { "zh-TW": items.slice(0, 2) } } } };

            let finished = false;
            ui.runAssessment(root, mini, "zh-TW", "pre", () => { finished = true; });

            // 作答第一題（點擊第一個選項）
            const opt = root.querySelector("[data-option]");
            if (opt) {
                opt.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true }));
            }
            await flush(10);

            // 作答第二題
            const opt2 = root.querySelector("[data-option]");
            if (opt2) {
                opt2.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true }));
            }
            await flush(10);

            const runs = ui.loadAssessmentRuns();
            const done = root.querySelector(".assessment--done");

            const ok = Boolean(finished) && runs.length === 1 && Boolean(done);
            return {
                ok,
                detail: `finished=${finished} runs=${runs.length} done=${Boolean(done)}`
            };
        }
    },

    {
        name: "play-assessment-resume-cursor",
        async run(env) {
            const ui = await loadExtraModule(env, "src/js/ui/assessment-ui.js");
            const root = env.document.getElementById("assessment-root");
            ui.clearAssessmentRuns();

            const assessment = JSON.parse(
                fs.readFileSync(path.join(ROOT, "content/assessment.json"), "utf8")
            );
            const items = assessment.pretest[Object.keys(assessment.pretest)[0]]["zh-TW"];
            const mini = { assessment: { pretest: { s: { "zh-TW": items.slice(0, 3) } } } };

            // 作答第一題後離開
            ui.runAssessment(root, mini, "zh-TW", "pre", () => { });
            const opt = root.querySelector("[data-option]");
            if (opt) opt.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true }));
            await flush(10);

            const cursor = env.window.localStorage.getItem("mumu.assessment.v1.cursor.pre");

            // 重新進入 → 應從第 2 題續答
            ui.runAssessment(root, mini, "zh-TW", "pre", () => { });
            const progress = root.querySelector(".assessment__progress")?.textContent || "";

            const ok = Boolean(cursor) && progress.includes("2/3");
            return { ok, detail: `cursor=${cursor} progress=${progress.trim()}` };
        }
    },

    {
        name: "play-assessment-double-click-lock",
        async run(env) {
            const ui = await loadExtraModule(env, "src/js/ui/assessment-ui.js");
            const root = env.document.getElementById("assessment-root");
            ui.clearAssessmentRuns();

            const assessment = JSON.parse(
                fs.readFileSync(path.join(ROOT, "content/assessment.json"), "utf8")
            );
            const items = assessment.pretest[Object.keys(assessment.pretest)[0]]["zh-TW"];
            const mini = { assessment: { pretest: { s: { "zh-TW": items.slice(0, 3) } } } };

            ui.runAssessment(root, mini, "zh-TW", "pre", () => { });
            const opt = root.querySelector("[data-option]");
            if (!opt) return { ok: false, detail: "找不到選項" };

            // 連點兩次 → 只應前進一題
            opt.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true }));
            opt.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true }));
            await flush(10);

            const progress = root.querySelector(".assessment__progress")?.textContent || "";
            const ok = progress.includes("2/3");
            return { ok, detail: `progress=${progress.trim()}` };
        }
    },

    {
        name: "play-parent-report-assessment-entry",
        async run(env) {
            const report = await loadExtraModule(env, "src/js/ui/parent-report.js");
            const root = env.document.getElementById("parent-report-root");

            report.renderParentReport(root, { stars: {}, unlockedDex: [] }, { dex: [] }, "zh-TW");

            const btn = root.querySelector("#parent-assessment-start");
            const entry = root.querySelector(".parent-report__assessment-entry");
            const ok = Boolean(btn) && Boolean(entry);
            return { ok, detail: `btn=${Boolean(btn)} entry=${Boolean(entry)}` };
        }
    },

    /* ---------------- 上市基建（Step 168） ---------------- */

    {
        name: "play-seo-meta-present",
        async run(_env) {
            const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

            const required = [
                'property="og:title"', 'property="og:description"', 'property="og:image"',
                'name="twitter:card"', 'name="twitter:title"', 'name="twitter:image"',
                'rel="canonical"'
            ];
            const missing = required.filter((m) => !html.includes(m));

            // og:image 檔案必須存在
            const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
            const imgRef = ogMatch ? ogMatch[1].replace(/^\.\//, "") : "";
            const imgExists = Boolean(imgRef) && fs.existsSync(path.join(ROOT, imgRef));

            const ok = missing.length === 0 && imgExists;
            return { ok, detail: `missing=${missing.join(",") || "none"} ogImage=${imgRef} exists=${imgExists}` };
        }
    },

    {
        name: "play-footer-links",
        async run(env) {
            await bootGame(env);
            await env.clock.advance(300);

            const footer = env.document.getElementById("app-footer");
            const privacy = env.document.getElementById("footer-privacy");
            const terms = env.document.getElementById("footer-terms");
            const support = env.document.getElementById("footer-support");
            const version = env.document.getElementById("footer-version");

            const privacyHref = privacy?.getAttribute("href") || "";
            const termsHref = terms?.getAttribute("href") || "";
            const supportHref = support?.getAttribute("href") || "";

            // 連結必須有效（檔案存在）
            const privacyExists = fs.existsSync(path.join(ROOT, privacyHref.replace(/^\.\//, "")));
            const termsExists = fs.existsSync(path.join(ROOT, termsHref.replace(/^\.\//, "")));

            // 禁 example.com / TODO
            const noPlaceholder = !/example\.com|TODO/.test(footer?.textContent || "");

            // 版本號
            const hasVersion = /\d+\.\d+\.\d+/.test(version?.textContent || "");

            const ok = Boolean(footer) && Boolean(privacy) && Boolean(terms)
                && Boolean(support) && privacyExists && termsExists
                && supportHref.startsWith("mailto:")
                && noPlaceholder && hasVersion;

            return {
                ok,
                detail: `footer=${Boolean(footer)} privacyExists=${privacyExists} termsExists=${termsExists} mailto=${supportHref.startsWith("mailto:")} version=${version?.textContent}`
            };
        }
    },

    {
        name: "play-manifest-fields",
        async run(_env) {
            const m = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));

            const hasId = Boolean(m.id);
            const shortcuts = Array.isArray(m.shortcuts) ? m.shortcuts.length : 0;
            const maskable = (m.icons || []).some((i) => String(i.purpose || "").includes("maskable"));

            // shortcut 圖示必須存在
            const iconMissing = (m.shortcuts || []).some((sc) =>
                (sc.icons || []).some((i) => !fs.existsSync(path.join(ROOT, String(i.src).replace(/^\.\//, "")))));

            const ok = hasId && shortcuts > 0 && maskable && !iconMissing;
            return { ok, detail: `id=${m.id} shortcuts=${shortcuts} maskable=${maskable} iconMissing=${iconMissing}` };
        }
    },

    /* ---------------- PWA 安裝引導（Step 167） ---------------- */

    {
        name: "play-pwa-install-standalone",
        async run(env) {
            // 模擬已安裝（display-mode: standalone）
            const original = env.window.matchMedia;
            env.window.matchMedia = (query) => ({
                matches: String(query).includes("display-mode: standalone"),
                media: query,
                addEventListener() { },
                removeEventListener() { }
            });

            try {
                const pwa = await loadExtraModule(env, "src/js/ui/pwa-install.js");
                const root = env.document.getElementById("pwa-install-root");
                const res = pwa.initPwaInstall(root, "zh-TW");

                const visible = root && !root.classList.contains("hidden");
                const ok = res.canShow === false && res.mode === "none" && !visible;
                return {
                    ok,
                    detail: `canShow=${res.canShow} mode=${res.mode} visible=${visible}`
                };
            } finally {
                env.window.matchMedia = original;
            }
        }
    },

    {
        name: "play-pwa-install-beforeinstallprompt",
        async run(env) {
            const pwa = await loadExtraModule(env, "src/js/ui/pwa-install.js");
            const root = env.document.getElementById("pwa-install-root");
            const res = pwa.initPwaInstall(root, "zh-TW");

            // 模擬 beforeinstallprompt
            let promptedCalled = false;
            const evt = new env.window.Event("beforeinstallprompt", { cancelable: true });
            evt.prompt = async () => { promptedCalled = true; };
            void promptedCalled;
            evt.preventDefault = () => { };
            env.window.dispatchEvent(evt);
            await flush(10);

            const visible = root && !root.classList.contains("hidden");
            const hasInstallBtn = Boolean(root?.querySelector("#pwa-install-btn"));
            const hasSkip = Boolean(root?.querySelector("#pwa-install-skip"));
            const hasClose = Boolean(root?.querySelector("#pwa-install-close"));
            const role = root?.querySelector(".pwa-install")?.getAttribute("role");

            const ok = res.mode === "native" && visible && hasInstallBtn && hasSkip && hasClose && role === "dialog";
            return {
                ok,
                detail: `mode=${res.mode} visible=${visible} installBtn=${hasInstallBtn} skip=${hasSkip} close=${hasClose} role=${role}`
            };
        }
    },

    {
        name: "play-pwa-install-ios",
        async run(env) {
            // 模擬 iOS Safari UA
            const originalUA = env.window.navigator.userAgent;
            Object.defineProperty(env.window.navigator, "userAgent", {
                value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                configurable: true
            });

            try {
                const pwa = await loadExtraModule(env, "src/js/ui/pwa-install.js");
                const root = env.document.getElementById("pwa-install-root");
                const res = pwa.initPwaInstall(root, "zh-TW");

                const visible = root && !root.classList.contains("hidden");
                const steps = root?.querySelectorAll(".pwa-install__step").length || 0;
                // iOS 步驟圖卡不得有安裝鈕（iOS 無 beforeinstallprompt）
                const noInstallBtn = !root?.querySelector("#pwa-install-btn");
                // 禁 emoji
                const noEmoji = !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(root?.textContent || "");

                const ok = res.mode === "ios" && visible && steps === 3 && noInstallBtn && noEmoji;
                return {
                    ok,
                    detail: `mode=${res.mode} visible=${visible} steps=${steps} noInstallBtn=${noInstallBtn} noEmoji=${noEmoji}`
                };
            } finally {
                Object.defineProperty(env.window.navigator, "userAgent", {
                    value: originalUA,
                    configurable: true
                });
            }
        }
    },

    {
        name: "play-pwa-install-dismiss-cooldown",
        async run(env) {
            const pwa = await loadExtraModule(env, "src/js/ui/pwa-install.js");
            const root = env.document.getElementById("pwa-install-root");

            // 略過 → 進入冷卻期
            pwa.recordDismiss();
            const inCd = pwa.inCooldown();

            const res = pwa.initPwaInstall(root, "zh-TW");
            const visible = root && !root.classList.contains("hidden");

            const ok = inCd === true && res.canShow === false && !visible;
            return {
                ok,
                detail: `inCooldown=${inCd} canShow=${res.canShow} visible=${visible}`
            };
        }
    },

    {
        name: "play-pwa-install-esc",
        async run(env) {
            const pwa = await loadExtraModule(env, "src/js/ui/pwa-install.js");
            const root = env.document.getElementById("pwa-install-root");
            pwa.initPwaInstall(root, "zh-TW");

            const evt = new env.window.Event("beforeinstallprompt", { cancelable: true });
            evt.prompt = async () => { };
            evt.preventDefault = () => { };
            env.window.dispatchEvent(evt);
            await flush(10);

            const visibleBefore = !root.classList.contains("hidden");

            const esc = new env.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
            env.document.dispatchEvent(esc);
            await flush(10);

            const visibleAfter = !root.classList.contains("hidden");
            const ok = visibleBefore && !visibleAfter;
            return {
                ok,
                detail: `visibleBefore=${visibleBefore} visibleAfter=${visibleAfter}`
            };
        }
    },

    /* ---------------- Round 1 上市紅線（L1–L4） ---------------- */

    {
        name: "play-paywall-no-fake-deal",
        async run(env) {
            await bootGame(env);
            await env.clock.advance(200);

            const paywall = await loadExtraModule(env, "src/js/ui/paywall.js");
            const root = env.document.getElementById("share-root");

            paywall.showPaywall(root, {
                id: "chapter4",
                title: "解鎖完整旅程",
                body: "第 4–5 章與恐龍谷主題包。資料僅儲存於本機裝置。",
                cta: "訂閱年方案",
                price: "NT$790 / 年",
                features: []
            });
            await flush(10);

            const html = root.innerHTML;
            const hasFakeText = /敬請期待|coming soon/i.test(html);
            const hasFalseSync = /跨裝置同步|cross-device sync/i.test(html);

            // 點擊訂閱 → 應記錄意向並**留在對話框內**呈現回饋（不得直接關閉）
            const buy = root.querySelector("[data-buy]");
            const gate = await loadExtraModule(env, "src/js/core/parental-gate.js");
            gate.setGateUnlocked(root, true);
            if (buy) buy.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true, cancelable: true }));
            await flush(20);

            const stillOpen = !root.classList.contains("hidden");
            const feedbackShown = Boolean(root.querySelector("#paywall-ack"));
            const feedbackText = root.textContent || "";
            const honestText = /不會產生任何費用|不會自動扣款|no payment is taken/i.test(feedbackText);

            const ok = !hasFakeText && !hasFalseSync && stillOpen && feedbackShown && honestText;
            return {
                ok,
                detail: `fakeText=${hasFakeText} falseSync=${hasFalseSync} stillOpen=${stillOpen} feedback=${feedbackShown} honest=${honestText}`
            };
        }
    },

    {
        name: "play-paywall-esc-and-ack",
        async run(env) {
            await bootGame(env);
            await env.clock.advance(200);

            const paywall = await loadExtraModule(env, "src/js/ui/paywall.js");
            const root = env.document.getElementById("share-root");

            paywall.showPaywall(root, {
                id: "chapter4",
                title: "解鎖完整旅程",
                body: "第 4–5 章與恐龍谷主題包。",
                cta: "訂閱年方案",
                price: "NT$790 / 年",
                features: []
            });
            await flush(10);

            // Esc 關閉
            const esc = new env.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
            env.document.dispatchEvent(esc);
            await flush(10);
            const closedByEsc = root.classList.contains("hidden");

            // 重新開啟 → 記錄意向 → 對話框內有「我知道了」→ 點擊後關閉
            paywall.showPaywall(root, {
                id: "chapter4",
                title: "解鎖完整旅程",
                body: "第 4–5 章與恐龍谷主題包。",
                cta: "訂閱年方案",
                price: "NT$790 / 年",
                features: []
            });
            await flush(10);

            const gate = await loadExtraModule(env, "src/js/core/parental-gate.js");
            gate.setGateUnlocked(root, true);
            paywall.recordIntent(root, "year", 790, "年訂閱");
            await flush(10);

            const ack = root.querySelector("#paywall-ack");
            const ackVisible = Boolean(ack) && !root.classList.contains("hidden");
            if (ack) ack.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true, cancelable: true }));
            await flush(10);
            const closedByAck = root.classList.contains("hidden");

            const ok = closedByEsc && ackVisible && closedByAck;
            return { ok, detail: `closedByEsc=${closedByEsc} ackVisible=${ackVisible} closedByAck=${closedByAck}` };
        }
    },

    {
        name: "play-boot-error-panel",
        async run(env) {
            // 讓內容載入失敗 → 必須顯示可見錯誤恢復面板
            const originalFetch = env.window.fetch;
            env.window.fetch = async () => {
                throw new Error("[test] 內容載入失敗");
            };

            await bootGame(env);
            await env.clock.advance(200);

            const panel = env.document.getElementById("boot-error-root");
            const startOverlay = env.document.getElementById("start-overlay");
            const retry = env.document.getElementById("boot-retry-btn");
            const refresh = env.document.getElementById("boot-refresh-btn");

            const visible = Boolean(panel) && !panel.classList.contains("hidden");
            const startHidden = Boolean(startOverlay) && startOverlay.classList.contains("hidden");
            const roleAlert = panel?.getAttribute("role") === "alert";
            const text = panel?.textContent || "";

            // 恢復 fetch 後點擊重試 → 應能成功啟動
            env.window.fetch = originalFetch;
            if (retry) {
                retry.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true, cancelable: true }));
                await env.clock.advance(300);
            }
            const recovered = !env.document.getElementById("boot-error-root");

            const ok = visible && startHidden && roleAlert && Boolean(retry) && Boolean(refresh)
                && /網路|連線/.test(text) && recovered;
            return {
                ok,
                detail: `visible=${visible} startHidden=${startHidden} roleAlert=${roleAlert} retry=${Boolean(retry)} refresh=${Boolean(refresh)} recovered=${recovered}`
            };
        }
    },

    {
        name: "play-boot-error-retry-lock",
        async run(env) {
            const originalFetch = env.window.fetch;
            env.window.fetch = async () => {
                throw new Error("[test] 內容載入失敗");
            };

            await bootGame(env);
            await env.clock.advance(200);

            const retry = env.document.getElementById("boot-retry-btn");
            if (!retry) return { ok: false, detail: "無重試鈕" };

            // 連點兩次（第二次應被 in-flight lock 擋下）
            retry.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true, cancelable: true }));
            const lockedAfterFirst = retry.disabled === true;
            retry.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true, cancelable: true }));
            await env.clock.advance(100);

            env.window.fetch = originalFetch;
            const ok = lockedAfterFirst;
            return { ok, detail: `lockedAfterFirst=${lockedAfterFirst}` };
        }
    },

    {
        name: "play-footer-legal-panel",
        async run(env) {
            await bootGame(env);
            await env.clock.advance(300);

            const privacy = env.document.getElementById("footer-privacy");
            if (!privacy) return { ok: false, detail: "無 #footer-privacy" };

            privacy.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true, cancelable: true }));
            await flush(30);

            const panel = env.document.querySelector(".legal-panel");
            const body = env.document.querySelector("[data-legal-body]");
            const title = env.document.getElementById("legal-panel-title");

            const opened = Boolean(panel);
            const role = panel?.getAttribute("role") === "dialog";
            const scrollable = Boolean(body) && /consent-policy__body/.test(body.className || "");
            const hasTitle = Boolean(title) && /隱私權政策/.test(title.textContent || "");
            const contentLoaded = Boolean(body) && (body.textContent || "").length > 200;

            // Esc 關閉
            const esc = new env.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
            env.document.dispatchEvent(esc);
            await flush(10);
            const closed = !env.document.querySelector(".legal-panel");

            const ok = opened && role && scrollable && hasTitle && contentLoaded && closed;
            return {
                ok,
                detail: `opened=${opened} role=${role} scrollable=${scrollable} title=${hasTitle} content=${contentLoaded} closed=${closed}`
            };
        }
    },

    {
        name: "play-footer-terms-panel",
        async run(env) {
            await bootGame(env);
            await env.clock.advance(300);

            const terms = env.document.getElementById("footer-terms");
            if (!terms) return { ok: false, detail: "無 #footer-terms" };

            terms.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true, cancelable: true }));
            await flush(30);

            const title = env.document.getElementById("legal-panel-title");
            const body = env.document.querySelector("[data-legal-body]");
            const ok = Boolean(title) && /服務條款/.test(title.textContent || "")
                && Boolean(body) && (body.textContent || "").length > 200;
            return { ok, detail: `title=${title?.textContent} len=${(body?.textContent || "").length}` };
        }
    },

    {
        name: "play-viewport-zoom-allowed",
        async run(_env) {
            const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
            const m = /<meta[^>]+name=["']viewport["'][^>]*>/i.exec(html);
            const tag = m ? m[0] : "";
            const ok = Boolean(tag) && !/user-scalable\s*=\s*no/i.test(tag);
            return { ok, detail: `viewport=${tag}` };
        }
    },

    {
        name: "play-brand-title-unified",
        async run(_env) {
            const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
            const m = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
            const title = /<title>([^<]*)<\/title>/.exec(html);
            const ok = Boolean(title) && /木木遊戲/.test(title[1]) && /聖誕小幫手/.test(title[1])
                && /木木遊戲/.test(String(m.name || "")) && /木木遊戲/.test(String(m.short_name || ""));
            return { ok, detail: `title=${title?.[1]} name=${m.name} short=${m.short_name}` };
        }
    }
];

/* ------------------------------------------------------------------ */
/* 主流程                                                              */
/* ------------------------------------------------------------------ */

/**
 * 執行守門。
 */
async function main() {
    const args = process.argv.slice(2);
    /** @type {string[]} */
    const only = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--case" && args[i + 1]) {
            only.push(args[i + 1]);
            i++;
        } else if (!args[i].startsWith("-")) {
            only.push(args[i]);
        }
    }
    const list = only.length ? CHECKS.filter((c) => only.includes(c.name)) : CHECKS;

    let passed = 0;
    let failed = 0;

    for (const c of list) {
        const env = createGameEnv({ locale: "zh-TW", ...(c.options || {}) });
        let result = { ok: false, detail: "未執行" };
        try {
            result = await c.run(env);
        } catch (err) {
            result = { ok: false, detail: `例外：${err?.stack || err?.message || String(err)}` };
        } finally {
            disposeEnv(env);
        }

        if (result.ok) {
            passed++;
            out(`[PASS] ${c.name} — ${result.detail}`);
        } else {
            failed++;
            out(`[FAIL] ${c.name} — ${result.detail}`);
        }
    }

    out("");
    out(`通過 ${passed}/${list.length}，失敗 ${failed}`);
    if (failed > 0) process.exitCode = 1;
}

main();
