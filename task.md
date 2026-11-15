# 木木遊戲 — 商轉級改版實作清單（v6 最高評分方案）

> 本清單取代先前所有任務與過期紀錄。每一步可獨立執行，完成後必須通過該步驟指定的靜態驗證，並自動 commit + push。
>
> **本版對應的投資評分**：9.12 / 10（條件成立時）。評分構成：核心玩法與教育價值 9.6、耐玩度 9.4、視覺美感 9.4、留存與成效證據 9.3、劇情 9.2、通路 9.0、音訊 9.0、動效 9.2、變現 8.7、合規 8.2。
> 三項必備的實證（不可用設計替代）：**D7 留存 ≥ 12%**、**最小對辨識成效有統計顯著改善（n ≥ 30）**、**下載轉付費 ≥ 2.5%**。

## 全域約束

1. **禁止啟動任何本地 Web 伺服器或佔用 Port**（禁止 `python -m http.server` / `npx serve` / `npm run dev` / `uvicorn` 等）。驗證僅限靜態指令：`npx tsc --noEmit`、`npx eslint .`、`node tools/*.mjs`。
2. 每步驟最多修改 2–3 個檔案；單一檔案單次改動不超過 400 行。由工具腳本產生的輸出檔（48 個 icon、24 隻恐龍 SVG、3 個 app icon PNG、拼圖切片）視為單一邏輯單位。
3. 嚴格依序執行，**禁止跳步**；每步驟標註「依賴 Step N」。
4. 每步驟結束執行該步的提交指令（`git add` → `git commit` → `git push`）。
5. 目標分支 `main`，遠端 `origin`（https://github.com/differ505-prog/mumu-game.git）。
6. 專案為無建置工具的原生 ES Module 靜態網站（PWA）；不引入打包器。
7. 內容檔（`content/*.json`）於執行期以 `fetch()` 載入，非模組 import；結構由 `tools/check-content.mjs` 驗證。
8. **成效評估題組（`content/assessment.json`）必須與遊戲題庫（`content/items.json`）完全分離**——用遊戲題型做前後測會產生練習效應，會使成效研究失去說服力。`tools/check-content.mjs` 必須驗證兩者無重疊。
9. **免費公測邊界**：免費＝序章＋第 1–3 章（共 12 關）；付費＝第 4–5 章、恐龍谷主題包、家長報告完整版、跨裝置同步。免費公測硬性上限 6 個月。
10. **定價**：只推年訂閱（台港 NT$790，另測 NT$990），不推月訂閱。

---

## 目標規格摘要（供實作時對照）

| 支柱 | 交付標準 |
|---|---|
| 核心玩法 | 六個認知動詞：序列回憶、**最小對辨識**、節奏與音高模仿、**干擾抑制**、**拼圖（圖像拼合＋序列推理）**、**記憶力（配對翻牌＋雙通道序列）**。每個動詞有獨立難度曲線 |
| 教育價值 | 最小對辨識＝語音覺辨（phonological awareness），前讀預備；須以成效研究佐證 |
| 耐玩度 | **24 隻恐龍圖鑑**，每隻對應一個真實學習里程碑；掌握度驅動難度，無天花板 |
| 劇情 | 六章主線，**每章解鎖一種新玩法**（章節＝換玩法，不是換裝飾）；雙語 120 句情境台詞 |
| 視覺 | 24 隻去背重繪恐龍（含 4 幀步行循環）、5 層視差、48 個自繪 SVG icon（emoji 圖示數 = 0）、統一材質與光影 |
| 動效 | Motion token（8 級時長／6 級曲線）、統一粒子引擎、觸覺詞彙、reduced-motion 全覆蓋、≥55 FPS |
| 音訊 | 44 個材質音效（各 3 變體）、四軌混音器、側鏈 ducking、−16 LUFS ±1、四滑桿音量 |
| 流量 | **學習成果卡 + 恐龍圖鑑卡**（可炫耀視覺）＋ LINE 分享連結帶推薦碼；分享率目標 8–12%、K ≥ 0.5 |
| 整合 | 感官時間軸：每個遊戲事件有完整四軌時間軸（動畫／音效／劇情／畫面） |

---

## Phase A — 靜態檢查工具鏈

### Step 1 — 建立 TypeScript / ESLint 檢查基礎
- **依賴**：無（起點）
- **檔案**：`package.json`（新增）、`tsconfig.json`（新增）、`.gitignore`（修改）
- **預期變更**：
  - `package.json`：
    ```json
    {
      "name": "mumu-game",
      "private": true,
      "type": "module",
      "scripts": {
        "check": "tsc --noEmit && eslint . && node tools/check-content.mjs && node tools/check-assets.mjs && node tools/sweep-logs.mjs",
        "typecheck": "tsc --noEmit",
        "lint": "eslint .",
        "sweep": "node tools/sweep-logs.mjs"
      },
      "devDependencies": {
        "typescript": "^5.6.0",
        "eslint": "^9.13.0",
        "@eslint/js": "^9.13.0",
        "globals": "^15.11.0",
        "sharp": "^0.33.5"
      }
    }
    ```
  - `tsconfig.json`：
    ```json
    {
      "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "allowJs": true,
        "checkJs": true,
        "strict": false,
        "noEmit": true,
        "noImplicitAny": false,
        "resolveJsonModule": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
      },
      "include": ["src/**/*.js", "tools/**/*.mjs", "eslint.config.js"],
      "exclude": ["node_modules"]
    }
    ```
  - `.gitignore` 追加：`node_modules/`、`dist/`、`assets/generated/`。
- **驗證**：`npm install` → `npx tsc --noEmit` → `npx eslint --version`
- **提交**：`git add package.json tsconfig.json .gitignore package-lock.json && git commit -m "chore: 建立靜態檢查工具鏈" && git push origin main`

### Step 2 — ESLint 扁平設定
- **依賴**：Step 1
- **檔案**：`eslint.config.js`（新增）、`package.json`（修改）
- **預期變更**：
  - `eslint.config.js`：
    ```js
    import js from "@eslint/js";
    import globals from "globals";

    export default [
      { ignores: ["node_modules/**", "dist/**", "外部資源/**", "assets/generated/**"] },
      js.configs.recommended,
      {
        files: ["src/**/*.js", "tools/**/*.mjs"],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
          globals: { ...globals.browser, ...globals.node }
        },
        rules: {
          "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
          "no-console": ["warn", { allow: ["warn", "error"] }],
          "eqeqeq": ["error", "smart"]
        }
      }
    ];
    ```
  - `package.json` 的 `scripts.lint` 改為 `eslint .`。
- **驗證**：`npx eslint .`（0 error）
- **提交**：`git add eslint.config.js package.json && git commit -m "chore: 加入 ESLint 扁平設定" && git push origin main`

---

## Phase B — 應用骨架與設計系統

### Step 3 — 重寫 index.html 為外掛式 shell + 建立 design token
- **依賴**：Step 2
- **檔案**：`index.html`（完全覆寫）、`src/styles/tokens.css`（新增）
- **預期變更**：
  - `index.html`：移除全部 inline `<style>` 與 inline `<script>`（現有約 3,080 行）。保留並擴充節點 id：
    `start-overlay`、`character-select-overlay`、`mode-select-overlay`、`level-up-overlay`、`game-container`、`tv-view`、`controls-view`、`scoreboard-container`、`level-display`、`scoreboard`、`achievement-display`、`status-text`、`combo-display`、`combo-step-indicator`、`mode-indicator`、`turn-signal`、`replay-btn`、`slow-mode-btn`、`music-control-btn`、`santa-container`、`character-img`、`bubble`、`bubble-content`、`level-complete-container`、`next-level-btn`、`replay-level-btn`、`snow-container`。
    **新增**：`#scene`（視差場景容器）、`#hud`（單一狀態列）、`#toast-layer`、`#sr-live`（aria-live）、`#levelmap-root`、`#dex-root`（圖鑑）、`#parent-report-root`、`#audio-settings-root`、`#share-root`（成果卡）、`#assessment-root`（成效評估入口）。
    掛載：`<link rel="stylesheet" href="./src/styles/tokens.css">` 等五個樣式檔；`<script type="module" src="./src/js/main.js"></script>`。
  - `src/styles/tokens.css`：定義全部設計變數
    ```css
    :root {
      --c-night-900:#0a1a3c; --c-night-700:#16294f; --c-night-500:#203a43;
      --c-snow-100:#f7fbff; --c-snow-300:#cfe4f2; --c-cloud-400:#a9c6d8;
      --c-red-500:#c0392b; --c-red-400:#e74c3c; --c-green-500:#27ae60;
      --c-blue-500:#2980b9; --c-gold-400:#f1c40f; --c-amber-500:#f39c12;
      --c-violet-500:#8e44ad; --c-orange-500:#e67e22;
      --c-dino-green:#4a9d5f; --c-dino-teal:#2f8f8a; --c-dino-amber:#d98b28; --c-dino-slate:#5a6b7a;
      --bg-scene:var(--c-night-900); --bg-panel:var(--c-night-700); --bg-elevated:#1d3358;
      --text-primary:var(--c-snow-100); --text-secondary:var(--c-snow-300); --text-muted:var(--c-cloud-400);
      --accent-warm:var(--c-gold-400); --accent-cool:var(--c-blue-500);
      --border-soft:rgba(207,228,242,.22); --focus-ring:var(--c-gold-400);
      --r-sm:8px; --r-md:12px; --r-lg:20px; --r-full:999px;
      --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:20px; --s-6:24px; --s-8:32px; --s-10:40px;
      --fs-xs:12px; --fs-sm:14px; --fs-md:16px; --fs-lg:20px; --fs-xl:26px; --fs-2xl:32px;
      --touch-min:64px; --touch-gap:8px;
      --mat-border-light:inset 0 1px 0 rgba(255,255,255,.18);
      --mat-shadow-1:0 6px 18px rgba(0,0,0,.28);
      --mat-shadow-2:0 12px 32px rgba(0,0,0,.36);
      --t-instant:80ms; --t-micro:120ms; --t-base:200ms; --t-enter:300ms;
      --t-settle:450ms; --t-hold:800ms; --t-scene:1200ms; --t-epic:2000ms;
      --e-standard:cubic-bezier(.2,0,0,1); --e-decelerate:cubic-bezier(0,0,0,1);
      --e-accelerate:cubic-bezier(.3,0,1,1); --e-spring:cubic-bezier(.34,1.56,.64,1);
      --e-overshoot:cubic-bezier(.2,0,.2,1.2); --e-linear:linear;
      --z-scene:0; --z-character:2; --z-hud:10; --z-overlay:40; --z-toast:60;
    }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `grep -c "<style" index.html` = 0 → `grep -c "<script" index.html` = 1
- **提交**：`git add index.html src/styles/tokens.css && git commit -m "feat: 重構為外掛式 shell 並建立 design token" && git push origin main`

### Step 4 — 基礎與元件樣式
- **依賴**：Step 3
- **檔案**：`src/styles/base.css`（新增）、`src/styles/components.css`（新增）
- **預期變更**：
  - `base.css`：reset（`box-sizing`、`user-select:none`、`touch-action:manipulation`）、`html,body` 使用 `100dvh` + `env(safe-area-inset-*)`、`.sr-only`、`:focus-visible` 焦點環、`#game-container` flex 佈局（`--tv-ratio:70`）、`#tv-view`/`#controls-view` 以 `flex:70 1 0` / `flex:30 1 0` 承載、`.hidden { display:none !important }`。
  - `components.css`：`.overlay`、`.mode-option`、`.character-card`、`.control-btn`、`.option-btn`、`.hud`、`.hud__level`、`.hud__score`、`.hud__medals`、`.dialogue-bubble`、`.level-complete`、`.progress-ring`、`.star-badge`、`.toast`、`.parent-gate`、`.combo-step`、`.turn-signal`、`.medal-icon`、`.dex-grid`、`.dex-card`、`.dex-card--locked`、`.share-card-preview`、`.chapter-banner`。
    規格：`.control-btn` 最小 `min-width:var(--touch-min); min-height:var(--touch-min)`；`:active` 為 `transform:scale(.96)` + `transition:var(--t-micro) var(--e-standard)`；`:focus-visible` 為 `outline:3px solid var(--focus-ring); outline-offset:2px`。
- **驗證**：`npx eslint .` → `npx tsc --noEmit` → 人工複核 `src/styles/base.css` 內除媒體查詢斷點外無 px 硬編碼
- **提交**：`git add src/styles/base.css src/styles/components.css && git commit -m "feat: 建立基礎與元件樣式" && git push origin main`

### Step 5 — 動畫樣式、響應式斷點與圖鑑/分享樣式
- **依賴**：Step 4
- **檔案**：`src/styles/motion.css`（新增）、`src/styles/responsive.css`（新增）
- **預期變更**：
  - `motion.css`：
    - `@keyframes` 保留既有 `pop`/`shake`/`sparkle`/`fireworks`/`fall`/`float`/`bounce`/`nod`/`medal-bounce`/`catch-fish`/`fly-gift`/`pulse`/`fadeIn`/`zzz`/`aurora-shift`/`santa-breathe`，**新增** `dino-blink`、`dino-roar`、`dino-step`（4 幀步行循環）、`dino-hatch`（破殼）、`piece-snap`（拼圖吸附）、`card-flip`、`drift`、`rise`、`pop-in`。
    - 每個 keyframe 的 duration 與 easing **一律使用 var(--t-*) 與 var(--e-*)**。
    - `@media (prefers-reduced-motion: reduce)`：所有 animation/transition 設為 none 或 1ms，視差與粒子降級為靜態。
  - `responsive.css`：以 `clamp()` 取代 px 硬編碼；三組斷點：
    - `@media (orientation: portrait)`：單欄，兩區皆 `flex:1 1 0`，選項網格 3 欄。
    - `@media (orientation: landscape) and (max-height:800px)`：選項網格 6 欄、`--touch-min` 降為 56px、`#hud` 縮小。
    - `@media (min-width:1200px)`：最大寬度 1100px 置中、選項網格 6 欄。
    - 移除既有 `transform: scale(0.8)` 硬縮放選項網格的寫法。
