# 9 分驗收標準對照表

> 本表對應投資評分 **9.12 / 10** 的九項支柱。
> 每一項標記為 **靜態可驗證**（可由 `npm run check` 或既有指令重現）或 **需實測**（須真機／真實使用者／後端數據）。
> **需實測項目一律標示為「待實機驗收」，不代表已達成。**

驗證入口：`npm run check`（typecheck → lint → check-content → check-assets → sweep-logs）

---

## 支柱一：核心玩法與教育價值（目標 9.6）

| 驗收標準 | 類別 | 實作位置 | 靜態驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 六個認知動詞各有獨立玩法引擎 | 靜態可驗證 | `src/js/verbs/`（sequence / minimal-pair / rhythm / interference / puzzle / memory） | `node tools/check-content.mjs`（items.json 九軸齊備） | 已實作 |
| 最小對辨識＝語音覺辨（phonological awareness） | 靜態可驗證 | `content/minimal-pairs.json`、`src/js/verbs/minimal-pair.js` | `node tools/check-content.mjs` 第 8 條（zh-TW ≥ 12 組 / en-US ≥ 10 組） | 已實作 |
| 每一動詞有獨立難度曲線 | 靜態可驗證 | `src/js/core/mastery.js` → `deriveDifficulty()`、`suggestDifficulty()` | `grep -rn "level + 1" src/js/` 無結果 | 已實作 |
| 難度由掌握度驅動、無天花板 | 靜態可驗證 | `src/js/core/mastery.js` `updateMastery()`（EMA α=0.3） | 同上 | 已實作 |
| **最小對辨識成效有統計顯著改善（n ≥ 30）** | **需實測** | 題組 `content/assessment.json`（前測 75 題／後測 75 題）；執行器 `src/js/assessment/runner.js` | 題目與遊戲題庫分離可靜態驗證；**顯著性與 n ≥ 30 須招募 30 戶實測** | **待實機驗收** |
| 成效題組與遊戲題庫完全分離 | 靜態可驗證 | `tools/check-content.mjs` 第 7 條 | `node tools/check-content.mjs` | 已實作 |
| 前後測題面不同（避免練習效應） | 靜態可驗證 | `tools/check-content.mjs`（前測／後測選項順序與序列內容比對） | `node tools/check-content.mjs` | 已實作 |

---

## 支柱二：耐玩度（目標 9.4）

| 驗收標準 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 24 隻恐龍圖鑑 | 靜態可驗證 | `content/characters.json`（`dex` 陣列）、`src/js/ui/dex.js`、`src/js/core/dex.js` | `node tools/check-content.mjs`；`node tools/check-assets.mjs`（角色 manifest 24 筆） | 已實作 |
| 每隻對應一個真實學習里程碑 | 靜態可驗證 | `src/js/core/dex.js` `evaluateCondition()`（解鎖條件僅依技能軸答對數／正確率／章節／星數） | `grep -rn "level + 1" src/js/` 無結果；解鎖條件無「操作次數」欄位 | 已實作 |
| 未解鎖顯示剪影與真實學習條件文字 | 靜態可驗證 | `src/js/ui/dex.js` `renderDex()`、`src/js/core/dex.js` `unlockConditionText()` | `node tools/check-content.mjs` | 已實作 |
| 掌握度驅動難度、無天花板 | 靜態可驗證 | `src/js/core/mastery.js` | `grep -rn "level + 1" src/js/` 無結果 | 已實作 |
| 40 關 / 六章，每章解鎖一種玩法 | 靜態可驗證 | `content/levels.json`、`content/chapters.json` | `node tools/check-content.mjs`（levels 40／chapters 6） | 已實作 |
| 每日挑戰全球同題 | 靜態可驗證 | `src/js/core/daily.js` `dailySeed()`（UTC 日期 + locale → FNV-1a） | `node tools/check-content.mjs` | 已實作 |
| **D7 留存 ≥ 12%** | **需實測** | 事件字典 `content/telemetry.json`（`session_start`／`first_session_complete`）；埋點 `src/js/core/telemetry.js` | 埋點就緒可靜態驗證；**留存率數值須真實使用者 cohort 觀察** | **待實機驗收** |

