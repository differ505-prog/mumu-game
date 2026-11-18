# 木木遊戲 — 商轉級製作水準提升清單（v8 三支柱專案）

> 本清單取代 v7。v7 的 Phase O Step 65–66 已完成（守門工具＋圖鑑解鎖 type 契約修復）。
> v8 的重點是**遊戲本身的製作水準**：**劇本、畫面、音樂**三支柱。
>
> **對標標準**：頂尖兒童教育遊戲（Duolingo ABC / Endless Alphabet / Sago Mini 的完成度）。
> 這個標準的意思是：角色有個性、場景有層次與情緒、音樂有獨立且切合情境的主題曲，而不是「功能齊全但素材共用」。
>
> **素材策略：混合** — 能程序化生成的就生成（沿用既有 Web Audio 手法，全自動、無授權風險）；需要真實錄音／樂器的部分由素材方提供，本清單先把介面與接線做對。
>
> **狀態（2026-11-19）：v8 三支柱 Step 81–108 全部完成。** 靜態可驗證項目全部通過
> （`npm run check` exit 0、`node tools/verify-quality.mjs` 29/29、`node tools/verify-phaseO.mjs --phase 1` 7/7）。
> **但以下實測項目仍未達成，必須在公測期補齊，不得宣稱已達成：**
> D7 留存 ≥ 12%、下載轉付費 ≥ 2.5%、≥ 55 FPS、−16 LUFS ±1、分享率 8–12%、K-factor ≥ 0.5、
> 最小對辨識成效顯著改善（n ≥ 30）、盲測 5/5、音樂真人聆聽評分、兒童理解度（4–8 歲）、
> 兒童試玩滿意度、家長評價、聆聽疲勞度、美術主觀水準評分。
> 詳細對照見 `docs/acceptance-9.md`「三支柱製作水準驗收」與 `docs/beta-launch.md`。
>
> **執行對象**：低階模型。本清單每一步都必須可獨立執行、可獨立驗證、不可跳步。
> **前置條件**：必須先讀完「執行守則」與「全域約束」。

---

## 執行守則（低階模型必讀）

1. **一次只做一個 Step。** 做完一個 Step、跑過它的驗證指令、`git commit` 並 `git push` 之後，才開始下一個 Step。
2. **驗證失敗時不要跳過。** 修正後重跑驗證；若同一 Step 嘗試 3 次仍失敗，**停止**並回報「卡在 Step N，錯誤訊息為 X」，不要硬推、也不要註記略過。
3. **不要自行擴大範圍。** 每個 Step 只改它列出的檔案。若發現 Step 描述之外的问题，寫進 `docs/notes/step-N.md` 記錄，交由後續 Step 或人工處理。
4. **不要改動 Step 描述之外的既有行為。** 例如 Step 81 動音樂，不得順手改音效系統。
5. **每個 Step 結束必須 commit + push。** 提交訊息用 Step 中指定的字串，不要自創。
6. **本清單的所有「驗證」指令都必須實際執行並貼出結果。** 不可只描述「應該會通過」。
7. **遇到看不懂的程式碼，先讀再開改。** 尤其 `src/js/main.js`（600+ 行）與 `src/js/core/session.js`，改動前先讀相關段落。

---

## 全域約束

1. **禁止啟動任何本地 Web 伺服器或佔用 Port**（禁止 `python -m http.server` / `npx serve` / `npm run dev` / `uvicorn` 等）。驗證僅限靜態指令：`npx tsc --noEmit`、`npx eslint .`、`node tools/*.mjs`。
2. 每步驟最多修改 2–3 個檔案；單一檔案單次改動不超過 400 行。由工具腳本產生的輸出檔（SVG、音檔）視為單一邏輯單位。
3. 嚴格依序執行，**禁止跳步**；每步驟標註「依賴 Step N」。
4. 目標分支 `main`，遠端 `origin`（https://github.com/differ505-prog/mumu-game.git）。
5. 專案為無建置工具的原生 ES Module 靜態網站（PWA）；不引入打包器、不引入 npm 套件。
6. 內容檔（`content/*.json`）於執行期以 `fetch()` 載入，非模組 import；結構由 `tools/check-content.mjs` 驗證。
7. **所有中文文案使用繁體中文（zh-TW）**，不得混入簡體。
8. **雙語檔案（`narrative.*.json`、`story-arcs.json`）修改時必須同步維護 zh-TW 與 en-US**，句數與結構必須完全對稱。`npm run check:content` 會驗證對稱性，失敗即退回重做。
9. **禁止 emoji 圖示**（`npm run check:assets` 會驗證 emoji = 0）。所有圖示必須是自繪 SVG。
10. **不得宣稱未實測項目已達成。** 需要真人試玩／真實用戶資料的項目（聆聽秒數、留存率、兒童滿意度）在對應實測完成前，一律標註「待實測」。
11. **JSON 檔案含連字號的鍵必須加引號。** 例如 `"ice-age": { … }`（不可寫成 `ice-age: { … }`，那是語法錯誤）。Step 81 已有實例。
12. **每個 Step 的驗證指令必須真的能執行。** 若指令本身寫錯（例如引號未閉合），先修指令再跑。

---

## 現況診斷（2026-11-16 實測，v8 撰寫依據）

### 已達標的部分（不需重做）

| 項目 | 實測結果 |
| --- | --- |
| 六種認知動詞引擎 | 齊全：`sequence / minimal-pair / rhythm / interference / puzzle / memory` |
| 關卡資料 | 40 關，`spec` 覆蓋 40/40，每關固定 3 回合 |
| 題庫 | 9 軸 108 題；最小對 zh-TW 14 組 / en-US 13 組 |
| 音效系統 | 44 個材質音效，Web Audio 合成，8 個呼叫點已接線 |
| 音訊引擎 | 四軌混音器、側鏈 ducking、區段循環、淡入淡出 — **引擎品質佳，問題在素材與接線** |
| 感官時間軸 | `content/timeline.json` 11 個事件，四軌（動畫／音效／語音／畫面）結構完整 |
| 角色素材 | 24 隻 × 4 幀 + 3 節慶 = 123 SVG，全透明去背、無缺失 |
| 圖示 | 49 個自繪 SVG icon，線稿風格一致 |
| 語系對稱 | 88 句台詞 zh-TW／en-US 完全對稱 |
| 離線資產體積 | 2.87 MB（目標 <6 MB） |
| 圖鑑解鎖 type 契約 | v7 Step 66 已修復（commit `d115df5`） |

### 支柱一：音樂 ❌ 最嚴重

**A1 — 背景音根本沒有接線**
`src/js/main.js` 只匯入了 `setMusicMap`，**`playMusic()` 在整個 `src/js/` 從未被呼叫**（實測：1 次，全部是函式定義本身）。
唯一的音樂入口是「音樂」按鈕，它**硬編碼**播放 `外部資源__jingle-bells.m4a`：

```620:628:src/js/main.js
    const musicBtn = $("music-control-btn");
    musicBtn?.addEventListener("click", () => {
        const bgm = /** @type {HTMLAudioElement} */ ($("bgm-player"));
        if (!bgm) return;
        if (bgm.paused) {
            bgm.src = "./assets/audio/外部資源__jingle-bells.m4a";
            bgm.volume = 0.25;
            bgm.play().catch(() => { });
        } else {
```

後果：背景音**不會自動播放**，玩家不點按鈕就完全沒有音樂；點了也只有聖誕曲，不分場景。

**A2 — 場景切換不換歌、不換景**
`startLevel()` 內**完全沒有**呼叫 `playMusic()` 或 `applyTheme()`。五個場景（`christmas` / `valley` / `forest` / `ice-age` / `north`）共用同一個背景。
`src/styles/base.css` 只對 `data-layer="sky"` 與 `data-layer="character"` 有視覺定義，`ridge` / `midground` / `foreground` 三層 CSS 規則為空。

**A3 — 五個章節主題只有 2 個音檔**
`content/music.json` 的 `chapters` 有 5 個場景，但只指向 2 個音檔：

| 場景 | 關卡數 | 音檔 |
| --- | --- | --- |
| `christmas` | 4 | `外部資源__jingle-bells.m4a` |
| `valley` | 8 | `外部資源__jingle-bells.m4a` |
| `forest` | 8 | `外部資源__silent-night.m4a` |
| `ice-age` | 16 | `外部資源__silent-night.m4a` |
| `north` | 4 | `外部資源__silent-night.m4a` |

「冰河紀」與「北方之夜」配聖誕歌，風格與場景完全不符。

**A4 — 4 份重複音檔，白佔 1.1 MB**
`assets/audio/` 內同時存在 `外部資源__Jingle Bells.m4a`（大寫 J/B）與 `外部資源__jingle-bells.m4a`（小寫），`Silent Night` 與 `silent-night` 同理。同一首歌存了兩份。

### 支柱二：劇本 ⚠️ 深度不足

**B1 — 24 隻恐龍共用 7 句對白**
`content/narrative.zh-TW.json` 的 `dinoLines` 有 24 個鍵，但內容是 7 句話循環（第 1、8、16 隻都是「我聽到你說話了！」）。24 隻恐龍沒有個性，違背「圖鑑收集」的心理回饋設計。

**B2 — 章節信件過短**
六章信件各僅 55–65 字（中文），相當於 2–3 句話。頂尖兒童遊戲的章節敘事通常是 150–300 字，有起承轉合。

**B3 — 章節結構不均**
第 3 章與第 4 章**共用同一個場景** `ice-age`（第 4 章叫「冰河紀的聖誕」但場景仍是 ice-age），而 `music.json` 的 `ice-age` 沒有獨立對應音樂。

**B4 — 情境台詞數量不足**
現況 88 句（5 個情境 × 15 句 + 分齡 10 句 + 圖鑑稱讚 3 句）。原規格為 120 句。

### 支柱三：畫面 ⚠️ 幾何佔位

**C1 — 24 隻恐龍只有 5 種體型**
24 隻角色 SVG 的 `<path>` 數分佈：**5 隻 11 條、8 隻 9 條、4 隻 6 條、6 隻 5 條、2 隻 8 條** —— 只有 5 種骨架，其餘靠換色碼區分。三角龍與暴龍是同一具身體改色。

**C2 — 角色無接地感**
每隻只有 13–14 個圖元，無漸層、無陰影、無材質變化。

**C3 — 視差三層空白**（同 A2）

### 支柱零：兒童語言層 ❌ 最影響體驗

**D1 — 圖鑑解鎖條件直接對孩子外露認知心理學術語**

`src/js/core/dex.js` 的 `unlockConditionText()` 是孩子**主動查看**的內容（圖鑑介面每隻未解鎖恐龍的副標題），但它輸出的是評量語言：

| 條件 type | 孩子實際看到 |
| --- | --- |
| `minimal-pair` | 再答對 3 次**最小對辨識** |
| `sequence` | 再答對 2 次**序列回憶** |
| `interference` | 再答對 4 次**干擾抑制** |
| `pitch` | 再答對 1 次**音高模仿** |
| `puzzle` | 再完成 2 個**拼圖** |
| `memory` | 再完成 5 個**記憶遊戲** |

「最小對辨識」「干擾抑制」「序列回憶」是語音學與認知心理學術語。5–8 歲孩子看不懂，這不構成目標，只構成挫敗。

**D2 — 寫法本身把「作業」和「誘因」混在一起**

即使把術語換掉，「再答對 3 次 X」仍是**作業指令**。圖鑑的設計目的是**收集欲**——應該說「這隻恐龍在等你帶牠回家」，而不是「你還要再做 3 次作業」。

**D3 — 分享卡雷達圖軸標籤同樣是術語，且「雷達圖」本身就是評量構件**

`src/js/ui/share-card.js` 的 `drawLearningCard()` 把七個軸直接寫成「語音覺辨」「序列回憶」「干擾抑制」「音高模仿」「圖像推理」「空間記憶」，並**畫在分享圖上**。

但問題不只在標籤——**雷達圖這種多軸統計圖本身就是給大人看的評量構件**。把它放在孩子會主動分享的圖上，等於在說「這是給大人檢查你的學習成果」。孩子版應該是**收集成果圖**（我的恐龍隊伍、拼好的恐龍、學會的小秘密），雷達圖應只存在於家長端。

**D3b — 評量構件混入孩子介面**

