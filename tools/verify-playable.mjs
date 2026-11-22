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

import {
    createGameEnv,
    disposeEnv,
    bootGame,
    clickStart,
    closePrologue,
    advanceTutorial,
    pickCharacter,
    startLevel,
    answerRound,
    currentState,
    openLevel,
    flush
} from "./test-harness.mjs";

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
    const seen = { correct: 0, wrong: 0 };
    env.onEvent("round:correct", () => { seen.correct++; });
    env.onEvent("round:wrong", () => { seen.wrong++; });
    return seen;
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
        const env = createGameEnv({ locale: "zh-TW" });
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
            console.log(`[PASS] ${c.name} — ${result.detail}`);
        } else {
            failed++;
            console.log(`[FAIL] ${c.name} — ${result.detail}`);
        }
    }

    console.log("");
    console.log(`通過 ${passed}/${list.length}，失敗 ${failed}`);
    if (failed > 0) process.exitCode = 1;
}

main();
