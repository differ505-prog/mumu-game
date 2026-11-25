# 木木遊戲 — PWA 產品上市成熟度衝刺規格書 (`./task.md`)

✅ LAUNCH MATURITY PASSED (9.5/10) — READY FOR PWA RELEASE

## 📊 上市產品成熟度驗收儀表板
- **當前輪次**：Round 2 / 4（正式結案，歸檔於 `docs/task-archive.md`）
- **最新總分**：**9.5 / 10.0**（✅ 全維度 >= 1.7，零上市紅線）
- **上市紅線狀態**：✅ 零紅線（零死按鈕／零「敬請期待」或測試殘字／零破圖與啟動白屏卡死）
- **五維度明細**：核心價值閉環 **1.9/2.0**｜視覺品牌信任 **1.9/2.0**｜微互動多端適配 **1.9/2.0**｜極端邊界韌性 **1.9/2.0**｜商業細節合規 **1.9/2.0**。
- **驗證紀錄**：`npm run check` 全綠、`verify-quality.mjs` **45/45**、`npm run test:play` **79/79**。

---

## 🎯 待修補上市紅線與商業打磨清單（Round 1 退回）

- [x] **L1. 消除 `paywall.js`「敬請期待」假成交死路、不實承諾與未跳脫 `innerHTML`**
  - **檔案**：`src/js/ui/paywall.js`、`src/js/main.js`
  - **Before -> After**：
    - `main.js:1585`：移除不實「跨裝置同步」文案，改為誠實的 PWA 公測方案說明（所有資料存於本機）。
    - `paywall.js:19-84`：所有插值經 `escapeHtml()`；移除 `note.textContent = "已記錄您的訂閱意向，敬請期待。"` 後立刻 `root.classList.add("hidden")` 的假成交死路，改為點擊後 in-flight lock 鎖定並於對話框內呈現清楚回饋與「我知道了」按鈕；補齊 `Esc` 關閉、Focus Trap 與 `>=48px` 觸控。

- [x] **L2. 補齊 `boot()` 啟動內容載入失敗恢復畫面（消除白屏／遮蔽卡死）**
  - **檔案**：`src/js/main.js`、`src/styles/components.css`
  - **Before -> After**：
    - `main.js:152-156`：`catch (err)` 原本僅 `setStatus("內容載入失敗，請重新整理頁面")` 且被 `#start-overlay` 遮蔽。改為顯示可見的錯誤恢復面板（隱藏或覆蓋 `#start-overlay`，`role="alert"`），提供友善雙語錯誤說明、離線檢查提示與「重新載入」按鈕（防連點 lock，點擊重新呼叫 `boot()` 或重整）。

- [x] **L3. 頁尾隱私權／服務條款改為 PWA 應用內可捲動對話框（避免跳出獨立模式看原始 `.md`）**
  - **檔案**：`src/js/main.js`、`src/js/ui/consent-gate.js`
  - **Before -> After**：
    - `main.js:416-428`：為 `#footer-privacy` 與 `#footer-terms` 綁定 `click` 攔截（`e.preventDefault()`，保留 `href` 降級），開啟應用內可捲動條款面板（含 Loading 骨架、載入失敗重試按鈕、Focus Trap、`Esc` 關閉與 `>=48px` 關閉鈕）。

- [x] **L4. 移除 `user-scalable=no` 無障礙違規並統一中英品牌標題與過關微文案**
  - **檔案**：`index.html`、`manifest.json`
  - **Before -> After**：
    - `index.html:6`：`viewport` 移除 `user-scalable=no` 以符合 WCAG 縮放規範。
    - `index.html:9, 154` 與 `manifest.json:2-3`：統一品牌名為「木木遊戲：聖誕小幫手」／「木木遊戲」，將寫死的 `Level Up!` 改為中文預設「過關了！」並對齊 `docs/DESIGN_SYSTEM.md`。

---

## 🎯 已完成基礎任務（T1–T10 保留記錄）