同樣的問題出現在：
- `src/js/ui/hud.js` 的 HUD 顯示 `Level ${n}`（介面語言不統一）
- 圖鑑介面顯示「正確率」這類指標（`dex.js` 的 `accuracy` 條件）
- 分享卡的家長版雷達圖若成為預設輸出，孩子分享出去的圖自己看不懂

**判準（守門用）**：孩子的操作路徑上不得出現任何**評量構件**——雷達圖、多軸統計圖、達成率指標、前測/後測對比、正確率百分比。這些一律只屬於家長端。

**D4 — HUD 顯示 `Level ${n}`**

`src/js/ui/hud.js` 的關卡顯示為英文 `Level 12`，對 5–8 歲中文使用者是介面語言不統一。

**E — 分層原則**

正確做法是**同一件事兩套語言**：

| 孩子看到 | 家長看到 |
| --- | --- |
| 再答對 3 次「小耳朵任務」，就能帶牠回家 | 最小對辨識正確率 78% |
| 幫小三角龍找回星星 | 干擾抑制正確次數 6/12 |
| 我學會了聽出聲音的小秘密 | 語音覺辨前後測 +18 百分點 |

**已確認不需要動的部分**（避免誤傷）：
- `src/js/core/mastery.js`、`state.js`、`verbs.js`、`data/levels.js` 裡的「掌握度／技能軸」**全是註解與內部識別字**，不會顯示給使用者。
- `src/js/ui/parent-report.js` 的「技能掌握度」「成效前後測」「前測正確率」「百分點變化」是**家長端**（需家長閘門），對象正確，**不得修改**。
- `src/js/ui/assessment-ui.js` 同屬家長／研究者端，**不得修改**。
- 玩法顯示名稱已是兒童向（「足跡石林」），**保留**。

### 素材策略：混合

| 支柱 | 手段 | 理由 |
| --- | --- | --- |
| 音樂（主題曲） | **程序化生成** | Web Audio 合成，零外部檔案、零授權風險、可為每場景獨立配樂 |
| 音樂（環境音） | **程序化生成** | 風／雪／森林噪聲層，同上 |
| 音效 | **維持現有合成**（已達標） | 44 個材質音效品質足夠 |
| 角色美術 | **程序化生成 + 參考實作擴充** | 保留現有透明去背與 4 幀步行骨架，增加體型變化、漸層、材質 |
| 場景視差 | **CSS 幾何 + 漸層** | 不需圖檔即可有層次與景深 |
| 劇本 | **人工撰寫** | 內容創作，程式無法代勞 |

---

## 目標規格（v8 完成後的樣貌）

| 支柱 | 交付標準 | 對標 | 對應 Step |
| --- | --- | --- | --- |
| **兒童語言** | **孩子介面上零評量術語**；玩法名為動作或角色（「找不同」「穿過風雪」）；圖鑑文案是收集誘因而非作業指令；分享卡孩子自己也看得懂；家長端保留正式技能名與數據 | Sago Mini 的全齡童悅 | Step 96–102 |
| 音樂 | **每個場景有獨立主題曲**，程序化生成、風格切合情境（北極空靈／恐龍谷俏皮／森林探險／冰原漂浮／北方寧靜）；場景切換時交叉淡入淡出；環境音獨立層 | Duolingo ABC 的場景配樂 | Step 83–88 |
| 劇本 | **24 隻恐龍各有 3 句以上專屬對白**（依物種個性：三角龍保護、暴龍衝勁、腕龍溫柔…）；六章信件各 150–300 字有起承轉合；情境台詞達 120 句 | Endless Alphabet 的角色性格 | Step 89–92 |
| 畫面 | **24 隻至少 12 種體型**；角色有漸層與接地陰影；**五層視差全部有視覺定義**且層間位移肉眼可辨；每章場景色系有明確差異 | Sago Mini 的場景層次 | Step 93–95 |

### 分層原則（最重要的一條）

**孩子看到「收集恐龍的誘因」，家長看到「技能的數據」。** 同一件事兩套語言：

| 孩子看到 | 家長看到 |
| --- | --- |
| 再答對 3 次「小耳朵任務」，就能帶牠回家 | 最小對辨識正確率 78% |
| 幫小三角龍找回星星 | 干擾抑制正確次數 6/12 |
| 我學會了聽出聲音的小秘密 | 語音覺辨前後測 +18 百分點 |

**家長端（`ui/parent-report.js`、`ui/assessment-ui.js`）不得修改** —— 那裡的術語是正確的。

---

## Phase P — 守門與準備

### Step 81 — 建立三支柱品質守門工具
- **依賴**：Step 66（v7，已完成：圖鑑解鎖 type 契約修復）
- **檔案**：`tools/verify-quality.mjs`（新增）
- **目標**：建立可重複執行的守門，抓出三支柱的結構性缺陷。**這是 Phase P/Q/R 的驗證基礎，必須先做。**
- **預期變更**：建立工具，用法如下：
  ```js
  /**
   * 三支柱品質守門（純讀檔／純 import，無副作用）。
   *
   * 用法：
   *   node tools/verify-quality.mjs            # 全部檢查
   *   node tools/verify-quality.mjs --list     # 列出檢查 id
   *
   * 檢查項：
   *   music-autoplay      main.js 必須呼叫 playMusic()，且不可硬編碼音檔路徑
   *   music-per-scene     每個章節場景必須有獨立音樂 id，且不得共用同一音檔
   *   music-scenes-match  music.json 的章節場景集合必須涵蓋 levels.json 用到的全部 scene
   *   audio-dupes         assets/audio/ 不得有大小寫不同的同名重複檔
   *   story-dino-lines    每隻恐龍的對白數必須 ≥3，且不得有 3 隻以上共用同一句
   *   story-letter-length 每章信件中文長度必須 ≥150 字
   *   story-lines-count   情境台詞總數必須 ≥120 句，且雙語對稱
   *   visual-body-types   24 隻角色的 path 數種類必須 ≥12
   *   visual-parallax     base.css 必須定義 sky/ridge/midground/foreground/character 五層
   *   visual-scene-diff   每個場景必須有獨立的場景色票
   */
  ```
- **必須實作的 10 條檢查**（每條要有獨立函式，函式名對應 id，且有明確 PASS／FAIL 輸出與總結「通過 N/M，失敗 K」；有 FAIL 時 exit code = 1）：
  1. `music-autoplay`：斷言 `src/js/main.js` 中**有** `playMusic(` 的實際呼叫（不是只有匯入），且**不含** `外部資源__` 這類硬編碼音檔路徑。
  2. `music-per-scene`：讀 `content/music.json` 的 `chapters`，斷言每個場景的 `file` 或 `scene` 欄位互不相同（不得 5 個場景指同一音檔）。
  3. `music-scenes-match`：讀 `content/levels.json` 取得所有 `scene` 值，斷言 `music.json` 的 `chapters` 鍵**涵蓋全部**這些 scene。
  4. `audio-dupes`：列出 `assets/audio/` 全部檔名，斷言沒有兩個檔案**正規化後**同名。正規化規則：檔名轉小寫後**移除所有非英數字元**（空格、連字號、底線都移除）。例如 `外部資源__Jingle Bells.m4a` 與 `外部資源__jingle-bells.m4a` 正規化後同為 `外部資源jinglebells.m4a`，必須判定為重複。
     **注意**：單純轉小寫不足以抓到這組重複，因為「Jingle Bells」（空格）與「jingle-bells」（連字號）的小寫形式不同。
  5. `story-dino-lines`：讀 `content/narrative.zh-TW.json` 的 `dinoLines`，斷言每隻恐龍的**陣列長度 ≥ 3**（若現為字串則視為 1，會 FAIL）；並斷言沒有任何一句被 3 隻以上共用。
  6. `story-letter-length`：讀 `content/story-arcs.json`，斷言每章 `letter["zh-TW"]` 長度 **≥150**。
  7. `story-lines-count`：斷言情境台詞總數 **≥120** 且 zh-TW／en-US 句數完全相同。
  8. `visual-body-types`：讀 `assets/characters/dino-*.svg`（排除 `-walk-` 檔），統計各自的 `<path` 數，斷言**不同數值的種類 ≥12**。
  9. `visual-parallax`：讀 `src/styles/base.css`，斷言五個 `data-layer="..."`（sky／ridge／midground／foreground／character）**全部有 CSS 規則**。
  10. `visual-scene-diff`：斷言 `content/scenes.json`（本 Phase 新增）至少定義 5 個場景，且每個場景的 `sky` 色值**互不相同**。
- **規範**：
  - 純讀檔／純 import，不啟動伺服器、不寫檔案。
  - 不得刪除或弱化任何既有檢查來讓它通過。
  - 輸出格式範例：
    ```
    [PASS] music-autoplay       背景音已接線且無硬編碼音檔
    [FAIL] audio-dupes          2 組重複音檔：外部資源__jingle-bells.m4a × 2
    ---
    通過 3/10，失敗 7
    ```
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --list
  node tools/verify-quality.mjs; echo "exit=$?"
  ```
  預期：`--list` 列出 10 條 id；完整模式 **exit=1**（證明守門抓得到既有缺陷，此時至少 `music-autoplay`、`audio-dupes`、`story-dino-lines`、`story-letter-length`、`story-lines-count`、`visual-body-types`、`visual-parallax`、`visual-scene-diff` 為 FAIL）。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs
  git commit -m "test: 新增三支柱品質守門工具"
  git push origin main
  ```

### Step 82 — 建立場景設定資料檔
- **依賴**：Step 81
- **檔案**：`content/scenes.json`（新增）、`tools/verify-quality.mjs`（修改）
- **目標**：把「每個場景的視覺與音樂設定」集中到一份資料檔，讓視差層與主題曲都有單一來源。
- **預期變更**：`content/scenes.json` 結構如下，**必須涵蓋 `levels.json` 用到的全部 5 個 scene**：
  ```json
  {
    "christmas": {
      "id": "christmas",
      "title": { "zh-TW": "北極的聖誕", "en-US": "Arctic Christmas" },
      "music": { "scene": "christmas", "gainDb": -15, "tempo": 62 },
      "ambience": { "kind": "wind", "gainDb": -24 },
      "palette": {
        "sky": "#16294f",
        "glow": "#f1c40f",
        "fog": "#cfe4f2",
        "ridge": "#203a43",
        "midground": "#16294f",
        "foreground": "#0a1a3c"
      },
      "weather": "snow"
    },
    "valley": { "…": "同結構，sky 不得與 christmas 相同" },
    "forest": { "…": "同結構" },
    "ice-age": { "…": "同結構" },
    "north": { "…": "同結構" }
  }
  ```
  - 五個場景的 `palette.sky` **必須互不相同**。
  - `music.scene` 必須對應 `src/js/audio/scene-music.js` 中 `SCENE_MUSIC` 的鍵（Step 83 建立）。
  - `palette` 的每個色值必須是合法的 6 位 hex。