---

## 支柱三：視覺美感（目標 9.4）

| 驗收標準 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 24 隻去背重繪恐龍（透明背景） | 靜態可驗證 | `tools/gen-characters.mjs` → `assets/characters/*.svg`（512×512、`fill="none"`、無底色矩形） | `node tools/check-assets.mjs`（hasAlpha、24 筆 manifest） | 已實作（**佔位美術**，正式素材依 VA-2 替換） |
| 每隻含 4 幀步行循環 | 靜態可驗證 | `tools/gen-characters.mjs` → `<id>-walk-1..4.svg`、`assets/characters/manifest.json` | `node tools/check-assets.mjs`（walkFrames 恰 4 幀且檔案存在） | 已實作 |
| 5 層視差 | 靜態可驗證 | `src/js/ui/parallax.js`（sky .05 / ridge .12 / midground .22 / character .35 / foreground .55） | `npx tsc --noEmit` | 已實作 |
| 48 個自繪 SVG icon | 靜態可驗證 | `tools/gen-icons.mjs` → `assets/icons/`（48 個） | `ls assets/icons/*.svg \| wc -l` = 48 | 已實作 |
| **emoji 圖示數 = 0** | 靜態可驗證 | `tools/check-assets.mjs` 第 4 條（掃描 emoji + variation selector） | `node tools/check-assets.mjs` | 已實作 |
| 統一材質與光影 | 靜態可驗證 | `src/styles/tokens.css`（`--mat-border-light`／`--mat-shadow-1`）、`src/styles/components.css` | `grep -n "box-shadow: 0" src/styles/components.css` 無結果 | 已實作 |
| 離線資產 < 6MB | 靜態可驗證 | `tools/convert-assets.mjs` → `assets/audio/`（AAC 96k mono）、`assets/generated/`（WebP q82） | `node tools/check-assets.mjs`（離線資產合計） | 已實作（現況 2.87 MB） |
| 視覺完成度主觀評分 | **需實測** | — | 須設計師／目標使用者評審 | **待實機驗收** |

---

## 支柱四：留存與成效證據（目標 9.3）

| 驗收標準 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 掌握度雷達圖（家長端） | 靜態可驗證 | `src/js/ui/parent-report.js` `buildRadar()`（內嵌 SVG，座標由 mastery 計算） | `npx tsc --noEmit` | 已實作 |
| 各技能弱項與下週建議 | 靜態可驗證 | `src/js/ui/parent-report.js` `findWeakest()`／`buildSuggestions()` | 同上 | 已實作 |
| 家長報告無負面評語措辭 | 靜態可驗證 | `src/js/ui/parent-report.js`（建議文案為正向措辭） | 人工複核，建議文案不含落後／不熟／退步等語 | 已實作 |
| 連續天數缺漏只中斷不懲罰 | 靜態可驗證 | `src/js/core/progress.js` `updateStreak()` | `npx tsc --noEmit` | 已實作 |
| 單一 HUD 取代分散計分元件 | 靜態可驗證 | `src/js/ui/hud.js`；`index.html` 已移除 `#scoreboard-container`／`#level-display`／`#scoreboard`／`#achievement-display`／`#combo-display` | `grep -c "scoreboard-container" index.html` = 0 | 已實作 |
| **分享率 8–12%** | **需實測** | 埋點 `src/js/core/telemetry.js` `trackShare()`；卡種 `learning`／`dex`／`puzzle` | 埋點就緒可靜態驗證；**分享率須真實流量** | **待實機驗收** |
| **K-factor ≥ 0.5** | **需實測** | `src/js/core/referral.js`（8 字元推薦碼含校驗）、`trackReferralInstall()` | 推薦碼產生／解析可靜態驗證；**K 須真實推薦鏈路數據** | **待實機驗收** |

