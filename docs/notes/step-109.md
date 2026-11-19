# Step 109 — 建立 jsdom 可玩性測試骨架

日期：2026-11-20

## 產出物

| 檔案 | 狀態 | 說明 |
| --- | --- | --- |
| `package.json` | 修改 | 新增 devDependency `jsdom@^26.1.0` 與 script `test:play` |
| `tools/test-harness.mjs` | 新增 | 可玩性測試骨架（jsdom 環境 + fake timers + 瀏覽器 API stub） |
| `tools/verify-playable.mjs` | 新增 | 可玩性守門（10 條行為檢查） |

## 技術選型：為何用 `vm.SourceTextModule`

`src/js/**` 是原生 ESM，且**全部使用具名匯出**（無 default export、無 namespace import、無動態 import）。
因此守門以 `node --experimental-vm-modules` 的 `vm.SourceTextModule` 在 **jsdom 的全域物件**中
執行遊戲模組，理由：

1. **完整隔離** —— 每一個測試環境都有獨立的模組狀態（`main.js` 的 `bundle`／`session`、
   `events.js` 的 listener Map、`mixer.js` 的 `AudioContext`），測試之間不互相污染。
2. **真實 DOM** —— `document`／`window` 全部來自 jsdom，測試以真實 DOM 事件操作，
   符合「不得 import `src/js/main.js` 的私有狀態」規範。
3. **零 runtime dependency** —— 只新增 `jsdom` 一個 devDependency。

## 已 stub 的瀏覽器 API

- **Web Audio**：`AudioContext` / `webkitAudioContext` / `OfflineAudioContext`
  （`createGain`／`createBufferSource`／`createOscillator`／`createBuffer`／
  `createBiquadFilter`／`createStereoPanner`／`createDynamicsCompressor`／
  `createDelay`／`createAnalyser`／`createMediaElementSource`／`destination`／
  `currentTime`／`state`／`resume`／`suspend`／`close`／`startRendering()`）
- **語音**：`window.speechSynthesis`（`speak`／`cancel`／`getVoices` 回傳空陣列／
  `pause`／`resume`）與 `window.SpeechSynthesisUtterance`
- **其他**：`matchMedia`、`requestAnimationFrame`／`cancelAnimationFrame`、
  `HTMLCanvasElement.prototype.getContext`（2D context 全 API）、
  `HTMLCanvasElement.prototype.toDataURL`、`Image`（`src` 設定後於 microtask 觸發 `onload`，
  `naturalWidth`／`naturalHeight` = 512）、`Audio`、`performance.now`、`navigator.vibrate`
- **fetch**：攔截 `./content/*.json`，直接讀本機磁碟檔案並回傳 `{ ok, status, json() }`
- **localStorage**：jsdom 內建；**每個測試前清空**，並預先寫入解鎖全部 40 關的進度存檔
  （讓測試可進入任一關卡）與 `mumu.locale`

## Fake timers

`tools/test-harness.mjs` 以自製 clock 取代視窗內的 `setTimeout`／`setInterval`／
`requestAnimationFrame`，測試**一律**以 `env.clock.advance(ms)` 手動推進，
**不得**使用真實時間等待。

## 守門結果（Step 109 落地時）

```
[PASS] play-boot          — errors=0 startOverlayVisible=true
[PASS] play-start         — startHidden=true gameContainerVisible=true
[FAIL] play-dom-contract  — 缺陷：renderCharacter() 覆寫 #santa-container，#bubble / #bubble-content 消失
[FAIL] play-tutorial      — 缺陷：教學從未顯示（shown=false stuck=true）
[PASS] play-character     — hadCharacterButton=true levelMapVisible=true
[PASS] play-levelmap      — levelMapVisible=true nodeCount=40
[PASS] play-level-enter   — interactiveElements=3 phase=input level=1
[FAIL] play-level-complete — 缺陷：關卡 1（sequence）無法完成回合
[FAIL] play-all-verbs     — 缺陷：sequence / puzzle / memory 三種玩法無法判定對錯
[PASS] play-no-blocking   — uncaughtErrors=0 consoleErrors=0 phase=input
通過 6/10，失敗 4
```

**符合 Step 109 的預期**：`play-level-complete`、`play-all-verbs`、`play-tutorial` 為 FAIL，
證明守門抓得到既有缺陷。

## 守門揭露的既有缺陷（不在 Step 109 的修復範圍）

依執行守則第 3 條「不要自行擴大範圍」，以下缺陷**只記錄不修復**，
修復歸屬如下：

| 缺陷 | 現象 | 對應 Step |
| --- | --- | --- |
| **DOM 契約破裂** | `renderCharacter()` 以 `innerHTML` 覆寫 `#santa-container`，連帶刪掉 `#bubble` / `#bubble-content`；`showLetter()` 因此拋 `TypeError: Cannot set properties of null`，**第一次點擊開始畫面就中斷整條導航** | Step 115（序章信件改為過場）／Step 118（角色尺寸與版面根治） |
| **教學從未顯示** | `main.js` 的 `runTutorial()` 呼叫 `tutorial.skip(finish)`，而 `skip()` 會**立即**執行 `onDone` → 教學被瞬間跳過，使用者看不到任何教學步驟 | Step 114（修掉開始畫面重複觸發與教學卡死） |
| **sequence 玩法無法完成** | `auditory.js` 的 `check()` 對 sequence 一律回傳 `{ correct: false }`，UI 也從不呼叫 `advance()`；關卡 1–4 永遠卡在第 1 回合 | Step 110／111（統一引擎契約） |
| **puzzle 無操作介面** | `main.js` 的 `renderRound()` 只渲染選項網格，`place()` 從未被呼叫；關卡 29–32、40 永遠卡死 | Step 112（拼合盤 UI） |
| **memory 配對無法完成** | 記憶玩法的 `check()` 在有參數時一律回傳 `{ correct: false }`；配對完成需靠 `__memory_done__` 魔法字串 | Step 110／111 |

### 關於 `play-dom-contract` 的測試設計

`play-dom-contract` **刻意不套用** DOM fixture，以如實回報真實產品的 DOM 契約狀態；
其餘檢查則套用 fixture（把 `#bubble` 搬到 `#game-container` 底下），
讓「按真實路徑玩到回合」這件事可被驗證。

**這不是掩蓋缺陷** —— 缺陷由 `play-dom-contract` 單獨且明確地報為 FAIL。

## 未在本 Step 實作的 harness 匯出

`task.md` 列出的 `resetEnv()`／`openLevelMap()`／`answerRound()` 等匯出已提供，
但本次守門採「每個檢查一個全新環境」的隔離策略（`createGameEnv` → 檢查 → `disposeEnv`），
`resetEnv()` 未被實際使用，保留供後續 Step 擴充。
