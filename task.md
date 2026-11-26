# 木木遊戲 — 真實瀏覽器上市成熟度最終打磨任務書 (`./task.md`)

## 📊 上市產品成熟度驗收儀表板（Round 3 真實瀏覽器實測）
- **當前輪次**：Round 3（不限輪數，必須**真實瀏覽器截圖驗收 >= 9.0 / 10.0** 且零紅線才准結案）
- **最新總分**：**6.8 / 10.0**（進步顯著：0 JS 錯、0 4xx、無故事滲漏、手機直橫向工具列全通；剩 5 項精確視覺與資料瑕疵待清零）
- **五維度明細**：核心價值閉環 **1.4/2.0**｜視覺品牌信任 **1.3/2.0**｜微互動多端適配 **1.4/2.0**｜極端邊界韌性 **1.4/2.0**｜商業細節合規 **1.3/2.0**。
- **禁區**：嚴禁觸碰 `:8787` 代理；禁改 `docs/roadmap-v13.md`、`content/narrative.*.json`、`tokens.css` 既有值；禁 emoji；實作階段嚴禁 `git commit`/`git push`。

---

## 🎯 Round 3 待清零實機瑕疵清單（Z1–Z5，全部完成後轉 `[?]`）

- [!] **Z1. 修復關卡地圖第 2 頁錯亂資料、「返回」間距與暗色捲軸**
  - **檔案**：`src/js/ui/levelmap.js`、`src/styles/components.css`
  - **Before -> After**：
    - `levelmap.js:54-72`：目前 `firstOfEachChapter` 會在第 2 頁塞入第 0/1/2 章孤立卡片（關卡 1/5/13）並把關卡 21 排在 28 後面；改為**僅依當頁切片渲染**（第 1 頁 1–24、第 2 頁 25–40，嚴格遞增不重複）。
    - `components.css`：`.levelmap` `padding-top: 84px` 讓右上角「返回」與「家長報告」保留清楚間距；微調章節卡片內距使 1280×800 下分頁列完整露出不截切；`#levelmap-root` 加暗色細捲軸（消除原生白色捲軸）。

- [!] **Z2. 消除第 1 關頂部 HUD 文字碰撞、底部殘留白邊與直向背景接縫**
  - **檔案**：`src/styles/base.css`、`src/styles/responsive.css`、`src/styles/a11y.css`
  - **Before -> After**：
    - `base.css:520`：`#status-text` 原本 `top: var(--s-4)`（16px）與 `#hud`（`序章… 星星 0/3`）及 `#visual-fallback` 碰撞；改為 `top: 52px`（手機直向 `top: 48px`），並讓 `#visual-fallback` 置於 `top: 92px` 以下，確保三者在 1280×800、375×812、812×375 零重疊。
    - `base.css` / `responsive.css`：`#tv-view` 與 `#game-container` 加 `overflow: hidden`，並修正手機橫向（`812×375`）底邊 4px 殘留白字與左側邊條、手機直向（`375×812`）中段背景硬切線。

- [!] **Z3. 修復開始畫面 `#app-footer` 被遮罩壓暗問題**
  - **檔案**：`src/styles/components.css`、`src/styles/base.css`
  - **Before -> After**：
    - 目前開始畫面 `#start-overlay`（`z-index: 40`）壓在 `#app-footer`（`z-index: 10`）上方，導致頁尾法律連結暗到看不見。
    - 改法：非遊玩狀態（開始畫面顯示時）讓 `.app-footer` 具備 `position: fixed; left: 0; right: 0; bottom: 0; z-index: calc(var(--z-overlay) + 5);` 且高對比淺色字，遊玩期間（`body.is-playing`）則維持 `display: none`。

- [!] **Z4. 統一視覺圖卡與答案鈕 1:1 視覺配對、修復「重播」顯示圖卡與故事 CTA 文案**
  - **檔案**：`src/js/main.js`、`src/js/ui/a11y.js`、`src/js/ui/story.js`
  - **Before -> After**：
    - 答案鈕上的序號徽章（`1`/`2`/`3`）改為獨立定位不壓到圖示，且改用與 `#visual-fallback` 圖卡**1:1 同色同序號同形狀徽章**（移除把「羊」配成雪花、「鳥」配成禮物盒的錯亂圖示）。
    - 點擊「重播」按鈕時，若語音不可用或視覺輔助開啟，必須立即重新顯示當題 `#visual-fallback` 視覺圖卡。
    - `story.js`：當語音不可用時，故事彈窗 CTA 立即顯示「繼續」／「開始冒險」，不得卡在「正在說…」。

- [!] **Z5. 確保設定頁包覆 `.settings-card` 容器與標題、並升級 SW 至 `mumu-v5`**
  - **檔案**：`src/js/main.js`、`src/js/ui/settings-audio.js`、`service-worker.js`
  - **Before -> After**：
    - `main.js` + `settings-audio.js`：確保 `#audio-settings-root` 開啟設定時，所有滑桿與 5 顆操作鈕皆包覆在置中的 `.settings-card` 卡片容器內並含清楚 `設定` 標題。
    - `service-worker.js`：`CACHE_NAME` 升為 `mumu-v5`，對 `.css`／`.js` 改採 `network-first`（離線回退快取），避免回訪用戶首次開啟吃到舊版樣式。

---

## 📌 驗收標準
- 執行 `npm run check && node tools/verify-quality.mjs && npm run test:play` 全綠後，將 `Z1`–`Z5` 改為 `[?]`（禁止 `git commit`/`git push`）。