- **規範**：
  - 色票要能對應劇情：北極聖誕＝深藍＋金、恐龍谷＝暖綠、森林＝青綠、冰原＝冷灰藍、北方之夜＝靛紫。
  - 不得使用 emoji 表情作為場景符號。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase scenes; echo "exit=$?"
  node -e "
  const s=require('./content/scenes.json');
  const skys=Object.values(s).map(v=>v.palette.sky);
  if(new Set(skys).size!==skys.length){ console.error('場景 sky 色重複'); process.exit(1); }
  console.log('[PASS] 5 個場景 sky 色互不相同');
  "
  npm run check:content
  ```
- **提交**：
  ```bash
  git add content/scenes.json tools/verify-quality.mjs
  git commit -m "feat: 新增場景設定資料檔"
  git push origin main
  ```

---

## Phase Q — 音樂支柱（最高優先）

> 本 Phase 解決診斷 A1–A4。**這是三支柱中落差最大、最容易被玩家感知的部分。**

### Step 83 — 建立程序化場景音樂生成器
- **依賴**：Step 82
- **檔案**：`src/js/audio/scene-music.js`（新增）
- **參考實作**：`docs/refs/scene-music.reference.js`（**已存在，語法已修好，可直接作為起點**）
- **目標**：能為每個場景生成**風格獨立**的無限循環主題曲。
- **預期變更**：以 `docs/refs/scene-music.reference.js` 為基礎，實作／確認以下內容：
  1. `SCENE_MUSIC` 匯出至少 9 個場景定義，鍵為：`christmas`、`valley`、`forest`、`ice-age`、`ice-age-christmas`、`north`、`celebrate`、`daily`、`night`。
  2. 每個定義含：`root`（MIDI 根音）、`scale`（音階）、`tempo`、`chords`（和弦進行）、`pad`／`arp`／`bell`（音色）、`drums`（節奏型）、`ambience`（環境層）、`brightness`（亮度 0–1）、`bellPattern`。
  3. 音樂理論要求：
     - `valley` 用大調、tempo ≈ 96、`drums: "march"` —— 明亮俏皮。
     - `forest` 用 dorian、tempo ≈ 84 —— 有探險感。
     - `ice-age` 用 lydian、tempo ≈ 58、`drums: "none"` —— 空曠漂浮。
     - `north` 用五聲音階、tempo ≈ 52 —— 寧靜收束。
     - `christmas` 大調、tempo ≈ 62 —— 空靈。
  4. `renderSceneMusic(ctx, sceneId, seconds)` 回傳 `AudioBuffer`，實作：
     - 和弦鋪底（pad）＋琶音（arp）＋鐘鈴點綴（bell）＋節奏層（drums）＋環境噪聲層（ambience）。
     - 立體聲展寬（右聲道加延遲副本）。
     - 一階低通柔化（依 `brightness` 決定截止頻率）。
     - 峰值正規化至 0.72。
     - 首尾各 50ms 淡入淡出（避免循環點爆音）。
  5. `renderSceneMusic` 必須**冪等且可快取**：同一 `sceneId` 只渲染一次。
- **規範**：
  - **所有物件鍵若含連字號必須加引號**：`"ice-age": { … }`。參考實作原本漏了這點導致語法錯誤，已修正，**改動時不得移除引號**。
  - 不得引入 npm 套件；不得使用 `OfflineAudioContext` 之外無法在瀏覽器執行的 Node 專用 API。
  - 不得使用 `Math.random()` 決定音高或節奏（**只有環境噪聲層可用亂數**，讓每次渲染略有差異）。
  - 渲染必須是**純函式**（不依賴外部狀態）。
- **驗證**：
  ```bash
  node --check src/js/audio/scene-music.js && echo "[PASS] 語法正確"
  node -e "
  const s=require('fs').readFileSync('src/js/audio/scene-music.js','utf8');
  for(const k of ['christmas','valley','forest','ice-age','north','celebrate','daily','night']){
    if(!s.includes('\"'+k+'\"') && !s.includes(k+':')) { console.error('缺少場景:', k); process.exit(1); }
  }
  if(!s.includes('renderSceneMusic')) { console.error('缺少 renderSceneMusic'); process.exit(1); }
  console.log('[PASS] 場景音樂生成器齊備');
  "
  npm run typecheck && npm run lint
  ```
- **提交**：
  ```bash
  git add src/js/audio/scene-music.js
  git commit -m "feat: 新增程序化場景音樂生成器"
  git push origin main
  ```

### Step 84 — 音樂引擎支援程序化音樂播放
- **依賴**：Step 83
- **檔案**：`src/js/audio/music.js`（修改）
- **目標**：讓 `music.js` 能播放程序化生成的 `AudioBuffer`，並與既有 HTMLAudioElement 軌道共存。
- **預期變更**：
  1. 匯入 `renderSceneMusic` 與 `SCENE_MUSIC`。
  2. 新增模組層級的 `sceneBuffers`（`Map<string, AudioBuffer>`）快取，與 `sceneSource`（`AudioBufferSourceNode`）、`sceneGain`（`GainNode`）狀態變數。
  3. 新增匯出函式 `playSceneMusic(sceneId, opts?)`：
     - 若 `SCENE_MUSIC[sceneId]` 不存在則直接 return（**不拋錯**）。
     - 取得 `context()`；若無脈絡則 return。
     - 以 `renderSceneMusic(ctx, sceneId)` 取得緩衝區（走快取）。
     - 建立 `AudioBufferSourceNode`，設 `loop = true`，接 `GainNode`（gain 由 `opts.gainDb ?? -15` 換算），再接到 `bus("music")`。
     - 啟動播放。
  4. 新增匯出函式 `stopSceneMusic(fadeMs = 800)`：以 `linearRampToValueAtTime` 淡出後 `disconnect()`。
  5. 新增匯出函式 `hasSceneMusic(sceneId)`：回傳 `SCENE_MUSIC` 是否含此場景。
  6. `playMusic(id)` 保留原行為（走 `music.json` 的檔案軌道），但**當傳入的 id 對應到 `SCENE_MUSIC` 的場景鍵時，改走程序化軌道**（讓呼叫端不必分辨兩套機制）。
  7. `stopMusic(fadeMs)` 必須**同時**停止 HTMLAudioElement 軌道與程序化軌道。
- **規範**：
  - 不得破壞既有的 `playMusic` / `stopMusic` / `playAmbience` / `stopAmbience` / `musicForTheme` / `trackForTheme` 對外介面。
  - 程序化音樂與檔案音樂**不得同時播放**（避免疊音）。
  - 節點必須在停止時 `disconnect()`，避免記憶體洩漏。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  node -e "
  const s=require('fs').readFileSync('src/js/audio/music.js','utf8');
  for(const f of ['playSceneMusic','stopSceneMusic','hasSceneMusic']){
    if(!s.includes('export function '+f)) { console.error('缺少匯出:', f); process.exit(1); }
  }
  console.log('[PASS] 音樂引擎已支援程序化播放');
  "
  npm run check
  ```
- **提交**：
  ```bash
  git add src/js/audio/music.js
  git commit -m "feat: 音樂引擎支援程序化場景音樂"
  git push origin main
  ```

### Step 85 — 接通背景音自動播放與場景換曲
- **依賴**：Step 84
- **檔案**：`src/js/main.js`（修改）
- **目標**：背景音**自動播放**並**隨場景切換**。這是診斷 A1／A2 的直接修復。
- **預期變更**：
  1. 匯入更新：`import { setMusicMap, playMusic, stopMusic, playSceneMusic, musicForTheme } from "./audio/music.js";`
  2. **移除**「音樂」按鈕中硬編碼的 `bgm.src = "./assets/audio/外部資源__jingle-bells.m4a";`（診斷 A1 的直接來源）。
  3. 新增模組層級變數 `let currentSceneId = "";`。
  4. 新增函式 `applySceneAudio(scene)`：
     - 若 `scene === currentSceneId` 則直接 return（避免重複切換）。
     - 設定 `currentSceneId = scene`。
     - 呼叫 `playSceneMusic(scene)` 播放該場景主題曲。
  5. 在 `startLevel(levelId)` 內，於 `setState({...})` 之後呼叫 `applySceneAudio(level.scene)`。
  6. 在 `startGame()` 內（序章開始時）呼叫 `applySceneAudio("christmas")`。
  7. 音樂按鈕改為**控制程序化音樂**：
     - 若正在播放 → `stopSceneMusic()` 並更新按鈕 `aria-pressed="false"`。
     - 若未播放 → `playSceneMusic(currentSceneId || "daily")` 並更新 `aria-pressed="true"`。
     - **不得**再直接設定 `bgm.src`。
  8. 首次播放必須在使用者互動之後（瀏覽器自動播放政策）：`ensureAudio(locale)` 已在 `startGame()` 中呼叫，因此 `applySceneAudio` 必須放在 `ensureAudio` **之後**。