- [x] **T1. 英文隱私權政策、Focus Trap 與同意資料完整性（Step 133–134）**
  - **目標檔案**：`content/privacy.en-US.md`、`src/js/ui/consent-gate.js`、`src/js/core/consent.js`（<= 3 檔）
  - **規格**：補齊 `privacy.en-US.md`（>= 1200 字元）；`consent-gate.js` 補全 `Tab`/`Shift+Tab` Focus Trap、送出鈕 in-flight lock 防連點、`Esc` 禁繞過首次同意、政策全文完整捲動；`localStorage` 讀取包 `try/catch JSON.parse` 損毀回退預設值。
  - **Pass**：`play-consent-blocks`、`play-consent-delete-data` PASS；`privacy.en-US.md` >= 1200 字元；`npm run check:content && npm run test:play` exit 0。

- [x] **T2. Service Worker 預快取修復與離線冷啟動驗證（Step 129–130）**
  - **目標檔案**：`service-worker.js`、`tools/verify-quality.mjs`、`tools/verify-playable.mjs`（<= 3 檔）
  - **規格**：`CACHE_NAME` 升為 `mumu-v4`；移除 12 條不存在路徑並補齊現行檔案（`narrative.*.json`、`scenes.json`、`performances.json`、`consent-gate.js` 等）；`install` 保留逐條容錯；SW 失敗不阻塞 `boot()`，離線導覽失敗回退 `./index.html`。
  - **Pass**：`verify-quality.mjs` 通過 `sw-precache-valid`（PRECACHE 每項皆存在且含全部 `content/*.json`）；`play-offline-boot` PASS。

- [x] **T3. PWA 雙平台安裝引導（iOS Safari + Android）（Step 167）**
  - **目標檔案**：`src/js/ui/pwa-install.js`、`src/js/main.js`、`src/styles/components.css`（<= 3 檔）
  - **規格**：偵測 `standalone` 模式；非 standalone 時攔截 `beforeinstallprompt`（Android/Desktop）或顯示 iOS Safari「分享 → 加入主畫面」步驟圖卡（自繪 SVG 禁 emoji）；安裝鈕加 in-flight lock、含「暫時略過」且記住冷卻天數，局部 Error Boundary 禁白屏；>= 48px 觸控、`Esc` 可關。
  - **Pass**：模擬 `beforeinstallprompt` 與 iOS UA 皆可顯示且可關閉不阻塞遊戲；Mobile `375px` 無水平溢位。

- [x] **T4. Web Vitals 量測與遙測外送／退避佇列（Step 131, 143）**
  - **目標檔案**：`src/js/core/vitals.js`、`src/js/core/telemetry.js`、`src/js/main.js`（<= 3 檔）
  - **規格**：`vitals.js` 以 `PerformanceObserver` 量測 `LCP`/`CLS`/`INP` 與 `trackFirstInteraction()`（無 API 時降級 null 禁拋錯）；`telemetry.js` 移除 `void 0;`，改 `sendBeacon`/`fetch(keepalive)` 指數退避佇列、`pagehide` flush、斷網降級本地計數；未同意禁外送，`sanitize()` 攔截 `email`/`name`/`ip`/`deviceId`/`token`/`secret`。
  - **Pass**：`telemetry.js` 含 `flush`/`sendBeacon` 且無 `void 0;`；無 `PerformanceObserver` 環境不拋錯；`npm run sweep` exit 0。

- [x] **T5. 題庫深度擴充與去重抽題（Step 162–163）**
  - **目標檔案**：`src/js/data/items.js`、`content/minimal-pairs.json`、`content/items.json`（<= 3 檔）
  - **規格**：實作滑動視窗去重抽題（同回合不重複、跨最近 N 題不重複，題庫將盡時安全重置循環不得卡死或回傳空陣列）；擴充 `minimal-pairs.json` 與 `items.json` 題量並保持雙語／九軸對稱結構；題庫異常時回退安全預設題不白屏。
  - **Pass**：連續抽取 30 回合 `recentIds` 重複率 = 0（同回合內）；`npm run check:content && npm run test:play` exit 0。

- [x] **T6. 聽覺可及性與語音降級視覺替代（Step 196 基礎, 205–206）**
  - **目標檔案**：`src/js/ui/a11y.js`、`src/js/audio/voice.js`、`src/styles/a11y.css`（<= 3 檔）
  - **規格**：`voice.js` 當 `speechSynthesis` 不可用／靜音／無語音包時回傳可觀測降級狀態並觸發視覺替代提示（大字動作卡／節奏脈衝圖示，禁 emoji）；`a11y.js` 支援「視覺輔助（無聲可玩）」與「單手大目標」切換並寫入偏好；不識字幼兒僅看圖與動效即可完成回合。
  - **Pass**：關閉瀏覽器語音輸出模擬下，視覺提示可見且可完成第 1 關；`aria-live` 正常更新。