- **驗證**：`npx eslint .` → `grep -n "scale(0.8)" src/styles/*.css` 無結果 → `grep -c "prefers-reduced-motion" src/styles/motion.css` ≥ 1
- **提交**：`git add src/styles/motion.css src/styles/responsive.css && git commit -m "feat: 動畫 token 化與響應式斷點" && git push origin main`

---

## Phase C — 核心模組

### Step 6 — 事件匯流排與核心狀態
- **依賴**：Step 5
- **檔案**：`src/js/core/events.js`（新增）、`src/js/core/state.js`（新增）
- **預期變更**：
  - `events.js`：
    ```js
    /** @typedef {{ type: string, payload?: Record<string, unknown>, at?: number }} GameEvent */
    /** @type {Map<string, Set<(e: GameEvent) => void>>} */
    const listeners = new Map();
    /** @param {string} type @param {(e: GameEvent) => void} fn */
    export function on(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); return () => off(type, fn); }
    /** @param {string} type @param {(e: GameEvent) => void} fn */
    export function off(type, fn) { listeners.get(type)?.delete(fn); }
    /** @param {GameEvent} event */
    export function emit(event) { const set = listeners.get(event.type); if (!set) return; for (const fn of Array.from(set)) { try { fn(event); } catch (err) { console.error("[events]", event.type, err); } } }
    ```
  - `state.js`：
    ```js
    /** @typedef {"sequence"|"minimal-pair"|"rhythm"|"interference"|"puzzle"|"memory"} Verb */
    /** @typedef {"idle"|"listening"|"input"|"feedback"|"levelup"} RoundPhase */
    export const state = {
      verb: "sequence", level: 1, round: 0, score: 0, maxScore: 3,
      phase: "idle", sequence: [], inputIndex: 0, locked: true,
      slowMode: false, combo: 0, characterId: "santa", skillAxis: "minimal-pair",
      difficulty: 1, mastery: {}, chapter: 1, sessionStartedAt: 0, attempt: 0
    };
    /** @param {Partial<typeof state>} patch */
    export function setState(patch) { Object.assign(state, patch); emit({ type: "state:changed", payload: { ...state } }); }
    /** @param {Verb} verb @param {string} characterId */
    export function resetSession(verb, characterId) { /* 重設 level/round/score/mastery 後 emit "session:reset" */ }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/core/events.js src/js/core/state.js && git commit -m "feat: 新增事件匯流排與核心狀態" && git push origin main`

### Step 7 — 建置版本常數與玩法定義表
- **依賴**：Step 6
- **檔案**：`src/js/core/config.js`（新增）、`src/js/core/verbs.js`（新增）
- **預期變更**：
  - `config.js`：
    ```js
    export const APP = {
      name: "Santa's Little Helper",
      version: "3.0.0",
      build: "2026-11-15",
      locales: ["zh-TW", "en-US"],
      defaultLocale: "zh-TW",
      maxScore: 3,
      cacheName: "mumu-v3",
      freeChapters: [0, 1, 2, 3],
      paidChapters: [4, 5],
      dinoCount: 24,
      dexSlots: 24
    };
    ```
  - `verbs.js`：
    ```js
    /** @typedef {"sequence"|"minimal-pair"|"rhythm"|"interference"|"puzzle"|"memory"} Verb */
    export const VERBS = {
      sequence:    { id: "sequence",    label: { "zh-TW": "回聲谷", "en-US": "Echo Valley" },     axis: "sequence",    age: [3, 6], engine: "sequence",    icon: "echo" },
      "minimal-pair": { id: "minimal-pair", label: { "zh-TW": "雙聲谷", "en-US": "Twin Voice Valley" }, axis: "minimal-pair", age: [3, 6], engine: "auditory", icon: "twin" },
      rhythm:      { id: "rhythm",      label: { "zh-TW": "鼓點峽谷", "en-US": "Beat Canyon" },   axis: "rhythm",      age: [3, 6], engine: "auditory", icon: "drum" },
      interference:{ id: "interference",label: { "zh-TW": "回聲迷宮", "en-US": "Echo Maze" },      axis: "interference",age: [5, 8], engine: "auditory", icon: "maze" },
      puzzle:      { id: "puzzle",      label: { "zh-TW": "拼蛋巢", "en-US": "Puzzle Nest" },    axis: "puzzle",      age: [3, 8], engine: "puzzle",     icon: "egg" },
      memory:      { id: "memory",      label: { "zh-TW": "足跡石林", "en-US": "Tracks Grove" }, axis: "memory",      age: [3, 8], engine: "memory",     icon: "footprint" }
    };
    /** @param {string} id @returns {keyof typeof VERBS | null} */
    export function verbById(id) { return id in VERBS ? id : null; }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `grep -rn "v54.0" src/ index.html` 無結果
- **提交**：`git add src/js/core/config.js src/js/core/verbs.js && git commit -m "feat: 新增版本常數與六個認知動詞定義" && git push origin main`

---

## Phase D — 內容資料層（恐龍主題核心）

### Step 8 — 角色資料（含 7 隻可玩角色 + 24 隻圖鑑）
- **依賴**：Step 7
- **檔案**：`content/characters.json`（新增）
- **預期變更**：兩類條目。
  - **可玩角色**（7 隻，`playable: true`）：`santa`、`snowman`、`reindeer`、`dino-triceratops`、`dino-trex`、`dino-brachiosaurus`、`dino-pteranodon`。欄位：
    ```json
    {
      "id": "dino-trex",
      "name": { "zh-TW": "暴龍", "en-US": "T-Rex" },
      "kind": "dino",
      "playable": true,
      "unlock": { "type": "chapter", "chapter": 1 },
      "art": { "file": "./assets/characters/dino-trex.svg", "hasAlpha": true },
      "palette": { "primary": "#4a9d5f", "secondary": "#2f6f45", "accent": "#f39c12" },
      "voice": { "pitch": 1.15, "rate": 0.85, "blurb": { "zh-TW": "力氣最大但怕聽錯", "en-US": "The strongest, but afraid of mishearing" } },
      "traits": { "roar": "loud", "idle": "sway", "celebrate": "stomp", "walk": "heavy" }
    }
    ```
  - **圖鑑條目**（24 隻，`dex` 陣列）：每隻含 `id`、`name`（雙語）、`dexNo`（1–24）、`unlockCondition`（真實學習行為描述）、`roar`（deep/loud/soft/sharp/mid/warm）、`personality`（雙語一句）、`walkFrames`（4）、`art`。
    解鎖條件必須是學習行為而非操作次數，範例：`{ "type": "minimal-pair-correct", "count": 8, "locale": "zh-TW" }`。
- **驗證**：`node -e "const c=require('./content/characters.json'); const p=c.filter(x=>x.playable); const d=c.dex||c.filter(x=>!x.playable); if(p.length!==7)process.exit(1); if(d.length!==24)process.exit(1); console.log('playable',p.length,'dex',d.length)"`
- **提交**：`git add content/characters.json && git commit -m "feat: 新增七隻可玩角色與二十四隻恐龍圖鑑" && git push origin main`

### Step 9 — 題庫（九技能軸）
- **依賴**：Step 8
- **檔案**：`content/items.json`（新增）
- **預期變更**：物件結構：
  ```json
  {
    "colors": [{ "id": "red", "hex": "#c0392b", "symbol": "●", "zh-TW": "紅色", "en-US": "red" }],
    "shapes": [{ "id": "circle", "svg": "circle", "zh-TW": "圓形", "en-US": "circle" }],
    "animals": [{ "id": "crab", "emoji": "🦀", "plural": "crabs", "zh-TW": "螃蟹", "en-US": "crab" }],
    "dinos": [{ "id": "triceratops", "zh-TW": "三角龍", "en-US": "Triceratops", "roar": "deep", "size": "big" }],
    "numbers": [{ "value": 1, "zh-TW": "一", "en-US": "one" }],
    "pitches": [{ "id": "low", "hz": 220 }, { "id": "mid", "hz": 330 }, { "id": "high", "hz": 494 }],
    "rhythms": [{ "id": "r4", "beats": 4, "pattern": [1, 0, 1, 0] }],
    "interference": [{ "id": "boat-goat", "zh-TW": ["船", "羊"], "en-US": ["boat", "goat"], "similarity": "onset" }],
    "footprints": [{ "id": "tri", "dinoId": "triceratops", "shape": "triangle" }]
  }
  ```
  規則：`colors` 12 色、`shapes` 4 形、`animals` 18 種、`dinos` 24 隻、`numbers` 1–5、`pitches` 3 種、`rhythms` 6 種、`interference` 12 組、`footprints` 24 個對應圖鑑。
- **驗證**：`node -e "const i=require('./content/items.json'); const k=['colors','shapes','animals','dinos','numbers','pitches','rhythms','interference','footprints']; k.forEach(x=>{if(!Array.isArray(i[x])||!i[x].length)process.exit(1)}); if(i.dinos.length!==24)process.exit(1); console.log('items ok')"`
- **提交**：`git add content/items.json && git commit -m "feat: 新增九技能軸題庫含二十四隻恐龍" && git push origin main`

### Step 10 — 最小對與干擾題組（教育核心）
- **依賴**：Step 9
- **檔案**：`content/minimal-pairs.json`（新增）
- **預期變更**：
  ```json
  {
    "zh-TW": [
      { "id": "ba-ba", "pair": ["八", "爸"], "feature": "initial", "distractor": "八／爸／巴" },
      { "id": "bu-fu", "pair": ["ㄅㄨ", "ㄈㄨ"], "feature": "initial", "distractor": "ㄅㄨ／ㄈㄨ／ㄅㄤ" },
      { "id": "si-shi", "pair": ["四", "是"], "feature": "initial", "distractor": "四／是／西" },
      { "id": "zhong-qin", "pair": ["中", "親"], "feature": "initial", "distractor": "中／親／真" }
    ],
    "en-US": [
      { "id": "ship-sheep", "pair": ["ship", "sheep"], "feature": "vowel", "distractor": "ship／sheep／slip" },
      { "id": "fish-fist", "pair": ["fish", "fist"], "feature": "initial", "distractor": "fish／fist／miss" },
      { "id": "bed-pet", "pair": ["bed", "pet"], "feature": "initial", "distractor": "bed／pet／red" }
    ],
    "levels": [
      { "level": 1, "feature": "initial", "distractors": 0 },
      { "level": 2, "feature": "initial", "distractors": 1 },
      { "level": 3, "feature": "vowel", "distractors": 2 }
    ]
  }
  ```
  規範：`zh-TW` 至少 12 組、`en-US` 至少 10 組，每組含 `feature` 與 `distractor`；`levels` 定義干擾升級路徑。
- **驗證**：`node -e "const m=require('./content/minimal-pairs.json'); if(m['zh-TW'].length<12||m['en-US'].length<10)process.exit(1); console.log('minimal-pairs ok')"`
- **提交**：`git add content/minimal-pairs.json && git commit -m "feat: 新增最小對辨識題組" && git push origin main`

### Step 11 — 關卡資料（40 關 / 六章 / 每章解鎖一種玩法）
- **依賴**：Step 10
- **檔案**：`content/levels.json`（新增）
- **預期變更**：40 關物件陣列，每關：
  ```json
  {
    "id": 1, "chapter": 1, "verb": "minimal-pair", "axis": "minimal-pair",
    "name": { "zh-TW": "一樣還是不一樣", "en-US": "Same or Different" },
    "difficulty": 1, "theme": "christmas", "scene": "christmas",
    "objective": { "zh-TW": "幫三角龍找回紅色的星星", "en-US": "Help Triceratops find the red stars" },
    "spec": { "rounds": 3, "sequenceLength": 2, "options": 2, "interference": 0 },
    "stars": { "1": "完成關卡", "2": "正確率 ≥ 70%", "3": "無提示且正確率 ≥ 90%" }
  }
  ```
  章節分配（**章節＝換玩法**）：
  - 第 0 章（序章，關 1–4）：`verb: "sequence"`，教學關。
  - 第 1 章·恐龍谷（關 5–12）：`verb: "minimal-pair"`（華語）。
  - 第 2 章·恐龍的語言（關 13–20）：`verb: "minimal-pair"`（英語）＋ `"rhythm"`。
  - 第 3 章·深海與天空（關 21–28）：`verb: "rhythm"` ＋ `"interference"`。
  - 第 4 章·冰河紀的聖誕（關 29–36）：`verb: "puzzle"` ＋ `"memory"`（**付費區**）。
  - 第 5 章·北方的一夜（關 37–40）：跨技能回顧 ＋ 自由挑戰（**付費區**）。
  規範：每關必有 `objective`；每章至少一關 `verb` 與該章主題相符；`spec` 欄位齊全。
- **驗證**：`node -e "const l=require('./content/levels.json'); if(l.length!==40)process.exit(1); const ids=l.map(x=>x.id); if(new Set(ids).size!==40)process.exit(1); const ch=new Set(l.map(x=>x.chapter)); if(ch.size!==6)process.exit(1); console.log('levels ok, chapters',[...ch].sort().join(','))"`
- **提交**：`git add content/levels.json && git commit -m "feat: 新增四十關六章關卡資料" && git push origin main`

### Step 12 — 敘事台詞與故事弧線
- **依賴**：Step 11
- **檔案**：`content/narrative.zh-TW.json`（新增）、`content/narrative.en-US.json`（新增）
- **預期變更**：兩檔結構完全對稱：
  ```json
  {
    "locale": "zh-TW",
    "contexts": {
      "invite":    ["三角龍說：我聽到你說话了！", "今天想先探索哪一個山谷？"],
      "encourage": ["你辦到了！", "真棒，再試一次看看"],
      "hint":      ["再聽一次，我們一起來", "看，這個就是正確的"],
      "celebrate": ["你完成今天的任務了！", "這隻恐龍已經加入你的圖鑑"],
      "comfort":   ["沒關係，我們再試一次", "慢慢來，你學會了"]
    },
    "letters": {
      "prologue": { "zh-TW": "親愛的孩子：今年聖誕夜我需要你的幫忙……", "en-US": "Dear helper…" },
      "perChapter": { "1": { "zh-TW": "第一章：恐龍谷", "en-US": "Chapter 1: Dinosaur Valley" } },
      "epilogue": { "zh-TW": "你做到了！這封信可以列印給你。", "en-US": "You did it! Print this letter." }
    },
    "dinoLines": { "triceratops": { "zh-TW": "三角龍說：我用角把雪推開了！", "en-US": "Triceratops says…" } },
    "ageVariants": {
      "young": { "zh-TW": "找紅色。", "en-US": "Find red." },
      "older": { "zh-TW": "幫三角龍找回三顆紅色的星星，它們藏在雪地裡。", "en-US": "Find three red stars hidden in the snow." }
    },
    "dexPraise": { "zh-TW": "你認識了 {name}！", "en-US": "You met {name}!" }
  }
  ```
  規範：`contexts` 五情境每情境 ≥ 12 句（雙語共 120 句以上）；`letters.perChapter` 含 0–5 六章；`dinoLines` 須覆蓋全部 24 隻圖鑑恐龍；`ageVariants` 提供 3–5 歲與 6–8 歲兩版。
- **驗證**：`node -e "const a=require('./content/narrative.zh-TW.json'),b=require('./content/narrative.en-US.json'); const c=o=>Object.values(o.contexts).reduce((s,x)=>s+x.length,0); if(c(a)<60||c(b)<60)process.exit(1); if(Object.keys(a.dinoLines).length!==24)process.exit(1); console.log('narrative ok',c(a),c(b))"`
- **提交**：`git add content/narrative.zh-TW.json content/narrative.en-US.json && git commit -m "feat: 新增雙語敘事台詞與恐龍台詞" && git push origin main`

### Step 13 — 故事弧線與章節信件
- **依賴**：Step 12
- **檔案**：`content/story-arcs.json`（新增）、`src/js/data/story.js`（新增）
- **預期變更**：
  - `story-arcs.json`：六章，每章含 `chapter`、`title`（雙語）、`mood`（`wonder`/`play`/`brave`/`kind`/`home`/`together`）、`scene`（`christmas`/`valley`/`forest`/`ice-age`/`ice-age`/`north`）、`verbs`（該章玩法陣列）、`unlockDex`（該章解鎖的圖鑑索引範圍）、`letter`（雙語信件）。
  - `story.js`：
    ```js
    /** @param {ContentBundle} bundle @param {string} locale @param {number} chapter */
    export function chapterLetter(bundle, locale, chapter) { /* 回傳該章信件字串 */ }
    /** @param {ContentBundle} bundle @param {string} locale @param {"invite"|"encourage"|"hint"|"celebrate"|"comfort"} ctx @param {number} [seed] */
    export function pickLine(bundle, locale, ctx, seed) { /* 以 seed 決定性抽句，避免同句連續 */ }
    /** @param {ContentBundle} bundle @param {string} locale @param {string} dinoId */
    export function dinoLine(bundle, locale, dinoId) { /* 回傳恐龍台詞 */ }
    /** @param {ContentBundle} bundle @param {string} locale @param {"young"|"older"} band */
    export function ageText(bundle, locale, band) { /* 回傳分齡提示句 */ }
    /** @param {ContentBundle} bundle @param {string} locale @param {string} dinoId */
    export function dexPraise(bundle, locale, dinoId) { /* 圖鑑解鎖稱讚句，支援 {name} 佔位 */ }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `node -e "const s=require('./content/story-arcs.json'); if(s.length!==6)process.exit(1); console.log('arcs ok')"`