- **規範**：
  - **不得**再出現任何硬編碼音檔路徑字串（`外部資源__` 或 `.m4a`）。
  - 不得改動 `ensureAudio` 與 mixer 的既有行為。
  - 若 `playSceneMusic` 因無 AudioContext 而靜默失敗，**不得拋錯**、不得中斷遊戲流程。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  node tools/verify-quality.mjs --phase music; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/main.js','utf8');
  if(s.includes('外部資源__')) { console.error('main.js 仍有硬編碼音檔路徑'); process.exit(1); }
  if(!/playSceneMusic\(/.test(s)) { console.error('main.js 未呼叫 playSceneMusic'); process.exit(1); }
  console.log('[PASS] 背景音已接線且無硬編碼音檔');
  "
  ```
  註：`music-autoplay` 檢查在此步後應轉為 PASS。
- **提交**：
  ```bash
  git add src/js/main.js
  git commit -m "feat: 接通背景音自動播放與場景換曲"
  git push origin main
  ```

### Step 86 — 場景視差五層視覺定義
- **依賴**：Step 85
- **檔案**：`src/styles/base.css`（修改）、`src/js/ui/parallax.js`（修改）
- **目標**：填滿診斷 A2／C3 的三層空白，五層視差肉眼可辨。
- **預期變更**：
  1. 在 `src/styles/base.css` 補上 `data-layer="ridge"`、`"midground"`、`"foreground"` 三層的 CSS 規則：
     - `ridge`：遠山稜線，用 `linear-gradient` 做出山脊剪影 + `clip-path` 做出稜線形狀。
     - `midground`：中景（森林／冰原／雪地），用漸層 + 斑點紋理。
     - `foreground`：近景（雪堆／樹幹），顏色最深、遮住畫面底部。
  2. 每層必須設定不同的**位移基準**，讓 `setParallax()` 產生的層間差異肉眼可辨。建議比例（`--depth`）：sky 0.15、ridge 0.35、midground 0.55、character 0.8、foreground 1.0。
  3. 色值必須取自 `content/scenes.json` 對應場景的 palette，透過 CSS 自訂屬性 `--scene-ridge` / `--scene-midground` / `--scene-foreground` 注入（由 `applyTheme()` 設定）。
  4. 在 `src/js/ui/parallax.js` 的 `applyTheme()` 內，補上設定 `--scene-ridge` / `--scene-midground` / `--scene-foreground` 的程式碼。
  5. 尊重 `prefers-reduced-motion`：reduced-motion 下**層面仍可見**，只是不做位移。
- **規範**：
  - 不得硬編碼色碼（必須走 token 或 `--scene-*` 變數）。
  - 不得使用圖片檔（保持離線體積）。
  - 不得移除既有的 `sky` 與 `character` 規則。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase visual; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/styles/base.css','utf8');
  for(const l of ['sky','ridge','midground','foreground','character']){
    if(!s.includes('data-layer=\"'+l+'\"')) { console.error('缺少視差層:', l); process.exit(1); }
  }
  console.log('[PASS] 五層視差 CSS 齊備');
  "
  npm run typecheck && npm run lint
  ```
- **提交**：
  ```bash
  git add src/styles/base.css src/js/ui/parallax.js
  git commit -m "feat: 補齊視差場景三層視覺定義與場景色票注入"
  git push origin main
  ```

### Step 87 — 清理重複音檔
- **依賴**：Step 86
- **檔案**：`assets/audio/`（刪除重複檔）、`content/music.json`（修改）
- **目標**：消除診斷 A4 的 4 份重複音檔（白佔 1.1 MB）。
- **預期變更**：
  1. 先用 `md5` 比對每一組候選檔案的**內容**（不是檔名）：
     ```bash
     md5 -q "assets/audio/外部資源__Jingle Bells.m4a" "assets/audio/外部資源__jingle-bells.m4a"
     md5 -q "assets/audio/外部資源__Silent Night - Instrumental.m4a" "assets/audio/外部資源__silent-night.m4a"
     ```
  2. **實測基準（2026-11-16）**：Jingle Bells 組兩個 hash **不同**（`8e28ef66…` vs `43baa822…`）；Silent Night 組也**不同**（`4298376e…` vs `b102114e…`）。代表這是**同一首歌的不同轉碼／版本**，不是完全相同的副本。
  3. 因此處置方式為：
     - 統一檔名為小寫連字號格式（`jingle-bells.m4a`、`silent-night.m4a`），**只保留 `content/music.json` 目前引用的小寫版**。
     - 刪除大寫／空格版本：`外部資源__Jingle Bells.m4a`、`外部資源__Silent Night - Instrumental.m4a`。
     - **刪除前仍須再跑一次 md5 確認**，若 hash 相同則可直接刪（內容無損）；若不同（本次實測情況），代表大寫版是**另一個版本**，刪除後需在 `docs/notes/step-87.md` 記錄此事，讓素材方日後可重新提供。
  4. `content/music.json` 中所有 `file` 路徑必須指向**實際存在**的檔案（改用統一後的小寫檔名）。
- **規範**：
  - **刪除前必須先比對內容並記錄 hash**，不得看到檔名相似就直接刪。
  - 刪除後 `assets/audio/` 不得有任何兩個檔案正規化後同名。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase music; echo "exit=$?"
  node -e "
  const fs=require('fs');
  const files=fs.readdirSync('assets/audio');
  const norm=f=>f.toLowerCase().replace(/[^a-z0-9]/g,'');
  const seen={};
  for(const f of files){
    const k=norm(f);
    if(seen[k]){ console.error('重複音檔:', f, '≡', seen[k]); process.exit(1); }
    seen[k]=f;
  }
  console.log('[PASS] 無正規化後重複音檔，共', files.length, '個');
  "
  npm run check:assets
  ```
  註：正規化必須移除空格與連字號，否則抓不到「Jingle Bells」vs「jingle-bells」這組重複。
- **提交**：
  ```bash
  git add -A assets/audio content/music.json
  git commit -m "chore: 清理重複音檔"
  git push origin main
  ```

### Step 88 — 音樂支柱回歸驗證
- **依賴**：Step 87
- **檔案**：`tools/verify-quality.mjs`（修改）
- **目標**：把守門升級為**完整驗證音樂支柱已達標**。
- **預期變更**：
  1. 強化 `music-autoplay`：除了靜態檢查 `main.js`，再用 `import()` 載入 `src/js/audio/scene-music.js`，斷言 `SCENE_MUSIC` 至少含 9 個鍵，且每個鍵的音高（`root`）與速度（`tempo`）**至少與另一個場景不同**（避免所有場景音樂雷同）。
  2. 新增 `music-scene-distinct`：斷言 5 個章節場景的 `(root, tempo)` 組合**互不相同**。
  3. 新增 `music-scenes-defined`：斷言 `content/scenes.json` 的每個場景都在 `SCENE_MUSIC` 中有對應的音樂場景鍵。
  4. 保留 Step 81 的 10 條檢查不變。
- **規範**：
  - 不得把斷言門檻放寬（例如不得寫成「至少 2 個場景不同」）。
  - 測試必須是純邏輯合成資料，不得依賴真實播放。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase music; echo "exit=$?"
  ```
  預期：音樂相關檢查**全部 PASS**（`music-autoplay`、`music-per-scene`、`music-scenes-match`、`music-scenes-defined`、`music-scene-distinct`、`audio-dupes`）。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs
  git commit -m "test: 音樂支柱回歸驗證"
  git push origin main
  ```

---

## Phase R — 劇本支柱

### Step 89 — 24 隻恐龍專屬對白
- **依賴**：Step 88
- **檔案**：`content/narrative.zh-TW.json`（修改）、`content/narrative.en-US.json`（修改）
- **目標**：解決診斷 B1 —— 24 隻恐龍各有 **3 句以上專屬對白**，依物種個性區分。
- **預期變更**：
  1. 將 `dinoLines` 每隻的值從**單一字串**改為**陣列**（至少 3 句）。
  2. 語氣必須依物種個性區分。個性感參考：
     - 三角龍／甲龍／劍龍：**守護型**（保護、擋風、照顧）
     - 暴龍／異特龍／迅猛龍／伶盜龍：**衝勁型**（挑戰、催促、比賽）
     - 腕龍／梁龍／雷龍：**溫柔型**（耐心、讚美、安慰）
     - 翼龍／無翼龍：**天空型**（俯瞰、飛行、高處）
     - 滄龍／棘龍：**水域型**（深海、潛水）
     - 三角龍以外的草食恐龍：好奇、活潑
  3. **不得有 3 隻以上共用同一句**。
  4. 保留 `{name}` 佔位符語法（每隻至少一句含 `{name}`）。
  5. `src/js/data/story.js` 的 `dinoLine()` 目前取 `entry[locale]`（單一字串）—— **必須一併改為支援陣列**：若 `entry[locale]` 為陣列，依 `seed` 取一項；若為字串則沿用舊行為（**不得破壞既有呼叫點**）。
- **規範**：
  - **zh-TW 與 en-US 的句數必須完全一致**，且一一對應。
  - 不得使用 emoji。
  - 對白要適合 5–8 歲兒童理解，句子短（中文 ≤ 18 字）。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase story; echo "exit=$?"
  node -e "
  const z=require('./content/narrative.zh-TW.json'), e=require('./content/narrative.en-US.json');
  const dz=z.dinoLines, de=e.dinoLines;
  const ids=Object.keys(dz);
  if(ids.length!==24){ console.error('dinoLines 應為 24 隻，實際', ids.length); process.exit(1); }
  for(const id of ids){
    const a=dz[id], b=de[id];
    if(!Array.isArray(a)){ console.error(id,'zh 非陣列'); process.exit(1); }
    if(a.length<3){ console.error(id,'僅',a.length,'句'); process.exit(1); }
    if(!Array.isArray(b)||b.length!==a.length){ console.error(id,'雙語句數不對稱'); process.exit(1); }
  }
  const all=[]; for(const id of ids) all.push(...dz[id]);
  const dup={}; for(const s of all) dup[s]=(dup[s]||0)+1;
  const bad=Object.entries(dup).filter(([,n])=>n>=3);
  if(bad.length){ console.error('有', bad.length, '句被 3 隻以上共用'); process.exit(1); }
  console.log('[PASS] 24 隻各有', dz[ids[0]].length, '句以上專屬對白，無 3 隻共用');
  "
  npm run typecheck && npm run lint && npm run check:content
  ```
- **提交**：
  ```bash
  git add content/narrative.zh-TW.json content/narrative.en-US.json src/js/data/story.js
  git commit -m "feat: 二十四隻恐龍各有專屬對白"
  git push origin main
  ```

### Step 90 — 擴寫六章章節信件
- **依賴**：Step 89
- **檔案**：`content/story-arcs.json`（修改）
- **目標**：解決診斷 B2 —— 六章信件各 **≥150 字**（中文），有起承轉合。
- **預期變更**：
  1. 每章 `letter["zh-TW"]` 擴寫至 **150–300 字**，`letter["en-US"]` 同步擴寫（語意對應，字數不必相同）。
  2. 每章信件需具備四段結構：
     - **承接**：回應上一章發生的事。
     - **轉折**：帶出新場景的危機或疑問。
     - **任務**：說明孩子為什麼要練這個能力（**用孩子聽得懂的比喻**，不要說「認知動詞」）。
     - **寄望**：以聖誕老人或恐龍的口吻鼓勵。
  3. 保留既有章節的 `mood`（wonder／play／brave／kind／home／together）與 `title`，不可改動。
  4. 信件中提到的玩法要對應該章實際的 `verbs`（第 1 章＝最小對辨識，第 3 章＝節奏與干擾抑制…），但**用語要轉譯**成兒童語言。
- **規範**：
  - 不得改動 `chapter` / `title` / `mood` / `scene` / `verbs` / `unlockDex` 欄位。
  - 不得使用 emoji。
  - 信件長度以**中文字元數**計（含標點）。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase story; echo "exit=$?"
  node -e "
  const sa=require('./content/story-arcs.json');
  for(const c of sa.chapters){
    const n=(c.letter?.['zh-TW']||'').length;
    console.log('  第'+c.chapter+'章:', n, '字');
    if(n<150){ console.error('第'+c.chapter+'章 信件不足 150 字'); process.exit(1); }
  }
  console.log('[PASS] 六章信件皆達 150 字');
  "
  npm run check:content
  ```
- **提交**：
  ```bash
  git add content/story-arcs.json
  git commit -m "feat: 擴寫六章章節信件"
  git push origin main
  ```

### Step 91 — 補足情境台詞至 120 句
- **依賴**：Step 90
- **檔案**：`content/narrative.zh-TW.json`（修改）、`content/narrative.en-US.json`（修改）
- **目標**：解決診斷 B4 —— 情境台詞達 **120 句**。
- **預期變更**：
  1. 5 個情境（`invite` / `encourage` / `hint` / `celebrate` / `comfort`）各由 15 句補足至 **21 句**，合計 105 句。
  2. 加 `ageVariants.young` 5 句、`ageVariants.older` 5 句 → 115 句。
  3. 加 `dexPraise` 5 句 → **120 句**。
  4. 每句需符合情境語氣，不得混用（`hint` 是提示、`comfort` 是安慰、`celebrate` 是慶祝）。
  5. 雙語句數完全一致，英文須為**語意對應的獨立翻譯**，不可複製同一句。
- **規範**：
  - `dexPraise` 須保留 `{name}` 佔位符。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  node -e "
  const z=require('./content/narrative.zh-TW.json'), e=require('./content/narrative.en-US.json');
  const count=o=>Object.values(o.contexts).reduce((a,v)=>a+v.length,0)+o.ageVariants.young.length+o.ageVariants.older.length+o.dexPraise.length;
  const cz=count(z), ce=count(e);
  console.log('zh-TW', cz, '/ en-US', ce);
  if(cz!==120||ce!==120){ console.error('台詞未達 120 句'); process.exit(1); }
  for(const k of Object.keys(z.contexts)){
    if(z.contexts[k].length!==e.contexts[k].length){ console.error(k+' 句數不對稱'); process.exit(1); }
    if(z.contexts[k].length!==21){ console.error(k+' 應為 21 句，實際', z.contexts[k].length); process.exit(1); }
  }
  console.log('[PASS] 雙語台詞各 120 句且對稱');
  "
  npm run check:content
  ```
- **提交**：
  ```bash
  git add content/narrative.zh-TW.json content/narrative.en-US.json
  git commit -m "feat: 補足雙語情境台詞至 120 句"
  git push origin main
  ```

### Step 92 — 劇本支柱回歸驗證
- **依賴**：Step 91
- **檔案**：`tools/verify-quality.mjs`（修改）
- **目標**：完整驗證劇本支柱已達標。
- **預期變更**：
  1. 強化 `story-dino-lines`：追加斷言 **24 隻的對白總數 ≥72 句**。
  2. 新增 `story-dino-personality`：斷言不同「個性類型」的恐龍其對白**不得相同**（以句子集合比對）。
  3. 新增 `story-letter-arc`：斷言每章信件**長度各不相同**（避免六章長度雷同，代表內容不是複製貼上）。
  4. 新增 `story-scene-unique`：斷言第 3 章與第 4 章**不得共用同一個 `scene`**（診斷 B3）—— 若兩章確實共用 `ice-age`，則必須為第 4 章新增獨立場景 `ice-age-christmas`（並在 `content/scenes.json` 補上對應設定）。
  5. 保留 Step 81 的 10 條檢查不變。
- **規範**：
  - 不得放寬門檻。
  - 若 Step 92.4 需要新增場景 `ice-age-christmas`，必須**同時**更新 `content/scenes.json` 與 `content/music.json`，並讓 `SCENE_MUSIC` 有對應的音樂定義。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase story; echo "exit=$?"
  ```
  預期：劇本相關檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs
  git commit -m "test: 劇本支柱回歸驗證"
  git push origin main
  ```

---

## Phase S — 畫面支柱

### Step 93 — 角色體型多樣化（至少 12 種）
- **依賴**：Step 92
- **檔案**：`assets/characters/dino-*.svg`（修改，24 隻）
- **目標**：解決診斷 C1 —— 24 隻角色至少有 **12 種不同體型**。
- **預期變更**：
  1. 依物種分類設計 **12–14 種體型**，每種對應一組或多隻恐龍。建議分組：
     - 四足大型（暴龍、異特龍、伶盜龍、擬暴龍…）
     - 四足中型（三角龍、劍龍、 甲龍、恐龍谷…）
     - 長頸（腕龍、梁龍、雷龍、泰坦巨龙）
     - 雙足小型（迅猛龍、伶盜龍、鵝足龍、始祖鳥）
     - 有背帆（棘龍、鱷魚…）
     - 有頭冠（冠龍、盔龍、鴨嘴龍…）
     - 厚甲（甲龍、胃龍）
     - 翼龍類（翼龍、無翼龍…）
     - 海生（滄龍、蛇頸龍）
  2. 每隻角色的 `<path>` 數必須符合其體型（大型多、細長多），**不得所有角色共用同一組 path 數**。
  3. **必須保留**每隻現有的**配色**（依 `content/characters.json` 的 `palette`）與 `walk-1..4` 四幀的對應關係。
  4. 每隻角色的 SVG 必須：
     - 透明去背（**不得**有背景 `<rect>`）。
     - `viewBox="0 0 512 512"`、`width/height="512"`、`role="img"`、`aria-label`（與角色 id 一致）。
     - 有**接地陰影**（橢圓，低透明度）。
     - 有**漸層或材質變化**（至少一處 `linearGradient` 或多層色階），不得全是單色 path。
- **規範**：
  - 改動 SVG 時**不得**改動 `assets/characters/manifest.json` 的結構（`file` / `walkFrames` / `hasAlpha`）。
  - `walk-1..4` 必須反映行走時的腿部擺動差異（不可四幀完全相同）。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase visual; echo "exit=$?"
  node -e "
  const fs=require('fs');
  const files=fs.readdirSync('assets/characters').filter(f=>/^dino-.*\.svg$/.test(f)&&!/walk/.test(f));
  const counts=files.map(f=>({f,n:(fs.readFileSync('assets/characters/'+f,'utf8').match(/<path/g)||[]).length}));
  const kinds=new Set(counts.map(c=>c.n));
  console.log('角色數', files.length, '| path 數種類', kinds.size, '→', [...kinds].sort((a,b)=>a-b).join(','));
  if(kinds.size<12){ console.error('體型種類不足 12'); process.exit(1); }
  // 背景 rect 檢查
  for(const c of counts){
    const s=fs.readFileSync('assets/characters/'+c.f,'utf8');
    if(/<rect[^>]*fill=[\"#']?(?!none)/.test(s)){ console.error(c.f,'有背景 rect'); process.exit(1); }
  }
  console.log('[PASS] 體型種類達', kinds.size);
  "
  npm run check:assets
  ```
- **提交**：
  ```bash
  git add assets/characters
  git commit -m "feat: 角色體型多樣化至十二種以上"
  git push origin main
  ```

### Step 94 — 角色接地感與表情細節
- **依賴**：Step 93
- **檔案**：`src/js/ui/character-render.js`（修改）、`src/styles/components.css`（修改）
- **目標**：讓角色在畫面上有「站在雪地裡」的實感。
- **預期變更**：
  1. `src/styles/components.css` 強化 `.char__shadow`：改為橢圓漸層（中心深、邊緣透），並依角色身高微調縮放。
  2. 依 `content/timeline.json` 的事件，加入**情緒回饋**：
     - `dex:unlock` → 角色做一個短促的跳躍＋星星散落。
     - `dino:roar` → 角色放大再回彈（squash & stretch）。
     - `level:complete` → 角色上下彈跳。
  3. 所有動效必須使用 `src/styles/tokens.css` 的**動畫 token**（`--t-*` / `--e-*`），不得硬編碼毫秒數。
  4. 必須支援 `prefers-reduced-motion`（reduced-motion 時跳過彈跳，只做靜態狀態變化）。
- **規範**：
  - 不得在動畫中使用 `setInterval`（只用具體的 class 切換）。
  - 不得破壞 `renderCharacter` / `lookAt` / `blink` / `playRoar` / `playWalk` / `stopWalk` / `playHatch` 的既有介面。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  node -e "
  const s=require('fs').readFileSync('src/styles/components.css','utf8');
  if(!s.includes('.char__shadow')){ console.error('缺少接地陰影'); process.exit(1); }
  const m=require('fs').readFileSync('src/js/ui/character-render.js','utf8');
  if(!/reduced-motion|prefers-reduced-motion/.test(s+m)){ console.error('未處理 reduced-motion'); process.exit(1); }
  console.log('[PASS] 角色接地感與 reduced-motion 已處理');
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/character-render.js src/styles/components.css
  git commit -m "feat: 強化角色接地感與情緒回饋動效"
  git push origin main
  ```

### Step 95 — 畫面支柱回歸驗證
- **依賴**：Step 94
- **檔案**：`tools/verify-quality.mjs`（修改）
- **目標**：完整驗證畫面支柱已達標。
- **預期變更**：
  1. 強化 `visual-body-types`：追加斷言**沒有任何兩隻角色的 path 數完全相同的比例超過 40%**。
  2. 新增 `visual-gradient`：斷言 24 隻角色中至少 **20 隻**含 `linearGradient` 或多層色階。
  3. 新增 `visual-walk-diff`：斷言每隻的 `walk-1..4` 四幀**內容不相同**（以四幀的 path 座標差異比對）。
  4. 新增 `visual-manifest-sync`：斷言 `assets/characters/manifest.json` 的每一筆，其 `file` 與 `walkFrames` 都實際存在於磁碟。
  5. 保留 Step 81 的 10 條檢查不變。
- **規範**：
  - 不得放寬門檻。
  - 不得修改 `assets/characters/manifest.json` 來讓檢查通過（除非是真的缺檔）。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase visual; echo "exit=$?"
  ```
  預期：畫面相關檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs
  git commit -m "test: 畫面支柱回歸驗證"
  git push origin main
  ```

---

## Phase U — 兒童語言層（體驗最高優先）

> 本 Phase 解決診斷 D1–D4。**這是所有支柱中對體驗影響最大的一項**——音樂再好，圖鑑裡寫「再答對 3 次干擾抑制」，孩子一樣會放棄。
>
> **核心原則**：孩子的介面上不得出現任何認知心理學或教育評量術語。孩子看到的是「收集恐龍的誘因」，家長看到的是「技能的數據」。
>
> **為什麼這是第一優先**：一個把「最小對辨識正確率」「成效前後測」「掌握度雷達圖」放在孩子眼前的產品，看起來就像**教師甄試工具**而不是遊戲。孩子不需要被評量，孩子需要被吸引。
>
> **兩層分層，不得越界**：
> - **孩子層**（`core/dex.js`、`ui/dex.js`、`ui/share-card.js`、`ui/hud.js`、`main.js` 的遊戲路徑）：只有誘因、收集、遊戲語言。**不得有評量構件**（雷達圖、多軸統計圖、達成率、正確率、前後測對比）。
> - **家長層**（`ui/parent-report.js`、`ui/assessment-ui.js`）：保留全部正式技能名與數據。**這裡的術語是正確的，不得修改**。
>
> **最容易犯的錯**：把家長端的「學習報告」搬到孩子端，或把雷達圖當成「成就展示」。判準是：**孩子看得懂嗎？如果一個 5 歲孩子解釋不出這張圖/這句話代表什麼，它就不該出現在孩子路徑。**

### Step 96 — 建立雙層文案資料檔
- **依賴**：Step 95（Phase S 畫面支柱終局）
- **檔案**：`content/child-voice.json`（新增）
- **目標**：建立孩子版與家長版文案**分離**的單一資料來源。**這是 Phase U 的根，其他步驟都是消費端。**
- **參考實作**：`docs/refs/child-voice.reference.json`（**已存在，內容已通過禁用術語檢查，可直接作為起點**）
- **預期變更**：以 `docs/refs/child-voice.reference.json` 為基礎，落地為 `content/child-voice.json`。結構（鍵名固定，後續步驟依賴它）：
  ```json
  {
    "verbChildLabel": {
      "sequence":      { "zh-TW": "小耳朵任務", "en-US": "Little Ears" },
      "minimal-pair":  { "zh-TW": "找不同",    "en-US": "Spot the Difference" },
      "rhythm":        { "zh-TW": "打拍子",    "en-US": "Clap Along" },
      "interference":  { "zh-TW": "穿過風雪",  "en-US": "Through the Storm" },
      "pitch":         { "zh-TW": "高低聲",    "en-US": "High and Low" },
      "puzzle":        { "zh-TW": "拼骨頭",    "en-US": "Piece Together" },
      "memory":        { "zh-TW": "足跡石林",  "en-US": "Tracks Grove" }
    },
    "verbChildHint": {
      "sequence": { "zh-TW": "聖誕老人唸出一串聲音，聽完輪到你", "en-US": "Santa reads a sound trail, then it is your turn" }
    },
    "unlockChild": {
      "minimal-pair": { "zh-TW": "再答對 {n} 次「{verb}」", "en-US": "Get {n} more {verb} right" },
      "stars":        { "zh-TW": "再收集 {n} 顆星星", "en-US": "Collect {n} more stars" },
      "chapter":      { "zh-TW": "再走完 {n} 個章節", "en-US": "Finish {n} more chapters" }
    },
    "childSuffix":  { "zh-TW": "就能帶牠回家", "en-US": "to bring it home" },
    "childReady":   { "zh-TW": "牠在等你帶牠回家！", "en-US": "It is waiting for you!" },
    "childNotSet":  { "zh-TW": "再玩幾場就會出現", "en-US": "Play a few rounds to find out" },
    "localeSuffix": { "zh-TW": "（要聽中文的題目）", "en-US": "（English questions only）" },
    "noHintSuffix": { "zh-TW": "（而且不要用提示）", "en-US": "（without using hints）" },
    "dexProgressLabel": { "zh-TW": "收集進度", "en-US": "Collection" },
    "dexUnlockedBadge": { "zh-TW": "已加入隊伍", "en-US": "In your team" },
    "dexLockedSilhouette": { "zh-TW": "還在雪地裡", "en-US": "Still out there" },
    "shareChildTitle": {
      "learning": { "zh-TW": "我學會了新東西！", "en-US": "I learned something new!" },
      "dex":      { "zh-TW": "我的恐龍隊伍", "en-US": "My dino team" },
      "puzzle":   { "zh-TW": "我拼好了恐龍！", "en-US": "I built a dinosaur!" }
    },
    "shareChildBody": {
      "learning": { "zh-TW": "我學會了聽出聲音的小秘密", "en-US": "I learned the secret of hearing sounds apart" },
      "dex":      { "zh-TW": "我收集了 {n} 隻恐龍", "en-US": "I collected {n} dinosaurs" },
      "puzzle":   { "zh-TW": "我把恐龍的骨頭拼回來了", "en-US": "I put a dinosaur back together" }
    },
    "parentVerbLabel": {
      "minimal-pair": { "zh-TW": "最小對辨識", "en-US": "Minimal Pair Discrimination" }
    },
    "hudLevelLabel": { "zh-TW": "第 {n} 關", "en-US": "Level {n}" },
    "childScoreLabel": { "zh-TW": "星星", "en-US": "Stars" }
  }
  ```
- **文案撰寫規範**（這是本步最重要的部分）：
  1. **不得出現**任何下列術語（守門會檢查）：最小對辨識、語音覺辨、序列回憶、干擾抑制、音高模仿、節奏模仿、圖像推理、空間記憶、記憶配對、正確率、掌握度、成效、前測、後測、百分點、技能軸、認知、認知動詞。
  2. 孩子的玩法名稱必須是**動作或角色**，不是能力名稱。例：小耳朵任務（聽音序列）、找不同（最小對）、打拍子（節奏）、穿過風雪（干擾抑制）、高低聲（音高）、拼骨頭（圖像拼合）、足跡石林（記憶配對）。
  3. 每句中文 ≤ 20 字，英文 ≤ 55 字元。
  4. 不得使用 emoji（`npm run check:assets` 會驗 emoji = 0）。
  5. **每個鍵都必須有 zh-TW 與 en-US**，句數與結構對稱。
  6. `unlockChild` 的模板中，`{n}` 代表次數、`{verb}` 代表 `verbChildLabel` 的值。
- **驗證**：
  ```bash
  node -e "
  const v=require('./content/child-voice.json');
  const banned=['最小對辨識','語音覺辨','序列回憶','干擾抑制','音高模仿','節奏模仿','圖像推理','空間記憶','記憶配對','正確率','掌握度','成效','前測','後測','百分點','技能軸','認知'];
  const hits=[];
  // 只掃「孩子層」區塊；parentVerbLabel 是家長層，本就該含正式技能名，不得掃
  const childKeys=Object.keys(v).filter(k=>!k.startsWith('parent')&&!k.startsWith('_'));
  for(const ck of childKeys){
    (function walk(o,p){ for(const[k,val]of Object.entries(o||{})){ if(typeof val==='string'){ for(const b of banned) if(val.includes(b)) hits.push(p+'.'+k+' → '+b); } else if(val&&typeof val==='object') walk(val,p+'.'+k); } })(v[ck], ck);
  }
  if(hits.length){ console.error('兒童文案含術語:'); hits.forEach(h=>console.error('  '+h)); process.exit(1); }
  const verbs=['sequence','minimal-pair','rhythm','interference','pitch','puzzle','memory'];
  for(const k of verbs){ if(!v.verbChildLabel?.[k]){ console.error('缺少玩法兒童名:',k); process.exit(1);} if(!v.verbChildLabel[k]['zh-TW']||!v.verbChildLabel[k]['en-US']){ console.error(k,'雙語不全'); process.exit(1);} }
  console.log('[PASS] 兒童文案無評量術語，7 種玩法名稱齊備');
  "
  npm run check:content
  ```
  註：檢查**只掃孩子層區塊**（排除 `parent*` 開頭的鍵與 `_` 開頭的註解鍵），因為 `parentVerbLabel` 本來就該含「最小對辨識」這類正式技能名。
- **提交**：
  ```bash
  git add content/child-voice.json
  git commit -m "feat: 新增兒童與家長雙層文案資料檔"
  git push origin main
  ```

### Step 97 — 建立兒童語言守門檢查
- **依賴**：Step 96
- **檔案**：`tools/verify-quality.mjs`（修改）
- **目標**：防止術語再次外露，防止評量構件混入兒童路徑，並防止家長端被誤改。
- **預期變更**：在 `tools/verify-quality.mjs` 新增 6 條檢查：
  1. `child-no-jargon`：掃描 `src/js/core/dex.js`、`src/js/ui/share-card.js`、`src/js/ui/dex.js`、`src/js/ui/hud.js`、`src/js/main.js` 五個**孩子可見**檔案的**字串字面值**，斷言不含 Step 96 列出的 18 個禁用術語。
     - **只掃字串字面值**，不得掃註解（註解裡寫「掌握度」是合法的）。
     - 掃描方式：先用 regex 移除 `/* … */` 與 `// …` 區塊，再用 regex 取出 `"..."`、`'...'`、`` `...` `` 內的內容再比對。
  2. `child-no-eval-widget`（**最關鍵的一條**）：斷言**孩子可見的介面**不得出現「評量構件」。具體檢查：
     - `src/js/ui/share-card.js` 的**孩子版**路徑不得產生雷達圖（多軸座標圖）。斷言方式：`buildShareCard` 的 `view === "child"` 分支不得呼叫 `drawLearningCard` 雷達圖路徑，且孩子版不得使用 `AXES`／`radar` 這類多軸繪製。
     - `src/js/ui/dex.js` 不得顯示「正確率／掌握度／達成率」等百分比指標，只顯示**收集進度**。
     - `src/js/ui/hud.js` 不得顯示「正確率／連續天數／每週分鐘」等統計指標。
     - 檢查對象是**結構**（有沒有雷達圖、多軸圖、達成率指標），不只是字串。
  3. `child-voice-complete`：斷言 `content/child-voice.json` 含 7 種玩法的 `verbChildLabel`（雙語齊備），且 `unlockChild` 至少涵蓋 `minimal-pair`、`stars`、`chapter` 三種。
  4. `parent-view-untouched`：**反向檢查**——斷言 `src/js/ui/parent-report.js` 與 `src/js/ui/assessment-ui.js` **仍含**家長端術語（用來確認沒有被誤改）。若這兩檔不再含「掌握度」或「成效」，則 FAIL 並提示「家長端被誤改」。
  5. `child-hud-level`：斷言 `src/js/ui/hud.js` 的關卡顯示使用 `child-voice.json` 的 `hudLevelLabel`（或至少不再硬編碼 `Level ${...}` 字面量）。
  6. `child-single-layer`：**資訊分層檢查**——斷言家長端介面**必須**存在且**必須**在孩子路徑之外」。檢查方式：斷言 `index.html` 中 `parent-report-root` 與 `assessment-root` 存在，但 `src/js/main.js` 中**沒有**任何非家長閘門路徑會自動開啟它們（只能由家長閘門 `requireParentalGate` 觸發）。
     - 若發現孩子流程會自動顯示家長報告，則 FAIL。
- **規範**：
  - 不得刪除或弱化 Step 81 建立的既有 10 條檢查。
  - `child-no-jargon` 的掃描必須排除註解，否則會產生大量誤報。
  - `parent-view-untouched` 是**反向檢查**，用來防止 Step 97–102 誤傷家長端。
  - `child-no-eval-widget` 檢查的是**介面構件**，不要退化成只查字串——那樣會漏掉「用圖表呈現的評量語意」。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase child; echo "exit=$?"
  ```
  預期：此時 `child-no-jargon` **FAIL**（`dex.js` 與 `share-card.js` 仍有術語），其餘三條 PASS。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs
  git commit -m "test: 新增兒童語言層守門檢查"
  git push origin main
  ```

### Step 98 — 圖鑑解鎖條件改為兒童語言
- **依賴**：Step 97
- **檔案**：`src/js/core/dex.js`（修改）
- **目標**：解決診斷 D1／D2 —— 孩子看到的解鎖條件是「收集誘因」而非「作業指令」。
- **預期變更**：
  1. `unlockConditionText(bundle, progress, dinoId, locale)` **新增一個參數** `view`（`"child"` 或 `"parent"`，預設 `"child"`），以選擇文案層。
     - 為相容既有呼叫點，未傳入時視為 `"child"`；**但 `src/js/ui/dex.js` 必須顯式傳 `"child"`**。
  2. `view === "child"` 時：
     - 使用 `child-voice.json` 的 `verbChildLabel[verb]` 作為 `{verb}` 的值。
     - 使用 `unlockChild[type]` 模板，代入 `{n}`（剩餘次數）與 `{verb}`。
     - **追加** `childSuffix`（中文「就能帶牠回家」／英文「to bring it home」）。
     - 若 `cond.locale` 存在，追加 `localeSuffix`。
     - 若 `cond.noHint === true`，追加 `noHintSuffix`。
     - `default` 分支改為 `childNotSet`（「再玩幾場就會出現」）。
  3. `view === "parent"` 時：**完整保留現有行為**（家長端術語原樣輸出），並把 `parentVerbLabel` 用於把 `cond.type` 轉為正式技能名（僅影響「correct rate」這類 type 的描述）。
  4. 新增匯出 `childUnlockText(bundle, progress, dinoId, locale)`，為 `view === "child"` 的薄包裝。
- **規範**：
  - **不得**改變 `evaluateCondition()` 的判定邏輯（那是解鎖條件本身，不是文案）。
  - **不得**刪除家長端文案分支。
  - 孩子端文案中**不得**出現數字以外的任何抽象概念詞。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase child; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/core/dex.js','utf8');
  if(!s.includes('child-voice') && !s.includes('childVoice') && !s.includes('unlockChild')){ console.error('dex.js 未使用兒童文案'); process.exit(1); }
  console.log('[PASS] dex.js 已改用兒童文案');
  "
  npm run typecheck && npm run lint
  ```
- **提交**：
  ```bash
  git add src/js/core/dex.js
  git commit -m "feat: 圖鑑解鎖條件改為兒童語言"
  git push origin main
  ```

### Step 99 — 圖鑑介面改為收集語言
- **依賴**：Step 98
- **檔案**：`src/js/ui/dex.js`（修改）
- **目標**：圖鑑介面整體改為「收集隊伍」的語氣。
- **預期變更**：
  1. 明確以 `view = "child"` 呼叫 `unlockConditionText()`。
  2. 已解鎖的恐龍：徽章文字改用 `dexUnlockedBadge`（「已加入隊伍」）。
  3. 未解鎖的恐龍：剪影下方顯示 `dexLockedSilhouette`（「還在雪地裡」）＋ 兒童化解鎖條件。
  4. 進度條標籤改用 `dexProgressLabel`（「收集進度」）。
  5. 進度百分比**維持顯示**（孩子看得懂數字），但不得搭配任何術語。
- **規範**：
  - 不得顯示任何 `dex-cond` 之類的技術識別字給使用者。
  - 不得移除 `aria-label` 的可及性描述（但內容也必須是兒童語言）。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase child; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/ui/dex.js','utf8');
  if(!s.includes('\"child\"')){ console.error('未顯式傳入 child view'); process.exit(1); }
  console.log('[PASS] 圖鑑介面已切換為兒童視角');
  "
  npm run typecheck && npm run lint
  ```
- **提交**：
  ```bash
  git add src/js/ui/dex.js
  git commit -m "feat: 圖鑑介面改為兒童收集語言"
  git push origin main
  ```

### Step 100 — 分享卡改為兒童語言
- **依賴**：Step 99
- **檔案**：`src/js/ui/share-card.js`（修改）
- **目標**：解決診斷 D3 —— 分享出去的圖，孩子自己也看得懂。
- **預期變更**：
  1. `buildShareCard(bundle, progress, kind, payload)` 新增 `view` 參數（`"child"` 或 `"parent"`，預設 `"child"`）。
  2. **`view === "child"`（預設）**：
     - **絕對不得**使用雷達圖（多軸統計圖）。孩子版三種卡片都是**收集成果圖**：
       - `learning`：孩子在遊戲中學會的**一個具體小秘密**（例：「我學會了聽出聲音的小秘密」）＋ 已收集恐龍的剪影排列，**不是**雷達圖。
       - `dex`：已收集的恐龍插畫排列（已解鎖的彩色、未解鎖的剪影）＋ `shareChildTitle.dex`。
       - `puzzle`：拼好的恐龍成品圖 ＋ `shareChildTitle.puzzle`。
     - 卡片標題用 `shareChildTitle[kind]`，內文用 `shareChildBody[kind]`（`{n}` 代入恐龍數）。
     - 不得出現任何評量構件（雷達圖、多軸圖、達成率、正確率）。
  3. **`view === "parent"`**：
     - 保留現有的雷達圖（`drawLearningCard`）與正式技能名（`parentVerbLabel`），**不得刪除**家長版能力。
     - 家長版雷達圖**只能**透過明確的 `view === "parent"` 呼叫產生。
  4. `shareToLine()` 產生的分享文字**預設使用兒童版文案**（家長明確選擇家長版時才用家長版）。
- **規範**：
  - 孩子版分享卡**不得**出現任何評量術語，也不得出現任何評量構件。
  - 不得移除家長版能力（家長想看數據時仍要看得到）。
  - `shareChildBody.dex` 的 `{n}` 必須代入實際恐龍數。
  - **不得**為了「資訊量」而在孩子版塞入統計數字（孩子不需要看到自己的正確率）。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase child; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/ui/share-card.js','utf8');
  for(const bad of ['語音覺辨','序列回憶','干擾抑制','音高模仿','圖像推理','空間記憶','節奏模仿']){
    if(s.includes('\"'+bad+'\"')) { console.error('分享卡仍含術語字面值:', bad); process.exit(1); }
  }
  // 孩子版分支不得使用雷達圖路徑
  const childBranch=s.match(/view\s*===\s*\"child\"[\s\S]{0,600}?\}\s*\}/);
  if(childBranch && /drawLearningCard|radar/i.test(childBranch[0])){
    console.error('孩子版分支仍產出雷達圖'); process.exit(1);
  }
  console.log('[PASS] 分享卡孩子版已無術語與雷達圖');
  "
  npm run typecheck && npm run lint
  ```
- **提交**：
  ```bash
  git add src/js/ui/share-card.js
  git commit -m "feat: 分享卡改為兒童語言並保留家長版"
  git push origin main
  ```

### Step 101 — HUD 與介面語言統一
- **依賴**：Step 100
- **檔案**：`src/js/ui/hud.js`（修改）、`src/js/main.js`（修改）
- **目標**：解決診斷 D4，並統一介面語言。
- **預期變更**：
  1. `src/js/ui/hud.js` 的關卡顯示，從硬編碼 `Level ${s.level}` 改為使用 `child-voice.json` 的 `hudLevelLabel`（中文「第 {n} 關」／英文「Level {n}」）。
  2. 分數標籤使用 `childScoreLabel`（「星星」／「Stars」）。
  3. `src/js/main.js` 的 `mode-indicator`（`verbLabel(level.verb, locale)`）改為使用 `verbChildLabel`（兒童化玩法名）。
  4. `src/js/main.js` 的「慢速模式」toast 改為兒童語言（例：「我們慢慢來」／「Let's go slow」），並改為非 emoji 的符號（現行使用 `◑` `◔`，屬字形符號非 emoji，可保留但需確認 `check:assets` 通過）。
- **規範**：
  - **不得**修改 `src/js/ui/parent-report.js` 與 `src/js/ui/assessment-ui.js`（家長端）。
  - 不得改變 HUD 的資料結構與對外介面（`update()` 的參數形狀不變）。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase child; echo "exit=$?"
  node -e "
  const h=require('fs').readFileSync('src/js/ui/hud.js','utf8');
  if(/Level \\\$\{/.test(h)){ console.error('HUD 仍硬編碼 Level 模板'); process.exit(1); }
  const p=require('fs').readFileSync('src/js/ui/parent-report.js','utf8');
  if(!p.includes('掌握度') && !p.includes('Skill Mastery')){ console.error('家長端被誤改'); process.exit(1); }
  console.log('[PASS] HUD 已兒童化，家長端未受影響');
  "
  npm run typecheck && npm run lint && npm run check
  ```
- **提交**：
  ```bash
  git add src/js/ui/hud.js src/js/main.js
  git commit -m "feat: HUD 與模式指示改為兒童語言"
  git push origin main
  ```

### Step 102 — 兒童語言層回歸驗證
- **依賴**：Step 101
- **檔案**：`tools/verify-quality.mjs`（修改）
- **目標**：完整驗證兒童語言層已達標。
- **預期變更**：
  1. 強化 `child-no-jargon`：擴大掃描範圍到**所有**孩子可見檔案（`src/js/core/dex.js`、`src/js/ui/dex.js`、`src/js/ui/share-card.js`、`src/js/ui/hud.js`、`src/js/main.js`），並排除註解。
  2. 新增 `child-positive-check`：斷言 `content/child-voice.json` 的 7 種 `verbChildLabel` 中文值**互不相同**（避免多個玩法用同一個名）。
  3. 新增 `child-share-uses-voice`：斷言 `src/js/ui/share-card.js` 有引用 `shareChildTitle` 或 `verbChildLabel`。
  4. 新增 `parent-view-intact`：斷言 `src/js/ui/parent-report.js` 仍含「技能掌握度」或「Skill Mastery」，且 `src/js/ui/assessment-ui.js` 仍含「成效」或「Assessment」。
  5. 新增 `child-no-eval-widget-final`：**最終驗收用的構件檢查**——斷言：
     - 孩子版分享卡路徑不含雷達圖（多軸繪製）。
     - `src/js/ui/dex.js` 不含「正確率／達成率」等百分比指標字面值。
     - `src/js/ui/hud.js` 不含「正確率／本週分鐘／連續天數」等統計指標字面值。
     - `src/js/main.js` 中家長端介面只能由家長閘門觸發（孩子流程不會自動開啟）。
  6. 保留 Step 81 的 10 條與 Step 97 的 6 條檢查不變。
- **規範**：
  - 不得放寬門檻。
  - `child-no-jargon` 若因掃描範圍擴大而誤報（例如掃到 `main.js` 註解裡的技術說明），必須**修正排除邏輯**而非放寬禁用詞表。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase child; echo "exit=$?"
  ```
  預期：兒童語言相關檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs
  git commit -m "test: 兒童語言層回歸驗證"
  git push origin main
  ```

---

## Phase T — 整合與交付

### Step 106 — 三支柱整合回歸與場景連續性
- **依賴**：Step 105
- **檔案**：`src/js/main.js`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：確認三支柱在**同一場景內同時生效**——切換章節時，音樂、場景色票、視差層、敘事同時改變。
- **預期變更**：
  1. 在 `src/js/main.js` 的 `applySceneAudio(scene)` 旁，新增 `applySceneVisual(scene)`：
     - 呼叫 `applyTheme($("scene"), scene)` 套用 `content/scenes.json` 的場景色票。
     - 呼叫 `setParallax` 重置位移。
  2. `startLevel()` 內改為同時呼叫 `applySceneAudio(level.scene)` 與 `applySceneVisual(level.scene)`。
  3. `applyTheme()` 必須從 `content/scenes.json` 讀取 palette（若 `main.js` 已有場景資料載入流程則沿用，否則在啟動時載入 `content/scenes.json` 並存入模組變數）。
  4. 在 `tools/verify-quality.mjs` 新增 `integration-scene-switch`：靜態斷言 `main.js` 中同時存在 `playSceneMusic` 與 `applyTheme` 的呼叫，且兩者都出現在 `startLevel` 函式本體內。
- **規範**：
  - 不得破壞 `buildScene` / `setParallax` / `applyTheme` 的既有介面。
  - 若 `content/scenes.json` 載入失敗，必須有 fallback（沿用現有預設色票），**不得中斷遊戲**。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  node tools/verify-quality.mjs; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/main.js','utf8');
  const fn=s.match(/function startLevel[\s\S]*?\n\}/);
  if(!fn){ console.error('找不到 startLevel'); process.exit(1); }
  if(!fn[0].includes('playSceneMusic')||!fn[0].includes('applyTheme')){ console.error('startLevel 未同時切換音樂與場景'); process.exit(1); }
  console.log('[PASS] 場景切換已整合');
  "
  npm run check
  ```
- **提交**：
  ```bash
  git add src/js/main.js tools/verify-quality.mjs
  git commit -m "feat: 整合場景切換之音樂與視覺"
  git push origin main
  ```

### Step 107 — 更新驗收對照表與公測檢查表
- **依賴**：Step 106
- **檔案**：`docs/acceptance-9.md`（修改）、`docs/beta-launch.md`（修改）
- **目標**：文件反映三支柱的**真實現況**，不宣稱未實測項目。
- **預期變更**：
  1. `docs/acceptance-9.md` 新增一節「三支柱製作水準驗收」，逐項列出：
     - 音樂：每場景獨立主題曲 ✅／程序化生成 ✅／交叉淡入淡出 ✅／需真人聆聽評分（**待實測**）。
     - 劇本：24 隻專屬對白 ✅／信件 150+ 字 ✅／台詞 120 句 ✅／兒童理解度（**待實測**）。
     - 畫面：12+ 體型 ✅／五層視差 ✅／接地陰影 ✅／美術主觀評分（**待實測**）。
  2. 明確標註「**待實測**」：兒童試玩滿意度、家長評價、聆聽疲勞度、美術主觀水準。
  3. `docs/beta-launch.md` 的產品面補入：五個場景各能聽到不同主題曲、場景切換有視覺與聽覺同步轉場、24 隻角色外觀可區分。
- **規範**：
  - **嚴禁**把待實測項目寫成已達成。
  - 不得刪除既有的「尚未驗證」標註。
- **驗證**：
  ```bash
  npm run check
  node -e "
  const s=require('fs').readFileSync('docs/acceptance-9.md','utf8');
  if(s.length<1500) process.exit(1);
  if(!s.includes('待實測')){ console.error('缺「待實測」標註'); process.exit(1); }
  console.log('[PASS] 驗收對照表已更新');
  "
  ```
- **提交**：
  ```bash
  git add docs/acceptance-9.md docs/beta-launch.md
  git commit -m "docs: 更新三支柱驗收對照表"
  git push origin main
  ```

### Step 108 — 終局守門與交付
- **依賴**：Step 107
- **檔案**：`task.md`（修改）
- **目標**：三支柱全部完成後做一次完整守門並交付。
- **預期變更**：
  1. 在 `task.md` 末尾新增「v8 完成紀錄」區塊，列出 Step 81–97 的驗證指令與對應 commit 短 hash（以 `git log --oneline` 取得）。
  2. 更新文件頭部評分區塊：以三支柱完成後的實測現況更新評分，**並保留「待實測」項目清單**。
  3. 標註診斷 A1–A4、B1–B4、C1–C3 各自的修復狀態。
- **驗證**：
  ```bash
  npm run check; echo "exit=$?"
  node tools/verify-quality.mjs; echo "quality_exit=$?"
  node tools/verify-phaseO.mjs; echo "phaseO_exit=$?"
  ```
  預期：三者皆為 0（`verify-phaseO.mjs` 的商業管道檢查若仍 FAIL，因 v8 不涵蓋該範圍，**請改用 `--phase 1`**，該子集應全 PASS）。
- **提交**（終局步驟，唯一一條，不需再 git add 其他檔案）：
  ```bash
  git add -A
  git commit -m "feat: 完成三支柱製作水準提升（獨立場景配樂／恐龍專屬對白／角色體型多樣化）"
  git push origin "$(git branch --show-current)"
  ```

---

## v8 完成紀錄

> Step 81–108：全部完成（2026-11-19）。
> 三支柱（音樂／劇本／畫面）與兒童語言層的**靜態可驗證**項目全部達成；
> 主觀與實測項目仍為「待實測」，詳見 `docs/acceptance-9.md`「三支柱製作水準驗收」。

### Phase P — 守門與準備

| Step | 內容 | 驗證指令 | Commit | 狀態 |
| --- | --- | --- | --- | --- |
| 81 | 三支柱品質守門工具 | `node tools/verify-quality.mjs` | `0cbfe00` | ✅ |
| 82 | 場景設定資料檔 | `node tools/verify-quality.mjs --phase scenes` | `198d4a8` | ✅ |

### Phase Q — 音樂支柱

| Step | 內容 | 驗證指令 | Commit | 狀態 |
| --- | --- | --- | --- | --- |
| 83 | 程序化場景音樂生成器 | `node --check src/js/audio/scene-music.js` | `568eb81` | ✅ |
| 84 | 音樂引擎支援程序化播放 | `npm run typecheck` | `f4e0205` | ✅ |
| 85 | 接通背景音自動播放與換曲 | `node tools/verify-quality.mjs --phase music` | `ef17ccd` | ✅ |
| 86 | 視差五層視覺定義 | `node tools/verify-quality.mjs --phase visual` | `fb6f2ff` | ✅ |
| 87 | 清理重複音檔 | `node tools/verify-quality.mjs --phase music` | `4871882` | ✅ |
| 88 | 音樂支柱回歸驗證 | `node tools/verify-quality.mjs --phase music` | `9ab532a` | ✅ |

### Phase R — 劇本支柱

| Step | 內容 | 驗證指令 | Commit | 狀態 |
| --- | --- | --- | --- | --- |
| 89 | 24 隻恐龍專屬對白 | `node tools/verify-quality.mjs --phase story` | `09787a9` | ✅ |
| 90 | 擴寫六章章節信件 | `node tools/verify-quality.mjs --phase story` | `a97644d` | ✅ |
| 91 | 補足情境台詞至 120 句 | `node -e "…"` | `f04d0a5` | ✅ |
| 92 | 劇本支柱回歸驗證 | `node tools/verify-quality.mjs --phase story` | `be5c773` | ✅ |

### Phase S — 畫面支柱

| Step | 內容 | 驗證指令 | Commit | 狀態 |
| --- | --- | --- | --- | --- |
| 93 | 角色體型多樣化至 12+ 種 | `node tools/verify-quality.mjs --phase visual` | `32ed845` | ✅ |
| 94 | 角色接地感與情緒回饋 | `npm run typecheck` | `fe6b22b` | ✅ |
| 95 | 畫面支柱回歸驗證 | `node tools/verify-quality.mjs --phase visual` | `54192a8` | ✅ |

### Phase U — 兒童語言層

| Step | 內容 | 驗證指令 | Commit | 狀態 |
| --- | --- | --- | --- | --- |
| 96 | 建立雙層文案資料檔 | `node -e "…"` | `64ec7b4` | ✅ |
| 97 | 建立兒童語言守門檢查（6 條） | `node tools/verify-quality.mjs --phase child` | `555b05a` | ✅ |
| 98 | 圖鑑解鎖條件改為兒童語言 | `node tools/verify-quality.mjs --phase child` | `d199665` | ✅ |
| 99 | 圖鑑介面改為收集語言 | `node tools/verify-quality.mjs --phase child` | `5cd4e19` | ✅ |
| 100 | 分享卡改為兒童語言（無雷達圖） | `node tools/verify-quality.mjs --phase child` | `50c46d6` | ✅ |
| 101 | HUD 與介面語言統一 | `node tools/verify-quality.mjs --phase child` | `b6e7929` | ✅ |
| 102 | 兒童語言層回歸驗證 | `node tools/verify-quality.mjs --phase child` | `e4bef8c` | ✅ |

### Phase T — 整合與交付

| Step | 內容 | 驗證指令 | Commit | 狀態 |
| --- | --- | --- | --- | --- |
| 106 | 三支柱與兒童語言整合 | `node tools/verify-quality.mjs` | `e8d5532` | ✅ |
| 107 | 更新驗收與公測文件 | `npm run check` | `b133e1b` | ✅ |
| 108 | 終局守門與交付 | `npm run check` | （本 Step） | ✅ |

### 終局守門結果（2026-11-19）

| 指令 | 結果 |
| --- | --- |
| `npm run check` | exit 0（lint／check-content／check-assets／sweep 全通過） |
| `node tools/verify-quality.mjs` | exit 0（29/29 通過） |
| `node tools/verify-phaseO.mjs --phase 1` | exit 0（7/7 通過） |

> 註：`verify-phaseO.mjs` 的 phase 2（Service Worker 預快取、telemetry 外送、IAP 金流）
> 屬商業管道範圍，v8 不涵蓋，維持未通過狀態（見 `docs/beta-launch.md` 產品／商業面）。

### 現況診斷修復狀態

| 診斷 | 問題 | 修復狀態 | 修復 Step | 修復 Commit |
| --- | --- | --- | --- | --- |
| **A1** | 背景音未接線（`playMusic()` 從未被呼叫，音樂按鈕硬編碼音檔） | ✅ 已修復 | Step 85 | `ef17ccd` |
| **A2** | 場景切換不換歌不換景（`startLevel()` 無 `playMusic`／`applyTheme`） | ✅ 已修復 | Step 85、Step 106 | `ef17ccd`、`e8d5532` |
| **A3** | 五個章節主題只有 2 個音檔 | ✅ 已修復（程序化獨立主題曲，9 個場景定義涵蓋 6 個遊戲場景） | Step 83、Step 92 | `568eb81`、`be5c773` |
| **A4** | 4 份大小寫重複音檔，白佔 1.1 MB | ✅ 已修復 | Step 87 | `4871882` |
| **B1** | 24 隻恐龍共用 7 句對白 | ✅ 已修復（24 隻各 ≥3 句、共 72 句，無 3 隻共用） | Step 89 | `09787a9` |
| **B2** | 章節信件過短（55–65 字） | ✅ 已修復（六章各 263–330 字） | Step 90 | `a97644d` |
| **B3** | 第 3、4 章共用場景 `ice-age` | ✅ 已修復（新增 `ice-age-christmas` 場景／音樂／關卡） | Step 92 | `be5c773` |
| **B4** | 情境台詞僅 88 句 | ✅ 已修復（雙語各 120 句且對稱） | Step 91 | `f04d0a5` |
| **C1** | 24 隻恐龍只有 5 種體型 | ✅ 已修復（20 種體型定義、19 種 path 數、最大同型群組 2/24） | Step 93 | `32ed845` |
| **C2** | 角色無接地感（無漸層、無陰影） | ✅ 已修復（漸層 + 接地陰影 + 情緒動效） | Step 94 | `fe6b22b` |
| **C3** | 視差三層空白 | ✅ 已修復（五層視差皆有 CSS 定義與場景色票注入） | Step 86 | `fb6f2ff` |
| **D1–D4** | 兒童介面外露認知心理學術語與評量構件 | ✅ 已修復（孩子層零禁用術語、分享卡無雷達圖、HUD 統一） | Step 96–102 | `64ec7b4`～`e4bef8c` |
| 附帶修正 | 序章信以 `[locale]` 取字串值導致 undefined；`session` 未產出學習樣本；圖鑑解鎖未評估 `locale`／`noHint` | ✅ 已修復（`verify-phaseO --phase 1` 由 4/7 提升為 7/7） | Step 108 | （本 Step） |

### 三支柱完成後評分現況（僅靜態可驗證部分）

| 支柱 | v8 目標 | 靜態驗證現況 | 仍待實測 |
| --- | --- | --- | --- |
| **音樂** | 每場景獨立主題曲、程序化生成、交叉淡入淡出 | ✅ 9 個場景音樂定義涵蓋 6 個遊戲場景、(root, tempo) 互不相同、9 個皆渲染出非靜音緩衝區、淡入 1.2s／淡出 700ms | 真人聆聽評分（悅耳度）、聆聽疲勞度 |
| **劇本** | 24 隻專屬對白、信件 150+ 字、台詞 120 句 | ✅ 24 隻各 ≥3 句共 72 句、六章信件 263–330 字且長度互異、雙語台詞各 120 句對稱、6 類個性組別內對白互異 | 兒童理解度（4–8 歲） |
| **畫面** | 12+ 體型、漸層與接地陰影、五層視差、場景色差 | ✅ 19 種體型（最大同型群組 2/24）、24/24 含漸層、24 隻四幀步行皆相異、五層視差齊備、6 場景 sky 色互不相同 | 美術主觀水準評分 |
| **兒童語言層** | 孩子介面零評量術語與評量構件 | ✅ 12 條 child 守門全通過（含反向檢查：家長端術語仍在） | 兒童試玩滿意度、家長評價 |
| **整合** | 三支柱於同一場景同時生效 | ✅ `startLevel()` 內同時呼叫 `playSceneMusic()` 與 `applyTheme()`（`integration-scene-switch`） | 場景轉場觀感（主觀） |

> **上述評分只涵蓋靜態可驗證部分。** 留存率、轉付費、FPS、LUFS、盲測、兒童滿意度等
> 實測指標**仍未達成**，一律標示「待實測」，詳見 `docs/acceptance-9.md` 與 `docs/beta-launch.md`。

---

## 附錄 A — 音樂支柱現況速查（實作時必讀）

```
content/music.json ──chapters──> { christmas, valley, forest, ice-age, north }
                                        │
                                   全部指向 2 個音檔
                                        │
                    ┌───────────────────┴───────────────────┐
              jingle-bells.m4a                        silent-night.m4a
            christmas(4關) valley(8關)              forest(8關) ice-age(16關) north(4關)

src/js/main.js
  ├─ import { setMusicMap }              ← 只有 setMusicMap 被匯入
  ├─ setMusicMap(await res.json())       ← music.json 有載入，但…
  ├─ playMusic( )                        ← 從未被呼叫（實測 1 次，全是定義）
  └─ 音樂按鈕 → bgm.src = "…jingle-bells.m4a"   ← 唯一實際播放點，硬編碼

startLevel(levelId)
  ├─ setState({ level, chapter, verb })   ← 有
  ├─ playSceneMusic(level.scene)          ← 沒有
  └─ applyTheme($("scene"), level.scene)  ← 沒有
```

**Step 83–85 就是要把上面這張圖的缺口補上。**

## 附錄 B — 參考實作

`docs/refs/` 內有兩個**可直接作為起點**的參考實作（皆已驗證通過）：

### `docs/refs/scene-music.reference.js` — Step 83 的起點

語法已驗證通過，含 9 個場景音樂定義（`christmas` / `valley` / `forest` / `ice-age` / `ice-age-christmas` / `north` / `celebrate` / `daily` / `night`）。

已知它原始版本的兩個問題，已在參考檔中修正，**改動時不得回退**：
1. `ice-age` / `ice-age-christmas` 兩個鍵**必須加引號**（含連字號，未加引號是語法錯誤）。
2. `writeMono()` 函式為未使用的死碼，已移除。

### `docs/refs/child-voice.reference.json` — Step 96 的起點

內容已通過禁用術語檢查（孩子層區塊零命中），7 種玩法的兒童名雙語齊備。

注意它的結構特性：**`parentVerbLabel` 區塊本來就含「最小對辨識」等正式技能名**，這是**正確的**（家長層）。因此 Step 96 的驗證指令只掃「孩子層」區塊（排除 `parent` 與 `_` 開頭的鍵），不可掃全檔——否則會誤報。

### 開始 Step 的方式

```bash
# Step 83
cp docs/refs/scene-music.reference.js src/js/audio/scene-music.js

# Step 96
cp docs/refs/child-voice.reference.json content/child-voice.json
```

## 附錄 C — 三支柱驗收速查表

| 支柱 | 檢查 id | 門檻 |
| --- | --- | --- |
| 兒童語言 | `child-no-jargon` | 孩子可見檔案的字面值無 18 個禁用術語 |
| 兒童語言 | `child-no-eval-widget` | 孩子路徑無雷達圖／多軸圖／達成率指標 |
| 兒童語言 | `child-voice-complete` | 7 種玩法兒童名雙語齊備 |
| 兒童語言 | `child-positive-check` | 7 種玩法兒童名互不相同 |
| 兒童語言 | `child-share-uses-voice` | 分享卡引用兒童文案 |
| 兒童語言 | `child-hud-level` | HUD 不用硬編碼 `Level ${…}` |
| 兒童語言 | `child-single-layer` | 家長端只能由家長閘門觸發 |
| 兒童語言 | `parent-view-untouched` / `parent-view-intact` | 家長端術語**仍在**（反向檢查） |
| 音樂 | `music-autoplay` | `playMusic` 有實際呼叫、無硬編碼音檔 |
| 音樂 | `music-per-scene` | 5 個場景不共用同一音檔 |
| 音樂 | `music-scene-distinct` | 5 個場景 `(root, tempo)` 互不相同 |
| 音樂 | `music-scenes-match` | `music.json` 涵蓋 `levels.json` 全部 scene |
| 音樂 | `music-scenes-defined` | 每個場景在 `SCENE_MUSIC` 有對應 |
| 音樂 | `audio-dupes` | 無正規化後重複音檔 |
| 劇本 | `story-dino-lines` | 每隻 ≥3 句、無 3 隻共用同句 |
| 劇本 | `story-letter-length` | 每章信件 ≥150 字 |
| 劇本 | `story-lines-count` | 台詞 ≥120 句、雙語對稱 |
| 劇本 | `story-letter-arc` | 六章信件長度互不相同 |
| 劇本 | `story-scene-unique` | 第 3、4 章不共用場景 |
| 畫面 | `visual-body-types` | 體型種類 ≥12 |
| 畫面 | `visual-gradient` | ≥20 隻角色含漸層 |
| 畫面 | `visual-walk-diff` | 四幀步行內容不同 |
| 畫面 | `visual-parallax` | 五層視差 CSS 齊備 |
| 畫面 | `visual-scene-diff` | 5 個場景 sky 色互不相同 |

## 附錄 D — 兒童語言層速查（最重要，實作時先讀這頁）

### 一句話判準

> **一個 5 歲的孩子能解釋出這句話／這張圖代表什麼嗎？解釋不出來，就不該出現在孩子看得到的地方。**

### 孩子層 vs 家長層

| 位置 | 層級 | 處理方式 |
| --- | --- | --- |
| `src/js/core/dex.js` 圖鑑解鎖條件 | **孩子** | 改成兒童誘因語言 |
| `src/js/ui/dex.js` 圖鑑介面 | **孩子** | 收集語言，不顯示正確率 |
| `src/js/ui/share-card.js` 分享卡（孩子版） | **孩子** | 收集成果圖，**無雷達圖** |
| `src/js/ui/share-card.js` 分享卡（家長版） | 家長 | 保留雷達圖與正式技能名 |
| `src/js/ui/hud.js` HUD | **孩子** | 「第 N 關」「星星」 |
| `src/js/main.js` 模式指示 | **孩子** | 兒童化玩法名 |
| `src/js/ui/parent-report.js` 家長報告 | 家長 | **不得修改** |
| `src/js/ui/assessment-ui.js` 成效評估 | 家長 | **不得修改** |

### 禁用詞表（18 個）

最小對辨識、語音覺辨、序列回憶、干擾抑制、音高模仿、節奏模仿、圖像推理、空間記憶、記憶配對、正確率、掌握度、成效、前測、後測、百分點、技能軸、認知、認知動詞

### 禁用構件（不只是文字，是畫面結構）

雷達圖／多軸統計圖、達成率指標、正確率百分比、前測後測對比圖、連續天數、本週分鐘數

### 玩法名對照（孩子 ← → 正式）

| 正式（家長看） | 孩子看 | 玩法 |
| --- | --- | --- |
| 序列回憶 | 小耳朵任務 | sequence |
| 最小對辨識 | 找不同 | minimal-pair |
| 節奏模仿 | 打拍子 | rhythm |
| 干擾抑制 | 穿過風雪 | interference |
| 音高模仿 | 高低聲 | pitch |
| 圖像拼合 | 拼骨頭 | puzzle |
| 記憶配對 | 足跡石林 | memory |

### 兩種寫法的差別

| ✗ 作業指令 | ✓ 收集誘因 |
| --- | --- |
| 再答對 3 次最小對辨識 | 再答對 3 次「找不同」，就能帶牠回家 |
| 達成正確率 80% | 再答對 8 個題目，就能帶牠回家 |
| 記憶遊戲完成 5 次 | 再完成 5 個「足跡石林」，就能帶牠回家 |