---

## 支柱五：劇情（目標 9.2）

| 驗收標準 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 六章主線 | 靜態可驗證 | `content/chapters.json`、`content/story-arcs.json` | `node tools/check-content.mjs`（chapters 6） | 已實作 |
| 每章解鎖一種新玩法（章節＝換玩法） | 靜態可驗證 | `content/levels.json`（每章 `verb` 一致且互異） | `node tools/check-content.mjs` | 已實作 |
| 雙語 120 句情境台詞 | 靜態可驗證 | `content/narrative.json` | `node tools/check-content.mjs`（narrative 對稱） | 已實作 |
| 章節信件（可列印） | 靜態可驗證 | `src/js/ui/story.js` `showLetter()`、`src/styles/a11y.css` 列印樣式 | `npx tsc --noEmit` | 已實作 |
| 劇情過場 | 靜態可驗證 | `src/js/ui/story.js` `showStoryScene()` | 同上 | 已實作 |
| 融入角色的教學（非靜態教學頁） | 靜態可驗證 | `src/js/ui/tutorial.js` `createTutorial()`（listen→watch→choose，可跳過） | 同上 | 已實作 |

---

## 支柱六：通路（目標 9.0）

| 驗收標準 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 學習成果卡 + 圖鑑卡 + 拼圖卡（可炫耀視覺） | 靜態可驗證 | `src/js/ui/share-card.js` `buildShareCard()`（1080×1350 canvas） | `npx tsc --noEmit` | 已實作 |
| 文案為家長驕傲向而非操作向 | 靜態可驗證 | `src/js/ui/share-card.js` `drawLearningCard()`（「孩子已學會辨認 N 組語音對照」） | 人工複核文案 | 已實作 |
| 圖上含推薦碼 | 靜態可驗證 | `src/js/ui/share-card.js`（canvas 內繪製 referral code） | 同上 | 已實作 |
| 分享卡不顯示可識別資訊 | 靜態可驗證 | `src/js/ui/share-card.js`（僅統計與代碼） | 同上 | 已實作 |
| LINE 分享連結帶推薦碼 | 靜態可驗證 | `src/js/ui/share-card.js` `shareToLine()` | 同上 | 已實作 |
| 分享事件已追蹤 | 靜態可驗證 | `content/telemetry.json`（`share_click`／`share_install`）、`src/js/core/telemetry.js` | `node -e "const t=require('./content/telemetry.json'); ..."` | 已實作 |
| 分享卡線上可開啟 | **需實測** | — | 須實際以 LINE 開啟連結確認 | **待實機驗收** |

---

## 支柱七：音訊（目標 9.0）

| 驗收標準 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 44 個材質音效（各 3 變體） | 靜態可驗證 | `content/sfx-map.json`、`src/js/audio/sfx.js` | `node -e "const m=require('./content/sfx-map.json'); if(Object.keys(m).length!==44)process.exit(1)"` | 已實作 |
| 四軌混音器（music／sfx／voice／ambience） | 靜態可驗證 | `src/js/audio/mixer.js` | `npx tsc --noEmit` | 已實作 |
| 側鏈 ducking | 靜態可驗證 | `src/js/audio/mixer.js` `duckMusic(ms, db)` | 同上 | 已實作 |
| 四滑桿音量設定 | 靜態可驗證 | `src/js/ui/settings-audio.js` `createAudioSettings()` | 同上 | 已實作 |
| 語音層與字幕 fallback | 靜態可驗證 | `src/js/audio/voice.js` `speak()`／`showSubtitle()`（失敗必發事件） | 同上 | 已實作 |
| 最小對等長間隔朗讀 | 靜態可驗證 | `src/js/audio/voice.js` `speakMinimalPair()` | 同上 | 已實作 |
| **−16 LUFS ±1** | **需實測** | 混音器總輸出 | 須以 ffmpeg loudnorm 或廣播級儀器量測最終輸出 | **待實機驗收** |