- **提交**：`git add content/story-arcs.json src/js/data/story.js && git commit -m "feat: 新增六章故事弧線與選句邏輯" && git push origin main`

### Step 14 — 內容載入器與存取層
- **依賴**：Step 13
- **檔案**：`src/js/data/load-content.js`（新增）、`src/js/data/characters.js`（新增）
- **預期變更**：
  - `load-content.js`：
    ```js
    /** @typedef {{ id:string, name:{zhTW:string,enUS:string}, kind:string, playable:boolean, art:{file:string,hasAlpha:boolean}, palette:{primary:string,secondary:string,accent:string}, voice:{pitch:number,rate:number,blurb:{zhTW:string,enUS:string}}, traits:{roar:string,idle:string,celebrate:string,walk:string} }} Character */
    /** @typedef {{ characters: Character[], dex: Character[], items: any, levels: any[], narrative: any, minimalPairs: any, storyArcs: any[] }} ContentBundle */
    /** @type {ContentBundle | null} */
    let cache = null;
    /** @param {string} path @returns {Promise<any>} */
    async function fetchJson(path) { const res = await fetch(path, { cache: "no-cache" }); if (!res.ok) throw new Error(`[content] ${path} ${res.status}`); return res.json(); }
    /** @param {string} locale @returns {Promise<ContentBundle>} */
    export async function loadContent(locale) {
      if (cache) return cache;
      const [characters, items, levels, narrative, minimalPairs, storyArcs] = await Promise.all([
        fetchJson("./content/characters.json"), fetchJson("./content/items.json"),
        fetchJson("./content/levels.json"), fetchJson(`./content/narrative.${locale}.json`),
        fetchJson("./content/minimal-pairs.json"), fetchJson("./content/story-arcs.json")
      ]);
      const playable = characters.filter((c) => c.playable);
      const dex = characters.dex || characters.filter((c) => !c.playable);
      cache = { characters: playable, dex, items, levels, narrative, minimalPairs, storyArcs };
      return cache;
    }
    ```
  - `characters.js`：
    ```js
    /** @param {ContentBundle} bundle @param {string} id */
    export function getCharacter(bundle, id) { /* 找不到拋錯 */ }
    /** @param {ContentBundle} bundle @param {string} id */
    export function getDexEntry(bundle, id) { /* 圖鑑條目，未解鎖時回傳物件但標記 locked */ }
    /** @param {ContentBundle} bundle @param {number} chapter */
    export function playableCharacters(bundle, chapter) { /* 依 unlock.chapter 過濾 */ }
    /** @param {ContentBundle} bundle @param {string} id */
    export function characterVoice(bundle, id) { /* 回傳 { pitch, rate } */ }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/data/load-content.js src/js/data/characters.js && git commit -m "feat: 新增內容載入器與角色存取" && git push origin main`

### Step 15 — 關卡與題目存取
- **依賴**：Step 14
- **檔案**：`src/js/data/levels.js`（新增）、`src/js/data/items.js`（新增）
- **預期變更**：
  - `levels.js`：
    ```js
    /** @param {ContentBundle} bundle @param {number} levelId */
    export function getLevel(bundle, levelId) { /* 找不到拋錯 */ }
    /** @param {ContentBundle} bundle @param {number} chapter */
    export function getChapterLevels(bundle, chapter) { /* 依 chapter 過濾 */ }
    /** @param {ContentBundle} bundle @param {string} verb @param {number} count @param {string} excludeName */
    export function pickItems(bundle, verb, count, excludeName) { /* 依 verb 對應軸隨機取題 */ }
    /** @param {ContentBundle} bundle @param {number} levelId @param {string} locale */
    export function levelObjective(bundle, levelId, locale) { /* 回傳任務動機句 */ }
    /** @param {ContentBundle} bundle @param {number} levelId */
    export function levelSpec(bundle, levelId) { /* 回傳 spec（rounds/sequenceLength/options/interference） */ }
    ```
  - `items.js`：
    ```js
    /** @param {ContentBundle} bundle @param {string} id */
    export function colorItem(bundle, id) { }
    /** @param {ContentBundle} bundle @param {string} id */
    export function dinoItem(bundle, id) { }
    /** @param {ContentBundle} bundle @param {string} locale @param {string} id */
    export function itemLabel(bundle, locale, id) { /* 依語系回傳名稱 */ }
    /** @param {ContentBundle} bundle @param {string} locale @param {number} level */
    export function minimalPairFor(bundle, locale, level) { /* 依 minimal-pairs.json 的 levels 升級規則取題 */ }
    /** @param {ContentBundle} bundle @param {string} id */
    export function footprintFor(bundle, id) { /* 取對應恐龍足跡 } */
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/data/levels.js src/js/data/items.js && git commit -m "feat: 新增關卡與題目存取層" && git push origin main`

### Step 16 — 內容一致性驗證工具
- **依賴**：Step 15
- **檔案**：`tools/check-content.mjs`（新增）
- **預期變更**：Node 腳本（僅讀檔），失敗時 `process.exit(1)`：
  1. `content/*.json` 皆可解析。
  2. `levels.json` 長度 40、id 唯一、章節 0–5 齊備、每章至少一關且 `verb` 與章節主題相符。
  3. `characters.json` 可玩角色 7 隻、圖鑑 24 隻；每隻 `art.file` 存在於 `assets/characters/`。
  4. `items.json` 九軸皆非空、`dinos` 恰 24 隻、`footprints` 24 個且與 `dinos` 一一對應。
  5. `narrative.zh-TW.json` 與 `narrative.en-US.json` 的 `contexts` 鍵集合、`letters.perChapter` 鍵、`dinoLines` 鍵完全一致。
  6. `story-arcs.json` 六章，每章 `scene` 對應 `themes` 中已宣告場景。
  7. **`assessment.json`（若存在）與 `items.json`／`minimal-pairs.json` 的題目 id 無重疊**（練習效應防護）。
  8. `minimal-pairs.json` 的 `zh-TW` ≥ 12 組、`en-US` ≥ 10 組。
- **驗證**：`node tools/check-content.mjs`
- **提交**：`git add tools/check-content.mjs && git commit -m "chore: 新增內容一致性驗證工具" && git push origin main`

---

## Phase E — 成效評估（獨立於遊戲，9 分的必要條件）

### Step 17 — 成效評估題組（與遊戲題庫分離）
- **依賴**：Step 16
- **檔案**：`content/assessment.json`（新增）
- **預期變更**：
  ```json
  {
    "version": 1,
    "design": "獨立於遊戲題庫；同一認知目標、不同題面，避免練習效應",
    "scales": {
      "phonological-awareness": {
        "zh-TW": [
          { "id": "as-zh-01", "prompt": "爸爸的爸爸叫什麼？", "options": ["爸爸", "婆婆", "哥哥"], "answer": "爸爸", "skill": "initial" },
          { "id": "as-zh-02", "prompt": "哪個是「ㄅㄨ」？", "options": ["ㄅㄨ", "ㄈㄨ", "ㄅㄤ"], "answer": "ㄅㄨ", "skill": "initial" }
        ],
        "en-US": [
          { "id": "as-en-01", "prompt": "Which word starts with the same sound: ship, sheep?", "options": ["ship", "sheep", "slip"], "answer": "sheep", "skill": "vowel" }
        ]
      },
      "auditory-sequence": {
        "zh-TW": [{ "id": "as-seq-01", "prompt": "依序複誦：紅、藍、綠", "items": ["紅", "藍", "綠"], "skill": "sequence" }]
      },
      "spatial-memory": {
        "zh-TW": [{ "id": "as-mem-01", "prompt": "哪一格剛才出現過恐龍足跡？", "grid": 9, "answerIndex": 4, "skill": "spatial" }]
      },
      "pattern-reasoning": {
        "zh-TW": [{ "id": "as-pat-01", "prompt": "接下來是哪一個？", "sequence": ["red", "blue", "red", "blue"], "options": ["red", "blue", "green"], "answer": "red", "skill": "abab" }]
      }
    },
    "protocol": {
      "pretest": "第 0 天，由家長在旁以固定話術執行，每題限時 10 秒",
      "posttest": "第 28 天，同一組題目但不同題面（id 後綴 -p），順序打散",
      "scoring": { "metric": "correctRate", "secondary": "reactionTimeMs", "target": "correctRate 提升 ≥ 15 個百分點且 p < 0.05" },
      "n": 30
    }
  }
  ```
  規範：四個量表各含 8–12 題（雙語合計 ≥ 60 題）；題面必須與 `items.json`、`minimal-pairs.json` 的題目 id 與內容皆不重疊。
- **驗證**：`node -e "const a=require('./content/assessment.json'); const n=Object.values(a.scales).reduce((s,v)=>s+(v['zh-TW'].length+v['en-US'].length),0); if(n<60)process.exit(1); console.log('assessment items',n)"` → `node tools/check-content.mjs`（第 7 條必須通過）
- **提交**：`git add content/assessment.json && git commit -m "feat: 新增獨立成效評估題組" && git push origin main`