- [x] **T7. 觸控目標（>=48px）、長列表分頁懶載入與鍵盤流（Step 127, 149）**
  - **目標檔案**：`src/js/ui/dex.js`、`src/js/ui/levelmap.js`、`src/styles/components.css`（<= 3 檔）
  - **規格**：`.control-btn`/`.mode-option`/`.level-btn`/`.tool-btn`/`.dex-card` >= 48×48px；圖鑑與地圖分頁渲染單次 `<= 24` 節點、圖片 `loading="lazy"`、補齊 Loading 骨架／Empty／局部錯誤重試；樣式引用 `tokens.css`（60/30/10 與 `--s-1`/`--s-2`）；全站 `Tab`/`Shift+Tab`/`Esc` 完整，Mobile `375px` 不溢位。
  - **Pass**：`play-touch-targets` PASS；單次 DOM <= 24 節點；`scrollWidth <= clientWidth`；`npm run check:assets && npm run test:play` exit 0。

- [x] **T8. 成效評量流程接線與家長端報告閉環（Step 157）**
  - **目標檔案**：`src/js/ui/assessment-ui.js`、`src/js/main.js`、`src/js/ui/parent-report.js`（<= 3 檔）
  - **規格**：將孤島 `assessment-ui.js` 接入家長端入口（經家長閘門驗證後方可進入前／後測）；支援中斷保留進度、按鈕防連點鎖、Empty（尚未施測引導）與局部 Error Boundary；評量結果寫入獨立儲存鍵不得汙染兒童遊戲進度。
  - **Pass**：家長端可開啟並完成一次成效評量回寫報告，兒童進度未受影響；`npm run test:play` exit 0。

- [x] **T9a. CSP 安全標頭與輸入驗證（Step 153）**
  - **目標檔案**：`index.html`、`src/js/ui/story.js`、`tools/sweep-logs.mjs`（<= 3 檔）
  - **規格**：`index.html` 加 CSP `meta`（`default-src 'self'`、`script-src 'self'`、`object-src 'none'`、`base-uri 'none'`，禁 `unsafe-eval`）；URL 參數與物件欄位白名單驗證後再渲染，失敗回退安全預設；`sweep-logs.mjs` 掃描模板 `innerHTML`／`eval`／`new Function`／`document.write`。
  - **Pass**：`index.html` 含 CSP 且無 `unsafe-eval`；惡意 URL 參數不觸發腳本（`play-xss-input` PASS）。

- [x] **T9b. 剩餘 32 處 `innerHTML` 清零（Step 153）**
  - **目標檔案**：`src/js/core/sanitize-html.js`、`src/js/ui/dex.js`、`src/js/ui/parent-report.js`（<= 3 檔）
  - **規格**：新增零依賴 `sanitize-html.js`（`escapeHtml`/`safeText`）；將內容型模板插值改 `textContent` 或 DOM 節點組合；保留既有 `aria-label`/`role` 與版面不破版。
  - **Pass**：`npm run sweep` exit 0 且危險 `innerHTML` 掃描 = 0；`npm run test:play` exit 0。

- [x] **T10. PWA 上市基建：OG/SEO Meta、Manifest 與條款入口（Step 168）**
  - **目標檔案**：`index.html`、`content/store-listing.zh-TW.json`、`manifest.json`（<= 3 檔）
  - **規格**：補齊 `og:title`/`og:description`/`og:image`（指向存在圖檔）、Twitter Card、Canonical；`manifest.json` 確認 `id`/`shortcuts`/maskable icon；頁尾補隱私權、服務條款、版本號與聯絡信箱（禁 `example.com`/`TODO`/emoji，>= 48px 觸控，缺欄位降級預設安全文案）。
  - **Pass**：`npm run check:assets && npm run check:content` exit 0；`og:image` 檔案存在於磁碟。

---

