# 公測啟動檢查表

> 用途：免費公測（序章＋第 1–3 章，共 12 關）上線前的可執行清單。
> **免費公測硬性上限 6 個月**（到期前須完成商業化驗證或轉正式收費）。
> 所有標示「**尚未驗證**」的項目，必須在公測期間補齊實測數據。

驗證入口：`npm run check`

---

## 一、產品面

| # | 檢查項 | 驗證方式 | 現況 | 狀態 |
| --- | --- | --- | --- | --- |
| P1 | 首關完成率 ≥ 80% | 公測 cohort 觀察（`first_session_complete` / `session_start`） | 埋點就緒：`content/telemetry.json` | **尚未驗證** |
| P2 | 單次 session ≤ 6 回合 | 追蹤 `session_start` → `level_complete` 的回合數 | 埋點就緒 | **尚未驗證** |
| P3 | 離線開局成功率 100% | 飛航模式冷啟動 10 次 | `service-worker.js`（`mumu-v3` 完整預快取、導覽 network-first→回退 index.html） | **尚未驗證**（實機待測） |
| P4 | emoji 圖示數 = 0 | `node tools/check-assets.mjs` | 掃描 emoji + variation selector，0 命中 | 已驗證 |
| P5 | 素材體積 < 6MB | `node tools/check-assets.mjs` | 離線資產合計 2.87 MB | 已驗證 |
| P6 | 圖鑑 24 隻 × 4 幀步行 | `node tools/check-assets.mjs` | manifest 24 筆、walkFrames 恰 4 幀、檔案皆存在 | 已驗證 |
| P7 | 48 個 SVG icon 齊備 | `ls assets/icons/*.svg \| wc -l` = 48 | 48 個 | 已驗證 |
| P8 | 六種認知玩法可玩 | `node tools/check-content.mjs` | items.json 九軸、levels 40／chapters 6 | 已驗證（靜態）／**玩法互動待實測** |
| P9 | 無障礙選項生效 | 鍵盤走完首關、開啟色覺輔助與減少動畫 | `src/js/ui/a11y.js`、`src/styles/a11y.css` | **尚未驗證**（實機待測） |

---

## 二、流量面

| # | 檢查項 | 驗證方式 | 現況 | 狀態 |
| --- | --- | --- | --- | --- |
| F1 | 分享成果卡三種皆可產生 | 觸發 `buildShareCard(bundle, progress, "learning" \| "dex" \| "puzzle")` | `src/js/ui/share-card.js` 三種 kind 皆已實作 | 已驗證（靜態）／**畫面待實測** |
| F2 | 推薦碼可解析 | 產生碼 → 解析 → 校驗位不符時回傳 null | `src/js/core/referral.js`（8 字元含校驗） | 已驗證 |
| F3 | 分享事件已追蹤 | 檢查 `share_click` 事件參數含 cardKind／channel／referralCode | `src/js/core/telemetry.js` `trackShare()` | 已驗證 |
| F4 | LINE 分享連結可開啟 | 以 LINE 實機點開連結 | `shareToLine()` 產生 `https://line.me/R/msg/text/?text=...` | **尚未驗證**（實機待測） |
| F5 | 分享率目標 8–12% 的埋點就緒 | `share_click` ÷ `session_start` | 埋點已就緒 | 已驗證（埋點）／**數值尚未驗證** |
| F6 | K-factor ≥ 0.5 的歸因鏈路就緒 | `share_install` + `referral_install` 事件 | `content/telemetry.json` 已定義兩事件 | 已驗證（埋點）／**數值尚未驗證** |
| F7 | 分享文案為家長驕傲向 | 人工複核三種卡的文案 | 「孩子已學會辨認 N 組語音對照」等 | 已驗證 |
| F8 | 分享卡不顯示可識別資訊 | 人工複核卡面內容 | 僅統計數字與推薦碼 | 已驗證 |

---

## 三、商業面