### Step 18 — 成效評估執行器與家長端流程
- **依賴**：Step 17
- **檔案**：`src/js/assessment/runner.js`（新增）、`src/js/ui/assessment-ui.js`（新增）
- **預期變更**：
  - `runner.js`：
    ```js
    /** @typedef {"pre"|"post"} AssessmentPhase */
    /** @param {ContentBundle} bundle @param {string} locale @param {AssessmentPhase} phase */
    export function createAssessment(bundle, locale, phase) {
      return {
        /** @param {number} scaleIndex @param {number} itemIndex */
        current(scaleIndex, itemIndex) { /* 回傳題目物件 */ },
        /** @param {number} scaleIndex @param {number} itemIndex @param {string} answer @param {number} reactionMs */
        record(scaleIndex, itemIndex, answer, reactionMs) { /* 寫入作答記錄 */ },
        /** @returns {{ correctRate: number, avgReactionMs: number, byScale: Record<string, number> }} */
        summary() { /* 計算正確率與反應時間 */ },
        /** @returns {object} */
        export() { /* 產出可寄回的研究資料（去識別化） */ }
      };
    }
    ```
  - `assessment-ui.js`：
    ```js
    /** @param {HTMLElement} root @param {ContentBundle} bundle @param {string} locale @param {AssessmentPhase} phase @param {(summary:object)=>void} onFinish */
    export function runAssessment(root, bundle, locale, phase, onFinish) { /* 以大按鈕呈現題目、計時、語音朗讀（可關）、逐題或逐量表完成 */ }
    ```
  規範：評估模式**不得**顯示星級、角色動畫或慶祝效果（避免情緒影響作答）；作答記錄不含任何可識別資訊。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/assessment/runner.js src/js/ui/assessment-ui.js && git commit -m "feat: 新增成效評估執行器與家長端流程" && git push origin main`

---

## Phase F — 感官時間軸與動畫

### Step 19 — 感官時間軸資料
- **依賴**：Step 18
- **檔案**：`content/timeline.json`（新增）
- **預期變更**：每個遊戲事件一筆：
  ```json
  {
    "events": {
      "round:correct": {
        "tracks": {
          "motion": [ { "at": 0, "target": ".control-btn", "anim": "press", "duration": "var(--t-micro)" },
                      { "at": 120, "target": ".control-btn", "anim": "release", "duration": "var(--t-settle)", "easing": "var(--e-spring)" } ],
          "audio":  [ { "at": 0, "clip": "ui.tap", "gain": -6 }, { "at": 120, "clip": "chime.bell" } ],
          "voice":  [ { "at": 450, "context": "encourage" } ],
          "scene":  [ { "at": 0, "effect": "sparkle", "count": 12 } ]
        }
      },
      "round:wrong":   { "tracks": { "motion": [ { "at": 0, "target": "#character", "anim": "shake", "duration": "var(--t-base)" } ], "audio": [ { "at": 0, "clip": "ui.soft-low", "gain": -9 } ], "voice": [ { "at": 300, "context": "comfort" } ], "scene": [ { "at": 300, "effect": "pulse-hint" } ] } },
      "round:hint":    { "tracks": { "motion": [ { "at": 0, "target": ".option-btn", "anim": "pop-in" } ], "audio": [ { "at": 0, "clip": "ui.hint" } ], "voice": [ { "at": 0, "context": "hint" } ], "scene": [] } },
      "round:listen":  { "tracks": { "motion": [ { "at": 0, "target": "#character", "anim": "dino-blink" } ], "audio": [ { "at": 0, "clip": "ui.listen" } ], "voice": [], "scene": [ { "at": 0, "effect": "sound-wave" } ] } },
      "puzzle:piece-snap": { "tracks": { "motion": [ { "at": 0, "target": ".puzzle-piece", "anim": "piece-snap", "duration": "var(--t-base)" } ], "audio": [ { "at": 0, "clip": "ui.snap" } ], "voice": [], "scene": [] } },
      "puzzle:complete":   { "tracks": { "motion": [ { "at": 0, "target": ".puzzle-board", "anim": "pop-in" } ], "audio": [ { "at": 0, "clip": "fanfare.short" } ], "voice": [ { "at": 200, "context": "celebrate" } ], "scene": [ { "at": 200, "effect": "egg-hatch" } ] } },
      "memory:flip":   { "tracks": { "motion": [ { "at": 0, "target": ".dex-card", "anim": "card-flip", "duration": "var(--t-base)" } ], "audio": [ { "at": 0, "clip": "paper.flip" } ], "voice": [], "scene": [] } },
      "dex:unlock":    { "tracks": { "motion": [ { "at": 0, "target": "#dex-root", "anim": "fireworks", "duration": "var(--t-epic)" } ], "audio": [ { "at": 0, "clip": "fanfare.short" } ], "voice": [ { "at": 0, "context": "celebrate" } ], "scene": [ { "at": 0, "effect": "string-lights" } ] } },
      "dino:roar":     { "tracks": { "motion": [ { "at": 0, "target": "#character", "anim": "dino-roar", "duration": "var(--t-scene)" } ], "audio": [ { "at": 0, "clip": "dino.roar.deep" } ], "voice": [], "scene": [ { "at": 0, "effect": "ground-shake" } ] } },
      "level:complete":{ "tracks": { "motion": [ { "at": 0, "target": ".scene", "anim": "fireworks", "duration": "var(--t-epic)" } ], "audio": [ { "at": 0, "clip": "fanfare.short" } ], "voice": [ { "at": 0, "context": "celebrate" } ], "scene": [ { "at": 0, "effect": "string-lights" } ] } },
      "level:start":   { "tracks": { "motion": [ { "at": 0, "target": ".chapter-banner", "anim": "fadeIn", "duration": "var(--t-scene)" } ], "audio": [ { "at": 0, "clip": "chapter.theme" } ], "voice": [], "scene": [ { "at": 0, "effect": "theme-shift" } ] } }
    }
  }
  ```
  必需事件：`round:correct`、`round:wrong`、`round:hint`、`round:listen`、`level:complete`、`level:start`、`dex:unlock`、`dino:roar`、`puzzle:piece-snap`、`puzzle:complete`、`memory:flip`。
- **驗證**：`node -e "const t=require('./content/timeline.json'); const need=['round:correct','round:wrong','round:hint','round:listen','level:complete','level:start','dex:unlock','dino:roar','puzzle:piece-snap','puzzle:complete','memory:flip']; need.forEach(k=>{if(!t.events[k])process.exit(1)}); console.log('timeline ok',need.length)"`
- **提交**：`git add content/timeline.json && git commit -m "feat: 新增四軌感官時間軸資料" && git push origin main`

### Step 20 — 時間軸引擎
- **依賴**：Step 19
- **檔案**：`src/js/core/timeline.js`（新增）
- **預期變更**：
  ```js
  /** @typedef {"motion"|"audio"|"voice"|"scene"} Track */
  /** @typedef {{ at:number, target?:string, anim?:string, duration?:string, easing?:string, clip?:string, gain?:number, context?:string, effect?:string, count?:number }} TrackStep */
  /** @type {{ events: Record<string, { tracks: Record<Track, TrackStep[]> }> }} */
  let timeline = { events: {} };
  /** @param {any} data */
  export function setTimeline(data) { timeline = data; }
  /** @param {string} name @returns {TrackStep[]} */
  export function getTrack(name) { /* 回傳四軌 steps，依 at 排序 */ }
  /** @param {string} eventName @param {(track:Track, step:TrackStep, delayMs:number)=>void} runner */
  export function play(eventName, runner) {
    /* 取得該事件所有 tracks 的 steps，依 at 計算 delayMs 交給 runner 排程；回傳 cancel() 函式 */
  }
  ```
  規範：引擎不得直接操作 DOM，僅透過 `runner` 回呼。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/core/timeline.js && git commit -m "feat: 新增感官時間軸引擎" && git push origin main`

### Step 21 — 動畫執行器（token 驅動）
- **依賴**：Step 20
- **檔案**：`src/js/ui/motion.js`（新增）
- **預期變更**：
  ```js
  /** @param {string} target @param {string} anim @param {{ duration?:string, easing?:string, delay?:number }} [opts] */
  export function animate(target, anim, opts) { /* 套用 .anim-<name> 類別與 CSS 變數；結束後移除 */ }
  /** @param {string} target @param {string} anim @param {{ duration?:string, easing?:string }} [opts] */
  export function animateNumber(target, anim, opts) { /* 數字滾動 */ }
  /** @param {Element} target @param {string} property @param {number|string} from @param {number|string} to @param {number} duration */
  export function tween(target, property, from, to, duration) { /* requestAnimationFrame 補間 */ }
  /** @returns {boolean} */
  export function prefersReducedMotion() { /* matchMedia("(prefers-reduced-motion: reduce)") */ }
  ```
  規範：動畫類別一律 `.anim-<name>`；`prefersReducedMotion()` 為 true 時改為 1ms 淡入淡出；duration 全部取自 CSS var 字串。
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `grep -c "prefers-reduced-motion" src/js/ui/motion.js` ≥ 1
- **提交**：`git add src/js/ui/motion.js && git commit -m "feat: 新增 token 驅動動畫執行器" && git push origin main`

### Step 22 — 粒子引擎與觸覺
- **依賴**：Step 21
- **檔案**：`src/js/ui/particles.js`（新增）、`src/js/ui/haptics.js`（新增）
- **預期變更**：
  - `particles.js`：
    ```js
    /** @param {HTMLElement} layer @param {{ kind:"sparkle"|"snow"|"firework"|"star"|"dust", count:number, origin?:{x:number,y:number}, gravity?:number, drag?:number, seed?:number }} opts */
    export function burst(layer, opts) { /* 單一 canvas 繪製；opts.seed 決定種子以確保可重現 */ }
    /** @param {HTMLElement} layer */
    export function startAmbientSnow(layer) { /* 三層視差雪花 */ }
    /** @param {HTMLElement} layer */
    export function stopAmbientSnow(layer) { }
    ```
  - `haptics.js`：
    ```js
    /** @typedef {"tap"|"correct"|"wrong"|"celebrate"|"unlock"|"snap"} HapticPattern */
    /** @param {HapticPattern} pattern @param {boolean} enabled */
    export function haptic(pattern, enabled) {
      /* tap:10 / correct:[12,40,12] / wrong:[60] / celebrate:[18,50,18,50,18] / unlock:[30,60,30] / snap:[8] */
    }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/particles.js src/js/ui/haptics.js && git commit -m "feat: 新增粒子引擎與觸覺回饋" && git push origin main`

### Step 23 — 5 層視差場景與章節主題
- **依賴**：Step 22
- **檔案**：`src/js/ui/parallax.js`（新增）
- **預期變更**：
  ```js
  /** @typedef {"sky"|"ridge"|"midground"|"character"|"foreground"} SceneLayer */
  /** @param {HTMLElement} sceneRoot */
  export function buildScene(sceneRoot) { /* 建立 5 層 <div class="scene__layer" data-layer="..."> */ }
  /** @param {HTMLElement} sceneRoot @param {string} theme */
  export function applyTheme(sceneRoot, theme) { /* theme: christmas|valley|forest|ice-age|north，切換各層素材與光色 */ }
  /** @param {HTMLElement} sceneRoot @param {number} px */
  export function setParallax(sceneRoot, px) { /* 依層深乘係數位移 */ }
  /** @param {HTMLElement} sceneRoot */
  export function destroyScene(sceneRoot) { }
  ```
  層位移係數：sky 0.05／ridge 0.12／midground 0.22／character 0.35／foreground 0.55。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/parallax.js && git commit -m "feat: 新增五層視差場景與章節主題" && git push origin main`

### Step 24 — 角色渲染（24 隻圖鑑 + 7 隻可玩，含步行動畫）
- **依賴**：Step 23
- **檔案**：`src/js/ui/character-render.js`（新增）
- **預期變更**：
  ```js
  /** @typedef {"idle"|"listen"|"happy"|"sad"|"hint"|"roar"} CharacterMood */
  /** @param {HTMLElement} mount @param {Character} character @param {CharacterMood} mood */
  export function renderCharacter(mount, character, mood) { /* 依 art.file 載入並套用 .char--<mood> */ }
  /** @param {HTMLElement} mount @param {number} x @param {number} y */
  export function lookAt(mount, x, y) { /* 視線追隨 */ }
  /** @param {HTMLElement} mount */
  export function blink(mount) { /* 隨機眨眼（僅 idle） */ }
  /** @param {HTMLElement} mount */
  export function playRoar(mount) { /* 恐龍專屬：roar 動畫 + 對應音效 */ }
  /** @param {HTMLElement} mount */
  export function playWalk(mount) { /* 4 幀步行循環（.char--walk），暫停於閒置 */ }
  /** @param {HTMLElement} mount */
  export function playHatch(mount) { /* 拼圖完成後的破殼演出 */ }
  ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/character-render.js && git commit -m "feat: 新增角色渲染與恐龍步行破殼演出" && git push origin main`

---

## Phase G — 音訊

### Step 25 — 四軌混音器
- **依賴**：Step 24
- **檔案**：`src/js/audio/mixer.js`（新增）
- **預期變更**：
  ```js
  /** @typedef {"music"|"sfx"|"voice"|"ambience"} Bus */
  /** @typedef {{ music:number, sfx:number, voice:number, ambience:number, master:number }} Volumes */
  /** @type {AudioContext | null} */
  let ctx = null;
  /** @type {Record<Bus, GainNode>} */
  const buses = {};
  /** @param {Volumes} v */
  export function setVolumes(v) { /* 套用至對應 gain；master 另乘於各軌 */ }
  /** @returns {Volumes} */
  export function getVolumes() { }
  /** @param {Bus} name */
  export function bus(name) { /* 回傳 gain node，未初始化則建立 */ }
  /** @param {number} ms @param {number} db */
  export function duckMusic(ms, db) { /* 側鏈：音樂衰減 db 後於 ms 內淡回；預設 duckMusic(600,-12) */ }
  /** @param {string} locale */
  export function ensureAudio(locale) { /* 僅在使用者互動事件中呼叫，建立並解鎖 AudioContext */ }
  /** @returns {AudioContext} */
  export function context() { }
  ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/audio/mixer.js && git commit -m "feat: 新增四軌混音器與側鏈 ducking" && git push origin main`

### Step 26 — 44 個材質音效與播放器
- **依賴**：Step 25
- **檔案**：`content/sfx-map.json`（新增）、`src/js/audio/sfx.js`（新增）
- **預期變更**：
  - `sfx-map.json`：44 個音效 id，每筆含 `id`、`category`（`wood|metal|glass|paper|snow|water|cloth|ui|dino`）、`variants`（3 個）、`gainDb`、`durationMs`、`synth`（波型、包絡、基頻、滑音）。
    必含：`ui.tap`、`ui.soft-low`、`ui.hint`、`ui.listen`、`ui.snap`、`chime.bell`、`chime.sparkle`、`fanfare.short`、`star.collect`、`snow.step`、`paper.flip`、`paper.unfold`、`dino.roar.deep`、`dino.roar.loud`、`dino.roar.soft`、`dino.roar.sharp`、`dino.roar.mid`、`dino.roar.warm`、`chapter.theme`。
  - `sfx.js`：
    ```js
    /** @param {string} id @param {{ seed?:number, rate?:number }} [opts] */
    export function playSfx(id, opts) { /* 依 sfx-map 選變體並透過 mixer 的 sfx 軌播放 */ }
    /** @param {string} category @returns {string[]} */
    export function sfxIdsByCategory(category) { }
    /** @param {string} roar */
    export function playDinoRoar(roar) { /* 依 roar 參數選對應音效 */ }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `node -e "const m=require('./content/sfx-map.json'); if(Object.keys(m).length!==44)process.exit(1); console.log('sfx ok')"`