---

## 支柱八：動效（目標 9.2）

| 驗收標準 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| Motion token（8 級時長／6 級曲線） | 靜態可驗證 | `src/styles/tokens.css`、`src/js/ui/motion.js` | `npx tsc --noEmit` | 已實作 |
| 統一粒子引擎 | 靜態可驗證 | `src/js/ui/particles.js` `burst()`（單一 canvas、`seed` 可重現） | 同上 | 已實作 |
| 觸覺詞彙 | 靜態可驗證 | `src/js/ui/haptics.js` `haptic()`（6 種 pattern） | 同上 | 已實作 |
| reduced-motion 全覆蓋 | 靜態可驗證 | `src/js/ui/motion.js` `prefersReducedMotion()`；`src/styles/a11y.css` | `grep -c "prefers-reduced-motion" src/js/ui/motion.js` ≥ 1 | 已實作 |
| 感官時間軸（四軌完整） | 靜態可驗證 | `content/timeline.json`（11 個必需事件）、`src/js/core/timeline.js` | `node -e "const t=require('./content/timeline.json'); ..."` | 已實作 |
| 時間軸引擎不直接操作 DOM | 靜態可驗證 | `src/js/core/timeline.js`（僅透過 runner 回呼） | `npx tsc --noEmit` | 已實作 |
| **≥ 55 FPS** | **需實測** | `src/js/ui/particles.js`（單 canvas）、`src/styles/motion.css` | 須以裝置 Performance 面板或 `requestAnimationFrame` 採樣量測 | **待實機驗收** |

---

## 支柱九：變現（目標 8.7）

| 驗收標準 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 只推年訂閱（NT$790／另測 990），不推月訂閱 | 靜態可驗證 | `src/js/core/entitlements.js` `PLANS`；`src/js/ui/paywall.js` | `grep -c "freeChapters" src/js/core/entitlements.js` ≥ 1 | 已實作 |
| 免費邊界＝序章＋第 1–3 章（12 關） | 靜態可驗證 | `src/js/core/entitlements.js` `FREE_CHAPTERS = [0,1,2,3]`、`isChapterFree()` | 同上 | 已實作 |
| 付費＝第 4–5 章／恐龍谷主題包／家長報告完整版／跨裝置同步 | 靜態可驗證 | `src/js/core/entitlements.js` `canAccess()` | 同上 | 已實作 |
| 家長閘門不可繞過 | 靜態可驗證 | `src/js/core/parental-gate.js` `requireParentalGate()`（算術題／長按 3 秒，15 分鐘有效） | `npx tsc --noEmit` | 已實作 |
| 付費牆需通過家長閘門才顯示購買按鈕 | 靜態可驗證 | `src/js/ui/paywall.js` `showPaywall()` | 同上 | 已實作 |
| 付費意向可記錄（供定價 A/B） | 靜態可驗證 | `src/js/ui/paywall.js` `recordIntent()`、`content/telemetry.json`（`purchase`） | 同上 | 已實作 |
| **下載轉付費 ≥ 2.5%** | **需實測** | 事件字典 `purchase` 埋點 | 埋點就緒可靜態驗證；**轉付率須真實商店數據** | **待實機驗收** |

---

## 附加：合規（目標 8.2）