| # | 檢查項 | 驗證方式 | 現況 | 狀態 |
| --- | --- | --- | --- | --- |
| C1 | 年訂閱付費牆可走通 | 點訂閱 → 通過家長閘門 → 產生 purchase 事件 | `src/js/ui/paywall.js` → `recordIntent()` → `track("purchase")` | 已驗證（靜態）／**實際金流待串接商店 SDK** |
| C2 | 家長閘門不可繞過 | 連續錯誤答案；長按未滿 3 秒放開 | `src/js/core/parental-gate.js`（算術題 + 長按 3 秒） | 已驗證（靜態）／**實機待測** |
| C3 | 免費邊界為第 0–3 章 | 點第 13 關（章節 4）→ 應導向付費牆 | `FREE_CHAPTERS = [0,1,2,3]`；`isLevelLocked()` | 已驗證（靜態）／**互動待實測** |
| C4 | 意向登記可記錄 | 檢查 `purchase` 事件參數 plan 與 amount | `recordIntent(root, plan, amount)` | 已驗證 |
| C5 | 不提供月訂閱選項 | 檢查付費牆方案清單 | `PLANS` 僅 year（NT$790）與 family（NT$990） | 已驗證 |
| C6 | 免費公測 6 個月上限 | 產品排程 | 已於產品決策中載明 | 已驗證 |

---

## 四、證據面

| # | 檢查項 | 驗證方式 | 現況 | 狀態 |
| --- | --- | --- | --- | --- |
| E1 | assessment 前測可執行 | 開啟家長專區執行前測 | `src/js/ui/assessment-ui.js` `runAssessment()` | 已驗證（靜態）／**流程待實測** |
| E2 | 資料可去識別化匯出 | 檢查匯出 JSON 是否含姓名／時間戳／裝置資訊 | `runner.js` `export()` 僅含 scale／itemId／correct／reactionMs | 已驗證 |
| E3 | 後測題面與前測不同 | `node tools/check-content.mjs` | 前後測選項順序與序列內容皆不同 | 已驗證 |
| E4 | 30 戶招募清單已備妥 | 研究計畫書附錄 | 待建立（研究尚未執行） | **尚未驗證** |
| E5 | 觀察表已備妥 | 研究計畫書附錄 | 待建立 | **尚未驗證** |
| E6 | 成效目標達成判定 | 正確率提升 ≥ 15 個百分點且 p < 0.05 | `content/assessment.json` `protocol.scoring` 已定義 | **尚未驗證**（須 n ≥ 30 實測） |

---

## 五、止損門檻（公測期間監控）

任一條件成立即啟動止損流程，不得靜默放行：

| 觸發條件 | 止損動作 |
| --- | --- |
| D7 留存低於 8%（低於目標 12% 的三分之二） | 暫停外部投放，重做新手流程與首關引導 |
| 最小對成效提升 < 5 個百分點 | 檢視教學與題型設計；若 n ≥ 30 仍無改善，暫停該章節對外推薦 |
| 轉付費率 < 1% | 重測付費牆文案與方案呈現順序，不下調定價（避免錨定污染） |
| 崩潰率 > 1% | 立即發布修補版本，暫停新增功能 |
| 兒少隱私或合規疑慮 | 立即下架對應功能（如定向廣告路徑），48 小時內發布聲明 |
| 免費公測滿 6 個月仍無商業化數據 | 停止擴張，評估轉 B2B 授權或關閉付費牆路徑 |

---

## 六、公測前最終動作（依序）

1. `npm run check` 全數通過（exit code 0）
2. 飛航模式冷啟動測試 × 10（確認離線可開局）
3. 以 LINE 實機測試分享連結開啟
4. 完成家長閘門繞過測試（錯誤答案、長按不足 3 秒）
5. 確認第 13 關導向付費牆而非直接進入
6. 招募 30 戶，執行前測（第 0 天）
7. 第 28 天執行後測，計算正確率差與 p 值
8. 每週更新本表「尚未驗證」項目狀態

---

## 七、明確標註為「尚未驗證」的項目彙總

- 首關完成率 ≥ 80%（P1）
- 單次 session ≤ 6 回合（P2）
- 離線開局成功率 100%（P3）
- 無障礙選項實機生效（P9）
- 分享卡三種畫面呈現（F1）
- LINE 分享連結實機開啟（F4）
- 分享率 8–12%（F5）
- K-factor ≥ 0.5（F6）
- 實際金流走通（C1）
- 家長閘門實機不可繞過（C2）
- 付費邊界互動（C3）
- 成效研究 30 戶招募與執行（E4–E6）
- 上述數據之外的所有成效指標（D7 留存 ≥ 12%、轉付費 ≥ 2.5%、≥55 FPS、−16 LUFS ±1、盲測 5/5）

完整對照見 `docs/acceptance-9.md`。