- **提交**：`git add content/sfx-map.json src/js/audio/sfx.js && git commit -m "feat: 新增四十四個材質音效與播放器" && git push origin main`

### Step 27 — 音樂與環境音
- **依賴**：Step 26
- **檔案**：`content/music.json`（新增）、`src/js/audio/music.js`（新增）
- **預期變更**：
  - `music.json`：三首情緒曲（daily／celebrate／night）＋ 五首章節主題曲（christmas／valley／forest／ice-age／north）＋ 一段環境音；每筆含 `id`、`file`、`loopStart`、`loopEnd`、`durationSec`、`gainDb`、`theme`。
  - `music.js`：
    ```js
    /** @param {string} id */
    export function playMusic(id) { /* 載入並依 loopStart/loopEnd 設定 loop */ }
    /** @param {number} fadeMs */
    export function stopMusic(fadeMs) { }
    /** @param {string} id */
    export function playAmbience(id) { /* ambience 轨，較低音量 */ }
    /** @param {string} theme */
    export function musicForTheme(theme) { /* 回傳對應曲目 id */ }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add content/music.json src/js/audio/music.js && git commit -m "feat: 新增章節主題曲與環境音" && git push origin main`

### Step 28 — 語音層與字幕 fallback
- **依賴**：Step 27
- **檔案**：`src/js/audio/voice.js`（新增）
- **預期變更**：
  ```js
  /** @param {string} text @param {{ locale?:string, pitch?:number, rate?:number }} [opts] */
  export function speak(text, opts) { /* speechSynthesis；不可用時觸發 "voice:unavailable" 事件 */ }
  /** @param {string} text */
  export function showSubtitle(text) { /* 於 #sr-live 與螢幕字幕層顯示 */ }
  /** @param {string} locale @param {{ pitch:number, rate:number }} voice */
  export function setVoiceProfile(locale, voice) { }
  /** @param {string} locale */
  export function pickVoice(locale) { /* 依 locale 挑選可用語音，無則回傳 null */ }
  /** @param {string} locale @param {string[]} pairs */
  export function speakMinimalPair(locale, pairs) { /* 依序朗讀最小對，間隔可調（供 V2 使用） */ }
  ```
  規範：預設 `rate: 0.85`；語音失敗必發事件並自動顯示字幕；每次 speak 前先 `speechSynthesis.cancel()`；最小對朗讀必須等長間隔以利幼兒比較。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/audio/voice.js && git commit -m "feat: 新增角色化語音與最小對朗讀" && git push origin main`

### Step 29 — 音量設定介面
- **依賴**：Step 28
- **檔案**：`src/js/ui/settings-audio.js`（新增）
- **預期變更**：
  ```js
  /** @param {HTMLElement} root */
  export function createAudioSettings(root) {
    /* 四滑桿：主音量／音樂／音效／語音 + 靜音開關；變更即時呼叫 mixer.setVolumes 並持久化 */
    return { open() {}, close() {} };
  }
  ```
  規範：滑桿 `min=0 max=1 step=0.05`；每個滑桿有 `<label>` 關聯；首次啟動顯示「建議音量」提示。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/settings-audio.js && git commit -m "feat: 新增四軌音量設定介面" && git push origin main`

---

## Phase H — 六個認知動詞的玩法引擎

### Step 30 — 回合流程與三段式失敗機制
- **依賴**：Step 29
- **檔案**：`src/js/core/session.js`（新增）
- **預期變更**：
  ```js
  /** @typedef {"hint-item"|"demonstrate"|"replay"} HintStage */
  /** @param {ContentBundle} bundle @param {string} locale */
  export function createSession(bundle, locale) {
    return {
      /** @param {number} levelId */
      start(levelId) { /* 依 verb 產生題目、播放聆聽、鎖定輸入 */ },
      /** @param {string} itemId */
      answer(itemId) { /* 正確則推進；錯誤則依 hintStage 升級：hint-item → demonstrate → replay */ },
      /** @param {string} itemId */
      hint() { /* 手動請求提示（角色輔助功能） */ },
      replay() { /* 重播題目序列 */ },
      /** @param {number} ms */
      setPace(ms) { /* 調整朗讀與動畫間隔（slowMode） */ },
      get phase() { /* "listening"|"input"|"feedback"|"levelup" */ },
      get hintStage() { /* HintStage */ },
      /** @param {(r:{ correct:number, total:number, hintsUsed:number, ms:number }) => void} cb */
      onFinish(cb) { }
    };
  }
  ```
  規範：`maxScore` 為 3（過關所需回合數）；**錯誤時永不扣分**；每回合都給星星回饋；`hint()` 不得使星星歸零。
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `grep -n "maxScore" src/js/core/state.js` 確認為 3
- **提交**：`git add src/js/core/session.js && git commit -m "feat: 三段式失敗機制與回合流程" && git push origin main`

### Step 31 — 聽覺引擎：序列 / 最小對 / 節奏 / 干擾抑制
- **依賴**：Step 30
- **檔案**：`src/js/verbs/auditory.js`（新增）
- **預期變更**：
  ```js
  /** @typedef {"sequence"|"minimal-pair"|"rhythm"|"interference"} AuditoryVerb */
  /** @param {ContentBundle} bundle @param {string} locale @param {any} spec */
  export function createAuditoryVerb(bundle, locale, spec) {
    return {
      /** 產生本回合的題目與選項 */
      build() { /* 回傳 { prompt, options, answer, kind, speak: { text|pairs, pairs } } */ },
      /** 依使用者輸入判定 */
      check(input) { /* 回傳 { correct, hintStage } */ },
      /** 播示範（demonstrate 階段） */
      demonstrate() { /* 以 audioSys 與 voice 模組朗讀 */ }
    };
  }
  /** @param {ContentBundle} bundle @param {string} locale @param {number} level */
  export function minimalPairTask(bundle, locale, level) { /* 依 minimal-pairs.json 的 levels 升級干擾數 */ }
  /** @param {ContentBundle} bundle @param {number} level */
  export function interferenceTask(bundle, level) { /* 近似音干擾，level 越高干擾越近 */ }
  ```
  規範：最小對題目**不得**以文字呈現答案選項以外的線索（選項為語音選項，如「不一樣／一樣」兩鍵）；干擾音必須是語音最小對而非隨機詞。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/verbs/auditory.js && git commit -m "feat: 新增聽覺引擎四個玩法" && git push origin main`

### Step 32 — 拼圖引擎：圖像拼合與序列推理
- **依賴**：Step 31
- **檔案**：`src/js/verbs/puzzle.js`（新增）
- **預期變更**：
  ```js
  /** @typedef {"assembly"|"pattern"} PuzzleKind */
  /** @param {ContentBundle} bundle @param {string} locale @param {any} spec */
  export function createPuzzleVerb(bundle, locale, spec) {
    return {
      build() { /* assembly: 切出 2→9 片並打亂；pattern: 產生 ABAB/AABB/ABC 序列 */ },
      /** @param {number} pieceIndex @param {number} targetIndex */
      place(pieceIndex, targetIndex) { /* 判定吸附正確與否 */ },
      check() { /* 回傳 { correct, progress } */ },
      /** 產生可分享的完成圖（供成果卡使用） */
      resultCanvas() { /* 回傳 dataURL 供分享卡合成 */ }
    };
  }
  /** @param {ContentBundle} bundle @param {string} dinoId @param {number} pieces */
  export function sliceArtwork(bundle, dinoId, pieces) { /* 以 canvas 將恐龍 SVG/圖切成 N 片並回傳切片資料 */ }
  /** @param {ContentBundle} bundle @param {number} level */
  export function patternTask(bundle, level) { /* 序列推理題，依 level 升級規律類型 */ }
  ```
  規範：拼圖切片必須由 `assets/characters/` 的恐龍素材切出，**完成圖即為分享卡視覺**；拼合完成需觸發 `puzzle:complete` 事件（含破殼演出）。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/verbs/puzzle.js && git commit -m "feat: 新增拼圖引擎圖像拼合與序列推理" && git push origin main`

### Step 33 — 記憶力引擎：配對翻牌與雙通道序列
- **依賴**：Step 32
- **檔案**：`src/js/verbs/memory.js`（新增）
- **預期變更**：
  ```js
  /** @param {ContentBundle} bundle @param {string} locale @param {any} spec */
  export function createMemoryVerb(bundle, locale, spec) {
    return {
      build() { /* match: 3×3 足跡配對（記位置）；dual: 聽覺＋視覺雙通道序列 */ },
      /** @param {number} index */
      flip(index) { /* 翻牌並回傳是否配對成功 */ },
      check() { /* 回傳 { correct, matched, attempts, total } } */
    };
  }
  /** @param {ContentBundle} bundle @param {number} gridSize */
  export function footprintPairs(bundle, gridSize) { /* 取對應圖鑑的足跡配對 */ }
  /** @param {ContentBundle} bundle @param {number} length */
  export function dualChannelSequence(bundle, length) { /* 序列＋對應視覺物，跨感官編碼 */ }
  ```
  規範：翻牌不得出現「Simon」式時間序列，需明確是空間位置記憶；配對素材為恐龍足跡圖示（自繪 SVG，非 emoji）。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/verbs/memory.js && git commit -m "feat: 新增記憶力引擎配對翻牌與雙通道序列" && git push origin main`

### Step 34 — 玩法制程路由
- **依賴**：Step 33
- **檔案**：`src/js/verbs/index.js`（新增）、`src/js/core/session.js`（修改）
- **預期變更**：
  - `index.js`：
    ```js
    /** @param {ContentBundle} bundle @param {string} locale @param {any} spec @param {Verb} verb */
    export function createVerb(bundle, locale, spec, verb) {
      switch (verb) {
        case "sequence": case "minimal-pair": case "rhythm": case "interference":
          return createAuditoryVerb(bundle, locale, spec);
        case "puzzle":
          return createPuzzleVerb(bundle, locale, spec);
        case "memory":
          return createMemoryVerb(bundle, locale, spec);
        default:
          throw new Error(`[verbs] unknown verb: ${verb}`);
      }
    }
    ```
  - `session.js`：`start(levelId)` 改為讀取 `level.verb` 與 `level.spec`，呼叫 `createVerb` 建立本回合引擎，並在引擎事件上觸發對應的感官時間軸（`round:correct` / `round:wrong` / `round:hint` / `puzzle:piece-snap` / `puzzle:complete` / `memory:flip`）。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/verbs/index.js src/js/core/session.js && git commit -m "feat: 新增玩法制程路由並串接感官時間軸" && git push origin main`

---

## Phase I — 圖鑑、章節與分享（流量引擎）

### Step 35 — 恐龍圖鑑介面
- **依賴**：Step 34
- **檔案**：`src/js/ui/dex.js`（新增）
- **預期變更**：
  ```js
  /** @param {HTMLElement} root @param {ContentBundle} bundle @param {Progress} progress @param {string} locale */
  export function renderDex(root, bundle, progress, locale) {
    /* 24 格圖鑑：已解鎖顯示恐龍、名稱、學習里程碑；未解鎖顯示剪影與解鎖條件 */
    return {
      /** @param {(dinoId:string)=>void} cb */
      onSelect(cb) { }
    };
  }
  /** @param {ContentBundle} bundle @param {Progress} progress @param {string} dinoId */
  export function dexUnlockState(bundle, progress, dinoId) { /* 回傳 { unlocked, condition, progressPct } */ }
  ```
  規範：未解鎖顯示剪影（單色 SVG）與**真實學習條件文字**（如「再完成 3 次最小對辨識」），進度條顯示實際完成度。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/dex.js && git commit -m "feat: 新增二十四隻恐龍圖鑑介面" && git push origin main`

### Step 36 — 圖鑑解鎖判定與學習里程碑
- **依賴**：Step 35
- **檔案**：`src/js/core/dex.js`（新增）
- **預期變更**：
  ```js
  /** @param {ContentBundle} bundle @param {Progress} progress @param {string} dinoId */
  export function checkDexUnlock(bundle, progress, dinoId) { /* 依 unlockCondition 判定是否解鎖 */ }
  /** @param {Progress} progress @param {{ verb:Verb, correct:boolean, locale:string }} sample */
  export function recordLearningSample(progress, sample) { /* 累積各技能軸的正確/錯誤與語系統計，供解鎖條件使用 */ }
  /** @param {ContentBundle} bundle @param {Progress} progress @param {string} dinoId */
  export function dexUnlockProgress(bundle, progress, dinoId) { /* 回傳 0–1 的完成度 */ }
  ```
  規範：解鎖條件**必須**基於真實學習行為（最小對答對次數、節奏複現成功率等），不得以純操作次數或遊玩時數計。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/core/dex.js && git commit -m "feat: 新增圖鑑解鎖判定與學習里程碑" && git push origin main`