## 📌 執行順序與守門
1. **順序**：T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9a → T9b → T10 → L1 → L2 → L3 → L4（已於本輪依序全綠落地）。
2. **禁區**：`:8787` 代理、`docs/roadmap-v13.md`、`content/narrative.*.json`、`tokens.css` 既有值。

## ✅ 落地驗證（本輪結果）
| 守門 | 結果 |
|---|---|
| `npm run typecheck` | exit 0（tsc --noEmit 無錯誤） |
| `npm run lint` | exit 0（0 errors / 0 warnings） |
| `npm run check:content` | PASS（levels 40／items 九軸／題庫深度達標） |
| `npm run check:assets` | PASS（OG／Manifest／條款齊備；離線資產 2.34MB） |
| `npm run sweep` | PASS（0 敏感 Log／0 模板 innerHTML，含 `paywall.js` 回歸把關） |
| `node tools/verify-quality.mjs` | 45/45 PASS（新增 4 項 Round 1 紅線把關） |
| `npm run test:play` | 79/79 PASS（新增 8 項 Round 1 紅線行為測試） |

### 本輪主要產出
- **T1**：`content/privacy.en-US.md`（6828 字元）、Focus Trap、in-flight lock、刪除全部資料。
- **T2**：`service-worker.js` 預快取 `mumu-v4`（260 項全存在）、離線冷啟動回退。
- **T3**：`src/js/ui/pwa-install.js` iOS 三步圖卡 + Android `beforeinstallprompt`。
- **T4**：`src/js/core/vitals.js`（LCP/CLS/INP）、`src/js/core/telemetry.js`（退避佇列 + PII 過濾）。
- **T5**：`src/js/data/items.js` 滑動視窗去重 + `safeFallbackItems`；`content/minimal-pairs.json`（zh-TW 29／en-US 33）、`content/items.json` 九軸擴充。
- **T6**：`src/js/audio/voice.js` 可觀測降級狀態、`src/js/ui/a11y.js` 視覺輔助／單手大目標、`src/styles/a11y.css` 大字卡與節奏脈衝。
- **T7**：`src/js/ui/dex.js`／`levelmap.js` 分頁（<= 24 節點）、事件委派、`loading="lazy"`、Empty／骨架、觸控目標 >= 48px。
- **T8**：`src/js/ui/assessment-ui.js` 獨立儲存鍵 `mumu.assessment.v1`、中斷續答、防連點 token 家長端閉環。
- **T9**：`index.html` 嚴格 CSP、`src/js/core/input-validate.js`、`src/js/core/sanitize-html.js`、危險 `innerHTML` 清零。
- **T10**：`index.html` OG/Twitter/Canonical、頁尾條款入口、`manifest.json` `id`/`shortcuts`/maskable、`content/terms.*.md`。

### Round 1 紅線產出（L1–L4）
- **L1**：`src/js/ui/paywall.js` 全插值 `escapeHtml()`；訂閱點擊 in-flight lock；對話框內誠實回饋 +「我知道了」；Esc／Focus Trap；移除「敬請期待」與「跨裝置同步」（改為本機資料說明）。
- **L2**：`src/js/main.js` `showBootError()` 顯示 `role="alert"` 可見錯誤恢復面板（隱藏 `#start-overlay`、雙語說明、離線提示、重新載入／重新整理鈕、防連點 lock）；`src/styles/components.css` `.boot-error-overlay`。
- **L3**：`src/js/ui/consent-gate.js` `openLegalDocument()` 應用內可捲動條款面板（骨架屏、載入失敗重試鈕、Focus Trap、Esc、>= 48px）；`src/js/main.js` `bindLegalLink()` 攔截頁尾條款點擊（保留 `href` 降級）。
- **L4**：`index.html` 移除 `user-scalable=no`；品牌統一為「木木遊戲：聖誕小幫手」／「木木遊戲」；過關微文案改為「過關了！」。
- **驗證**：`tools/verify-quality.mjs` 新增 `paywall-honest`／`boot-error-recovery`／`legal-panel-in-app`／`brand-viewport-a11y`；`tools/verify-playable.mjs` 新增 8 項行為測試；`tools/sweep-logs.mjs` 將 `paywall.js` 納入 XSS 回歸把關。
