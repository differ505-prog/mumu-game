# 木木遊戲 — 商業上市設計系統與微文案規範 (`docs/DESIGN_SYSTEM.md`)

> 單一事實來源（SSOT）：所有視覺與動效數值以 `src/styles/tokens.css` 為準，嚴禁裸寫色碼、px 間距或毫秒數，且不得更動既有 token 數值。

## 1. 色彩體系（60 / 30 / 10 原則）
- **60% 背景主調（冬夜安全感）**：`--bg-scene` (`#0a1a3c`)、`--bg-panel` (`#16294f`)、`--bg-elevated` (`#1d3358`)
- **30% 內容與文字層級（高對比 >= 4.5:1）**：`--text-primary` (`#f7fbff`)、`--text-secondary` (`#cfe4f2`)、`--text-muted` (`#a9c6d8`)、`--border-soft` (`rgba(207, 228, 242, .22)`)
- **10% 行動與回饋強調色**：
  - 主 CTA / 聚焦框：`--accent-warm` (`#f1c40f`)、`--focus-ring` (`#f1c40f`)
  - 次要互動：`--accent-cool` (`#2980b9`)
  - 語意回饋：成功 `--c-green-500` (`#27ae60`)、溫和提示 `--c-amber-500` (`#f39c12`)、角色主題 `--c-dino-green` / `--c-dino-teal` / `--c-dino-amber`
- **禁止事項**：禁止使用刺眼 AI 霓虹漸層或過重陰影；一律使用 `--mat-border-light`、`--mat-shadow-1`、`--mat-shadow-2`。

## 2. 網格、圓角與字級韻律
- **4px / 8px 間距網格**：`--s-1` (4px) 至 `--s-10` (40px)；按鈕間距至少 `--touch-gap` (8px)。
- **圓角規範**：`--r-sm` (8px)、`--r-md` (12px)、`--r-lg` (20px)、`--r-full` (999px)。
- **字級階梯**：`--fs-xs` (12px)、`--fs-sm` (14px)、`--fs-md` (16px)、`--fs-lg` (20px)、`--fs-xl` (26px)、`--fs-2xl` (32px)；字體採用 `--font-ui` 系統字體堆疊，嚴禁引入外部 CDN 字體。
- **零 Emoji 原則**：全站所有圖示必須使用 `assets/icons/*.svg` 自繪 SVG，嚴禁使用 Unicode Emoji。

## 3. 互動狀態、多端斷點與無障礙（A11y）
- **觸控熱區**：所有可點擊元件（`.control-btn`、`.mode-option`、`.level-btn`、`.tool-btn`、`.dex-card`、頁尾連結）須達 `>= 48×48 CSS px`（透過 `--touch-min` 或 padding/`::after` 擴充）。
- **響應式斷點（`src/styles/responsive.css`）**：
  - 直向手機（`orientation: portrait`，含 `375px` 寬度）：單欄佈局、禁止水平捲軸（`scrollWidth <= clientWidth`）。
  - 橫向緊湊（`orientation: landscape` 且 `max-height: 800px`）：`--touch-min: 56px`，6 欄選項格。
  - 寬螢幕（`min-width: 1200px`）：置中上限 `--content-max: 1100px`。
- **動效與降級**：一律使用 `--t-instant` (80ms) 至 `--t-epic` (2000ms) 與 `--e-standard` / `--e-spring`；必須尊重 `prefers-reduced-motion` 與 `[data-reduced-motion="on"]`，禁止以 `setInterval` 驅動動畫。
- **鍵盤與對話框**：全站支援 `Tab` / `Shift+Tab` / `Esc` 與 `:focus-visible`；`role="dialog"` 必須具備 Focus Trap，且首次家長同意閘不可按 `Esc` 繞過。

## 4. 極端邊界狀態標準
- **Loading**：非同步面板（圖鑑、同意政策、評量）須顯示骨架屏（如 `.dex-entry--skeleton`）或明確載入狀態，禁止白屏。
- **Empty**：尚無資料（未解鎖圖鑑、未施測評量）須顯示溫和引導文案與明確行動按鈕。
- **Error / Offline**：任何子面板異常須由局部 Error Boundary 攔截並提供「重試」按鈕，嚴禁整頁白屏；離線時顯示 `.offline-notice` 友善提示。
- **防連點鎖定**：送出、刪除資料、安裝 PWA 與評量提交按鈕在進行中必須設為 `disabled`（in-flight lock）。

## 5. 商業級微文案規範（雙層語氣）
- **兒童層（3–6 歲）**：零評量術語、零負面懲罰（答錯使用 `hint` 溫和引導，禁倒數／扣分／「答錯」驚嚇詞），動作詞簡短直覺（如「聽一聽」「換你了」）。
- **家長層（信任與合規）**：誠實透明、清楚說明「資料僅儲存在本機裝置、無兒少定向廣告、可隨時撤回或刪除」；**嚴禁殘留 `TODO`、`Lorem ipsum`、`敬請期待`、`example.com` 或原始錯誤堆疊**。