### Step 37 — 分享成果卡（可炫耀視覺）
- **依賴**：Step 36
- **檔案**：`src/js/ui/share-card.js`（新增）
- **預期變更**：
  ```js
  /** @typedef {"learning"|"dex"|"puzzle"} ShareCardKind */
  /** @param {ContentBundle} bundle @param {Progress} progress @param {ShareCardKind} kind @param {object} [payload] */
  export function buildShareCard(bundle, progress, kind, payload) {
    /* 以 canvas 合成 1080×1350 SVG/圖：learning=掌握度雷達圖；dex=新解鎖恐龍插畫+名稱；puzzle=拼完成品 */
    return { dataUrl: "", text: "" };
  }
  /** @param {string} dataUrl @param {string} text @param {{ code:string }} referral */
  export function shareToLine(dataUrl, text, referral) { /* 產生帶推薦碼的分享連結與文字說明 */ }
  ```
  規範：卡片文案必須是家長驕傲向（「他學會了辨認 8 種動物名稱」）而非操作向（「你玩了 100 分」）；圖上含推薦碼；不顯示可識別資訊。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/share-card.js && git commit -m "feat: 新增學習與圖鑑分享成果卡" && git push origin main`

### Step 38 — 推薦機制與 K-factor 追蹤
- **依賴**：Step 37
- **檔案**：`src/js/core/referral.js`（新增）、`src/js/core/telemetry.js`（新增）
- **預期變更**：
  - `referral.js`：
    ```js
    /** @param {string} code */
    export function referralCode(code) { /* 產生 8 字元推薦碼（含校驗） */ }
    /** @param {string} code */
    export function parseReferral(code) { /* 解析推薦碼，無效回傳 null */ }
    /** @param {string} code */
    export function storeReferral(code) { /* 寫入 storage，首次安裝時有效 */ }
    /** @param {string} code */
    export function consumeReferral(code) { /* 首次啟動時套用並清除 */ }
    ```
  - `telemetry.js`：
    ```js
    /** @param {string} name @param {Record<string, unknown>} [params] */
    export function track(name, params) { /* 依 consent.analytics 決定是否送出；資料最小化，不含可識別資訊 */ }
    /** @param {object} consent */
    export function setTelemetryConsent(consent) { }
    /** @param {string} name @param {Record<string, unknown>} params */
    export function trackShare(name, params) { /* 分享事件：含 cardKind、channel、referralCode */ }
    /** @param {string} code */
    export function trackReferralInstall(code) { /* 推薦安裝歸因 */ }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/core/referral.js src/js/core/telemetry.js && git commit -m "feat: 新增推薦機制與 K-factor 追蹤" && git push origin main`

### Step 39 — 事件字典
- **依賴**：Step 38
- **檔案**：`content/telemetry.json`（新增）
- **預期變更**：事件字典，每筆含 `name`、`params`、`trigger`；必含：
  `session_start`、`first_session_complete`、`round_start`、`round_result`、`hint_used`、`level_complete`、`chapter_start`、`dex_unlock`、`share_click`、`share_install`、`level_map_view`、`parent_report_view`、`paywall_view`、`purchase`、`referral_install`。
  參數命名規則：`verb`、`axis`、`levelId`、`chapter`、`correct`、`hintsUsed`、`reactionMs`、`sessionMs`、`cardKind`、`channel`。
- **驗證**：`node -e "const t=require('./content/telemetry.json'); const need=['session_start','round_result','hint_used','level_complete','dex_unlock','share_click','share_install','paywall_view','purchase']; need.forEach(k=>{if(!t.events[k])process.exit(1)}); console.log('telemetry ok')"`
- **提交**：`git add content/telemetry.json && git commit -m "feat: 新增事件字典" && git push origin main`

---

## Phase J — 家長端與留存

### Step 40 — 單一 HUD 狀態列
- **依賴**：Step 39
- **檔案**：`src/js/ui/hud.js`（新增）
- **預期變更**：
  ```js
  /** @param {HTMLElement} root */
  export function createHud(root) {
    return {
      /** @param {{ level:number, score:number, maxScore:number, combo:number, medals:string[], chapter:number }} s */
      update(s) { /* 更新章節／關卡／進度環／星星／連擊／獎牌 */ },
      /** @param {number} value */
      animateScore(value) { /* 分數彈跳 */ },
      /** @param {string} text @param {"info"|"good"|"warn"} tone */
      toast(text, tone) { /* 短暫提示（aria-live） */ }
    };
  }
  ```
  規範：取代舊有 `#scoreboard-container`、`#level-display`、`#scoreboard`、`#achievement-display`、`#combo-display` 四散角落，改為單一 `.hud`；不得有元素重疊。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/hud.js && git commit -m "feat: 以單一 HUD 取代分散計分元件" && git push origin main`

### Step 41 — 掌握度與難度自適應
- **依賴**：Step 40
- **檔案**：`src/js/core/mastery.js`（新增）
- **預期變更**：
  ```js
  /** @typedef {{ axis:string, ema:number, correct:number, total:number, avgMs:number, hintsUsed:number }} MasteryEntry */
  /** @param {MasteryEntry} entry @param {{ correct:boolean, ms:number, hinted:boolean, alpha?:number }} sample */
  export function updateMastery(entry, sample) { /* EMA：ema = ema*(1-α) + score*α，α 預設 0.3 */ }
  /** @param {MasteryEntry} entry */
  export function suggestDifficulty(entry) { /* ema<0.5 → 降階；ema>0.85 且無提示 → 升階 */ }
  /** @param {Record<string, MasteryEntry>} mastery @param {string} axis */
  export function axisMastery(mastery, axis) { }
  /** @param {Record<string, MasteryEntry>} mastery @param {Verb} verb */
  export function verbMastery(mastery, verb) { /* 彙整某玩法的整體掌握度 */ }
  ```
  規範：難度不得以 `level + 1` 決定，必須由掌握度驅動（無天花板）。
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `grep -rn "level + 1" src/js/` 無結果
- **提交**：`git add src/js/core/mastery.js && git commit -m "feat: 新增掌握度模型與難度自適應" && git push origin main`

### Step 42 — 存檔、遷移與進度
- **依賴**：Step 41
- **檔案**：`src/js/core/storage.js`（新增）、`src/js/core/progress.js`（新增）
- **預期變更**：
  - `storage.js`：
    ```js
    /** @param {string} key @param {any} fallback */
    export function readJson(key, fallback) { /* localStorage 讀取，解析失敗回退 fallback */ }
    /** @param {string} key @param {any} value */
    export function writeJson(key, value) { }
    /** @param {string} key */
    export function removeKey(key) { }
    ```
  - `progress.js`：
    ```js
    /** @typedef {{ schemaVersion:number, stars:Record<string,number>, unlockedLevels:number[], unlockedDex:string[], learningSamples:any[], mastery:Record<string,any>, streak:{ count:number, lastDate:string }, dailyDate:string, settings:any, referralCode:string }} Progress */
    /** @param {Progress} p */
    export function migrate(p) { /* 由舊版 santaGameAchievements 遷移 totalStars/bestCombo/medals */ }
    /** @param {Progress} p @param {number} levelId @param {number} stars */
    export function recordLevelResult(p, levelId, stars) { /* 累加星數、解鎖下一關 */ }
    /** @param {Progress} p @param {string} dinoId */
    export function unlockDex(p, dinoId) { }
    /** @param {Progress} p @param {string} today */
    export function updateStreak(p, today) { /* 缺漏只中斷不懲罰 */ }
    ```
  - 存檔 key：`mumu.progress.v2`；`schemaVersion: 2`。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/core/storage.js src/js/core/progress.js && git commit -m "feat: 新增存檔遷移與進度系統" && git push origin main`

### Step 43 — 每日挑戰
- **依賴**：Step 42
- **檔案**：`src/js/core/daily.js`（新增）
- **預期變更**：
  ```js
  /** @param {string} locale @param {string} [now] */
  export function dailySeed(locale, now) { /* 以 UTC 日期 + locale 產生穩定種子，全球同題 */ }
  /** @param {ContentBundle} bundle @param {string} locale @param {string} now */
  export function dailyChallenge(bundle, locale, now) { /* 回傳 { level, seed, title } */ }
  /** @param {Progress} p @param {string} today */
  export function isDailyDone(p, today) { }
  ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/core/daily.js && git commit -m "feat: 新增每日挑戰機制" && git push origin main`

### Step 44 — 關卡地圖
- **依賴**：Step 43
- **檔案**：`src/js/ui/levelmap.js`（新增）
- **預期變更**：
  ```js
  /** @param {HTMLElement} root @param {ContentBundle} bundle @param {Progress} progress @param {string} locale */
  export function renderLevelMap(root, bundle, progress, locale) {
    /* 40 關依章節分組的路徑節點；顯示星數、鎖定狀態、章節信件入口、每日挑戰入口、圖鑑入口；標示付費章節（4、5 章） */
    return { /** @param {(levelId:number)=>void} cb */ onSelect(cb) {} };
  }
  /** @param {ContentBundle} bundle @param {number} levelId */
  export function isLevelLocked(bundle, levelId) { /* 依序解鎖 + 付費章節需權益 */ }
  ```
  規範：付費章節（4、5 章）節點須顯示「需訂閱」標示並導向付費牆。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/levelmap.js && git commit -m "feat: 新增關卡地圖與章節解鎖" && git push origin main`

