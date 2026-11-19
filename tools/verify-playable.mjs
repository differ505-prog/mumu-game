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
    advanceTutorial,
    pickCharacter,
    startLevel,
    answerRound,
    currentState,
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
        name: "play-dom-contract",
        async run(env) {
            // #bubble / #bubble-content 必須在 renderCharacter() 覆寫 #santa-container 之後仍然存在。
            // 若被覆蓋，序章信件（showLetter）會拋出 TypeError，整條導航中斷。
            // 此檢查**不套用** DOM fixture，以如實反映真實產品的 DOM 契約狀態。
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(500);
            const bubble = env.document.getElementById("bubble");
            const content = env.document.getElementById("bubble-content");
            const crashed = env.errors.some((e) => /bubble-content/.test(e));
            const ok = Boolean(bubble && content) && !crashed;
            return {
                ok,
                detail: ok
                    ? "bubble 與 bubble-content 在角色渲染後仍存在"
                    : `缺陷：renderCharacter() 覆寫 #santa-container，#bubble / #bubble-content 消失（序章信件拋 TypeError）errors=${env.errors.length}`
            };
        }
    },

    {
        name: "play-tutorial",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(3000);
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
            await env.clock.advance(3000);
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
            await env.clock.advance(3000);
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
            await env.clock.advance(3000);
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
            await env.clock.advance(3000);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");

            /** @type {any} */
            let completed = null;
            env.onEvent("level:complete", (payload) => { completed = payload; });

            await enterLevel(env, 1);

            // 關卡 1 為 sequence 玩法：正確作答順序由公開狀態的 sequence 得知
            for (let r = 0; r < 3; r++) {
                const st = currentState(env);
                const seq = st.sequence || [];
                if (!seq.length) {
                    return { ok: false, detail: `round ${r + 1}: 公開狀態無 sequence（phase=${st.phase}）` };
                }
                const answered = await answerRound(env, String(seq[0]));
                if (!answered) {
                    return { ok: false, detail: `round ${r + 1}: 找不到可點擊的選項 ${seq[0]}` };
                }
                await env.clock.advance(1400);
                await env.clock.advance(2600);
            }

            await env.clock.advance(2000);
            const st = currentState(env);
            const ok = completed !== null || st.phase === "levelup";
            return {
                ok,
                detail: `levelCompleteEvent=${completed !== null} phase=${st.phase} score=${st.score} round=${st.round}`
            };
        }
    },

    {
        name: "play-all-verbs",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(3000);
            await advanceTutorial(env);
            await pickCharacter(env, "santa");

            /** @type {string[]} */
            const failed = [];
            /** @type {string[]} */
            const passed = [];

            for (const [verb, levelId] of Object.entries(VERB_LEVELS)) {
                await enterLevel(env, levelId);
                const els = roundElements(env);
                const verdict = watchVerdict(env);

                let judged = false;

                if (els.pieces.length) {
                    // 拼合玩法：必須能選取片段並放置
                    const piece = els.pieces[0];
                    const target = els.targets[0];
                    if (piece && target) {
                        click(env, piece);
                        await flush(10);
                        click(env, target);
                        await env.clock.advance(400);
                        judged = verdict.correct > 0;
                    }
                } else if (els.cards.length) {
                    // 配對玩法：依卡片 id 兩兩配對翻牌，直到完成
                    const cards = els.cards;
                    const pairs = new Map();
                    for (const card of cards) {
                        const label = card.querySelector(".memory-face--front .control-btn__label")?.textContent || "";
                        const list = pairs.get(label) || [];
                        list.push(card);
                        pairs.set(label, list);
                    }
                    for (const group of pairs.values()) {
                        for (let i = 0; i + 1 < group.length; i += 2) {
                            click(env, group[i]);
                            await env.clock.advance(900);
                            click(env, group[i + 1]);
                            await env.clock.advance(900);
                            if (verdict.correct > 0) judged = true;
                        }
                    }
                } else if (els.options.length) {
                    // 單選玩法：逐一嘗試，直到出現判定
                    for (const btn of els.options) {
                        click(env, btn);
                        await env.clock.advance(300);
                        if (verdict.correct > 0) {
                            judged = true;
                            break;
                        }
                    }
                }

                if (judged) {
                    passed.push(verb);
                } else {
                    failed.push(verb);
                }
            }

            return {
                ok: failed.length === 0,
                detail: `passed=[${passed.join(",")}] failed=[${failed.join(",")}]`
            };
        }
    },

    {
        name: "play-no-blocking",
        async run(env) {
            await bootGame(env);
            await clickStart(env);
            await env.clock.advance(3000);
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
        // play-dom-contract 不套用 DOM fixture，以如實回報真實產品的 DOM 契約缺陷
        const env = createGameEnv({
            locale: "zh-TW",
            applyDomFixture: c.name !== "play-dom-contract"
        });
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