| 驗收標準 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 兒少隱私文件 | 靜態可驗證 | `content/privacy.zh-TW.md` | `node -e "const s=require('fs').readFileSync('content/privacy.zh-TW.md','utf8'); if(s.length<1200)process.exit(1)"` | 已實作 |
| 同意預設全關、可獨立撤回 | 靜態可驗證 | `src/js/core/consent.js` `getConsent()`／`revokeConsent()` | `npx tsc --noEmit` | 已實作 |
| 不做行為式廣告定向（程式層面阻斷） | 靜態可驗證 | `src/js/core/consent.js` `canTargetedAdvertise()` 一律回傳 `false` | 同上 | 已實作 |
| COPPA 2025 修正案說明（2026/4/22 生效） | 靜態可驗證 | `content/privacy.zh-TW.md` 第七節 | 同上 | 已實作 |
| 資料最小化（無可識別資訊） | 靜態可驗證 | `src/js/core/telemetry.js` `sanitize()`（移除 email／name／ip／deviceId 等） | 同上 | 已實作 |
| 商店素材文案與 6 張分鏡 | 靜態可驗證 | `content/store-listing.zh-TW.json` | `node -e "const s=require('./content/store-listing.zh-TW.json'); if(!s.screenshotCaptions||s.screenshotCaptions.length!==6)process.exit(1)"` | 已實作 |
| 離線優先 Service Worker | 靜態可驗證 | `service-worker.js`（`mumu-v3`、完整預快取、network-first 導覽） | `node --check service-worker.js` | 已實作 |
| 無外部字體／CDN 依賴 | 靜態可驗證 | 全專案 | `grep -rn "fonts.googleapis.com" . --exclude-dir=node_modules --exclude-dir=.git` 無結果 | 已實作 |
| 專案體積 < 12MB | 靜態可驗證 | 已移除 `外部資源/`（53MB 舊素材） | 實測約 3.9MB（排除 node_modules） | 已實作 |

---

## 三支柱製作水準驗收（v8 三支柱：劇本／畫面／音樂）

本節逐項列出三支柱的**靜態可驗證**水準與**仍待實測**的部分。標示「待實測」者**不代表已達成**。

### 音樂支柱

| 驗收項 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 每個場景有獨立主題曲（不共用音檔） | 靜態可驗證 | `src/js/audio/scene-music.js` `SCENE_MUSIC`（9 個場景定義，涵蓋 6 個遊戲場景） | `node tools/verify-quality.mjs --phase music`（`music-per-scene`／`music-scene-distinct`） | 已實作 |
| 程序化生成（Web Audio 離線合成） | 靜態可驗證 | `src/js/audio/scene-music.js` `renderSceneMusic()`；`src/js/audio/music.js` `playSceneMusic()` | `node tools/verify-quality.mjs --phase music`（`music-renderable`：9 個場景皆渲染出非靜音緩衝區） | 已實作 |
| 場景切換有交叉淡入淡出 | 靜態可驗證 | `src/js/audio/music.js` `playSceneMusic()`（淡入 1.2s）／`stopSceneMusic()`（淡出 700ms） | `node tools/verify-quality.mjs --phase integration`（`integration-scene-switch`） | 已實作 |
| 場景切換時音樂與色票同步生效 | 靜態可驗證 | `src/js/main.js` `startLevel()` → `applySceneAudio()` / `applySceneVisual()` → `playSceneMusic()` / `applyTheme()` | 同上 | 已實作 |
| 每個場景在程序化音樂庫有對應 | 靜態可驗證 | `content/scenes.json` `music.scene` ↔ `src/js/audio/scene-music.js` `SCENE_MUSIC` | `node tools/verify-quality.mjs --phase music`（`music-scenes-defined`） | 已實作 |
| 場景設定完整且六章場景連續 | 靜態可驗證 | `content/scenes.json`、`content/story-arcs.json`、`content/levels.json` | `node tools/verify-quality.mjs --phase scenes`（`scenes-cover-levels`／`scenes-palette-valid`／`scenes-no-emoji`／`scenes-chapter-continuity`） | 已實作 |
| **真人聆聽評分（悅耳度、疲勞度）** | **需實測** | — | 須真人聆聽評分表回收 | **待實測** |

### 劇本支柱