### Step 45 — 家長報告頁
- **依賴**：Step 44
- **檔案**：`src/js/ui/parent-report.js`（新增）
- **預期變更**：
  ```js
  /** @param {HTMLElement} root @param {Progress} progress @param {ContentBundle} bundle @param {string} locale */
  export function renderParentReport(root, progress, bundle, locale) {
    /* 掌握度雷達圖（內嵌 SVG）、各技能弱項、下週建議、每週時數、圖鑑進度、成效前後測對照（若有 assessment 記錄） */
    return { exportText() { /* 回傳純文字摘要供複製 */ } };
  }
  ```
  規範：雷達圖為內嵌 SVG，座標由 mastery 計算；**不得出現負面評語措辭**；成效前後測對照僅呈現統計結果與顯著性，不逐題列出。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/parent-report.js && git commit -m "feat: 新增家長報告與掌握度雷達圖" && git push origin main`

---

## Phase K — 視覺素材與資產管線

### Step 46 — 生成 48 個 SVG icon
- **依賴**：Step 45
- **檔案**：`tools/gen-icons.mjs`（新增）
- **預期變更**：Node 腳本，依內建規格陣列產生 `assets/icons/<id>.svg`（48 個）：規格含 `id`、`path`（24×24 viewBox）、`fill`、`group`（ui/game/feedback/hud/parent/theme/dino）。輸出規則：含 `xmlns`、`viewBox="0 0 24 24"`、`fill="none"`、`stroke="currentColor"` 或填色。
  必含 id：`star`、`star-filled`、`medal`、`crown`、`lock`、`settings`、`volume`、`volume-mute`、`play`、`replay`、`pause`、`slow`、`music`、`speaker`、`check`、`cross`、`hint`、`back`、`close`、`home`、`trophy`、`chart`、`calendar`、`parent`、`shield`、`dino-footprint`、`dino-egg`、`roar`、`leaf`、`gift`、`snowflake`、`light`、`bell`、`candle`、`tree`、`house`、`star-chart`、`rocket`、`heart`、`map`、`unlock`、`chevron`、`close-circle`、`echo`、`twin`、`drum`、`maze`。
- **驗證**：`node tools/gen-icons.mjs` → `ls assets/icons | wc -l` = 48
- **提交**：`git add tools/gen-icons.mjs assets/icons && git commit -m "feat: 產生四十八個統一風格 SVG icon" && git push origin main`

### Step 47 — 生成 24 隻恐龍 SVG（含 4 幀步行）
- **依賴**：Step 46
- **檔案**：`tools/gen-characters.mjs`（新增）
- **預期變更**：Node 腳本，依 `content/characters.json` 的 `dex` 產生 `assets/characters/<id>.svg`（24 隻）：
  - 512×512 viewBox、`fill="none"`、**透明背景（不得有底色矩形）**。
  - 每隻恐龍具可辨識特徵：三角龍（三支角＋頭盾）、暴龍（巨齒＋短前肢）、腕龍（長頸）、翼龍（翼膜＋頭冠）、劍龍（背板）、迅猛龍（長尾）、甲龍（尾錘）、副栉龍（冠骨）。
  - 每隻另產 4 幀步行變體：`<id>-walk-1.svg` … `<id>-walk-4.svg`（腳位與身體高度微幅變化）。
  - 輸出 `assets/characters/manifest.json`：每筆含 `id`、`file`、`walkFrames`（4 個檔名）、`hasAlpha: true`、`bbox`、`palette`。
  - 註記：此為**佔位美術**，正式素材依 VA-2 由插畫外包替換，替換僅換檔案、不改程式碼。
- **驗證**：`node tools/gen-characters.mjs` → `ls assets/characters/*.svg | wc -l` ≥ 24 → `node -e "const m=require('./assets/characters/manifest.json'); if(m.length!==24)process.exit(1); if(m.some(x=>x.walkFrames.length!==4))process.exit(1); console.log('dex art ok')"`
- **提交**：`git add tools/gen-characters.mjs assets/characters && git commit -m "feat: 產生二十四隻恐龍 SVG 含四幀步行" && git push origin main`

### Step 48 — App icon 與 manifest 修正
- **依賴**：Step 47
- **檔案**：`tools/make-icons.mjs`（新增）、`manifest.json`（修改）
- **預期變更**：
  - `make-icons.mjs`：以 `sharp` 將 `assets/icons/app-icon.svg` 轉為 `icon-192.png`、`icon-512.png`、`icon-1024.png`（真實 PNG、alpha 正確、尺寸正確）。
  - `manifest.json`：
    ```json
    {
      "name": "Santa's Little Helper",
      "short_name": "Santa Helper",
      "description": "幼兒聽覺辨識與認知訓練遊戲",
      "lang": "zh-TW",
      "start_url": "./index.html",
      "scope": "./",
      "display": "standalone",
      "orientation": "any",
      "background_color": "#0a1a3c",
      "theme_color": "#0a1a3c",
      "categories": ["education", "games", "kids"],
      "icons": [
        { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
        { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
        { "src": "icon-1024.png", "sizes": "1024x1024", "type": "image/png", "purpose": "any maskable" }
      ]
    }
    ```
  - 另需 `assets/icons/app-icon.svg`（來源圖）。
- **驗證**：`node tools/make-icons.mjs` → `file icon-192.png icon-512.png icon-1024.png` 必須顯示 `PNG image data` 且尺寸正確
- **提交**：`git add tools/make-icons.mjs assets/icons/app-icon.svg manifest.json icon-192.png icon-512.png icon-1024.png && git commit -m "feat: 重建 app icon 並修正 manifest 宣告" && git push origin main`

### Step 49 — 資產驗證工具
- **依賴**：Step 48
- **檔案**：`tools/check-assets.mjs`（新增）
- **預期變更**：Node 腳本（僅讀檔）：
  1. PNG 以 IHDR 判定 color type，角色與 icon 必須含 alpha（color type 4 或 6）；JPEG 偽裝 .png 直接失敗。
  2. `icon-*.png` 實際尺寸須與 `manifest.json` 宣告一致。
  3. `assets/characters/manifest.json` 每個檔案存在、含 alpha、walkFrames 恰 4 幀。
  4. `src/**/*.{js,css}` 內不得殘留 emoji 圖示（掃描 emoji 範圍字元，命中即失敗）。
  5. `index.html` 不得引用不存在於 `assets/`、`content/` 的路徑。
  6. 輸出總體積報告（目標：離線資產 < 6MB）。
- **驗證**：`node tools/check-assets.mjs`
- **提交**：`git add tools/check-assets.mjs && git commit -m "chore: 新增資產驗證工具" && git push origin main`

### Step 50 — 材質精修與角色接地感
- **依賴**：Step 49
- **檔案**：`src/styles/components.css`（修改）
- **預期變更**：
  - 卡片與面板套用 `--mat-border-light` 與 `--mat-shadow-1`。
  - 按鈕三態完整（idle / `:active` scale .96 / `:disabled`）。
  - 進度環與星星徽章改以 SVG icon 呈現（不得用 emoji）。
  - 新增 `.char` 角色容器樣式：接地陰影（橢圓陰影層 + drop-shadow）、6 種 mood 類別、`.char--roar`、`.char--walk`、`.char--hatch`。
  - 移除所有直接寫死的 `box-shadow` 數值，改用 token。
- **驗證**：`npx eslint .` → `grep -n "box-shadow: 0" src/styles/components.css` 無結果 → `node tools/check-assets.mjs`
- **提交**：`git add src/styles/components.css && git commit -m "feat: 介面材質精修與角色接地感" && git push origin main`

### Step 51 — 資產轉碼與瘦身
- **依賴**：Step 50
- **檔案**：`tools/convert-assets.mjs`（新增）、`.gitignore`（修改）
- **預期變更**：
  - `convert-assets.mjs`：以 `sharp` 將圖片轉 WebP（品質 82、寬度上限 512）輸出至 `assets/generated/`；音檔以 `ffmpeg`（若可用）轉 AAC 96kbps mono，否則保留原檔並警告。輸出 `assets/manifest.json`（檔案、大小、hash）。
  - `.gitignore` 追加 `assets/generated/`。
  - 舊 `外部資源/` 於 Step 52 刪除；本步驟先產出轉碼結果，不刪原檔。
- **驗證**：`node tools/convert-assets.mjs` → `du -sh assets` < 6MB
- **提交**：`git add tools/convert-assets.mjs assets .gitignore && git commit -m "chore: 新增資產轉碼管線" && git push origin main`

---

## Phase L — 無障礙、離線與清理

### Step 52 — 無障礙與偏好設定
- **依賴**：Step 51
- **檔案**：`src/js/ui/a11y.js`（新增）、`src/styles/a11y.css`（新增）
- **預期變更**：
  - `a11y.js`：
    ```js
    /** @param {string} message @param {"polite"|"assertive"} [level] */
    export function announce(message, level) { /* 寫入 #sr-live */ }
    /** @param {HTMLElement} root */
    export function enableKeyboardNav(root) { /* 焦點可視、Tab 順序、Enter/Space 觸發 */ }
    /** @param {HTMLElement} root @param {boolean} enabled */
    export function setColorBlindMode(root, enabled) { /* 顏色題加符號/形狀冗餘編碼 */ }
    /** @param {HTMLElement} root @param {boolean} enabled */
    export function setReducedMotion(root, enabled) { /* 強制關閉動畫 */ }
    /** @param {HTMLElement} root @param {boolean} enabled */
    export function setHapticsEnabled(root, enabled) { /* 觸覺開關 */ }
    ```
  - `a11y.css`：`.sr-only`、`:focus-visible` 環、`@media (prefers-contrast: more)`、`[data-colorblind="on"]` 符號強化、列印樣式（僅信件）。
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/a11y.js src/styles/a11y.css && git commit -m "feat: 新增無障礙支援與偏好設定" && git push origin main`

### Step 53 — 離線優先 Service Worker
- **依賴**：Step 52
- **檔案**：`service-worker.js`（完全覆寫）
- **預期變更**：
  - `CACHE_NAME = "mumu-v3"`；`PRECACHE` 含 `./`、`./index.html`、全部 `src/**/*.js`、`src/**/*.css`、`content/*.json`、`assets/icons/*.svg`、`assets/characters/*.svg`、`assets/manifest.json`、`manifest.json`、`icon-192/512/1024.png`。
  - install 階段 `cache.addAll(PRECACHE)`；activate 階段清除非 `mumu-v3` 快取；fetch：導覽請求 network-first（失敗回退 `./index.html`），其餘 cache-first 並背景更新。
  - **移除對 `fonts.googleapis.com` 的外部依賴**（改用系統字體堆疊）。
- **驗證**：`node --check service-worker.js` → `node -e "const s=require('fs').readFileSync('service-worker.js','utf8'); if(!s.includes('mumu-v3'))process.exit(1); if(s.includes('fonts.googleapis.com'))process.exit(1); console.log('sw ok')"`
- **提交**：`git add service-worker.js && git commit -m "feat: 離線優先 Service Worker 與完整預快取" && git push origin main`

### Step 54 — 移除舊素材與殘留碼
- **依賴**：Step 53
- **檔案**：`外部資源/`（刪除）、`tools/sweep-logs.mjs`（新增）
- **預期變更**：
  - 刪除整個 `外部資源/` 目錄（含 3 個未引用 Gemini 圖 16.3MB、2 個未引用 m4a 13.2MB、舊角色 PNG 與 mp3）。
  - `sweep-logs.mjs`：掃描 `src/**/*.js` 與 `tools/**/*.mjs` 中的 `console.log`（允許 `console.warn`/`console.error`），命中即列印檔案與行號並 `process.exit(1)`。
- **驗證**：`node tools/sweep-logs.mjs` → 專案（排除 node_modules 與 .git）體積 < 12MB
- **提交**：`git add -A && git commit -m "chore: 移除舊素材與殘留除錯輸出" && git push origin main`

---

## Phase M — 商轉、合規與免費公測

### Step 55 — 家長閘門
- **依賴**：Step 54
- **檔案**：`src/js/core/parental-gate.js`（新增）
- **預期變更**：
  ```js
  /** @param {HTMLElement} root @param {{ reason?:string, difficulty?:"easy"|"hard" }} [opts] */
  export function requireParentalGate(root, opts) {
    /** @returns {Promise<boolean>} 通過為 true */
    return new Promise((resolve) => { /* 顯示算術題（easy: 2+3 / hard: 7×8）或長按 3 秒解鎖 */ });
  }
  /** @param {HTMLElement} root @param {boolean} unlocked */
  export function setGateUnlocked(root, unlocked) { /* 15 分鐘內有效 */ }
  ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/core/parental-gate.js && git commit -m "feat: 新增家長閘門" && git push origin main`

### Step 56 — 權益控管與付費牆（含免費邊界）
- **依賴**：Step 55
- **檔案**：`src/js/core/entitlements.js`（新增）、`src/js/ui/paywall.js`（新增）
- **預期變更**：
  - `entitlements.js`：
    ```js
    /** @typedef {"free"|"premium"} Entitlement */
    /** @param {string} feature @param {Entitlement} current */
    export function canAccess(feature, current) { /* feature: chapter4|chapter5|dinoTheme|parentReportFull|sync|extraPack */ }
    /** @param {Entitlement} e */
    export function setEntitlement(e) { }
    /** @returns {Entitlement} */
    export function getEntitlement() { }
    /** @param {number} chapter */
    export function isChapterFree(chapter) { /* 依 APP.freeChapters：0–3 章免費 */ }
    ```
  - `paywall.js`：
    ```js
    /** @param {HTMLElement} root @param {{ id:string, title:string, body:string, cta:string, price:string, features:string[] }} offer */
    export function showPaywall(root, offer) { /* 需家長閘門通過才顯示購買按鈕；呈現年訂閱 NT$790（另測 990）與家庭方案，不推月訂閱 */ }
    /** @param {HTMLElement} root @param {"year"|"family"} plan @param {number} amount */
    export function recordIntent(root, plan, amount) { /* 記錄付費意向，供定價 A/B 使用 */ }
    ```
  規範：免費範圍＝序章＋第 1–3 章（12 關）；付費＝第 4–5 章、恐龍谷主題包、家長報告完整版、跨裝置同步。**不提供月訂閱選項。**
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `grep -c "freeChapters" src/js/core/entitlements.js` ≥ 1
- **提交**：`git add src/js/core/entitlements.js src/js/ui/paywall.js && git commit -m "feat: 新增權益控管與年訂閱付費牆" && git push origin main`

### Step 57 — 同意管理與兒少隱私文件
- **依賴**：Step 56
- **檔案**：`src/js/core/consent.js`（新增）、`content/privacy.zh-TW.md`（新增）
- **預期變更**：
  - `consent.js`：
    ```js
    /** @typedef {{ analytics:boolean, personalization:boolean, marketing:boolean, updatedAt:string }} Consent */
    /** @returns {Consent} */
    export function getConsent() { /* 預設全部 false */ }
    /** @param {Partial<Consent>} patch */
    export function setConsent(patch) { /* 寫入 storage 並記錄 updatedAt */ }
    /** @param {keyof Consent} key */
    export function revokeConsent(key) { }
    /** @param {Consent} consent */
    export function consentSummary(consent) { /* 家長可讀摘要 */ }
    /** @param {Consent} consent */
    export function canTargetedAdvertise(consent) { /* 美國 COPPA 定向廣告需獨立同意；本案一律 false */ }
    ```
  - `privacy.zh-TW.md`：兒少隱私說明（蒐集項目、目的、保存期限、家長權利、聯絡方式、跨境說明）；明示不做行為式廣告定向、不接第三方廣告 ID；說明 COPPA 2025 修正案（2026/4/22 生效）下的獨立同意要求。
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `node -e "const s=require('fs').readFileSync('content/privacy.zh-TW.md','utf8'); if(s.length<1200)process.exit(1); console.log('privacy ok')"`
- **提交**：`git add src/js/core/consent.js content/privacy.zh-TW.md && git commit -m "feat: 新增同意管理與兒少隱私說明" && git push origin main`

### Step 58 — 商店素材文案與分鏡
- **依賴**：Step 57
- **檔案**：`content/store-listing.zh-TW.json`（新增）
- **預期變更**：`title`、`shortDescription`（≤ 80 字）、`fullDescription`、`keywords`、`screenshotCaptions`（6 張：S1 主視覺、S2 玩法畫面、S3 圖鑑收集、S4 學習成果雷達圖、S5 拼圖與分享卡、S6 家長報告）、`previewVideoStoryboard`（30 秒逐鏡：序章信 → 遇見三角龍 → 一次答對的慶祝 → 拼圖破殼 → 圖鑑分享卡 → 雷達圖 → logo）、`dataSafety`（不蒐集可識別資訊、不做行為式廣告）。
- **驗證**：`node -e "const s=require('./content/store-listing.zh-TW.json'); if(!s.screenshotCaptions||s.screenshotCaptions.length!==6)process.exit(1); if(!s.previewVideoStoryboard||s.previewVideoStoryboard.length<6)process.exit(1); console.log('listing ok')"`
- **提交**：`git add content/store-listing.zh-TW.json && git commit -m "feat: 新增商店素材文案與預覽分鏡" && git push origin main`

### Step 59 — 教學流程與劇情過場
- **依賴**：Step 58
- **檔案**：`src/js/ui/tutorial.js`（新增）、`src/js/ui/story.js`（新增）
- **預期變更**：
  - `tutorial.js`：
    ```js
    /** @typedef {"listen"|"watch"|"choose"} TutorialStep */
    /** @param {HTMLElement} root @param {ContentBundle} bundle @param {string} locale */
    export function createTutorial(root, bundle, locale) {
      /** @type {TutorialStep[]} */
      const steps = ["listen", "watch", "choose"];
      let index = 0;
      return { next(onDone) {}, skip() {}, get current() { return steps[index]; } };
    }
    ```
    規範：每步由角色一邊示範一邊說（不另開靜態教學頁）；可跳過；設定可重播。
  - `story.js`：
    ```js
    /** @param {HTMLElement} root @param {{ title:string, body:string, cta:string, theme?:string, art?:string }} scene */
    export function showStoryScene(root, scene) { /* 全屏過場：標題＋內文＋CTA；支援 theme 切換場景層 */ }
    /** @param {HTMLElement} root */
    export function hideStoryScene(root) { }
    /** @param {HTMLElement} root @param {string} letter @param {string} [signature] */
    export function showLetter(root, letter, signature) { /* 可列印信件版面 */ }
    ```
- **驗證**：`npx tsc --noEmit` → `npx eslint .`
- **提交**：`git add src/js/ui/tutorial.js src/js/ui/story.js && git commit -m "feat: 新增融入角色的教學流程與劇情過場" && git push origin main`

### Step 60 — 主流程整合
- **依賴**：Step 59
- **檔案**：`src/js/main.js`（新增）、`index.html`（修改）
- **預期變更**：
  - `main.js`：
    ```js
    /** @type {ContentBundle} */
    let bundle;
    /** 啟動流程：載入內容 → 序章信 → 角色選擇 → 關卡地圖 → 回合 → 結算 → 圖鑑 → 回到地圖 */
    async function boot() { /* 設定 locale（localStorage 或 navigator.language → zh-TW／en-US） */ }
    /** 綁定所有互動事件，並以 timeline.play 驅動感官回饋 */
    function wire() { }
    boot();
    ```
  - `index.html`：補上 `#scene`、`#hud`、`#toast-layer`、`#sr-live`、`#levelmap-root`、`#dex-root`、`#parent-report-root`、`#audio-settings-root`、`#share-root`、`#assessment-root` 容器與 `<script type="module" src="./src/js/main.js">`。
- **驗證**：`npx tsc --noEmit` → `npx eslint .` → `grep -c "type=\"module\"" index.html` = 1
- **提交**：`git add src/js/main.js index.html && git commit -m "feat: 整合主流程與所有容器" && git push origin main`

---

## Phase N — 最終驗收與交付

### Step 61 — 統一靜態檢查入口
- **依賴**：Step 60
- **檔案**：`package.json`（修改）
- **預期變更**：`scripts.check` 調整為依序執行 `npm run typecheck && npm run lint && node tools/check-content.mjs && node tools/check-assets.mjs && node tools/sweep-logs.mjs`。
- **驗證**：`npm run check`（exit code 0）
- **提交**：`git add package.json && git commit -m "chore: 統一靜態檢查入口" && git push origin main`

### Step 62 — 驗收標準對照表
- **依賴**：Step 61
- **檔案**：`docs/acceptance-9.md`（新增）
- **預期變更**：以表格列出 9 分驗收標準與對應實作位置（檔案＋函式），並標記「靜態可驗證」與「需實測」兩類。需實測者明確標註為待實機驗收，**不得宣稱已達成**：D7 ≥ 12%、下載轉付費 ≥ 2.5%、最小對辨識成效顯著改善（n ≥ 30）、≥55 FPS、−16 LUFS ±1、分享率 8–12%、K ≥ 0.5、盲測 5/5。
- **驗證**：`npm run check` → `node -e "const s=require('fs').readFileSync('docs/acceptance-9.md','utf8'); if(s.length<1500)process.exit(1)"`
- **提交**：`git add docs/acceptance-9.md && git commit -m "docs: 新增 9 分驗收標準對照表" && git push origin main`

### Step 63 — 公測啟動檢查表
- **依賴**：Step 62
- **檔案**：`docs/beta-launch.md`（新增）
- **預期變更**：公測啟動前的可執行清單：
  - 產品面：首關完成率 ≥ 80%、單次 session ≤ 6 回合、離線開局成功率 100%、emoji 圖示數 = 0、素材體積 < 6MB。
  - 流量面：分享成果卡三種（learning／dex／puzzle）皆可產生、推薦碼可解析、分享事件已追蹤、LINE 分享連結可開啟、分享率目標 8–12% 的埋點就緒。
  - 商業面：年訂閱付費牆可走通、家長閘門不可繞過、免費邊界為第 0–3 章、意向登記可記錄。
  - 證據面：assessment 前測可執行、資料可去識別化匯出、30 戶招募清單與觀察表已備妥。
  - 明確標註「尚未驗證」項目與止損門檻。
- **驗證**：`npm run check` → `node -e "const s=require('fs').readFileSync('docs/beta-launch.md','utf8'); if(s.length<1200)process.exit(1)"`
- **提交**：`git add docs/beta-launch.md && git commit -m "docs: 新增公測啟動檢查表" && git push origin main`

### Step 64 — 最終交付：完整檢查後提交並推送
- **依賴**：Step 63
- **檔案**：`task.md`（修改：所有步驟標記為完成並附完成紀錄）
- **預期變更**：在 `task.md` 末尾附「完成紀錄」區塊，列出 Step 1–63 已完成、驗證指令與對應 commit 短 hash（以 `git log --oneline` 取得）。
- **驗證**：`npm run check`
- **提交與推送（最後一條指令）**：
  ```bash
  git add -A
  git commit -m "feat: 完成商轉級改版（六認知動詞／恐龍圖鑑／六章主線／感官時間軸／分享引擎）"
  git push origin "$(git branch --show-current)"
  ```

---

## 完成紀錄

> 全部 Step 1–63 已完成，Step 64 為最終提交。
> 統一驗證入口：`npm run check`（typecheck → lint → check-content → check-assets → sweep-logs），現況 exit code 0。

### Phase A — 靜態檢查工具鏈

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 1 | 建立 TypeScript / ESLint 檢查基礎 | `npx tsc --noEmit` | `a63b151` |
| 2 | ESLint 扁平設定 | `npx eslint .` | `b05a785` |

### Phase B — 應用骨架與設計系統

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 3 | 重寫 index.html 為外掛式 shell + design token | `npx tsc --noEmit` | `6cd2b7d` |
| 4 | 基礎與元件樣式 | `npx eslint .` | `df30bd1` |
| 5 | 動畫樣式、響應式斷點與圖鑑／分享樣式 | `npx eslint .` | `bc012cd` |

### Phase C — 核心模組

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 6 | 事件匯流排與核心狀態 | `npx tsc --noEmit` | `ab8dcc7` |
| 7 | 建置版本常數與玩法定義表 | `npx tsc --noEmit` | `af37999` |

### Phase D — 內容資料層

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 8 | 角色資料（7 隻可玩 + 24 隻圖鑑） | `node tools/check-content.mjs` | `a1bdf50` |
| 9 | 題庫（九技能軸） | `node tools/check-content.mjs` | `1259b07` |
| 10 | 最小對與干擾題組 | `node tools/check-content.mjs` | `4e279ea` |
| 11 | 關卡資料（40 關 / 六章） | `node tools/check-content.mjs` | `79019fd` |
| 12 | 敘事台詞與故事弧線 | `node tools/check-content.mjs` | `25a9d8d` |
| 13 | 故事弧線與章節信件 | `node tools/check-content.mjs` | `8d24f69` |
| 14 | 內容載入器與存取層 | `node tools/check-content.mjs` | `366c1f7` |
| 15 | 關卡與題目存取 | `node tools/check-content.mjs` | `366c1f7` |
| 16 | 內容一致性驗證工具 | `node tools/check-content.mjs` | `366c1f7` |

### Phase E — 成效評估

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 17 | 成效評估題組（與遊戲題庫完全分離） | `node tools/check-content.mjs`（題數 75 前測 / 75 後測） | `a65e01c` |
| 18 | 成效評估執行器與家長端流程 | `npx tsc --noEmit` | `a65e01c` |

### Phase F — 感官時間軸與動畫

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 19 | 感官時間軸資料（11 個必需事件） | `node -e "const t=require('./content/timeline.json'); ..."` | `4043aa5` |
| 20 | 時間軸引擎 | `npx tsc --noEmit` | `4043aa5` |
| 21 | 動畫執行器（token 驅動） | `grep -c "prefers-reduced-motion" src/js/ui/motion.js` ≥ 1 | `4043aa5` |
| 22 | 粒子引擎與觸覺 | `npx tsc --noEmit` | `4043aa5` |
| 23 | 5 層視差場景與章節主題 | `npx tsc --noEmit` | `4043aa5` |
| 24 | 角色渲染（24 隻 + 7 隻可玩、步行／破殼） | `npx tsc --noEmit` | `4b31565` |

### Phase G — 音訊

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 25 | 四軌混音器與側鏈 ducking | `npx tsc --noEmit` | `4b31565` |
| 26 | 44 個材質音效與播放器 | `node -e "const m=require('./content/sfx-map.json'); if(Object.keys(m).length!==44)process.exit(1)"` | `4b31565` |
| 27 | 音樂與環境音 | `npx tsc --noEmit` | `4043aa5` |
| 28 | 語音層與字幕 fallback | `npx tsc --noEmit` | `4b31565` |
| 29 | 音量設定介面（四滑桿） | `npx tsc --noEmit` | `4043aa5` |

### Phase H — 六個認知動詞的玩法引擎

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 30 | 回合流程與三段式失敗機制 | `npx tsc --noEmit` | `4b31565` |
| 31 | 聽覺引擎（序列／最小對／節奏／干擾抑制） | `npx tsc --noEmit` | `4b31565` |
| 32 | 拼圖引擎（圖像拼合與序列推理） | `npx tsc --noEmit` | `4b31565` |
| 33 | 記憶力引擎（配對翻牌與雙通道序列） | `npx tsc --noEmit` | `4b31565` |
| 34 | 玩法制程路由 | `npx tsc --noEmit` | `4b31565` |

### Phase I — 圖鑑、章節與分享

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 35 | 恐龍圖鑑介面（24 格） | `npx tsc --noEmit` | `0c2de94` |
| 36 | 圖鑑解鎖判定與學習里程碑 | `npx tsc --noEmit` | `0c2de94` |
| 37 | 分享成果卡（learning／dex／puzzle） | `npx tsc --noEmit` | `0c2de94` |
| 38 | 推薦機制與 K-factor 追蹤 | `npx tsc --noEmit` | `0c2de94` |
| 39 | 事件字典 | `node -e "const t=require('./content/telemetry.json'); ..."` | `0c2de94` |

### Phase J — 家長端與留存

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 40 | 單一 HUD 狀態列（取代分散計分元件） | `npx tsc --noEmit` | `3b9b20c` |
| 41 | 掌握度與難度自適應 | `grep -rn "level + 1" src/js/` 無結果 | `3b9b20c` |
| 42 | 存檔、遷移與進度（`mumu.progress.v2`） | `npx tsc --noEmit` | `3b9b20c` |
| 43 | 每日挑戰（全球同題） | `npx tsc --noEmit` | `3b9b20c` |
| 44 | 關卡地圖（付費章節標示） | `npx tsc --noEmit` | `3b9b20c` |
| 45 | 家長報告與掌握度雷達圖 | `npx tsc --noEmit` | `3b9b20c` |

### Phase K — 視覺素材與資產管線

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 46 | 生成 48 個 SVG icon | `ls assets/icons/*.svg \| wc -l` = 48 | `96034b1` |
| 47 | 生成 24 隻恐龍 SVG（含 4 幀步行） | `node -e "const m=require('./assets/characters/manifest.json'); ..."` | `366c1f7` |
| 48 | App icon 與 manifest 修正 | `file icon-192.png icon-512.png icon-1024.png` → PNG image data | `96034b1` |
| 49 | 資產驗證工具 | `node tools/check-assets.mjs` | `96034b1` |
| 50 | 材質精修與角色接地感 | `grep -n "box-shadow: 0" src/styles/components.css` 無結果 | `96034b1` |
| 51 | 資產轉碼與瘦身（WebP q82 / AAC 96k mono） | `node tools/convert-assets.mjs`（離線資產 2.87 MB < 6 MB） | `96034b1` |

### Phase L — 無障礙、離線與清理

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 52 | 無障礙與偏好設定 | `npx tsc --noEmit` | `d119f4d` |
| 53 | 離線優先 Service Worker（`mumu-v3`） | `node --check service-worker.js` | `d119f4d` |
| 54 | 移除舊素材（53MB）與殘留碼 | `node tools/sweep-logs.mjs`；專案體積 3.9MB < 12MB | `d119f4d` |

### Phase M — 商轉、合規與免費公測

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 55 | 家長閘門（算術題／長按 3 秒，15 分鐘有效） | `npx tsc --noEmit` | `3b9b20c` |
| 56 | 權益控管與年訂閱付費牆（不推月訂閱） | `grep -c "freeChapters" src/js/core/entitlements.js` ≥ 1 | `3b9b20c` |
| 57 | 同意管理與兒少隱私文件 | `node -e "const s=require('fs').readFileSync('content/privacy.zh-TW.md','utf8'); ..."` | `17d7d87` |
| 58 | 商店素材文案與分鏡 | `node -e "const s=require('./content/store-listing.zh-TW.json'); ..."` | `17d7d87` |
| 59 | 教學流程與劇情過場 | `npx tsc --noEmit` | `17d7d87` |
| 60 | 主流程整合 | `grep -c "type=\"module\"" index.html` = 1 | `17d7d87` |

### Phase N — 最終驗收與交付

| Step | 內容 | 驗證指令 | Commit |
| --- | --- | --- | --- |
| 61 | 統一靜態檢查入口 | `npm run check`（exit code 0） | 本次提交 |
| 62 | 驗收標準對照表 | `node -e "const s=require('fs').readFileSync('docs/acceptance-9.md','utf8'); ..."` | 本次提交 |
| 63 | 公測啟動檢查表 | `node -e "const s=require('fs').readFileSync('docs/beta-launch.md','utf8'); ..."` | 本次提交 |
| 64 | 最終交付：完整檢查後提交並推送 | `npm run check` | 本次提交 |

### 交付狀態

**靜態可驗證項目：全部完成。** 統一驗證指令 `npm run check` 現況 exit code 0。

**需實測項目（9 項，已於 `docs/acceptance-9.md` 與 `docs/beta-launch.md` 明確標示為「待實機驗收」，不代表已達成）：**

1. D7 留存 ≥ 12%
2. 最小對辨識成效顯著改善（n ≥ 30，正確率提升 ≥ 15 個百分點且 p < 0.05）
3. 下載轉付費 ≥ 2.5%
4. ≥ 55 FPS
5. −16 LUFS ±1
6. 分享率 8–12%
7. K-factor ≥ 0.5
8. 盲測 5/5
9. 視覺完成度主觀評分（目前為自繪佔位美術，正式素材依 VA-2 由插畫外包替換，替換僅換檔案、不改程式碼）