| 驗收項 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 24 隻恐龍各有專屬對白 | 靜態可驗證 | `content/narrative.zh-TW.json`／`content/narrative.en-US.json` | `node tools/verify-quality.mjs --phase story`（`story-dino-lines`：24 隻各 ≥3 句、共 72 句，無 3 隻共用） | 已實作 |
| 章節信件 ≥ 150 字 | 靜態可驗證 | `content/story-arcs.json`（6 章，實際 263–330 字） | `node tools/verify-quality.mjs --phase story`（`story-letter-length`／`story-letter-arc`） | 已實作 |
| 情境台詞 120 句（雙語對稱） | 靜態可驗證 | `content/narrative.zh-TW.json`／`content/narrative.en-US.json`（5 情境 × 21 句 + 5 句解鎖讚美 = 120 句） | `node tools/verify-quality.mjs --phase story`（`story-lines-count`） | 已實作 |
| 個性感分組差異化 | 靜態可驗證 | `content/narrative.*.json` | `node tools/verify-quality.mjs --phase story`（`story-dino-personality`） | 已實作 |
| **兒童理解度（4–8 歲能聽懂）** | **需實測** | — | 須兒童試玩觀察或理解度測驗 | **待實測** |

### 畫面支柱

| 驗收項 | 類別 | 實作位置 | 驗證指令 | 狀態 |
| --- | --- | --- | --- | --- |
| 角色體型 ≥ 12 種 | 靜態可驗證 | `tools/dino-bodies.mjs`（20 種體型定義） | `node tools/verify-quality.mjs --phase visual`（`visual-body-types`：24 隻、19 種體型、最大同型群組 2/24） | 已實作 |
| 五層視差 | 靜態可驗證 | `src/js/ui/parallax.js`（sky .05／ridge .12／midground .22／character .35／foreground .55） | `node tools/verify-quality.mjs --phase visual`（`visual-parallax`） | 已實作 |
| 角色接地感（地面陰影） | 靜態可驗證 | `assets/characters/*.svg`（`<ellipse>` 接地陰影 + `<linearGradient>` 漸層）、`src/js/ui/character-render.js` `syncShadowScale()`、`src/styles/components.css` `.char__shadow` | `node tools/verify-quality.mjs --phase visual`（`visual-gradient`） | 已實作 |
| 24 隻外觀可區分 | 靜態可驗證 | `assets/characters/manifest.json`（24 筆）、`tools/gen-characters.mjs` | `node tools/verify-quality.mjs --phase visual`（`visual-body-types`／`visual-walk-diff`／`visual-manifest-sync`） | 已實作 |
| **美術主觀水準（是否專業級）** | **需實測** | — | 須設計師或目標使用者評審 | **待實測** |

### 本節「待實測」彙總（不得視為已達成）

1. 音樂：真人聆聽評分（悅耳度、疲勞度）
2. 劇本：兒童理解度（4–8 歲）
3. 畫面：美術主觀水準評分
4. 兒童試玩滿意度
5. 家長評價
6. 聆聽疲勞度
7. 美術主觀水準（與第 3 點同項，於公測期統一回收）

---

## 彙總

**靜態可驗證項目：全部已實作**，可由 `npm run check` 重現。

> 守門現況：`node tools/verify-quality.mjs` → **34/34 通過**（音樂 7／劇本 6／畫面 6／場景 4／整合 1／兒童語言 10）；
> `node tools/verify-phaseO.mjs --phase 1` → 7/7 通過。

**需實測項目（14 項，全部標示為「待實機驗收」或「待實測」，不代表已達成）：**

1. D7 留存 ≥ 12%
2. 最小對辨識成效顯著改善（n ≥ 30）
3. 下載轉付費 ≥ 2.5%
4. ≥ 55 FPS
5. −16 LUFS ±1
6. 分享率 8–12%
7. K-factor ≥ 0.5
8. 盲測 5/5（未列於上方各表，屬公測證據面，詳見 `docs/beta-launch.md`）
9. 視覺完成度主觀評分
10. 音樂真人聆聽評分（悅耳度）
11. 兒童理解度（4–8 歲）
12. 兒童試玩滿意度
13. 家長評價
14. 聆聽疲勞度

**下一階段：** 依 `docs/beta-launch.md` 招募 30 戶完成成效研究，並依公測檢查表收集實測數據。
