# 木木遊戲 — 上市級成熟度躍升專案（v11.0 · 目標 9.0+）

> **本清單取代 v9、v9.5 與 v10.6 提案。**
> v9 只解決「能玩」，v9.5 定義了「上市級 9 分」，
> v10 把它展開為可獨立執行的原子步驟，v10.6 補上體驗與品牌面向，
> **v11 修正 v10.6 計分機制本身的漏洞，並補上「護城河」這個從未被評估過的面向。**
>
> **v11.0 更新（2026-11-19 · 大公司 UI/UX 總監二次評審）**
>
> v10.6 自我評 **9.2 分**。二次評審以「上市後能不能活」重新計分，
> 實測結果是 **7.6 分**，比 v10.6 的自我評低 **1.6 分**。
> 差距**不是因為 v10.6 做得不夠多，而是因為 v10.6 的計分方式允許「空轉得分」。**
>
> **二次評審的三個發現（v11 的全部成因）：**
>
> 1. **Phase N 有六成產出物是 Markdown 文件，不是畫面。**
>    Step 171 的規範自己寫著「不得順手重構元件視覺」——
>    **規格寫完，畫面不變。** 一份沒有被實作的設計系統，
>    在第 8 週、第 20 週、第 30 週都不會改變孩子看到的一個像素。
>    但 v10.6 卻在 Step 171 完成後就把成熟度從 8.3 加到 8.6。**成熟度不該由文件數量決定。**
>
> 2. **Phase N 的守門機制允許整段空轉，且仍拿滿分。**
>    規則閉合如下：
>    ```
>    招募不到 → Step 177 標「未執行」
>     → Step 178 所有發現標 deferred（理由：研究未執行）
>      → 守門只檢查「Blocker/Major 的 open = 0」→ deferred 不算 open → PASS
>       → Step 179 落地 0 條修正 → PASS
>        → M23 / M24 / M26 全部 PASS → 成熟度 9.2
>    ```
>    **整條 Phase N 可以完全沒有任何一個孩子參與、沒有任何一條真實發現，
>    所有守門全綠，成熟度照拿 9.2。**
>    這**直接違反 v10.6 自己在 Step 182（現 v11.0 為 Step 194）寫下的禁令**：
>    「嚴禁把待實測項目寫成已達成（兒童滿意度、家長評價…）」。
>    M23／M24 本質上就是「兒童滿意度／家長評價」，
>    但守門機制讓它們可以被空轉過關。
>    **v10.6 的意圖是誠實的，機制不是。v11 把機制補上。**
>
> 3. **「成熟度」從未被定義為「差異性」，護城河整面向缺席。**
>    M1–M27 共 27 條條件，**沒有一條是「孩子為什麼明天還想玩，而且非這個不可」。**
>    Phase L 修完 D15–D23（資料、流程、法規、原生打包）之後，
>    **孩子端體驗幾乎沒有改變**。
>    成熟度 ≠ 差異性：一個可以上架、可以收費、可以合規、可以量測的產品，
>    如果沒有護城河，上架三個月就會在商店裡被淹沒。
>
> **v11.0 的三條核心紀律：**
> 1. **成熟度必須由「可見的產品變更」承載，不由文件數量承載。**
>    任何 Step 若其產出物無法被一個孩子、一個家長或一個審查員**看見／讀到／付費**，
>    它就不得被計入成熟度分數。
> 2. **研究沒做就是沒做。守門必須證明「研究確實發生」，
>    而不是證明「研究文件格式正確」。**
>    `deferred` **不得**用於通過成熟度條件。做不到就誠實記低分。
> 3. **上市 = 能收費 + 有人願意付費 + 一年後還活著。**
>    前兩項 v10.6 已大致解決，**第三項（護城河）完全缺席**，v11 補上。
>
> **對象：低階模型。** 每一步都必須可獨立執行、可獨立驗證、**不可跳步**。
> 每一步都附「可重現的驗證指令」與「通過標準」。
>
> **現況成熟度：4.2 / 10**
> **v10.6 落地後（自我評）：8.3 ／ 二次評審實測：7.6**
> **v11 目標：9.0 / 10**
> **工期：54.5 週（約 12.6 個月）／2–3 人全職**
> （v10.6 的 45 週 + Phase N 加長 2 週 + Phase P 4.5 週 + Phase Q 4.5 週 + Phase O 加長 0.5 週）

---

## 決策者摘要（v11.0）

| 問題 | 答案 |
| --- | --- |
| 這份清單做完，產品能上市嗎？ | **能，而且不會被下架。** M1–M18 全部 PASS 代表技術面、合規面、金流面、觀測面都不會被卡。 |
| v10.6 說做完 9.2 分，為什麼二次評審只給 7.6？ | 因為 **v10.6 的成熟度條件可以空轉得分**。Phase N 的六成產出物是文件而非畫面，且研究未執行時守門仍會 PASS。詳見下文「v10.6 的三個發現」。 |
| v11 具體改了什麼？ | **①** 每個成熟度條件改為「可見產出物」型；**②** 新增 `benchmark-executed` 硬性守門，`deferred` 不得用於通過成熟度條件；**③** 新增 **Phase P（商業可行性：定價／家庭方案／留存）** 與 **Phase Q（護城河：教研背書／縱深內容／家長黏性）**；**④** Step 177 改為**競品標竿研究**（不做真人訪談）。 |
| 新增 Phase P/Q 之後會是幾分？ | **9.0**（標竿研究完成且修正落地）／ **8.4**（標竿研究未完成，如實標記）。**因為不做真人訪談，最大外部依賴已被移除 —— 剩下 0.6 分差距只由「標竿研究是否做扎實」造成。** |
| 最不能省的一步？ | **Step 178、Step 183、Step 185。** 前者決定「有沒有依據」，後兩者決定「收不到錢、留不住」。 |
| 最大的外部風險？ | **原生 IAP 憑證與商店帳號**（Phase L／H 外部依賴）。**標竿研究與定價對照已無招募風險。** |
| 最大的內部風險？ | **Phase N 的「規格先行、實作後置」排程。** v11 已把每個設計 Step 綁定一個必須產生的畫面變更，且 Step 179 的檔案上限放寬到 12 檔、Phase N 工期拉長到 9 週。若這兩項沒落實，修正會被塞回文件。 |
| **不做真人訪談，會少什麼？** | **少「孩子喜不喜歡」「家長願不願意付費」的第一方證據。** 這兩項**永遠不得宣稱**（見執行守則第 19 條）。但**不影響上市** —— 同業多數產品上架前也沒有第一方幼兒測試。**影響的是誠實度，不是可行性。** |
| **不做真人訪談，會多什麼？** | **① 移除整份計畫最大的外部依賴**（招募 2–3 週前置作業，可能失敗）；**② 依據來自已被市場驗證的產品**，深度可達（可拆解競品的定價、留存機制、失敗處理）；**③ 工期可預測**。 |

> **一句話**：Phase A–L 讓產品「**不會出事**」，Phase N 讓產品「**有依據**」，
> Phase P 讓產品「**收得到錢、留得住**」，Phase Q 讓產品「**一年後還活著**」。
> **四者缺一，成熟度就卡在 9 分以下。**
>
> **注意措辭**：Phase N 讓產品「有依據」而不是「被喜歡」——
> 因為本專案不做真人研究，**「被喜歡」是上市後才能知道的事**。

---

## v10.6 的三個發現（v11 的成因，詳解）

### 發現 1：六成產出物是 Markdown，卻被計入成熟度

| Step | 核心產出物 | 性質 | 是否改變使用者所見 |
| --- | --- | --- | --- |
| 171 | `docs/design-system.md` | 文件 | **否**（規範明令不得順手改視覺） |
| 172 | `docs/visual-direction.md` + `scenes.json` 加欄位 | 文件 | 部分（加欄位，不改畫面） |
| 173 | `docs/brand.md` + `brand.json` | 文件 | **否**（只定義規範） |
| 174 | `docs/store-presentation.md` + ASO 表 | 文件 | **否** |
| 175 | 12 個遙測事件接線 | **工程** | 否（但使體驗可量測 ✅） |
| 176 | `docs/ux-metrics.md` | 文件 | 否 |
| 177 | `docs/benchmark/` 標竿分析 | **研究（第三方）** | 否（但決定後續方向 ✅） |
| 178 | `docs/benchmark/fixes.md` | 文件 | 否 |
| 179 | 落地修正 | **工程** | **是** ✅ |

**九個 Step 裡，六個的核心產出物是 Markdown。**
`docs/design-system.md` 對使用者的價值是零 ——
它的價值在於「讓工程師不要各自發明一套」，
而這個價值**只有在後續二十個 Step 真的依照它寫出來的時候才實現**。

**v11 的修正**：每個成熟度條件 M19–M27 都追加「**可見產出物**」欄位，
且新增 `design-implemented` 守門 ——
**斷言 `docs/design-system.md` 中定義的每一項，都能在 `src/styles/` 或 `src/js/ui/` 找到對應實作。**
文件與實作脫節 = 該條件 FAIL。

### 發現 2：守門機制允許空轉（最嚴重）

已於開頭展示完整閉合路徑。**v11 的修正**：

- 新增 `benchmark-executed`（帶 `phase: "ux"`）：
  斷言 `docs/benchmark/products/` ≥ 6 款標竿分析、`patterns.md` ≥ 8 條可轉移模式、
  每份分析含 URL 與擷取日期、且至少 1 條 Blocker 與 1 條 Major 發現。
- **廢除 `deferred` 通過成熟度條件的合法性**：
  M23／M24／M26 的守門改為「**發現編號存在於 fixes.md 且狀態為 `fixed`**」，
  `deferred` 一律不計為通過。
- **新增降級機制**：若標竿研究確實無法完成，
  **M23／M24 標為 NOT MET，成熟度記 8.4 分，並在 `docs/acceptance-9.md` 明列缺口。**
  這是誠實的記低分，**優於空轉得分**。

> **v11.0 的研究方法變更（重要）**：
> 本專案**不做真人訪談與幼兒觀察式測試**（專案決策）。
> Step 177 因此改為**競品標竿研究**：拆解已在市場上被驗證成功的兒童教育遊戲，
> 萃取其設計決策與可轉移模式，轉成本專案的具體規格。
>
> **這個替換解決了什麼**：
> - ✅ 移除了整份計畫**最大的外部依賴**（招募 2–3 週前置作業，可能失敗）。
> - ✅ 保留了「有依據」這個原則 —— 且依據來自**已被市場驗證**的產品。
> - ✅ 可對照的深度更高（可實際拆解競品的定價、留存機制、失敗處理）。
>
> **這個替換損失了什麼（必須誠實記錄）**：
> - ❌ **無法證明「我們的孩子喜歡」** —— 這是第一方資料才有的能力。
> - ❌ 存在**存活者偏差**（只看活下來的產品）。
> - ❌ 標竿的市場、文化背景、預算與本專案不同。
>
> **因此 v11.0 必須做三件事**：
> 1. **M23／M24 的定義必須改寫**（見附錄 C）——
>    從「孩子喜歡／家長願意付費」改為「**市場驗證過的模式已採納且已落地**」。
> 2. **新增 M32：研究限制已明示** —— 強制要求把「無第一方資料」寫在驗收文件上。
> 3. **新增一條永久性的宣稱禁令**（見執行守則第 19 條）：
>    「孩子喜歡我們的遊戲」**永遠不允許宣稱**。
>    這個限制不影響上市 —— 同業多數產品在上架前也沒有第一方幼兒測試；
>    **影響的是誠實度，不是可行性。**

### 發現 3：護城河整面向缺席

M1–M27 全部在問「能不能」，沒有一條在問「**會不會被取代**」。
v11 新增 **Phase P**（定價基準、家庭方案、留存機制、家長週報）與
**Phase Q**（教學法依據、縱深內容排程、場景擴張），
共八個 Step 對應「別人抄不走」的問題。
新增成熟度條件 **M28–M32**。

> **最具體的一個證據**：本專案現況的 40 關 × 3 回合 × 8 秒 ≈ **16 分鐘**純練習，
> 而每日挑戰若設 3 題，題庫需 **≥ 1,095 題**才能撐滿一年 ——
> 但 Phase L 擴充後的題庫只有 54 × 2 筆 minimal-pair + 其他玩法，
> **約 18 天就會耗盡**。這是本專案最被低估的營運風險（V2／W2）。

---

## 狀態（2026-11-19）

> **v10 尚未開始。** v8（Step 81–108）已完成；v9（Step 109–131）**未執行**，
> 規格已整合進本清單。
>
> **v8 的失敗教訓（必須記住）**：v8 的守門 34/34 全 PASS，
> 但遊戲有 **9/40 關永遠卡死**（`check()` 恆回傳 false）。
> 根因是守門驗「檔案裡有這些字串」，不是「遊戲能玩」。
> **本清單的核心紀律：每一步的驗證都必須能「實際跑一遍遊戲」。**
>
> **v10.5 的第二個教訓（v10 全綠後才會暴露）**：
> 守門全綠**不等於**產品成熟。v10 涵蓋了軟體品質的全部面向，
> 但**沒有觸碰內容深度與平台落地** —— 這兩件事在 v10 落地後仍會讓成熟度停在 8.4 分。
> **成熟度不只是「軟體品質」，內容是否夠用、能不能真的上架收錢，同樣是成熟度。**
>
> **v10.6 的第三個教訓（v10.5 評審）**：
> v10.5 在工程、合規、金流、觀測上已經足以上市（約 8.3 分），
> 但**沒有任何一個 Step 在做「比同業更好的體驗」**。
> 18 條成熟度條件 M1–M18 全部是「可驗證的有／無」型，
> 卻無法回答上市審查與市場會問的三個問題：
> **「孩子會不會喜歡？」「家長為什麼訂閱？」「這看起來像不像一個品牌？」**
> **成熟度分數衡量的是「零缺陷」，不是「被喜歡」。這兩者之間的差距，就是 Phase N 的全部內容。**
>
> **v11.0 的第四個教訓（本次二次評審）**：
> v10.6 的 Phase N 補上了體驗與品牌，但**成熟度計分機制本身有漏洞** ——
> 允許「沒有任何依據」也拿滿分。**這次要修的不是清單的內容，是清單的計分方式。**
>
> **v11.0 的第五個教訓（研究方法）**：
> 本專案**不做真人訪談**（專案決策）。改用競品標竿研究後，
> **整份計畫最大的外部依賴（受測者招募）消失**，
> 風險從「不可控」轉為「可控」。
> 這同時帶來一條永久性的誠實限制：
> **「孩子喜歡我們的遊戲」永遠不得宣稱**（見執行守則第 19 條）。

### 成熟度計分模型（v11.0 · 權重制，取代 v10.6 的等權平均）

> **v10.6 的評分有兩個方法論缺陷，v11 修正：**
> 1. **等權平均** — 把「合規 9.2」與「UX 研究 6.5」等權相加，
>    掩蓋了「孩子不喜歡」比「審查不過」更致命的事實。
> 2. **沒有「上市後存活」這個面向** — 全部 27 條都在問「能不能」，
>    沒有一條在問「**會不會被取代**」。
>
> **v11 採四維加權。** 權固定義如下，**不得隨意調整**：

| 維度 | 權重 | 這條維度回答的問題 | 對應 Step |
| --- | --- | --- | --- |
| **能不能賣出去** | **30%** | 家長看到商店頁，會不會付費？ | Phase H、N、P |
| **孩子會不會用** | **30%** | 三歲小孩的前 5 分鐘會發生什麼？ | Phase A、E、N |
| **能不能活著** | **25%** | 上架一年後，還有多少人回來？ | Phase L、P、Q |
| **能不能過審** | **15%** | 商店審查與法規會不會卡住？ | Phase F、G、H、J、L |

> **為什麼「能不能過審」只佔 15%？**
> 因為審查是**二元**的：過 = 100 分，不過 = 0 分，不是線性加權。
> 把它放進加權平均會讓人誤以為「補審查就能補回體驗分」。
> 實務上正確的處理是：**審查是 gate（門檻），體驗是 score（分數）。**
> 門檻在附錄 C 逐條列明，**任何一條不通過 = 不得上架**，不論總分多高。

### 現況評分基線（實測，非印象分）

| 面向 | 分數 | 關鍵證據 |
| --- | --- | --- |
| 可玩性 | 2.0 | 9/40 關 `check()` 恆 false（F1/F2） |
| 商業管道 | 1.5 | 購買按鈕最終只顯示「已記錄您的訂閱意向，敬請期待。」 |
| 營運與觀測 | 1.0 | `telemetry.js` 第 57 行 `void 0;` — 事件永不外送 |
| 離線可靠性 | 4.0 | SW 預快取指向 3 個不存在檔；漏 5 個關鍵 content 檔 |
| 品質工程 | 4.0 | 34 條守門全驗產出指標，0 條行為測試 |
| 資安 | 5.0 | 21 處 `innerHTML`、16 處模板插值；無 CSP |
| 可及性 | 6.0 | 鍵盤處理僅 4 處；無自動 a11y 掃描 |
| 合規 | 5.5 | `consent.js` API 齊全但**無任何 UI 入口** |
| 視覺與素材 | 7.5 | 24 隻 20 種體型、離線 2.0MB |
| **內容深度** | **7.5** | minimal-pair 14/13 筆撐 12 關；rhythm 6 筆撐 8 關；抽題 `Math.random()` 可重複 |
| **平台落地** | **6.0** | 無 Capacitor 等原生容器；無硬體返回鍵；無 iOS 安裝引導 |
| 內容與教育價值 | 8.5 | 六章信件 263–330 字、24 隻專屬對白、120 句台詞 |
| 資訊分層 | 9.0 | 孩子端零評量術語、家長端雷達圖保留 |
| **UI/UX 體驗設計** | **7.2** | `tokens.css` 僅 103 行、`components.css` 669 行 = 「能用的變數集合」而非設計系統；無元件狀態矩陣、無 spacing/type scale 理論 |
| **UX 研究與驗證** | **6.5** | 全案 0 次真人訪談、0 次幼兒可用性測試、0 份家長共創結論 |
| **品牌與商店呈現** | **6.8** | 素材精緻但無「首幀」原視覺定稿、無 color script、無商店頁體系、ASO 關鍵字未定義 |
| **市場護城河 / 差異性** | **5.5** | **v10.6 完全未評。** 無教研背書、無縱深內容排程、40 關 16 分鐘純練習、6 場景為硬上限 |

### v11.0 落地後的預估成熟度（四維加權）

> **這張表是 v11.0 存在的理由。**
> 假設 Step 109–**193** 全部按規格落地，且 **Step 177 的招募順利**：

| 維度 | 面向 | v10.6 落地後<br>（二次評審實測） | **v11.0 落地後** | 提升來源 |
| --- | --- | --- | --- | --- |
| 能不能賣出去<br>（30%） | 商業管道 / 變現 | 8.5 | **9.2** | Phase P：定價研究、家庭方案 UX、付費牆價值主張 |
| | 品牌 / 商店呈現 | 7.3 | **8.8** | Phase N：ASO + 鏡頭腳本 → 實際商店截圖 |
| | **小計（權重 30%）** | **7.9** | **9.0** | |
| 孩子會不會用<br>（30%） | UI/UX 體驗設計 | 7.8 | **9.0** | Phase N：設計體系**落地實作**（非僅文件） |
| | UX 研究與驗證 | 7.2 | **8.8** | Phase N：研究**確實執行** + 修正落地 |
| | 內容與教育價值 | 8.5 | **8.8** | Phase Q：教研背書提升內容可信度 |
| | **小計（權重 30%）** | **7.8** | **8.9** | |
| 能不能活著<br>（25%） | 內容深度 | 7.8 | **8.6** | Phase L + Phase Q：縱深內容排程 |
| | 留存機制 | *（未評）* | **8.5** | **Phase P：每日挑戰、連續天數、SRS 復出** |
| | 市場護城河 | *（未評）* | **8.0** | **Phase Q：教研背書 + 縱深內容 + 家長黏性** |
| | **小計（權重 25%）** | **7.8** | **8.4** | |
| 能不能過審<br>（15%） | 合規 / 兒童隱私 | 9.3 | **9.3** | Phase G |
| | 工程品質 / 可維護性 | 9.0 | **9.2** | Phase J |
| | 平台落地 | 8.0 | **8.8** | Phase L：Capacitor + 返回鍵 + iOS 引導 |
| | 營運手冊 / 客服 | 8.4 | **9.0** | Phase K |
| | **小計（權重 15%）** | **8.8** | **9.1** | |
| | **加權總分** | **7.6** | **9.0** | |

> **誠實的降級路徑（必須寫在 `docs/acceptance-9.md`）：**
>
> | 情形 | M23／M24 | 加權總分 | 處理方式 |
> | --- | --- | --- | --- |
> | 研究已執行且有真實發現落地 | PASS | **9.0** | 正常交付 |
> | 研究已執行但部分發現 `deferred` | PASS（有 deferred 清單） | **8.8** | 明列未處置發現與理由 |
> | **研究未執行（招募失敗）** | **NOT MET** | **8.4** | **明列缺口，不得宣稱「孩子喜歡」** |
> | 研究未執行 **且** Phase Q 未完成 | NOT MET | **7.9** | 不得上市，只做公測 |
>
> **「8.4 分且誠實標記缺口」優於「9.0 分且宣稱已驗證」。**
> 這是 v11 的第一條紀律。

### 已驗證的優勢（**不得在重構中犧牲**）

1. 24 隻角色素材（20 種體型、24/24 漸層、四幀步行互異）
2. 資訊分層架構（孩子層／家長層）— 同業領先
3. 程序化場景配樂（9 組，零外部檔案、零授權風險）
4. 離線 2.0MB、零 emoji、零外部 CDN 依賴
5. 存檔遷移機制（`migrate()` + `schemaVersion`）— 正確雛形，擴充而非重寫
6. 資料最小化與 `canTargetedAdvertise() → false` — 對兒童產品是賣點
7. 家長閘門（算術題 + 長按 3 秒）— 正確雛形

---

## 執行守則（低階模型必讀）

1. **一次只做一個 Step。** 做完、跑過驗證指令、`git commit` 並 `git push` 之後，才開始下一個 Step。
2. **驗證失敗時不要跳過。** 修正後重跑；若同一 Step 嘗試 3 次仍失敗，**停止**並回報「卡在 Step N，錯誤訊息為 X」，不要硬推、也不要註記略過。
3. **不要自行擴大範圍。** 每個 Step 只改它列出的檔案。發現 Step 之外的問題，寫進 `docs/notes/step-N.md`。
4. **不要改動 Step 描述之外的既有行為。**
5. **每個 Step 結束必須 commit + push。** 提交訊息用 Step 中指定的字串，不要自創。
6. **所有「驗證」指令都必須實際執行並貼出結果。** 不可只描述「應該會通過」。
7. **遇到看不懂的程式碼，先讀再開改。** 尤其 `src/js/main.js`、`src/js/core/session.js`、`src/js/verbs/*`、`tools/verify-quality.mjs`。
8. **本清單的核心紀律：每個 Step 都要能被「實際玩一遍」證明。**
   純靜態檢查（grep 字串、數 JSON 欄位）**不得**作為任何 Step 的主要驗證手段。
   若一個 Step 的驗證只有靜態檢查，它就是不合格的 Step，必須補上可執行的行為測試。
9. **不得刪弱既有守門。** `tools/verify-quality.mjs` 的 34 條檢查與
   `tools/verify-phaseO.mjs --phase 1` 的 7 條檢查**必須保持 PASS**。
   新增檢查只能加，不能改門檻來讓它通過。
10. **文案的語系檔優先原則**：使用者可見文案一律進 `content/` 語系檔，程式碼只引用 key。
    既有 `src/js/ui/*.js` 中已硬編碼的中文，**在本清單範圍內只改動 Step 明確指定的檔案**。
11. **v10.6 紀律：研究不是文件，是待辦。** Phase N 的每條研究發現都必須帶
    **嚴重度（Blocker/Major/Minor）、驗收方式、修正狀態（open/fixed/deferred）**。
    只寫在 `docs/` 裡而沒有對應修正 Step 的發現，視為未完成。
12. **v10.6 紀律：目標值必須是「體驗目標」而非「合規門檻」。**
    禁止把「≥ 48px」「對比 ≥ 4.5:1」這類合規數字當作用戶體驗的證據。
    任何 UX 相關 Step 都必須同時寫出**它想改善的用戶行為指標**。
13. **v10.6 紀律：不得在 Phase N 之前宣稱任何 UX 結論。**
    幼兒喜歡與否、家長訂閱動機、品牌觀感一律標「待實測」，直到 Phase N 的 Step 179 完成。
14. **v11.0 紀律（最重要）：依據沒做出來就是沒做，不得空轉得分。**
    v10.6 的 `ux-findings-dispositioned` 只檢查「Blocker/Major 的 `open` = 0」，
    導致「招募失敗 → 全標 `deferred` → 守門 PASS → 成熟度 9.2」的漏洞。
    **v11 修正**：
    - 新增 `benchmark-executed` 硬性守門（Step 178）。
    - **`deferred` 一律不得用於通過成熟度條件**（M23／M24／M26）。
    - 若標竿研究確實無法完成，**成熟度條件標為 NOT MET，總分記 8.4，
      並在 `docs/acceptance-9.md` 明列缺口**。誠實記低分優於空轉得分。
    > **v11.0 決策：本專案不做真人訪談。**
    > 因此「沒有受測者」**不再是**風險來源，而是既定設計選擇。
    > 風險轉移為「標竿研究是否真的具體、有可稽核來源、且轉成了實作」。
15. **v11.0 紀律：每個成熟度條件必須有「可見產出物」。**
    附錄 C 的 M19–M27 已追加「可見產出物」欄位。
    **只寫文件、不改畫面、不改行為的 Step，不得被計入成熟度分數。**
    新增 `design-implemented` 守門：斷言 `docs/design-system.md` 定義的每一項
    都能在 `src/styles/` 或 `src/js/ui/` 找到對應實作。
16. **v11.0 紀律：成熟度必須由「可見的產品變更」承載。**
    若一個 Step 的核心產出物是 Markdown 檔，它**必須同時**包含
    「這份文件導致了哪個具體的產品變更」欄位，且該變更必須已被驗證。
    否則該 Step 視為「只有規格沒有實作」，**不得計入成熟度**。
17. **v11.0 紀律：審查是 gate，體驗是 score。**
    附錄 C 的 M1–M18 是**上架門檻**（任何一條不通過 = 不得上架），
    M19–M31 是**成熟度分數**。**不得**用體驗分數高來合理化審查不通過。
18. **v11.0 紀律：不得宣稱護城河已建立，除非 Phase Q 的守門通過。**
    教研背書、縱深內容、家長黏性三項若未完成，
    `docs/acceptance-9.md` 必須明確標記「護城河未建立，屬同類產品可替代範圍」。
19. **v11.0 紀律：標竿研究不得被包裝成使用者研究。**
    任何宣稱「我們的孩子喜歡」「家長會訂閱」的結論，
    在沒有第一方資料的情況下**一律不成立**。
    `docs/acceptance-9.md` 必須明列「本產品無第一方使用者資料」這一限制。

---

## 全域約束

1. **禁止啟動任何本地 Web 伺服器或佔用 Port**（禁止 `python -m http.server` / `npx serve` / `npm run dev` / `uvicorn` 等）。
   驗證僅限：`npx tsc --noEmit`、`npx eslint .`、`node tools/*.mjs`、`npm test`。
   > **例外（v10 專屬）**：允許使用 **jsdom**（無瀏覽器 DOM 行為測試）與
   > **Playwright**（視覺回歸／可及性掃描，僅 headless，不佔用 Port）作為 devDependencies。
   > **不得**引入任何 runtime dependency，**不得**影響 `src/` 產物體積。
2. 每步驟最多修改 **3 個檔案**；單一檔案單次改動不超過 **400 行**。
   由工具腳本產生的輸出檔（SVG、截圖）視為單一邏輯單位。
   > **例外（v10.6 專屬）**：**Step 179（UX 修正落地）**上限放寬至 **6 個檔案／單檔 400 行**。
   > 理由：該 Step 的內容由 `docs/benchmark/fixes.md` 動態決定，
   > 修正必然橫跨 `src/styles/`、`src/js/ui/`、`content/` 三個目錄，
   > 硬限 3 檔會迫使執行者把修正塞進不相關的檔案，反而製造耦合。
   > 仍**不得**在此例外下修改 `src/js/core/`（見全域約束 16）。
   >
   > **例外（v11.0 新增）**：**Step 179（UX 修正落地）上限放寬至 12 個檔案**。
   > 理由：v11.0 的 Phase N 工期從 7 週拉長到 9 週，修正量隨之增加；
   > 硬限 6 檔會導致修正被塞回文件而無法真正落地，
   > 這正是 v11 要根治的問題。**單檔上限仍為 400 行**，
   > 且**仍不得**修改 `src/js/core/`（見全域約束 16）。
3. 嚴格依序執行，**禁止跳步**；每步驟標註「依賴 Step N」。
4. 目標分支 `main`，遠端 `origin`（https://github.com/differ505-prog/mumu-game.git）。
5. 專案為無建置工具的原生 ES Module 靜態網站（PWA）；**不引入打包器**。
6. 內容檔（`content/*.json`）於執行期以 `fetch()` 載入；結構由 `tools/check-content.mjs` 驗證。
7. **所有中文文案使用繁體中文（zh-TW）**，不得混入簡體。
8. **雙語檔案修改時必須同步維護 zh-TW 與 en-US**，句數與結構完全對稱。
9. **禁止 emoji**（`npm run check:assets` 驗證 emoji = 0）。圖示必須自繪 SVG。
10. **不得宣稱未實測項目已達成。** 需要真人試玩／真實數據的項目一律標註「待實測」。
11. **JSON 檔案含連字號的鍵必須加引號**（例：`"ice-age": { … }`）。
12. **每個 Step 的驗證指令必須真的能執行。** 指令寫錯先修指令再跑。
13. **後端相關步驟（Phase I）**：本專案為靜態網站，後端採 **BaaS / serverless**。
    低階模型**不得**撰寫真實後端程式碼，只負責**前端接線、事件契約、UI 與佔位實作**，
    並在 `docs/notes/step-N.md` 記錄需後端配合的契約。**不得**為了「看起來完成」而
    寫假的假資料並宣稱已實作。
14. **原生相關步驟（Phase L）**：本專案為 Web 應用，原生容器採 Capacitor。
    低階模型**不得**撰寫 Swift / Kotlin 原生程式碼，只負責**容器配置、Web 橋接層、
    建置流程文件與平台適配**。原生 IAP 憑證的實際取得需商店帳號，屬外部依賴。
15. **Phase N 相關步驟**：本 Phase 涉及**競品標竿研究**與**品牌定稿**。
    > **v11.0 決策：本專案不進行真人訪談與幼兒觀察式測試。**
    > Step 177 改為**競品標竿研究**，證據來源為公開的第三方產品資料與產業基準數據。
    低階模型**不得**撰寫虛構的訪談逐字稿、不得捏造「家長表示…」「小朋友喜歡…」等結論。
    **嚴禁**把標竿研究包裝成使用者研究 —— 標竿只能證明「市場驗證過的做法有沒有被採用」，
    **不能**證明「我們的孩子會喜歡」。
    所有標竿記錄必須來自**可存取的真實公開來源**（URL ＋ 擷取日期），
    並在 `docs/benchmark/` 下保留最小可稽核紀錄。
    **嚴禁**複製標竿產品的美術、角色、音效、動畫、程式碼或文案，只能萃取設計決策與模式。
    若標竿研究未完成，**必須如實標記為「未執行」**，不得以任何形式填補。
    > **v11.0 補充**：如實標記「未執行」是**允許的**，
    > 但該情況下 **M23／M24 必須標為 NOT MET，成熟度記 8.4 分**，
    > **不得**讓 `deferred` 通過成熟度條件。
    > 詳見執行守則第 14 條。
16. **Phase N 不得改動 `src/js/core/*` 的商業與同意邏輯。**
    設計體系重構僅限 `src/styles/` 與 `src/js/ui/`，避免與 Phase H／I 的成果衝突。
17. **Phase P（商業可行性）不得修改 `src/js/core/entitlements.js` 與 `src/js/core/subscription.js` 的既有狀態機。**
    本 Phase 只新增定價方案資料、家庭方案 UX、留存機制與其接線。
18. **Phase Q（護城河）不得捏造第三方背書。**
    教研背書**必須**附真實機構名稱、真實日期、真實簽署人職稱；
    若尚未取得，**必須**標記為「尚未取得（預計 YYYY-MM）」。
    **不得**以「已諮詢專家意見」這類無法稽核的描述充數。

---

## 成熟度計分與「不得宣稱」的對照表（v11.0）

> **本表是防止「文件分數」再次凌駕「產品分數」的機制。**
> 低階模型在填寫任何狀態時，必須對照本表。

| 說法 | 是否允許 | 條件 |
| --- | --- | --- |
| 「設計體系已建立」 | ✅ 僅當 | `design-system-documented` **且** `design-implemented` 皆 PASS |
| 「孩子喜歡我們的遊戲」 | ❌ **永不允許** | **本專案無第一方資料**。最多只能說「設計依據來自已驗證產品的標竿研究」，並標「待實測」 |
| 「家長願意訂閱」 | ⚠️ 僅可說「定價參考同業基準」 | 依 Step P1 的產業基準與同業定價對照表，**不得**宣稱已驗證家長意願 |
| 「品牌已建立」 | ⚠️ 僅可說「品牌系統已建立」 | 品牌**規格**落地可說；品牌**認知度**須待 Step P5 商店上線後的 A/B 實測 |
| 「護城河已建立」 | ✅ 僅當 | Phase Q 四個守門皆 PASS；否則必須寫「屬同類產品可替代範圍」 |
| 「留存率良好」 | ❌ 永遠不可 | 上市前無真實留存數據。只能寫「留存機制已實作，數據待實測」 |
| 「教育成效顯著」 | ❌ 除非有教研背書 | 否則只能寫「教學設計有參考依據，成效待長期研究」 |
| 「已符合 WCAG 2.2 AA」 | ✅ 僅當 | `check:a11y` 0 critical **且** 0 serious |
| 「可上架」 | ✅ 僅當 | 附錄 C 的 M1–M18 全部 PASS（gate） |

---

# Phase A — 地基：可玩性守門（Step 109–113）

> **這是全部工作的前提。** 沒有它，後面 30 個 Step 都會重蹈 v8 的覆轍。
> **本 Phase 產出兩件事：① 能實際跑遊戲的測試骨架 ② 修掉 9 關卡死的引擎契約**

---

## Step 109 — 建立 jsdom 可玩性測試骨架
- **依賴**：Step 108（v8 終局，已完成）
- **檔案**：`package.json`（修改）、`tools/test-harness.mjs`（新增）、`tools/verify-playable.mjs`（新增）
- **目標**：建立**能實際執行遊戲流程**的測試骨架。這是後續每個 Step 的驗證基礎。
- **預期變更**：
  1. `package.json` 新增 devDependency `jsdom`（^26）與 script：
     ```json
     "test:play": "node tools/verify-playable.mjs"
     ```
     **不得**新增任何 runtime dependency。
  2. `tools/test-harness.mjs`（新增）匯出：
     ```js
     /**
      * 可玩性測試骨架 — 以 jsdom 建立可執行的遊戲環境。
      *
      * 匯出：
      *   createGameEnv({ locale })  建立 jsdom 環境（載入 index.html、注入 fetch、
      *                             stub Web Audio / SpeechSynthesis / matchMedia / localStorage）
      *   bootGame(env)              執行 main.js 的 boot()，回傳 { errors, warnings }
      *   clickStart(env)            模擬點擊開始畫面
      *   advanceTutorial(env)       完成教學（依 env 的教學策略）
      *   pickCharacter(env, id)     選擇角色
      *   openLevelMap(env)          開啟關卡地圖
      *   startLevel(env, id)        進入指定關卡
      *   answerRound(env, input)    作答一個回合（input 可為 id 或 { pieceIndex, targetIndex } 等物件）
      *   currentState(env)          讀取目前回合狀態（phase / locked / round / score）
      *   advanceTimers(env, ms)     推進 fake timers
      *   resetEnv(env)              重置 localStorage 與 DOM（供測試之間隔離）
      */
     ```
  3. **jsdom 必須 stub 的瀏覽器 API**（缺一不可，缺一個測試就會假失敗）：
     - `AudioContext` / `webkitAudioContext`：`createGain` / `createBufferSource` /
       `createOscillator` / `createBuffer` / `createBiquadFilter` / `createStereoPanner` /
       `createDynamicsCompressor` / `createDelay` / `createAnalyser` / `destination` /
       `currentTime` / `state` / `resume` / `close`
     - `OfflineAudioContext`：`startRendering()` 回傳 `{ getChannelData, length, duration }`
     - `window.speechSynthesis`：`speak` / `cancel` / `getVoices`（回傳空陣列）/ `pause` / `resume`
     - `window.SpeechSynthesisUtterance`（可被 `new`）
     - `window.matchMedia`：回傳 `{ matches: false, addListener, removeListener, addEventListener, removeEventListener }`
     - `window.requestAnimationFrame` / `cancelAnimationFrame`
     - `HTMLCanvasElement.prototype.getContext`：2D context stub，含
       `drawImage` / `clearRect` / `fillRect` / `fillText` / `measureText` / `getImageData` /
       `putImageData` / `createImageData` / `save` / `restore` / `translate` / `scale` /
       `rotate` / `beginPath` / `closePath` / `moveTo` / `lineTo` / `arc` / `fill` / `stroke` /
       `createLinearGradient` / `createRadialGradient` / `setTransform` / `resetTransform`
     - `HTMLCanvasElement.prototype.toDataURL`：回傳 `"data:image/png;base64,iVBORw0KGgo="`
     - `Image`：`src` 設定後於 microtask 觸發 `onload`，`naturalWidth` / `naturalHeight` = 512
     - `localStorage`：jsdom 內建，但**每個測試前必須清空**
     - `fetch`：攔截 `./content/*.json` 路徑，直接讀本機磁碟檔案並回傳 `{ ok, status, json() }`
     - `performance.now()`
  4. `tools/verify-playable.mjs`（新增）以 harness 為基礎，執行 **9 條行為檢查**，
     每條獨立函式，輸出 `[PASS]` / `[FAIL]` 與總結 `通過 N/M，失敗 K`；
     有 FAIL 時 exit code = 1。**本步必須先證明守門抓得到既有缺陷**：
     ```js
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
      */
     ```
- **規範**：
  - `tools/test-harness.mjs` **不得** import `src/js/main.js` 的私有狀態，
    必須**透過 DOM 與公開事件**操作，模擬真實玩家。
  - 必須能對**任一關卡 id** 重複執行（測試之間需重置 `localStorage` 與 DOM）。
  - **不得**在測試中使用真實 `setTimeout` 等待，必須用 fake timers 或手動推進。
  - **不得**使用 `jsdom` 以外的任何新 devDependency。
- **驗證**：
  ```bash
  npm install --save-dev jsdom
  npm run test:play; echo "exit=$?"
  ```
  預期：至少 **`play-level-complete`、`play-all-verbs`、`play-tutorial`** 為 FAIL，
  證明守門抓得到既有缺陷。其餘應為 PASS。
- **提交**：
  ```bash
  git add package.json package-lock.json tools/test-harness.mjs tools/verify-playable.mjs
  git commit -m "test: 建立 jsdom 可玩性測試骨架與守門"
  git push origin main
  ```

---

## Step 110 — 定義並實作統一引擎契約
- **依賴**：Step 109
- **檔案**：`src/js/core/verb-contract.js`（新增）、`src/js/verbs/auditory.js`（修改）、`src/js/verbs/puzzle.js`（修改）、`src/js/verbs/memory.js`（修改）
- **目標**：把「四種不同的完成模型」統一成**一個可宣告的契約**。
  **這是 F1／F2／F3 的共同根因，不先修，後面每個玩法都會重蹈覆轍。**
- **預期變更**：
  1. 新增 `src/js/core/verb-contract.js`：
     ```js
     /**
      * 玩法制程契約 — 所有引擎必須實作以下介面。
      *
      * 選項類型（kind）：
      *   "choice"   單選：一次作答即判定（minimal-pair / rhythm / interference）
      *   "sequence" 序列：需依序多次作答（sequence / memory-dual）
      *   "place"    拼合：需多次放置片段（puzzle-assembly）
      *   "match"    配對：需翻牌配對（memory-match）
      *
      * 引擎必須提供：
      *   kind        上述四者之一
      *   build()     Promise<void> —— 一律可 await
      *   getPrompt() string
      *   getOptions() Option[]        —— 僅 choice／sequence 使用
      *   getCards()   Card[]           —— 僅 match 使用
      *   getPieces()  Piece[]          —— 僅 place 使用
      *   submit(input, meta) SubmitResult —— 統一作答入口
      *   isComplete() boolean          —— 判定本回合是否已完成
      *   getFeedback() string | null   —— 本回合的正確選項 id（供示範與測試用）
      *   playPrompt() void
      *   demonstrate() void
      *   replay() void
      *
      * SubmitResult:
      *   { status: "correct" | "wrong" | "progress",
      *     correct: boolean, done: boolean, feedback?: string }
      *
      * 規範：
      *   - 所有引擎的 build() 一律回傳 Promise，session 必須 await
      *   - 引擎不得自行決定回合是否結束，一律由 session 依 isComplete() 判定
      *   - 引擎不得使用 Math.random() 決定答案或題目
      */
     ```
  2. **改造三個引擎**，每個都必須：
     - 宣告 `kind`。
     - `build()` 一律 `async`。
     - 提供 `submit(input, meta)` 取代舊的 `check(input)`：
       - `choice`：比對 `answerId` → `{ status:"correct"|"wrong", correct, done:true }`
       - `sequence`：內部維護 `progressIndex`，每次 `submit` 比對 `sequence[progressIndex]`；
         正確則 `progressIndex++` → `{ status:"progress", correct:true, done: progressIndex >= sequence.length }`；
         錯誤則 `{ status:"wrong", correct:false, done:false }`。
         **必須移除**舊的 `advance()` 方法（改由 `submit` 內部處理）。
       - `place`：接收 `{ pieceIndex, targetIndex }`，呼叫既有 `place()` 邏輯 →
         `{ status:"progress", correct: 全部已放置, done: placed === pieces.length }`
       - `match`：接收 `{ slot }`，包裝既有 `flip()` →
         `{ status:"progress", correct: 配對成功, done: matched*2 >= cards.length }`
     - 提供 `isComplete()`。
     - **保留**舊的 `check()`、`getOptions()`、`getCards()`、`getSequence()` 作為**相容層**
       （既有呼叫點不得因此爆掉），但 `check()` 內部改為委派 `submit()`。
     - **不得**改變題目內容、選項內容、語音內容。
  3. `memory` 的 `dual` variant：`build()` 產生 `task` 但 `cards` 為空 ——
     必須讓 `kind` 為 `"sequence"`（它是「聽覺 + 視覺」序列，不是翻牌），
     並讓 `submit` 走序列邏輯。
  4. `puzzle` 的 `pattern` variant：維持 `kind: "choice"`（從 `getOptions()` 選答案），
     與 `assembly`（`kind: "place"`）區分。
- **規範**：
  - **不得**修改題庫（`content/items.json`、`content/minimal-pairs.json`）**於本 Step**。
  - **不得**改變任何文案的語言或長度。
  - 舊的 `check()` 必須仍可被呼叫且回傳等價結果。
  - 單檔改動不超過 400 行；若需拆分，先在 `docs/notes/step-110.md` 記錄。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play -- --case engine-contract; echo "exit=$?"
  ```
  預期：`engine-contract` PASS —— 六種玩法（含 `memory` 的 `match`/`dual`、
  `puzzle` 的 `assembly`/`pattern`）的引擎都宣告 `kind`、都有 `submit()`、都有 `isComplete()`，
  且 `build()` 皆為 async。
  **注意：`play-all-verbs` 此刻仍應 FAIL**（`session` 尚未改用新契約），這是正常的。
- **提交**：
  ```bash
  git add src/js/core/verb-contract.js src/js/verbs
  git commit -m "refactor: 統一六種玩法的引擎契約"
  git push origin main
  ```

---

## Step 111 — `session` 改用統一契約（修掉 F1／F2／F3）
- **依賴**：Step 110
- **檔案**：`src/js/core/session.js`（修改）
- **目標**：`session` 不再對任何玩法做特判。
  **這一步修掉 sequence（關卡 1–4）與 puzzle（關卡 29–32、40）永遠卡死的問題。**
- **預期變更**：
  1. `nextRound()` 改為 **async**，並 `await verbEngine.build()`：
     ```js
     async nextRound() {
         if (roundIndex >= totalRounds) { this.finish(); return; }
         hintStage = "hint-item";
         roundStartedAt = Date.now();
         verbEngine = currentLevel.engineFactory();
         await verbEngine.build();          // ★ 修掉 F3
         setState({ round: roundIndex + 1, phase: "listening", locked: true, sequence: verbEngine.getSequence?.() || [] });
         emit({ type: "round:listen", payload: { levelId: state.level, round: roundIndex + 1 } });
         verbEngine.playPrompt?.();
         setTimeout(() => {
             setState({ phase: "input", locked: false });
             emit({ type: "round:input-ready", payload: {} });
         }, paceMs + 400);
     }
     ```
     **不得**在 `build()` 完成前 emit `round:listen`。
  2. `answer(input)` 改為**統一走 `submit()`**：
     ```js
     answer(input) {
         if (state.locked) return;
         const result = verbEngine.submit?.(input) ?? { correct: false, done: false };
         attempts.push(Boolean(result.correct));
         samples.push({
             axis: axisForVerb(currentLevel.verb),
             verb: currentLevel.verb,
             correct: result.correct ? 1 : 0,
             locale,
             hinted: hintCount > 0 ? 1 : 0,
             ms: Date.now() - roundStartedAt
         });
         // ★ 核心規則：
         //   result.done === true                → 本回合完成 → roundIndex++
         //   result.done === false && correct    → 回合仍在進行（序列前進中／拼合中）
         //                                       → 不得 roundIndex++，但不得觸發 round:wrong
         //   result.done === false && !correct   → 答錯 → advanceHint()
         if (result.correct) {
             setState({ score: state.score + 1, combo: state.combo + 1 });
             emit({ type: "round:correct", payload: { itemId: input, round: roundIndex + 1 } });
             if (result.done) { roundIndex++; setTimeout(() => this.nextRound(), 900); }
         } else {
             setState({ combo: 0 });
             emit({ type: "round:wrong", payload: { itemId: input, round: roundIndex + 1 } });
             this.advanceHint();
         }
     }
     ```
  3. **移除** `"__memory_done__"` 魔法字串分支（memory 現在走 `submit({ slot })` 的 `match` 契約）。
  4. `session.start()` 呼叫 `this.nextRound()`，並加 `.catch()`：
     錯誤時記錄並呼叫 `finish()`，**絕不讓遊戲卡死在 loading**。
  5. 新增 `session.getFeedback()` 委派到引擎的 `getFeedback()`。
- **規範**：
  - **不得**在 `session` 中出現任何 `verb === "..."` 的玩法名稱特判。
  - **不得**讓 `session` 直接 import `src/js/verbs/*`（必須只依賴契約）。
  - 「錯誤時永不扣分」原則**必須保留**。
  - `hintStage` 三段式機制**必須保留**。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/core/session.js','utf8');
  if(/verb\s*===\s*['\"]/.test(s)){ console.error('session 仍有玩法特判'); process.exit(1); }
  if(s.includes('__memory_done__')){ console.error('session 仍有 __memory_done__ 特例'); process.exit(1); }
  if(!s.includes('await verbEngine.build()')){ console.error('session 未 await build()'); process.exit(1); }
  console.log('[PASS] session 已改用統一契約');
  "
  ```
  預期：**`play-level-complete` 與 `play-all-verbs` 轉為 PASS**。
- **提交**：
  ```bash
  git add src/js/core/session.js
  git commit -m "fix: session 改用統一引擎契約，修復序章與拼圖關卡卡死"
  git push origin main
  ```

---

## Step 112 — `main.js` 的回合 UI 支援四種玩法（補上 puzzle 的 UI）
- **依賴**：Step 111
- **檔案**：`src/js/main.js`（修改）
- **目標**：讓 puzzle（拼合）有真正的操作介面；讓 sequence（序列）有「已答對幾項」的可視化。
- **預期變更**：
  1. `renderRound()` 改為依 `engine.kind` 分派：
     - `"choice"` → 現有的按鈕網格（**不變**）。
     - `"sequence"` → 按鈕網格 ＋ **序列進度指示**（已答對的項顯示為已點亮）。
       **不得**洩漏答案順序。
     - `"place"` → **拼合盤**（見下）。
     - `"match"` → 現有的翻牌網格（**不變**）。
  2. **拼合盤 UI**（新增）：
     - 上方**目標區**（網格，顯示已正確放置的切片），下方**素材區**（待放置切片）。
     - 點素材切片 → 選取；點目標格 → 放置；呼叫 `engine.submit({ pieceIndex, targetIndex })`。
     - 放置正確 → 該片**吸附**進目標區 + 粒子回饋（用 `src/js/ui/particles.js` 的 `burst()`）。
     - 放置錯誤 → 素材**彈回** + 播放 `ui.soft-low`。
     - 全部放好 → `result.done === true` → 觸發回合完成。
     - 必須使用既有 `<img>` + dataUrl 切片路線（**不得**用 `<canvas>` 手繪，保持離線體積）。
  3. `renderMemoryBoard()` 改為呼叫 `engine.submit({ slot })`，
     但**翻牌的視覺即時性必須保留**（不能等 `submit` 回傳才翻）。
  4. **回合錯誤回饋修正**：`round:wrong` 目前用 `animate("#character-img", "shake")`，
     但 `#character-img` 已被 `renderCharacter()` 覆蓋而消失（見 Step 118）。
     本 Step 一併改用 `.char__art`（為 Step 118 鋪路）。
  5. 新增對 `round:progress` 事件的監聽（序列／拼合的進行中回饋）。
- **規範**：
  - **不得**在 `main.js` 內以玩法名稱（`"sequence"`、`"puzzle"`…）分派，必須用 `engine.kind`。
  - 不得使用 emoji。
  - 不得破壞 `renderRound` 既有呼叫點。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/main.js','utf8');
  if(!/engine\.kind|\.kind\s*===/.test(s)){ console.error('renderRound 未依 engine.kind 分派'); process.exit(1); }
  if(!/pieceIndex/.test(s)){ console.error('缺少拼合盤 UI'); process.exit(1); }
  console.log('[PASS] 回合 UI 已支援四種玩法');
  "
  ```
- **提交**：
  ```bash
  git add src/js/main.js
  git commit -m "feat: 回合介面支援序列進度與拼合盤"
  git push origin main
  ```

---

## Step 113 — 引擎契約回歸驗證
- **依賴**：Step 112
- **檔案**：`tools/verify-playable.mjs`（修改）
- **目標**：把可玩性守門升級為**完整驗證 40 關都可推進**。
- **預期變更**：
  1. 強化 `play-all-verbs`：不只驗「能判定對錯」，
     還要驗**六種玩法各自都能走完 3 回合並觸發 `level:complete`**。
     必須依各玩法的**真實正確作答路徑**操作：
     - `minimal-pair` / `interference` / `rhythm`：從 `getOptions()` 取出 `getFeedback()` 指定的 id 後送出。
     - `sequence`：依 `getSequence()` 的順序逐項送出。
     - `puzzle`：`assembly` 依 `getPieces()` 的 `targetX`/`targetY` 依序放置；
       `pattern` 從 `getOptions()` 取出 `getFeedback()`。
     - `memory`：`match` 依 `getCards()` 的 `id` 兩兩配對翻牌；`dual` 依 `getSequence()` 送出。
  2. 新增 `play-verbs-coverage`：斷言**40 關每一關**都能在無錯誤下走完 3 回合並觸發結算。
     （**這是最強的「推進不了劇情」防線**）
  3. 新增 `play-no-error-verbs`：斷言上述流程中**無未捕捉錯誤、無 console.error**。
  4. **保留** Step 109 的 9 條檢查不變。
- **規範**：
  - 不得放寬門檻（例如不得寫成「至少 3 種玩法可推進」）。
  - 測試必須是**真實的行為模擬**，不得直接改 `state` 跳過流程。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  ```
  預期：可玩性檢查**全部 PASS**（含 `play-verbs-coverage`）。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs
  git commit -m "test: 引擎契約回歸驗證，40 關全部可完成"
  git push origin main
  ```

---

# Phase B — 入口與導航（Step 114–117）

> 消除所有卡死點。**核心紀律：所有流程推進由使用者行為或語音結束事件觸發，禁用定時器推進。**

---

## Step 114 — 修掉開始畫面重複觸發與教學卡死
- **依賴**：Step 113
- **檔案**：`src/js/main.js`（修改）、`src/js/ui/tutorial.js`（修改）
- **目標**：修掉 F4（教學卡在第 1 步）與 F7（`startGame` 執行兩次）。
- **預期變更**：
  1. **F7 修正**：`showStart()` **不得**自己綁 `click`；事件綁定**只保留 `wire()` 一處**。
     `showStart()` 只負責顯示遮罩。
     **額外保護**：`startGame()` 開頭加 `started` 旗標，已啟動則直接 return。
  2. **F4 修正**：`tutorial.js` 的每一步按鈕都必須能前進：
     - `listen` 步驟的「播放聲音」→ 播放一個**真實的示範音**並**自動前進**。
     - `watch` 步驟的「示範給我看」→ 同上，**自動前進**。
     - `choose` 步驟選項 → 前進。
     - 每一個步驟**都必須有前進路徑**，`next()` 的完成判定必須正確
       （`index >= steps.length` 時才 `onDone(true)`）。
  3. 移除 `main.js` 中對 `tutorial.next` 的**包裝**（F4 成因之一），
     改為**直接使用** `tutorial` 公開的 `next()` / `skip()`。
  4. `runTutorial()` 的 `root` **必須是 `#tutorial-root`**，
     **不得** fallback 到 `#levelmap-root`（那會把教學渲染進地圖容器）。
  5. 教學三個步驟**必須**可在 30 秒內走完。
- **規範**：
  - 不得改變教學的三步驟內容文案。
  - 不得引入 `setTimeout` 作為流程推進手段。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/main.js','utf8');
  const m=s.match(/function showStart[\s\S]*?\n\}/);
  if(m && m[0].includes('addEventListener')){ console.error('showStart 仍自行綁定 click（F7 未修）'); process.exit(1); }
  if(s.includes('tutorial.next =')){ console.error('main.js 仍包裝 tutorial.next'); process.exit(1); }
  const t=require('fs').readFileSync('src/js/ui/tutorial.js','utf8');
  if(t.includes('tutorial:demo')){ console.error('仍有無人監聽的 tutorial:demo 事件'); process.exit(1); }
  console.log('[PASS] 入口與教學流程已修正');
  "
  ```
  預期：`play-tutorial` 轉為 PASS。
- **提交**：
  ```bash
  git add src/js/main.js src/js/ui/tutorial.js
  git commit -m "fix: 修掉開始畫面重複觸發與教學流程卡死"
  git push origin main
  ```

---

## Step 115 — 序章信件改為可關閉的過場（修掉 F6）
- **依賴**：Step 114
- **檔案**：`src/js/main.js`（修改）、`src/js/ui/story.js`（修改）、`src/js/audio/voice.js`（修改）
- **目標**：序章信件**必須是一個可以關上的過場**，不是塞在氣泡裡的無按鈕文字。
- **預期變更**：
  1. `main.js` 的 `showLetter(text)` **改為**使用 `src/js/ui/story.js` 的 `showLetter(root, letter, signature)`，
     掛載到 `#story-root`（`index.html` 已有該元素，目前是**死元素**）。
     - `signature` 傳 `"—— 聖誕老人"`（en-US 為 `"— Santa"`）。
  2. `story.js` 的 `showLetter()` 必須：
     - 接受 `onClose` 回呼參數，`main.js` 在其中才進入教學。
     - 保留「關上」按鈕（已有 `#letter-close`），但**必須**確實觸發 `onClose`。
     - 朗讀期間 CTA 顯示「正在說…」，`utter.onend` 後恢復為「關上」。
       **不得**用 `setTimeout` 猜測朗讀長度。
  3. **流程順序**改為：
     `開始畫面` →（點擊）→ `序章信件（可關上）` → `教學` → `角色選擇` → `關卡地圖`。
     **所有推進都由使用者行為觸發**，不再有 `setTimeout(..., 2600)`。
  4. `voice.js` 的 `speak()` 新增 `opts.onEnd`（在 `utter.onend` 與 `utter.onerror` 皆觸發），
     **不得**破壞既有呼叫點（`opts` 為選用參數）。
  5. 序章之後，每一章的首次進入都要顯示該章信件（見 Step 122），本 Step 只處理序章。
- **規範**：
  - 不得刪除 `src/js/ui/story.js` 的既有 `showLetter` / `showStoryScene` 匯出。
  - 不得改動信件內容。
  - 不得用 `setTimeout` 作為信件→教學的推進依據。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/main.js','utf8');
  if(s.includes('setTimeout(() => runTutorial()')){ console.error('仍有 setTimeout 推進教學'); process.exit(1); }
  if(!s.includes('story-root')){ console.error('序章信件未掛到 #story-root'); process.exit(1); }
  const v=require('fs').readFileSync('src/js/audio/voice.js','utf8');
  if(!v.includes('onEnd')){ console.error('speak() 未提供 onEnd 回呼'); process.exit(1); }
  console.log('[PASS] 序章信件已是可關閉的過場');
  "
  ```
- **提交**：
  ```bash
  git add src/js/main.js src/js/ui/story.js src/js/audio/voice.js
  git commit -m "feat: 序章信件改為可關閉的劇情過場"
  git push origin main
  ```

---

## Step 116 — 圖鑑與地圖的返回路徑（修掉 F8）
- **依賴**：Step 115
- **檔案**：`src/js/main.js`（修改）、`src/js/ui/dex.js`（修改）、`src/js/ui/levelmap.js`（修改）
- **目標**：孩子**在任何畫面都能回到上一層**，不會卡死。
- **預期變更**：
  1. `dex-root` **必須有「關上」按鈕**（目前沒有，點進去就出不來）。
     關上後回到**開啟圖鑑的那個畫面**（地圖）。
  2. `levelmap-root` **必須有「返回」按鈕**，回到**角色選擇**。
  3. `character-select-overlay` **必須有「返回」按鈕**。
  4. 每一層的返回**必須記錄來源**，不得假設「上一層永遠是某個畫面」。
     在 `main.js` 維護 `overlayStack`（模組層級陣列），`pushOverlay` / `popOverlay` 管理。
  5. 所有返回按鈕必須有 `aria-label` 與 `type="button"`。
- **規範**：
  - 不得移除任何既有入口（圖鑑／家長報告／每日挑戰／付費牆）。
  - 家長報告仍**必須**經過家長閘門（不得為了返回方便而繞過）。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/ui/dex.js','utf8');
  if(!/關上|Close/.test(s)){ console.error('圖鑑缺少關閉按鈕'); process.exit(1); }
  const m=require('fs').readFileSync('src/js/main.js','utf8');
  if(!m.includes('overlayStack') && !m.includes('popOverlay')){ console.error('main.js 無返回堆疊管理'); process.exit(1); }
  console.log('[PASS] 各層返回路徑齊備');
  "
  ```
- **提交**：
  ```bash
  git add src/js/main.js src/js/ui/dex.js src/js/ui/levelmap.js
  git commit -m "feat: 圖鑑與地圖補齊返回路徑"
  git push origin main
  ```

---

## Step 117 — 入口與導航回歸驗證
- **依賴**：Step 116
- **檔案**：`tools/verify-playable.mjs`（修改）
- **目標**：驗證「一個孩子可以獨自走完所有畫面且不會卡死」。
- **預期變更**：
  1. 新增 `play-nav-complete`：模擬完整導航 —
     `開始` → `關上序章` → `走完教學` → `選角色` → `地圖` → `進關卡` → `完成` → `回地圖` →
     `開圖鑑` → `關圖鑑` → `開家長報告`（通過閘門）→ `關家長報告` → `回地圖` → `返回角色選擇`。
     斷言**每一張遮罩在離開時都被加上 `hidden` 類別**。
  2. 新增 `play-no-dead-end`：斷言所有 `.overlay` 元素在流程結束後**沒有一個仍可見**。
  3. 新增 `play-start-once`：斷言點擊開始畫面 **`startGame` 只執行一次**
     （以「序章信件只被設定一次內容」與「教學只被建立一次」為觀察點）。
  4. **保留** Step 109 與 Step 113 的檢查不變。
- **規範**：
  - 不得放寬門檻。
  - 測試必須模擬**真實點擊**（`element.click()`），不得直接呼叫內部函式。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  ```
  預期：可玩性檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs
  git commit -m "test: 入口與導航回歸驗證"
  git push origin main
  ```

---

# Phase C — 畫面與角色（Step 118–121）

---

## Step 118 — 角色尺寸與版面根治（修掉 F5）
- **依賴**：Step 117
- **檔案**：`src/styles/components.css`（修改）、`src/styles/base.css`（修改）、`src/styles/responsive.css`（修改）、`src/js/ui/character-render.js`（修改）
- **目標**：角色**穩定佔畫面 25–40%**、不溢出、不遮住氣泡。
- **預期變更**：
  1. **`.char__art` 補齊尺寸規則**（目前完全缺失）：
     ```css
     .char__art {
         display: block;
         max-height: var(--char-max-h, 34dvh);
         max-width: min(280px, 46vw);
         height: auto;
         width: auto;
         object-fit: contain;
     }
     ```
  2. `#santa-container` 改為**底部置中但留出氣泡空間**：
     `bottom: 0` → `bottom: var(--s-6)`（或等效 token），並設定明確 `gap`。
  3. **移除 `#character-img` 的尺寸規則**（該元素已被 `renderCharacter()` 覆蓋，不存在了），
     `responsive.css` 的 `#character-img` 同步更新為 `.char__art`。
     **二選一，不得兩套並存**。
  4. `#bubble` 增加**最大寬度**（`max-width: min(560px, 78vw)`）與換行，避免撐破版面。
  5. `renderCharacter()` 的 `mount.className = ...` 會清掉承載版面定位的 class ——
     改為 `mount.classList` 增量操作（保留既有的 mood class 邏輯）。
  6. 橫向 / 直向都必須有合理的角色高度（`--char-max-h` 由 media query 覆寫）。
- **規範**：
  - 不得使用圖片檔（維持離線體積）。
  - 不得移除既有的 `.char__shadow` 與六種 mood 動畫。
  - 必須支援 `prefers-reduced-motion`。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const fs=require('fs');
  const c=fs.readFileSync('src/styles/components.css','utf8');
  const b=fs.readFileSync('src/styles/base.css','utf8');
  if(!/\.char__art\s*\{[^}]*max-height/.test(c)){ console.error('.char__art 缺少 max-height'); process.exit(1); }
  if(b.includes('#character-img')){ console.error('base.css 仍有失效的 #character-img 規則'); process.exit(1); }
  console.log('[PASS] 角色尺寸規則已根治');
  "
  ```
- **提交**：
  ```bash
  git add src/styles/components.css src/styles/base.css src/styles/responsive.css src/js/ui/character-render.js
  git commit -m "fix: 根治角色尺寸失控與版面溢出"
  git push origin main
  ```

---

## Step 119 — 關卡中的角色跟著劇情走（修掉 C3）
- **依賴**：Step 118
- **檔案**：`content/levels.json`（修改）、`content/story-arcs.json`（修改）、`src/js/main.js`（修改）、`tools/check-content.mjs`（修改）
- **目標**：**每一章有專屬的守護角色**，孩子進關卡看到的是**該章的夥伴**，而不是自己選的那一隻。
- **預期變更**：
  1. `content/levels.json` 每關新增 `companion` 欄位（該關的搭檔角色 id），
     必須取自 `content/characters.json` 的 `dex`（24 隻）或 `playable`（7 隻）。
     **分章規則**（每章可在此範圍內微調，但須語意相符）：
     - 第 0 章（序章）→ `santa`
     - 第 1 章（恐龍谷）→ `dino-triceratops`
     - 第 2 章（恐龍的語言）→ `dino-brachiosaurus`
     - 第 3 章（深海與天空）→ `dino-pteranodon`
     - 第 4 章（冰河紀的聖誕）→ `dino-trex`
     - 第 5 章（北方的一夜）→ `dino-mosasaurus`
  2. `src/js/main.js` 的 `startLevel()` 改為：
     ```js
     const companionId = level.companion || selectedCharacter;
     const char = getCharacter(bundle, companionId);
     renderCharacter($("santa-container"), char, "listen");
     ```
     **玩家選定的角色**保留在隊伍中（Step 124 會讓隊伍可見）。
  3. `content/story-arcs.json` 每章**新增** `companion` 欄位（與該章第 1 關一致），
     供信件署名與過場使用。**不得**改動既有 `letter` / `title` / `mood` / `scene` / `verbs`。
  4. 章節信件的署名改為該章搭檔（序章為聖誕老人）。
- **規範**：
  - **不得**改動既有欄位（`id` / `chapter` / `verb` / `axis` / `name` / `difficulty` /
    `theme` / `scene` / `objective` / `spec` / `stars`）。
  - 雙語必須對稱。
  - `check-content.mjs` 必須新增檢查：**每關的 `companion` 必須存在於 `characters.json`**。
  - **不得**使用 emoji。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  npm run test:play; echo "exit=$?"
  node -e "
  const l=require('./content/levels.json'); const arr=Array.isArray(l)?l:l.levels;
  const c=require('./content/characters.json');
  const ids=new Set([...(c.dex||[]),...(c.playable||[])].map(x=>x.id));
  const bad=arr.filter(x=>!x.companion || !ids.has(x.companion));
  if(bad.length){ console.error('有', bad.length, '關缺少合法 companion:', bad.map(x=>x.id).join(',')); process.exit(1); }
  const byChap={}; arr.forEach(x=>{ (byChap[x.chapter]=byChap[x.chapter]||new Set()).add(x.companion); });
  for(const [ch,s] of Object.entries(byChap)) if(s.size>2){ console.error('第'+ch+'章搭檔過於分散:', [...s].join(',')); process.exit(1); }
  console.log('[PASS] 40 關皆有合法搭檔，且每章搭檔不超過 2 隻');
  "
  ```
- **提交**：
  ```bash
  git add content/levels.json content/story-arcs.json src/js/main.js tools/check-content.mjs
  git commit -m "feat: 每關搭檔跟隨章節劇情"
  git push origin main
  ```

---

## Step 120 — 場景可辨識度與觸控視差（修掉 C1／C5）
- **依賴**：Step 119
- **檔案**：`src/js/ui/parallax.js`（修改）、`src/styles/base.css`（修改）、`src/js/main.js`（修改）、`src/js/ui/particles.js`（修改）、`content/scenes.json`（修改）
- **目標**：**場景切換必須一眼看得出來**（不只是換色），且**手機上有視差**。
- **預期變更**：
  1. `setParallax()` 改為**支援水平位移**：
     ```js
     export function setParallax(sceneRoot, x, y = 0) { /* translate3d(x*depth, y*depth, 0) */ }
     ```
     並保留**向後相容**的單參數呼叫（單參數時視為垂直位移）。
  2. `main.js` 的 `pointermove` 改為同時傳入水平與垂直位移，
     並**加上 `touchmove` 監聽**（觸控裝置的等效視差來源），必須 `passive: true`。
  3. **六個場景必須在視覺上可辨識**（不只是換顏色）：
     - 每個場景在 `data-layer="ridge"` 與 `"midground"` 上使用**不同的 `clip-path` 剪影**、
       **不同的漸層角度**、**不同的斑點紋理**。
     - 以 `data-theme="<scene>"` 為選擇器，寫出**六組**獨立的背景定義。
     - **不得**使用圖片檔（維持離線體積）。
  4. **`data-layer="character"` 層必須有內容**（目前該層只有 `z-index`，是空的）：
     必須放入**該場景的代表性剪影**（北極聖誕的聖誕樹、恐龍谷的蕨葉、冰原的冰稜…），
     用 CSS `clip-path` + 漸層繪製。
     **這是「場景一眼可辨」的關鍵。**
  5. `content/scenes.json` 的 `weather` 欄位**必須被消費**：
     - `"snow"` → 前景飄雪（既有 `startAmbientSnow`）。
     - 其他值 → **必須**有對應的環境粒子（`src/js/ui/particles.js` 的既有引擎擴充）。
     - 若無對應天氣，**必須**在 `scenes.json` 移除該欄位（不得留死欄位）。
- **規範**：
  - 不得硬編碼色碼（必須走 `--scene-*` 變數）。
  - 不得使用圖片檔。
  - 不得移除既有的五層視差。
  - `verify-quality.mjs` 的 `visual-parallax` 與 `visual-scene-diff` 必須**保持 PASS**。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node tools/verify-quality.mjs --phase visual; echo "exit=$?"
  node -e "
  const fs=require('fs');
  const s=fs.readFileSync('src/styles/base.css','utf8');
  const themes=[...new Set([...s.matchAll(/\[data-theme=\"([a-z-]+)\"\]/g)].map(m=>m[1]))];
  if(themes.length<6){ console.error('場景視覺定義只有', themes.length, '組，需 6 組'); process.exit(1); }
  if(!/data-layer=\"character\"[^}]*\{[^}]*background/.test(s)){ console.error('character 層仍是空的'); process.exit(1); }
  console.log('[PASS] 六場景視覺可辨識，character 層有內容');
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/parallax.js src/styles/base.css src/js/main.js src/js/ui/particles.js content/scenes.json
  git commit -m "feat: 六場景視覺可辨識並支援觸控視差"
  git push origin main
  ```

---

## Step 121 — 畫面與角色回歸驗證
- **依賴**：Step 120
- **檔案**：`tools/verify-playable.mjs`（修改）
- **目標**：驗證角色與場景**在實際渲染尺寸下**符合預期。
- **預期變更**：
  1. 新增 `play-character-visible`：斷言進入關卡後，
     `.char__art` 的 `src` 指向**存在於磁碟**的檔案，
     且**計算樣式**中 `.char__art` 的 `max-height` **非 `none` 且非 `0`**。
  2. 新增 `play-companion-matches`：斷言進入第 N 章的任一關時，
     `.char__art` 的 `src` **對應該關的 `companion`**。
  3. 新增 `play-scene-applied`：斷言進入第 N 章的關卡後，
     `#scene` 的 `dataset.theme` **等於該關的 `scene`**，
     且 `--scene-sky` **不等於**上一個場景的值。
  4. **保留** Step 109／113／117 的檢查不變。
- **規範**：
  - 不得放寬門檻。
  - jsdom 不做真實排版 —— **不得**假裝能測量像素；
    必須斷言**樣式契約**（CSS 規則存在且非空值）。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  ```
  預期：可玩性檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs
  git commit -m "test: 畫面與角色回歸驗證"
  git push origin main
  ```

---

# Phase D — 演出層與劇情連貫（Step 122–125）

> **v8 最大的資源錯置**：素材做到 9 分，但沒有任何一層把素材組成「舞台」。
> 結果是孩子看到雪地裡的暴龍，聽到深海的故事。

---

## Step 122 — 章節信件進入流程（修掉 C2）
- **依賴**：Step 121
- **檔案**：`src/js/main.js`（修改）、`content/story-arcs.json`（修改）
- **目標**：**六章信件每一章都必須在玩家眼前出現一次**。
- **預期變更**：
  1. `main.js` 新增 `storySeen` 追蹤（存於 `progress`，鍵為 `story.chapter`）。
     進入第 N 章的第一個關卡時，若 `progress["story." + N]` 不存在：
     → **先顯示該章過場**（`src/js/ui/story.js` 的 `showStoryScene`，掛到 `#story-root`，
     含標題、正文、搭檔立繪、CTA 按鈕）→ 關上後才 `startLevel()`。
  2. **順序必須是**：過場（信件）→ 場景切換 → 進關卡。
     玩家在過場中就應該**看到該章的場景與搭檔**（這是「畫面對上劇情」的關鍵時刻）。
  3. `content/story-arcs.json` 每章**新增** `sceneTitle`（雙語）與 `sceneTagline`（雙語）。
     **不得**改動既有 `letter` / `title` / `mood` / `scene` / `verbs` / `companion`。
  4. 過場的搭檔立繪使用該章的 `companion`（Step 119）。
  5. 信件**必須**朗讀，且朗讀期間 CTA 顯示「正在說…」。
- **規範**：
  - 雙語必須對稱（`npm run check:content` 驗證）。
  - 不得使用 emoji。不得改動既有信件內容。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('./content/story-arcs.json');
  for(const c of s.chapters){
    if(!c.sceneTitle?.['zh-TW'] || !c.sceneTitle?.['en-US']){ console.error('第'+c.chapter+'章缺少 sceneTitle'); process.exit(1); }
    if(!c.sceneTagline?.['zh-TW'] || !c.sceneTagline?.['en-US']){ console.error('第'+c.chapter+'章缺少 sceneTagline'); process.exit(1); }
  }
  console.log('[PASS] 六章皆有雙語過場標題與副標');
  "
  ```
- **提交**：
  ```bash
  git add src/js/main.js content/story-arcs.json
  git commit -m "feat: 章節信件以過場形式進入遊戲流程"
  git push origin main
  ```

---

## Step 123 — 演出層：誰、在哪、做什麼（修掉 A2）
- **依賴**：Step 122
- **檔案**：`content/performances.json`（新增）、`src/js/core/performance.js`（新增）、`src/js/main.js`（修改）、`tools/check-content.mjs`（修改）
- **目標**：建立**演出層** —— 把「24 隻角色 × 6 個場景 × 關卡事件」串成**可執行的舞台指示**。
  **這是讓素材從「零件」變成「機器」的關鍵一步。**
- **預期變更**：
  1. `content/performances.json`（新增）結構：
     ```json
     {
       "ice-age-christmas": {
         "id": "ice-age-christmas",
         "title": { "zh-TW": "冰河紀的聖誕", "en-US": "Ice Age Christmas" },
         "cast": [
           {
             "id": "dino-tyrannosaurus",
             "role": { "zh-TW": "雪原上的守護者", "en-US": "the Guardian of the Snowfield" },
             "entrance": "left",
             "props": ["lantern"]
           }
         ],
         "ambience": "snow-wind",
         "backdrop": "frozen-village"
       }
     }
     ```
     必須涵蓋 `content/scenes.json` 的**全部 6 個場景**。
  2. `src/js/core/performance.js`（新增）提供：
     ```js
     /**
      * 演出層 — 把場景、角色與事件組成可執行的舞台指示。
      *
      * 匯出：
      *   loadPerformances(data)          注入 performances.json
      *   castFor(sceneId)               取得該場景的卡司
      *   entranceOrder(sceneId)         依 entrance 排出登場順序（left→right→center）
      *   directiveFor(sceneId, event)   取得某事件的舞台指示
      *   lineFor(sceneId, dinoId, locale)  取得該角色在該場景的台詞
      *   applySceneCast(sceneId, mount) 把卡司渲染到場景容器
      */
     ```
     - `applySceneCast()` 必須渲染**多隻**角色到 `#scene` 的 `data-layer="character"` 層
       （**不是**只有 `#santa-container` 一隻），並依 `entrance` 分配水平位置。
     - `lineFor()` 讀 `content/narrative.*.json` 的 `dinoLines[dinoId]`（陣列），
       依 `sceneId` 與 `dinoId` 產生**穩定**的挑選（同一場景同一角色固定同一句），
       **不得**用 `Math.random()`。
  3. `main.js` 的 `applySceneVisual()` 改為**同時**套用色票 **與** 卡司：
     ```js
     function applySceneVisual(scene) {
         if (!scene) return;
         applyTheme($("scene"), scene);
         applySceneCast(scene, $("scene"));
         setParallax($("scene"), 0);
     }
     ```
  4. `#santa-container`（主角／搭檔）與場景卡司**分開渲染**
     （前者 `z-character`，後者在 `data-layer="character"`）。
  5. `content/narrative.*.json` **不得**改動（對白已足夠，缺的是接線）。
- **規範**：
  - `performances.json` 的每個 `cast[].id` 必須存在於 `characters.json`。
  - `check-content.mjs` 必須新增此結構檢查。
  - **不得**使用 `Math.random()` 決定台詞。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  npm run test:play; echo "exit=$?"
  node -e "
  const p=require('./content/performances.json');
  const c=require('./content/characters.json');
  const ids=new Set([...(c.dex||[]),...(c.playable||[])].map(x=>x.id));
  const scenes=Object.keys(require('./content/scenes.json'));
  const missing=scenes.filter(s=>!p[s]);
  if(missing.length){ console.error('performances.json 缺場景:', missing.join(',')); process.exit(1); }
  for(const [s,v] of Object.entries(p)){
    if(!v.cast?.length){ console.error(s,'無卡司'); process.exit(1); }
    for(const m of v.cast) if(!ids.has(m.id)){ console.error(s,'的卡司',m.id,'不存在'); process.exit(1); }
    if(!v.title?.['zh-TW']||!v.title?.['en-US']){ console.error(s,'標題雙語不全'); process.exit(1); }
  }
  console.log('[PASS] 六場景皆有合法卡司');
  "
  ```
- **提交**：
  ```bash
  git add content/performances.json src/js/core/performance.js src/js/main.js tools/check-content.mjs
  git commit -m "feat: 建立演出層，場景卡司與台詞接線"
  git push origin main
  ```

---

## Step 124 — 收集成就在遊戲中看得見（修掉 C4）
- **依賴**：Step 123
- **檔案**：`index.html`（修改）、`src/js/main.js`（修改）、`src/styles/motion.css`（修改）、`src/styles/components.css`（修改）
- **目標**：**24 隻圖鑑恐龍必須在遊戲中看得見** —— 這是「收集欲」的來源。
- **預期變更**：
  1. `index.html` 新增**隊伍列**容器：
     ```html
     <div id="team-dock" aria-label="我的隊伍"></div>
     ```
  2. 隊伍列顯示**已解鎖的恐龍縮圖**（由 `progress.unlockedDex` 驅動）：
     - 已解鎖 → 彩色縮圖（`assets/characters/<id>.svg`）。
     - 未解鎖 → **剪影**（同一 SVG 以 CSS filter 轉為剪影），**且不顯示未解鎖的數量**
       （避免孩子看到大量灰色而挫敗）。
  3. **關卡完成時，新解鎖的恐龍必須「走出來」**：
     - 於 `#team-dock` 播放一段**走入動畫**（`src/styles/motion.css` 的新 token 動畫），
       並跳出 `playUnlock()` 的粒子。
     - 必須有明顯的視覺與聽覺回饋。
  4. 隊伍列**必須出現在遊戲中**（不是只有圖鑑裡），讓孩子隨時看得到「我收集了什麼」。
  5. 隊伍列在**場景過場**時也必須可見（它們是孩子的隊伍）。
  6. **性能**：縮圖必須 `loading="lazy"`，且**不增加離線體積**（同一份 SVG）。
- **規範**：
  - 不得引入圖片檔。
  - 不得使用 emoji。
  - 隊伍列不得顯示任何評量構件（正確率／掌握度／雷達圖）。
  - 不得移除圖鑑既有功能。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/main.js','utf8');
  if(!s.includes('team-dock')){ console.error('缺少隊伍列渲染'); process.exit(1); }
  const b=require('fs').readFileSync('index.html','utf8');
  if(!b.includes('team-dock')){ console.error('index.html 缺少 #team-dock'); process.exit(1); }
  console.log('[PASS] 隊伍列已接線');
  "
  ```
- **提交**：
  ```bash
  git add index.html src/js/main.js src/styles/motion.css src/styles/components.css
  git commit -m "feat: 隊伍列讓收集成果在遊戲中看得見"
  git push origin main
  ```

---

## Step 125 — 劇情連貫回歸驗證
- **依賴**：Step 124
- **檔案**：`tools/verify-playable.mjs`（修改）
- **目標**：驗證「畫面跟人物對得上劇情」。
- **預期變更**：
  1. 新增 `play-story-per-chapter`：對**六章各取一關**，斷言：
     - 進入該關前**有過場**（`#story-root` 可見且含該章標題）。
     - 過場關上後，`#scene` 的 `dataset.theme` **等於該章 `scene`**。
     - 場景卡司**非空**（`data-layer="character"` 層內有 `.cast-member` 元素）。
     - `.char__art` 的 `src` **對應該關的 `companion`**。
  2. 新增 `play-team-visible`：斷言完成一關後，`#team-dock` 內**至少有一個**成員。
  3. 新增 `play-story-once-per-chapter`：斷言同一章的**第二關**不再顯示過場。
  4. **保留** Step 109／113／117／121 的檢查不變。
- **規範**：
  - 不得放寬門檻。
  - 不得以「直接改 `progress`」的方式模擬 —— 必須**實際玩**出一顆星星。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  ```
  預期：可玩性檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs
  git commit -m "test: 劇情連貫回歸驗證"
  git push origin main
  ```

---

# Phase E — 回饋與可讀性（Step 126–128）

---

## Step 126 — 回合回饋的三重奏
- **依賴**：Step 125
- **檔案**：`src/js/main.js`（修改）、`src/js/ui/character-render.js`（修改）、`src/styles/motion.css`（修改）
- **目標**：每次作答都有**聲音＋角色表情＋動態**三重回饋，孩子立刻知道「我做對了嗎」。
- **預期變更**：
  1. 答對時：
     - 角色切到 `happy` mood（**不是**只有 chime）。
     - 播放對應角色的 `celebrate` 音效（`content/characters.json` 的 `traits.celebrate`）。
     - 粒子 `burst()` 於角色位置。
     - 選項按鈕播放**成功**動畫（放大回彈 + 綠色描邊）。
  2. 答錯時：
     - 角色切到 `hint` mood（**友善**，不是 `sad`）。
     - 播放 `ui.soft-low`。
     - 角色**搖頭**動畫（既有 `char-wiggle`）。
     - **不得**有倒數、扣分、負面音效。
  3. **序列玩法**的中間步驟（答對一項但回合未完成）必須有**獨立的回饋**：
     - 該項**點亮**（持久化的視覺標記），角色給一個小反應（`char-bounce`）。
     - **不得**顯示「答錯」，**不得**扣分。
  4. `char` 的 mood 必須能**連續切換** —— 需要新增 `setMood(mount, mood)` 輔助函式
     （`renderCharacter()` 目前整個覆寫 `className`，會把 mood 弄丟）。
  5. 所有動效必須用 `src/styles/tokens.css` 的動畫 token，**不得**硬編碼毫秒數。
  6. 必須支援 `prefers-reduced-motion`（reduced-motion 時只做靜態狀態變化）。
- **規範**：
  - **不得**破壞 `renderCharacter` / `lookAt` / `blink` / `playRoar` / `playWalk` /
    `stopWalk` / `playHatch` 的既有介面。
  - **不得**在動畫中使用 `setInterval`。
  - **不得**引入負面情緒（幼兒產品原則：錯了不懲罰）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/ui/character-render.js','utf8');
  if(!s.includes('setMood')){ console.error('缺少 setMood（mood 無法連續切換）'); process.exit(1); }
  const m=require('fs').readFileSync('src/js/main.js','utf8');
  if(!m.includes('\"happy\"')){ console.error('答對未切換 happy mood'); process.exit(1); }
  console.log('[PASS] 三重回饋已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/main.js src/js/ui/character-render.js src/styles/motion.css
  git commit -m "feat: 回合回饋三重奏（聲音／表情／動態）"
  git push origin main
  ```

---

## Step 127 — 一眼看懂的介面
- **依賴**：Step 126
- **檔案**：`src/styles/components.css`（修改）、`src/styles/base.css`（修改）、`src/styles/responsive.css`（修改）、`assets/icons/`（新增圖示）
- **目標**：孩子 3 秒內知道現在該做什麼。
- **預期變更**：
  1. **回合提示必須視覺化**：
     - 當前要做的動作（例如「聽一聽，照順序按回去」）必須有**大圖示**（自繪 SVG）。
     - **不得**使用 emoji —— 必須是 `assets/icons/` 的自繪 SVG。
  2. **可互動元素最小 48×48 CSS px**：
     `.control-btn` / `.mode-option` / `.level-btn` / `.tool-btn` / `.dex-card`
     全部不得小於 48×48（可點擊區域，非視覺尺寸 —— 用 padding 或 `::after` 擴充）。
  3. **對比**：
     - 文字與背景對比至少 4.5:1（主要文字）。
     - 回合提示文字至少 5:1。
  4. **狀態提示必須是「動作」不是「狀態」**：
     - 目前 `setStatus("聽一聽…")` → 改為**大圖示 + 短動作詞**（「聽」）。
     - `換你了！` → 「換你」＋ 圖示。
  5. **回合進行中的視覺引導**：
     - 序列玩法：已答對的項**點亮**並**留在原位**。
     - 記憶玩法：配對成功的卡**翻正並亮起**。
     - 拼合玩法：正確放置的片**留在目標區**。
- **規範**：
  - 不得使用 emoji（`npm run check:assets` 驗證）。
  - 不得移除任何 `aria-label` / `role` / `aria-live`（可及性不得退步）。
  - 不得引入外部字體。
  - 必須支援 `prefers-reduced-motion`。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  npm run check:assets; echo "exit=$?"
  node -e "
  const fs=require('fs');
  const files=['src/styles/components.css','src/styles/base.css','src/styles/responsive.css'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
  for(const sel of ['.control-btn','.mode-option','.level-btn','.tool-btn']){
    const e=sel.replace('.','\\\\.');
    const re=new RegExp(e+'[^\\\\{]*\\\\{[^\\\\}]*(min-height|min-width):\\\\s*4[89]px');
    if(!re.test(files)){ console.error(sel+' 未達 48px 觸控目標'); process.exit(1); }
  }
  console.log('[PASS] 主要互動元素觸控目標達標');
  "
  ```
- **提交**：
  ```bash
  git add src/styles/components.css src/styles/base.css src/styles/responsive.css assets/icons
  git commit -m "feat: 一眼看懂的回合介面與觸控目標"
  git push origin main
  ```

---

## Step 128 — 導航與可讀性回歸驗證
- **依賴**：Step 127
- **檔案**：`tools/verify-playable.mjs`（修改）
- **目標**：驗證「看得懂」。
- **預期變更**：
  1. 新增 `play-touch-targets`：斷言所有 `.control-btn` / `.mode-option` / `.level-btn` /
     `.tool-btn` 的**計算樣式**中 `min-height` 或 `min-width` ≥ 48px。
  2. 新增 `play-round-affordance`：斷言每一回合都存在**視覺指示**
     （回合提示元素非空，且 `aria-live` 區域有更新）。
  3. 新增 `play-no-emoji`：斷言 `#game-container` 與各遮罩的**文字內容**不含 emoji。
  4. **保留**先前所有檢查不變。
- **規範**：
  - 不得放寬門檻。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  ```
  預期：可玩性檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs
  git commit -m "test: 導航與可讀性回歸驗證"
  git push origin main
  ```

---

# Phase F — 離線可靠性與 Web Vitals（Step 129–132）

> **這是上架前最容易在實機被發現的阻斷級問題。**

---

## Step 129 — 修好 Service Worker 預快取（修掉離線開不了）
- **依賴**：Step 128
- **檔案**：`service-worker.js`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：**飛航模式冷啟動 100% 成功**。
- **現況缺陷（實測）**：
  - 預快取指向 **3 個不存在的檔案**：`./content/chapters.json`、
    `./content/narrative.json`、`.#content/app.json`
  - **漏掉 5 個實際存在且必要的檔案**：`content/narrative.zh-TW.json`、
    `content/narrative.en-US.json`、`content/scenes.json`、`content/child-voice.json`、
    `content/store-listing.zh-TW.json`
  - 另有 9 個指向不存在路徑的 JS/CSS（`./src/js/core/constants.js`、
    `./src/js/data/loader.js`、`./src/js/game/verbs.js`、`./src/js/game/round.js`、
    `./src/js/game/router.js`、`./src/styles/tokens.css`、`./src/styles/dex.css`、
    `./src/styles/share.css`）
  - **後果**：`load-content.js` 的 `fetch("./content/narrative.${locale}.json")`
    離線時失敗 → `boot()` 直接 `return` → 「內容載入失敗，請重新整理頁面」→ **遊戲開不了**
- **預期變更**：
  1. `service-worker.js` 的 `PRECACHE` 陣列**必須與磁碟實際檔案完全一致**：
     - 移除所有不存在的路徑。
     - 補上所有必要且存在的路徑（尤其兩個 `narrative.*.json`、`scenes.json`、
       `child-voice.json`）。
  2. **必須**涵蓋 `src/js/` 下所有實際存在的模組與 `src/styles/` 下所有樣式。
  3. `install` 階段的 `cache.add` 已用 try/catch 包住（單檔失敗不致整批失敗）—— **保留**，
     但**不得**讓預快取清單包含不存在路徑（靜默失敗會掩蓋問題）。
  4. `tools/verify-quality.mjs` **新增**檢查 `sw-precache-valid`：
     - `PRECACHE` 中**每個**路徑都必須實際存在於磁碟。
     - `content/` 下**每個** `.json` 都必須被預快取。
- **規範**：
  - **不得**移除 `network-first` 導覽策略。
  - **不得**移除既有的 try/catch 容錯。
  - `CACHE_NAME` 必須**遞增版本**（`mumu-v3` → `mumu-v4`），以清掉舊的壞快取。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase integration; echo "exit=$?"
  node -e "
  const fs=require('fs');
  const sw=fs.readFileSync('service-worker.js','utf8');
  const list=sw.match(/PRECACHE = \[([\s\S]*?)\];/)[1]
    .split('\n').map(l=>l.trim()).filter(l=>l.startsWith('\"'))
    .map(l=>l.replace(/^\"|\",?$/g,''));
  const missing=list.filter(p=>!fs.existsSync(p));
  if(missing.length){ console.error('預快取指向不存在檔案:', missing.join(', ')); process.exit(1); }
  const contentFiles=fs.readdirSync('content').filter(f=>f.endsWith('.json')).map(f=>'./content/'+f);
  const notCached=contentFiles.filter(f=>!list.includes(f));
  if(notCached.length){ console.error('未預快取的 content 檔:', notCached.join(', ')); process.exit(1); }
  console.log('[PASS] 預快取清單與磁碟完全一致，共', list.length, '項');
  "
  npm run test:play; echo "exit=$?"
  ```
- **提交**：
  ```bash
  git add service-worker.js tools/verify-quality.mjs
  git commit -m "fix: 修好 Service Worker 預快取，離線冷啟動可成功"
  git push origin main
  ```

---

## Step 130 — 離線行為測試
- **依賴**：Step 129
- **檔案**：`tools/verify-playable.mjs`（修改）、`tools/test-harness.mjs`（修改）
- **目標**：**自動化**驗證離線冷啟動成功，不靠人手機測。
- **預期變更**：
  1. `tools/test-harness.mjs` 新增匯出：
     ```js
     /**
      * 模擬離線環境 — 讓 fetch 對所有 ./content/*.json 拋出網路錯誤，
      * 模擬 Service Worker 快取命中前的第一次載入失敗情境。
      *
      * 匯出：
      *   setOffline(env, boolean)   切換離線模式
      *   precacheManifest()          讀取 service-worker.js 的 PRECACHE 清單
      */
     ```
  2. `tools/verify-playable.mjs` 新增 `play-offline-boot`：
     - 讀取 `PRECACHE` 清單，**模擬 Service Worker 已快取**該清單的檔案。
     - 斷網後 `bootGame(env)`，斷言：
       - **無**「內容載入失敗」狀態。
       - 開始畫面可見。
       - 可進入關卡並完成一回合。
  3. 新增 `play-offline-level`：離線下完成第 1 關。
- **規範**：
  - 不得放寬門檻。
  - 測試必須**真的**攔截 fetch 拋錯，不得只在事後檢查 DOM。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  ```
  預期：`play-offline-boot` 與 `play-offline-level` PASS。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs tools/test-harness.mjs
  git commit -m "test: 離線冷啟動行為測試"
  git push origin main
  ```

---

## Step 131 — Web Vitals 量測（把「≥55 FPS 待實測」變成可量測）
- **依賴**：Step 130
- **檔案**：`src/js/core/vitals.js`（新增）、`src/js/main.js`（修改）、`content/telemetry.json`（修改）
- **目標**：**架構上量得到**效能指標，而不是靠人工測。
- **預期變更**：
  1. 新增 `src/js/core/vitals.js`：
     ```js
     /**
      * Web Vitals 量測 — LCP / CLS / INP 與自訂互動指標。
      *
      * 匯出：
      *   startVitals()            開始量測（PerformanceObserver）
      *   getVitals()              取得目前累積的指標快照
      *   trackFirstInteraction()  記錄首次互動時間（進畫面 → 第一次點擊）
      *   onVitals(cb)             指標變動時回呼（供遙測外送）
      *
      * 規範：
      *   - 必須支援 PerformanceObserver 不可用時的降級（回傳 null，不拋錯）
      *   - 不得阻塞遊戲流程
      *   - 不得使用 setInterval 輪詢（用 observer 事件驅動）
      */
     ```
  2. `main.js` 的 `boot()` 呼叫 `startVitals()`；
     `start-overlay` 的 click 與第一個互動元素上掛 `trackFirstInteraction()`。
  3. `content/telemetry.json` 新增事件：
     - `vitals`（參數：`lcp` / `cls` / `inp` / `firstInteractionMs`）
  4. **「首次互動時間」必須可量測** —— 這是公測關鍵指標（目標 ≤ 15 秒）。
- **規範**：
  - 不得引入 npm 套件（用瀏覽器內建 `PerformanceObserver`）。
  - 必須降級安全（無 `PerformanceObserver` 時不得拋錯）。
  - 不得阻塞遊戲流程。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/core/vitals.js','utf8');
  for(const k of ['PerformanceObserver','getVitals','trackFirstInteraction','onVitals']){
    if(!s.includes(k)){ console.error('缺少:', k); process.exit(1); }
  }
  console.log('[PASS] Web Vitals 量測已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/vitals.js src/js/main.js content/telemetry.json
  git commit -m "feat: Web Vitals 與首次互動時間量測"
  git push origin main
  ```

---

## Step 132 — 離線與效能回歸驗證
- **依賴**：Step 131
- **檔案**：`tools/verify-playable.mjs`（修改）
- **目標**：完整驗證離線與效能。
- **預期變更**：
  1. 新增 `play-vitals-degrades`：斷言無 `PerformanceObserver` 環境下
     `startVitals()` / `getVitals()` **不拋錯**且回傳可用的降級結果。
  2. 新增 `play-vitals-instrumented`：斷言 `main.js` 呼叫了 `startVitals()`
     且 `trackFirstInteraction()` 已掛在互動路徑上。
  3. 新增 `play-offline-assets`：斷言離線模式下所有 `assets/` 資源路徑都被預快取涵蓋。
  4. **保留**先前所有檢查不變。
- **規範**：
  - 不得放寬門檻。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  node tools/verify-quality.mjs --phase integration; echo "exit=$?"
  ```
  預期：兩者皆為 0。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs
  git commit -m "test: 離線與效能回歸驗證"
  git push origin main
  ```

---

# Phase G — 合規與同意流程（Step 133–136）

> **這是法規阻斷級。** `consent.js` 的 API 齊全，但**全專案沒有任何地方呼叫 `setConsent()`**，
> 也沒有隱私權政策的 UI 入口。**API 有了但玩家按不到 = 法規上等於沒有同意。**

---

## Step 133 — 首次啟動同意閘
- **依賴**：Step 132
- **檔案**：`index.html`（修改）、`src/js/ui/consent-gate.js`（新增）、`src/js/main.js`（修改）、`src/styles/components.css`（修改）
- **目標**：玩家**必須**由法定代理人家長主動選擇，才能進入遊戲。
- **預期變更**：
  1. `index.html` 新增同意遮罩：
     ```html
     <div id="consent-gate-root" class="overlay hidden" role="dialog" aria-modal="true"></div>
     ```
  2. 新增 `src/js/ui/consent-gate.js`：
     ```js
     /**
      * 首次啟動同意閘 — 未取得法定代理人家長同意前，不得進入遊戲。
      *
      * 規範：
      *   - 必須由法定代理人家長主動點選，不可預設勾選
      *   - 分析與廣告必須分開授權，可獨立撤回
      *   - 隱私權政策必須可完整捲動閱讀（不得截斷）
      *   - 未同意時不得寫入任何分析事件
      *
      * 匯出：
      *   requireConsent(root, locale)  回傳 Promise<boolean>；已同意時立即 resolve(true)
      *   openConsentSettings(root, locale)  家長可隨時開啟設定頁修改同意
      */
     ```
  3. `main.js` 的 `boot()` 在載入內容後、顯示開始畫面前，
     **必須** `await requireConsent(...)`；未同意則**不得** `showStart()`。
  4. 同意閘**必須**是獨立 overlay，**不得**侵入既有流程。
  5. 同意狀態寫入 `mumu.consent`（`consent.js` 既有 key）。
- **規範**：
  - 同意前**不得**寫入任何分析事件（`telemetry.js` 已有同意檢查，必須確保被觸發）。
  - 不得預設勾選任何選項。
  - 不得使用 emoji。
  - 不得移除 `consent.js` 的 `canTargetedAdvertise()` 恆 false 行為。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/main.js','utf8');
  if(!s.includes('requireConsent')){ console.error('boot() 未呼叫 requireConsent'); process.exit(1); }
  const b=require('fs').readFileSync('index.html','utf8');
  if(!b.includes('consent-gate-root')){ console.error('index.html 缺少 #consent-gate-root'); process.exit(1); }
  console.log('[PASS] 首次啟動同意閘已接線');
  "
  ```
- **提交**：
  ```bash
  git add index.html src/js/ui/consent-gate.js src/js/main.js src/styles/components.css
  git commit -m "feat: 首次啟動同意閘與家長設定入口"
  git push origin main
  ```

---

## Step 134 — 隱私權政策可讀入口與資料刪除
- **依賴**：Step 133
- **檔案**：`src/js/ui/consent-gate.js`（修改）、`src/js/core/consent.js`（修改）、`content/privacy.en-US.md`（新增）
- **目標**：**完整履行**資訊法規要求。
- **預期變更**：
  1. `consent-gate.js` 的同意閘**必須**有「隱私權政策」連結，
     點擊開啟**可完整捲動**的政策面板（不得截斷、不得只顯示摘要）。
  2. 新增 `content/privacy.en-US.md`（目前**只有** zh-TW 版本，英文版缺失）。
  3. `consent.js` 新增 `deleteAllData()`：
     清除 `localStorage` 中的所有 `mumu.*` key + 清除遙測佇列 + 呼叫後端刪除端點（若已接）。
     **必須**回報刪除結果（成功／部分失敗）。
  4. 家長端**必須**有「刪除所有資料」的入口。
- **規範**：
  - 不得刪除 `revokeConsent()` 的既有行為。
  - 資料刪除**必須**清空所有 `mumu.*` key（用列舉前綴，不要硬寫 key 清單）。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run check:content; echo "exit=$?"
  npm run test:play; echo "exit=$?"
  node -e "
  const fs=require('fs');
  if(!fs.existsSync('content/privacy.en-US.md')){ console.error('缺英文隱私權政策'); process.exit(1); }
  const c=require('fs').readFileSync('src/js/core/consent.js','utf8');
  if(!c.includes('deleteAllData')){ console.error('consent.js 缺少 deleteAllData'); process.exit(1); }
  console.log('[PASS] 隱私權政策與資料刪除已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/consent-gate.js src/js/core/consent.js content/privacy.en-US.md
  git commit -m "feat: 隱私權政策可讀入口與資料刪除"
  git push origin main
  ```

---

## Step 135 — 同意流程行為測試
- **依賴**：Step 134
- **檔案**：`tools/verify-playable.mjs`（修改）
- **目標**：驗證同意流程**真的會阻擋**。
- **預期變更**：
  1. 新增 `play-consent-blocks`：斷言**未同意**時，遊戲**不會**進入開始畫面。
  2. 新增 `play-consent-then-play`：斷言同意後可正常進入並完成第 1 關。
  3. 新增 `play-consent-no-analytics-before`：斷言同意前 `mumu.telemetry.queue` **為空**。
  4. 新增 `play-consent-revoke`：斷言撤回分析同意後，不再寫入新事件。
  5. 新增 `play-consent-delete-data`：斷言呼叫 `deleteAllData()` 後
     所有 `mumu.*` key 已清除。
  6. **保留**先前所有檢查不變。
- **規範**：
  - 不得放寬門檻。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  ```
  預期：可玩性檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs
  git commit -m "test: 同意流程行為測試"
  git push origin main
  ```

---

## Step 136 — 合規回歸驗證
- **依賴**：Step 135
- **檔案**：`tools/verify-quality.mjs`（修改）
- **目標**：把合規納入常駐守門。
- **預期變更**：
  1. 新增 `compliance-consent-ui`：斷言 `main.js` 呼叫 `requireConsent()`。
  2. 新增 `compliance-privacy-bilingual`：斷言 `content/privacy.zh-TW.md` 與
     `content/privacy.en-US.md` **都存在**且長度 ≥ 1200 字元。
  3. 新增 `compliance-no-targeted-ads`：斷言 `consent.js` 的
     `canTargetedAdvertise()` 恆回傳 `false`。
  4. 新增 `compliance-delete-endpoint`：斷言 `consent.js` 有 `deleteAllData()`。
  5. **保留** Step 81 的 10 條與既有全部檢查不變。
- **規範**：
  - 不得放寬門檻。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase compliance; echo "exit=$?"
  ```
  預期：合規檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs
  git commit -m "test: 合規回歸驗證"
  git push origin main
  ```

---

# Phase H — 商業管道：真實金流（Step 137–142）

> **這是 4.2 分的最大缺口。** 現況：購買按鈕最終只顯示「已記錄您的訂閱意向，敬請期待。」
> **上架必檢項目「訂閱復原」目前完全沒有 —— App Store 審核會直接退件。**

> **本 Phase 的實作邊界**：本專案是靜態網站，前端負責**接線、狀態機、UI、錯誤處理**；
> 商店 SDK 的憑證驗證需要後端（Phase I）。
> 原生 IAP 橋接在 Phase L（Step 165）。
> 低階模型**不得**寫假的假資料並宣稱已實作；
> 若無法在本 Phase 完成端到端，**必須**在 `docs/notes/step-N.md` 明確記錄缺口。

---

## Step 137 — 定義訂閱狀態機與權益契約
- **依賴**：Step 136
- **檔案**：`src/js/core/subscription.js`（新增）、`content/subscription-config.json`（新增）
- **目標**：把「購買」從一段 UI 程式碼變成**有狀態、有錯誤處理、可恢復**的流程。
- **預期變更**：
  1. 新增 `content/subscription-config.json`：
     ```json
     {
       "products": [
         { "id": "year", "platform": "web", "storeProductId": "mumu_year_annual" },
         { "id": "family", "platform": "web", "storeProductId": "mumu_family_annual" }
       ],
       "gracePeriodDays": 7,
       "refundWarningDays": 30,
       "restorePath": "settings"
     }
     ```
  2. 新增 `src/js/core/subscription.js`：
     ```js
     /**
      * 訂閱狀態機 — 管理購買、恢復、失效與降級。
      *
      * 狀態：
      *   "idle" | "purchasing" | "verifying" | "active"
      *   | "failed" | "cancelled" | "refunded" | "expired"
      *
      * 匯出：
      *   setAdapter(adapter)          注入商店 SDK 介面（測試用假 adapter）
      *   purchase(productId)          發起購買 → 回傳狀態與結果
      *   restore()                    恢復既有訂閱
      *   getStatus()                  取得目前狀態
      *   onStateChange(cb)            狀態變動回呼
      *   applyEntitlement(state)      把訂閱狀態映射為權益並寫入
      *
      * 規範：
      *   - 購買流程必須可失敗、可重試，不得卡在 pending
      *   - 恢復購買必須能覆蓋已失效的權益
      *   - 所有狀態變更都必須透過 onStateChange 通知 UI
      */
     ```
  3. 狀態機的 `adapter` 介面（**由後端／商店 SDK 實作，Phase I 與 Phase L 補**）：
     ```js
     /**
      * 商店介面 — 平台無關的購買抽象。
      *
      * 介面：
      *   canMakePayments()  回傳是否可付款
      *   purchase(productId, { parentConfirmed })  發起購買
      *   restore()          恢復購買
      *   verify(receipt)    憑證驗證（呼叫後端）
      */
     ```
- **規範**：
  - 不得硬編碼平台 SDK（必須走 `adapter`）。
  - 不得在狀態機內直接操作 DOM。
  - 必須有逾時保護（購買不得永久 pending）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/core/subscription.js','utf8');
  for(const k of ['purchase','restore','getStatus','onStateChange','applyEntitlement','setAdapter']){
    if(!s.includes(k)){ console.error('缺少匯出:', k); process.exit(1); }
  }
  if(!s.includes('expired')||!s.includes('refunded')){ console.error('狀態機缺少終態'); process.exit(1); }
  console.log('[PASS] 訂閱狀態機齊備');
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/subscription.js content/subscription-config.json
  git commit -m "feat: 訂閱狀態機與權益契約"
  git push origin main
  ```

---

## Step 138 — 付費牆接上真實購買流程
- **依賴**：Step 137
- **檔案**：`src/js/ui/paywall.js`（修改）、`src/js/core/entitlements.js`（修改）
- **目標**：付費牆的按鈕**真的**走狀態機，而不是記錄意向。
- **預期變更**：
  1. `paywall.js` 的購買按鈕改為呼叫 `subscription.purchase()`，
     並依狀態變動更新 UI：
     - `purchasing` → 按鈕顯示「處理中…」並**禁用**（防重複點擊）。
     - `verifying` → 顯示「確認中…」。
     - `active` → 顯示成功訊息 + 關閉。
     - `failed` → 顯示可理解的失敗訊息 + **重試**按鈕。
  2. **新增「恢復購買」按鈕**（`restorePath`）——
     這是**上架必檢**項目，目前完全沒有。
  3. `entitlements.js` 的 `setEntitlement()` 改為由 `subscription.applyEntitlement()` 驅動；
     `getEntitlement()` 讀取由狀態機寫入的權益（**不得**再由 UI 直接寫 `"premium"` 字串）。
  4. **修正付費牆文案債**（見 Step 140 的一致性檢查）：暫時移除無實作的承諾文案。
- **規範**：
  - 不得保留「已記錄您的訂閱意向，敬請期待。」這類**假成交**文案。
  - 必須有「恢復購買」入口。
  - 購買按鈕在 pending 時必須禁用。
  - 不得移除家長閘門（仍必須經過）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/ui/paywall.js','utf8');
  if(s.includes('敬請期待')){ console.error('仍有假成交文案'); process.exit(1); }
  if(!/restore|恢復/.test(s)){ console.error('付費牆缺少恢復購買入口'); process.exit(1); }
  console.log('[PASS] 付費牆已接上真實購買流程');
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/paywall.js src/js/core/entitlements.js
  git commit -m "feat: 付費牆接上訂閱狀態機與恢復購買"
  git push origin main
  ```

---

## Step 139 — Kids Category 家長購買確認流程
- **依賴**：Step 138
- **檔案**：`src/js/ui/paywall.js`（修改）、`src/js/ui/parental-gate.js`（修改）、`content/child-voice.json`（修改）
- **目標**：符合 Apple / Google 對兒童 App 的**強制要求**。
- **預期變更**：
  1. 購買前**必須**顯示**家長確認彈窗**（不只是算術閘門）：
     - 明示**金額**、**週期**（每年）、**可取消方式**（App Store 帳號）。
     - 明示**不會**自動續訂以外的任何隱藏條款。
     - 需家長**主動按下「確認訂閱」**才送出購買。
  2. 第二次使用（同一裝置 24 小時內）可縮短流程，但**首次必須完整**。
  3. 裝置有 Screen Time / 家長設定時，**必須**提示「請在系統設定完成訂閱」。
  4. 購買完成後**必須**顯示**家長可見的收據**（金額、方案、日期、取消說明）。
  5. 未滿 13 歲的流程**不得**自行恢復訂閱（恢復需家長閘門）。
  6. 文案進 `content/child-voice.json`（不得硬編碼在 JS 裡）。
- **規範**：
  - 不得移除既有家長閘門。
  - 不得預設勾選確認框。
  - 不得使用 emoji。
  - 家長確認文案必須**雙語對稱**。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  npm run test:play; echo "exit=$?"
  node -e "
  const v=require('./content/child-voice.json');
  if(!v.parentPurchaseConfirm){ console.error('child-voice.json 缺 parentPurchaseConfirm'); process.exit(1); }
  console.log('[PASS] 家長購買確認文案齊備');
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/paywall.js src/js/ui/parental-gate.js content/child-voice.json
  git commit -m "feat: Kids Category 家長購買確認流程"
  git push origin main
  ```

---

## Step 140 — 付費牆承諾一致性檢查（不要賣不存在的功能）
- **依賴**：Step 139
- **檔案**：`src/js/core/entitlements.js`（修改）、`content/subscription-config.json`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：**付費牆承諾的每一項功能都必須有實作**。
- **現況問題**：
  - 「跨裝置同步」→ **零實作**
  - 「最多 3 個孩子帳號」→ **無帳號系統**
  - 「優先客服」→ **無客服系統、無 CHANGELOG**
  > **上市後被用戶指出是誤導性行銷，比沒有這功能更糟。**
- **預期變更**：
  1. 為每個付費功能**定義實作狀態**：
     ```json
     {
       "features": {
         "chapter4": { "implemented": true },
         "chapter5": { "implemented": true },
         "dinoTheme": { "implemented": true },
         "parentReportFull": { "implemented": true },
         "sync": { "implemented": false, "plannedStep": "Step 141" },
         "childProfiles": { "implemented": false, "plannedStep": "Step 141" },
         "prioritySupport": { "implemented": false, "plannedStep": "Step 158" }
       }
     }
     ```
  2. `entitlements.js` 的 `PLANS[].features` **必須由 `subscription-config.json` 動態產生**，
     **只列出 `implemented: true` 的功能**。
  3. `tools/verify-quality.mjs` 新增 `commerce-no-fake-promises`：
     斷言 `PLANS[].features` 中**每一項**都在 `subscription-config.json` 標記為 `implemented: true`。
  4. 本 Step 結束時，付費牆**只顯示已實作的內容**
     （跨裝置同步等會在 Step 141 實作後才重新出現）。
- **規範**：
  - **不得**在功能未實作前出現在付費牆文案中。
  - **不得**放寬 `commerce-no-fake-promises` 的門檻。
  - 不得刪除 `PLANS` 的既有結構（`id` / `title` / `titleEn` / `price` / `priceEn`）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  node tools/verify-quality.mjs --phase commerce; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/core/entitlements.js','utf8');
  if(s.includes('跨裝置同步')){ console.error('付費牆仍列出未實作的「跨裝置同步」'); process.exit(1); }
  if(s.includes('最多 3 個孩子帳號')){ console.error('付費牆仍列出未實作的「孩子帳號」'); process.exit(1); }
  console.log('[PASS] 付費牆不再承諾未實作的功能');
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/entitlements.js content/subscription-config.json tools/verify-quality.mjs
  git commit -m "fix: 付費牆不再承諾未實作的功能"
  git push origin main
  ```

---

## Step 141 — 帳號、家庭檔案與跨裝置同步
- **依賴**：Step 140
- **檔案**：`src/js/core/account.js`（新增）、`src/js/ui/parent-report.js`（修改）、`content/subscription-config.json`（修改）、`src/js/core/entitlements.js`（修改）
- **目標**：實作「跨裝置同步」與「最多 3 個孩子檔案」，讓付費牆**可以誠實地**列出它們。
- **預期變更**：
  1. 新增 `src/js/core/account.js`：
     ```js
     /**
      * 家長帳號與孩子檔案 — 最多 3 個孩子，跨裝置同步。
      *
      * 匯出：
      *   getAccount()          取得目前帳號（未登入為 null）
      *   signIn(provider)      家長登入（provider: "apple" | "google" | "email"）
      *   signOut()             登出
      *   listChildren()        列出孩子檔案（最多 3）
      *   createChild(name)     建立孩子檔案
      *   switchChild(id)       切換目前孩子
      *   syncProgress()        同步進度（呼叫後端；未接後端時安全降級）
      *   onAccountChange(cb)   狀態變動回呼
      *
      * 規範：
      *   - 未登入時全部功能降級為本機模式，不得拋錯
      *   - 孩子檔案上限 3 個，超過時明確回報錯誤
      *   - 同步失敗不得影響本機遊戲（降級為本機模式）
      *   - 不得上傳可識別孩子的資料
      */
     ```
  2. `parent-report.js` 新增「帳號與裝置」區塊：登入／登出、孩子檔案切換、同步狀態。
     **不得**破壞既有家長報告內容。
  3. `subscription-config.json` 的 `sync` 與 `childProfiles` 改為 `implemented: true`。
  4. `entitlements.js` 的 `PLANS[].features` 重新包含這兩項。
- **規範**：
  - **不得**破壞 `parent-report.js` 的既有介面與內容。
  - 未登入／後端未接時**必須安全降級**，不得中斷遊戲。
  - **不得**上傳姓名等可識別資料。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node tools/verify-quality.mjs --phase commerce; echo "exit=$?"
  node -e "
  const a=require('fs').readFileSync('src/js/core/account.js','utf8');
  for(const k of ['signIn','signOut','listChildren','createChild','switchChild','syncProgress']){
    if(!a.includes(k)){ console.error('缺少:', k); process.exit(1); }
  }
  console.log('[PASS] 帳號與孩子檔案已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/account.js src/js/ui/parent-report.js content/subscription-config.json src/js/core/entitlements.js
  git commit -m "feat: 家長帳號與三個孩子檔案支援跨裝置同步"
  git push origin main
  ```

---

## Step 142 — 商業管道回歸驗證
- **依賴**：Step 141
- **檔案**：`tools/verify-playable.mjs`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：完整驗證金流路徑。
- **預期變更**：
  1. `tools/verify-playable.mjs` 新增（用**假 adapter**，不接真商店）：
     - `play-purchase-success`：注入假 adapter → 購買 → 狀態 `active` → 權益生效。
     - `play-purchase-failed`：假 adapter 回傳失敗 → 狀態 `failed` → 顯示重試。
     - `play-restore`：已有訂閱 → 恢復 → 權益恢復。
     - `play-purchase-blocked-before-parent`：未過家長閘門 → **不得**發起購買。
     - `play-no-fake-purchase-copy`：付費牆**不得**出現「敬請期待」等假成交文案。
  2. `tools/verify-quality.mjs` 新增 `commerce-restore-present`：
     斷言 `paywall.js` 有恢復購買入口。
  3. 新增 `commerce-kids-parent-confirm`：斷言有家長購買確認流程。
  4. **保留**既有全部檢查不變。
- **規範**：
  - 不得放寬門檻。
  - 測試**不得**依賴真實商店 SDK。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  node tools/verify-quality.mjs --phase commerce; echo "exit=$?"
  ```
  預期：兩者皆為 0。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs tools/verify-quality.mjs
  git commit -m "test: 商業管道回歸驗證"
  git push origin main
  ```

---

# Phase I — 後端與觀測（Step 143–148）

> **現況**：`telemetry.js` 第 57 行 `void 0;` — 事件永遠不會離開瀏覽器。
> 這代表所有「待實測」指標 **在架構上就無法量測**。
> 它們不是「還沒測」，是「永遠測不了」。

---

## Step 143 — 遙測外送管線
- **依賴**：Step 142
- **檔案**：`src/js/core/telemetry.js`（修改）、`content/telemetry.json`（修改）、`src/js/core/config.js`（修改）、`src/js/main.js`（修改）
- **目標**：事件**能離開瀏覽器**，且**不外洩可識別資訊**。
- **預期變更**：
  1. `config.js` 新增：
     ```js
     /** 遙測外送端點（後端提供；未設定時僅本地佇列）。 */
     export const TELEMETRY = {
         endpoint: "",          // 由部署環境注入（Step 148）
         batchSize: 20,
         flushIntervalMs: 30000,
         useBeacon: true
     };
     ```
  2. `telemetry.js` 實作外送：
     - 同意檢查（既有）→ `sanitize()`（既有）→ 入佇列（既有）→ **批次外送**。
     - 優先用 `navigator.sendBeacon`（頁面關閉不丟失），退回 `fetch`（`keepalive: true`）。
     - 失敗時**保留**佇列，下次再送（**不丟資料**）。
     - `flush()` 匯出供手動觸發。
     - 連續失敗達上限時**停止重試**（避免無限迴圈），但**不得丟棄**佇列。
  3. `content/telemetry.json` **補齊事件字典**（現有事件不足）：
     新增 `first_interaction` / `level_start` / `level_fail` / `tutorial_step` /
     `tutorial_complete` / `tutorial_skip` / `hint_shown` / `hint_used` /
     `scene_entered` / `paywall_cta` / `purchase_attempt` / `purchase_success` /
     `purchase_fail` / `restore_started` / `team_viewed` / `session_end` /
     `crash` / `vitals`。
     每個事件需有 `description` 與 `params` 型別說明。
  4. `main.js` 在 `session_end`（`visibilitychange` → hidden）時觸發 `track("session_end", ...)`。
- **規範**：
  - **不得**外送任何可識別資訊（`sanitize()` 必須保持並擴充阻擋清單）。
  - 未取得同意**不得**外送。
  - 外送失敗**不得**影響遊戲流程（不得拋錯）。
  - 不得使用 `setInterval` 輪詢（用 visibilitychange + 明確 flush 觸發）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/core/telemetry.js','utf8');
  if(s.includes('void 0;')){ console.error('telemetry.js 仍是空實作'); process.exit(1); }
  for(const k of ['sendBeacon','flush','fetch']){ if(!s.includes(k)){ console.error('缺少:', k); process.exit(1); } }
  const t=require('./content/telemetry.json');
  const names=(t.events||t).map? (t.events||t).map(e=>e.name||e) : Object.keys(t.events||t);
  for(const need of ['first_interaction','level_fail','purchase_success','vitals','crash']){
    if(!names.includes(need)){ console.error('遙測事件缺少:', need); process.exit(1); }
  }
  console.log('[PASS] 遙測外送與事件字典齊備，事件數', names.length);
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/telemetry.js content/telemetry.json src/js/core/config.js src/js/main.js
  git commit -m "feat: 遙測批次外送與完整事件字典"
  git push origin main
  ```

---

## Step 144 — Crash 報告與錯誤邊界
- **依賴**：Step 143
- **檔案**：`src/js/core/crash-reporter.js`（新增）、`src/js/main.js`（修改）
- **目標**：**知道孩子在哪一關崩潰**。
- **預期變更**：
  1. 新增 `src/js/core/crash-reporter.js`：
     ```js
     /**
      * 崩潰報告 — 捕捉未捕捉例外與 Promise 拒絕，分級回報。
      *
      * 分級：
      *   "fatal"   阻擋核心流程（無法進入遊戲／無法完成回合）
      *   "error"   功能失效但可繼續
      *   "warn"    可恢復的異常
      *
      * 匯出：
      *   installCrashReporter()   安裝全域監聽
      *   reportFatal(msg, ctx)    手動回報阻斷級錯誤
      *   getCrashes()             取得本機緩衝（供診斷）
      *   flushCrashes()           送出緩衝
      */
     ```
  2. 安裝 `window.onerror` 與 `unhandledrejection` 監聽。
  3. `main.js` 的 `boot()` 內容載入失敗時，呼叫 `reportFatal("content-load-failed", ...)`，
     **並顯示可理解的錯誤畫面**（含「重新載入」按鈕），而非只有一行文字。
  4. **關鍵流程加錯誤邊界**：關卡失敗、購買失敗、同意流程失敗都要有明確的 UI 處理。
  5. 崩潰緩衝**必須**遵守同意狀態（未同意不得外送）。
- **規範**：
  - 不得把堆疊中可能含個資的內容外送（`sanitize()` 必須套用）。
  - 崩潰報告**不得**阻塞遊戲流程。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/core/crash-reporter.js','utf8');
  for(const k of ['installCrashReporter','reportFatal','getCrashes','flushCrashes']){
    if(!s.includes(k)){ console.error('缺少:', k); process.exit(1); }
  }
  if(!s.includes('unhandledrejection')){ console.error('未捕捉 Promise 拒絕'); process.exit(1); }
  console.log('[PASS] 崩潰報告已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/crash-reporter.js src/js/main.js
  git commit -m "feat: 崩潰報告與錯誤邊界"
  git push origin main
  ```

---

## Step 145 — A/B 測試框架
- **依賴**：Step 144
- **檔案**：`content/experiments.json`（新增）、`src/js/core/experiments.js`（新增）、`src/js/main.js`（修改）、`content/telemetry.json`（修改）
- **目標**：讓 `recordIntent()` 註解寫的「供定價 A/B 使用」**真的成立**。
- **預期變更**：
  1. 新增 `content/experiments.json`：
     ```json
     {
       "experiments": [
         {
           "id": "pricing-2026q4",
           "status": "draft",
           "variants": [
             { "id": "A", "weight": 50, "plan": "year" },
             { "id": "B", "weight": 50, "plan": "family" }
           ]
         },
         {
           "id": "paywall-copy-2026q4",
           "status": "draft",
           "variants": [
             { "id": "A", "weight": 50, "headline": "解鎖完整旅程" },
             { "id": "B", "weight": 50, "headline": "讓孩子走完全六章" }
           ]
         }
       ]
     }
     ```
  2. 新增 `src/js/core/experiments.js`：
     ```js
     /**
      * A/B 測試框架 — 穩定分流與曝光／轉換事件。
      *
      * 匯出：
      *   loadExperiments(data)         注入實驗定義
      *   getVariant(expId)             取得目前使用者被分到的變體
      *   trackExposure(expId)          記錄曝光
      *   trackConversion(expId, meta)  記錄轉換
      *
      * 規範：
      *   - 分流必須依匿名 ID 雜湊（穩定且可復現），不得用 Math.random()
      *   - 同一使用者同一實驗的變體必須永不變動
      *   - 未同意分析時不得記錄曝光／轉換
      */
     ```
  3. `main.js` 在 `boot()` 載入 `experiments.json`；
     付費牆的方案呈現與標題**必須**依 `getVariant()` 決定。
  4. `content/telemetry.json` 新增 `experiment_exposure` / `experiment_conversion` 事件。
- **規範**：
  - **不得**使用 `Math.random()` 決定變體（必須可復現）。
  - 變體分配後**不得**變動。
  - 未同意分析時不得記錄曝光／轉換。
  - 不得移除既有 `recordIntent()`（改為記錄 `purchase` + `experiment_conversion`）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const e=require('fs').readFileSync('src/js/core/experiments.js','utf8');
  if(/Math\.random/.test(e)){ console.error('分流使用 Math.random（不可復現）'); process.exit(1); }
  for(const k of ['getVariant','trackExposure','trackConversion','loadExperiments']){
    if(!e.includes(k)){ console.error('缺少:', k); process.exit(1); }
  }
  const x=require('./content/experiments.json');
  console.log('[PASS] A/B 框架齊備，實驗數', (x.experiments||[]).length);
  "
  ```
- **提交**：
  ```bash
  git add content/experiments.json src/js/core/experiments.js src/js/main.js content/telemetry.json
  git commit -m "feat: A/B 測試框架與穩定分流"
  git push origin main
  ```

---

## Step 146 — 推薦碼歸因鏈路
- **依賴**：Step 145
- **檔案**：`src/js/core/referral.js`（修改）、`src/js/core/telemetry.js`（修改）
- **目標**：**K-factor 可量測**（目前只有本地歸因，無後端）。
- **預期變更**：
  1. `referral.js` 補上**歸因回報**：推薦碼被使用時，
     呼叫後端記錄「推薦者 → 被推薦者」的關聯（後端端點在 Step 148 定義）。
  2. 推薦碼解析必須**冪等**（同一碼重複使用不得重複計算）。
  3. 推薦碼必須記錄**時間戳**以便計算 K-factor 的時效性。
  4. `telemetry.json` 的 `share_install` / `referral_install` 事件補齊參數說明。
- **規範**：
  - 不得外送可識別資訊。
  - 不得讓推薦碼解析失敗影響遊戲（必須安全降級）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/core/referral.js','utf8');
  if(!s.includes('idempot') && !s.includes('冪等')){ console.error('referral.js 未說明冪等處理'); process.exit(1); }
  console.log('[PASS] 推薦碼歸因鏈路已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/referral.js src/js/core/telemetry.js
  git commit -m "feat: 推薦碼歸因鏈路與冪等處理"
  git push origin main
  ```

---

## Step 147 — 遙測與實驗回歸驗證
- **依賴**：Step 146
- **檔案**：`tools/verify-playable.mjs`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：驗證觀測管線。
- **預期變更**：
  1. `tools/verify-playable.mjs` 新增：
     - `play-telemetry-consent-gated`：未同意時 `mumu.telemetry.queue` 保持空。
     - `play-telemetry-queues-offline`：離線時事件進佇列不外送。
     - `play-telemetry-flushes`：端點可用時批次外送並清空佇列。
     - `play-telemetry-no-pii`：事件參數不含 email/name/ip/deviceId。
     - `play-experiment-stable`：同一匿名 ID 兩次呼叫 `getVariant()` 回傳相同變體。
  2. `tools/verify-quality.mjs` 新增 `observability-no-void-telemetry`：
     斷言 `telemetry.js` **不含** `void 0;` 的空實作。
  3. 新增 `observability-event-dictionary`：斷言必要事件齊備。
  4. **保留**既有全部檢查不變。
- **規範**：
  - 不得放寬門檻。
  - 測試不得依賴真實網路（用攔截的假 fetch）。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  node tools/verify-quality.mjs --phase observability; echo "exit=$?"
  ```
  預期：兩者皆為 0。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs tools/verify-quality.mjs
  git commit -m "test: 遙測與實驗回歸驗證"
  git push origin main
  ```

---

## Step 148 — 後端契約文件（交給後端團隊）
- **依賴**：Step 147
- **檔案**：`docs/backend-contract.md`（新增）
- **目標**：把前端需要後端提供的**全部契約**寫清楚，讓後端可平行開發。
- **預期變更**：
  1. `docs/backend-contract.md` 必須包含：
     - **端點清單**（每個含：方法、路徑、請求格式、回應格式、錯誤碼、認證方式）
       - `POST /v1/telemetry/batch` — 遙測批次
       - `POST /v1/crashes` — 崩潰報告
       - `POST /v1/receipt/verify` — 憑證驗證（Apple / Google）
       - `POST /v1/subscription/status` — 訂閱狀態查詢
       - `POST /v1/account/link` — 匿名帳號升級為家長帳號
       - `GET  /v1/account/children` — 孩子檔案清單
       - `POST /v1/account/children` — 建立孩子檔案
       - `GET  /v1/sync/progress` — 進度拉取
       - `PUT  /v1/sync/progress` — 進度同步
       - `POST /v1/referral/attribute` — 推薦歸因
       - `POST /v1/experiments/assignment` — 實驗分組
       - `POST /v1/data/delete` — 資料刪除
     - **資料最小化規格**：每個端點說明哪些欄位可送、哪些絕對不可送。
     - **兒少隱私注意事項**：不可上傳姓名、精確時間戳、裝置 ID、IP。
     - **認證與權限**：哪些端點需要家長 token、哪些需孩子本地 token。
     - **降級規格**：後端不可用時前端必須如何降級（**不得**阻斷遊戲）。
     - **環境變數清單**（對應 `src/js/core/config.js` 的 `TELEMETRY.endpoint` 等）。
  2. 每個前端呼叫點必須在文件中標註**對應端點**，確保一致。
- **規範**：
  - 文件必須與程式碼中的呼叫點**逐條對應**（不得寫一份程式碼沒在用的端點）。
  - 必須列出**降級規格**（後端掛掉時遊戲仍可玩）。
- **驗證**：
  ```bash
  node -e "
  const fs=require('fs');
  const doc=fs.readFileSync('docs/backend-contract.md','utf8');
  const src=['src/js/core/telemetry.js','src/js/core/account.js','src/js/core/crash-reporter.js','src/js/core/referral.js','src/js/core/subscription.js','src/js/core/experiments.js']
    .filter(f=>fs.existsSync(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');
  const calls=[...src.matchAll(/['\"\`](\/v1\/[a-z0-9\/_-]+)/gi)].map(m=>m[1]);
  const uniq=[...new Set(calls)];
  const missing=uniq.filter(p=>!doc.includes(p));
  if(missing.length){ console.error('文件缺少前端已呼叫的端點:', missing.join(', ')); process.exit(1); }
  console.log('[PASS] 後端契約涵蓋前端所有端點呼叫，共', uniq.length, '個');
  "
  ```
- **提交**：
  ```bash
  git add docs/backend-contract.md
  git commit -m "docs: 定義後端 API 契約與降級規格"
  git push origin main
  ```

---

# Phase J — 可及性與品質工程（Step 149–155）

---

## Step 149 — 鍵盤全流程可操作
- **依賴**：Step 148
- **檔案**：`src/js/ui/levelmap.js`（修改）、`src/js/ui/dex.js`（修改）、`src/styles/base.css`（修改）
- **目標**：**純鍵盤**可完成整個遊戲（無障礙法規要求）。
- **現況**：全專案 `keydown` 處理**僅 4 處**。
- **預期變更**：
  1. 所有可互動元素（關卡節點、圖鑑卡、選項鈕、關閉鈕）**必須**可用 Tab 聚焦、
     Enter / Space 觸發。
  2. 焦點**必須**可見（`:focus-visible` 樣式，不得 `outline: none` 了事）。
  3. 焦點順序**必須**符合視覺順序。
  4. 焦點在遮罩開啟／關閉時**必須**被正確管理（開啟時移入、關閉時歸位）。
  5. Escape 鍵**必須**關閉可關閉的遮罩。
- **規範**：
  - 不得移除任何 `tabindex` / `aria-label`。
  - 不得移除既有的 `keydown` 處理（`renderMemoryBoard` 的 Enter/Space）。
  - 焦點樣式必須符合對比要求。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const fs=require('fs');
  const b=fs.readFileSync('src/styles/base.css','utf8');
  if(/outline:\s*none/.test(b) && !/focus-visible/.test(b)){ console.error('焦點樣式被移除且無 focus-visible 替代'); process.exit(1); }
  console.log('[PASS] 鍵盤可及性已處理');
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/levelmap.js src/js/ui/dex.js src/styles/base.css
  git commit -m "feat: 鍵盤全流程可操作與焦點管理"
  git push origin main
  ```

---

## Step 150 — 自動可及性掃描（axe-core）
- **依賴**：Step 149
- **檔案**：`package.json`（修改）、`tools/verify-a11y.mjs`（新增）、`tools/verify-playable.mjs`（修改）
- **目標**：**自動化**可及性守門，進 CI。
- **預期變更**：
  1. `package.json` 新增 devDependency `@axe-core/js`（或 `axe-core`）
     與 script `"check:a11y": "node tools/verify-a11y.mjs"`。
  2. 新增 `tools/verify-a11y.mjs`：
     - 以 jsdom 建立環境，載入 `index.html`。
     - 注入 axe-core，掃描**每個主要畫面**（開始、同意閘、教學、角色選擇、地圖、
       關卡中、圖鑑、付費牆、家長報告）。
     - 斷言 **0 critical / 0 serious**。
     - 輸出 `[PASS]` / `[FAIL]` 與總結；有 FAIL 時 exit code = 1。
  3. `tools/verify-playable.mjs` 新增 `play-a11y-critical-zero`：
     斷言關鍵畫面（關卡中、圖鑑、付費牆）**無 critical 違規**。
  4. `package.json` 的 `check` script 串入 `check:a11y`。
- **規範**：
  - 不得放寬門檻（不得只擋 critical 而放行 serious）。
  - 不得為了讓掃描通過而移除 `aria-label` / `role`。
- **驗證**：
  ```bash
  npm install --save-dev @axe-core/js
  npm run check:a11y; echo "exit=$?"
  npm run check; echo "exit=$?"
  ```
  預期：`check:a11y` 0 critical / 0 serious；`npm run check` exit 0。
- **提交**：
  ```bash
  git add package.json package-lock.json tools/verify-a11y.mjs tools/verify-playable.mjs
  git commit -m "test: 自動可及性掃描守門"
  git push origin main
  ```

---

## Step 151 — CI 工作流程
- **依賴**：Step 150
- **檔案**：`.github/workflows/ci.yml`（新增)
- **目標**：**所有守門自動執行**，不靠人記得跑。
- **現況**：**無 `.github/workflows/`**。
- **預期變更**：
  1. 新增 `.github/workflows/ci.yml`：
     ```yaml
     name: CI
     on:
       pull_request:
       push:
         branches: [main]
     jobs:
       verify:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
           - uses: actions/setup-node@v4
             with: { node-version: 20 }
           - run: npm ci
           - run: npm run typecheck
           - run: npm run lint
           - run: npm run check:content
           - run: npm run check:assets
           - run: npm run test:play
           - run: npm run check:a11y
           - run: node tools/verify-quality.mjs
           - run: node tools/verify-phaseO.mjs --phase 1
     ```
  2. **必須**涵蓋全部守門：`typecheck` / `lint` / `check:content` / `check:assets` /
     `test:play` / `check:a11y` / `verify-quality` / `verify-phaseO --phase 1`。
  3. 不得有任何 `continue-on-error`（守門失敗必須讓 job 失敗）。
  4. 在 `task.md` 記錄「main 需保護分支，PR 必過 CI」。
- **規範**：
  - **不得**跳過任何守門。
  - 不得使用 `continue-on-error: true`。
  - 不得把 `npm run test:play` 標為 optional。
- **驗證**：
  ```bash
  node -e "
  const fs=require('fs');
  if(!fs.existsSync('.github/workflows/ci.yml')){ console.error('缺 CI workflow'); process.exit(1); }
  const y=fs.readFileSync('.github/workflows/ci.yml','utf8');
  for(const c of ['npm run typecheck','npm run lint','npm run check:content','npm run check:assets','npm run test:play','npm run check:a11y','verify-quality.mjs','verify-phaseO.mjs']){
    if(!y.includes(c)){ console.error('CI 未涵蓋:', c); process.exit(1); }
  }
  if(y.includes('continue-on-error')){ console.error('CI 含 continue-on-error'); process.exit(1); }
  console.log('[PASS] CI 涵蓋全部 8 項守門');
  "
  npm run check; echo "exit=$?"
  ```
- **提交**：
  ```bash
  git add .github/workflows/ci.yml
  git commit -m "ci: 建立全守門 CI 工作流程"
  git push origin main
  ```

---

## Step 152 — 單元測試與覆蓋率
- **依賴**：Step 151
- **檔案**：`package.json`（修改）、`tests/`（新增目錄）
- **目標**：核心邏輯有**回歸保護**。
- **預期變更**：
  1. `package.json` 新增 devDependency `vitest`（或 `node:test` + `c8`）
     與 script `"test:unit": "vitest run"`、`"test:coverage": "vitest run --coverage"`。
  2. `tests/` 至少涵蓋：
     - `src/js/core/progress.js` 的 `migrate()` / `recordLevelResult()` / `updateStreak()`
     - `src/js/core/referral.js` 的產生與解析（含校驗位不符）
     - `src/js/core/mastery.js` 的 `updateMastery()`（EMA）
     - `src/js/core/dex.js` 的 `evaluateCondition()`
     - `src/js/core/verb-contract.js` 的四種 kind 的 `submit()` 邏輯
     - `src/js/core/consent.js` 的同意／撤回／刪除
     - `src/js/core/subscription.js` 的狀態機（用假 adapter）
  3. 覆蓋率目標：核心目錄 `src/js/core/` **≥ 80%**。
  4. `package.json` 的 `check` script 串入 `test:unit`。
- **規範**：
  - 不得為了提高覆蓋率而測試無意義的實作細節。
  - 不得刪除既有測試。
  - **不得**修改 `src/` 原始碼來讓測試通過（除非測試確實揭露了 bug —— 那要寫進 `docs/notes/`）。
- **驗證**：
  ```bash
  npm run test:unit; echo "exit=$?"
  npm run test:coverage; echo "exit=$?"
  ```
  預期：全部通過，`src/js/core/` 覆蓋率 ≥ 80%。
- **提交**：
  ```bash
  git add package.json package-lock.json tests
  git commit -m "test: 核心邏輯單元測試與覆蓋率"
  git push origin main
  ```

---

## Step 153 — 資安基線（CSP 與 XSS）
- **依賴**：Step 152
- **檔案**：`src/js/core/sanitize-html.js`（新增）、`src/js/ui/share-card.js`（修改）、`src/js/ui/dex.js`（修改）、`tools/verify-quality.mjs`（修改）、`docs/csp-policy.md`（新增）
- **目標**：**消除 XSS 注入點**，並有 CSP。
- **現況**：21 處 `innerHTML`、16 處模板插值，無 CSP、無 escaping 層。
- **預期變更**：
  1. **XSS 審計**：逐一檢視 21 處 `innerHTML`，
     把**內容型資料**（使用者可影響的欄位）改為 `textContent` 或經過 escaping。
     優先處理：`share-card.js`、`dex.js`、`levelmap.js`、
     `parent-report.js`（**不得**破壞家長端功能）。
  2. 新增 `src/js/core/sanitize-html.js`：
     ```js
     /**
      * HTML 內容清理 — 供需要 innerHTML 的場景使用。
      *
      * 匯出：
      *   escapeHtml(text)     跳過所有 HTML 標籤
      *   safeText(value)      轉為安全字串（非字串一律回傳空字串）
      */
     ```
     **不得**引入 DOMPurify 等外部套件（維持零 runtime 依賴）。
  3. 新增 `docs/csp-policy.md`，記錄應設定的 CSP 標頭值：
     ```
     default-src 'self';
     script-src 'self';
     style-src 'self' 'unsafe-inline';
     img-src 'self' data: blob:;
     connect-src 'self' https://<telemetry-endpoint>;
     media-src 'self' data: blob:;
     object-src 'none';
     base-uri 'none';
     frame-ancestors 'none'
     ```
  4. `tools/verify-quality.mjs` 新增 `security-no-unescaped-innerhtml`：
     斷言 `innerHTML` 的模板插值中**沒有**直接使用未 escape 的變數。
     （以樣式規則比對，非完整語意分析，但必須能抓到明顯回歸。）
- **規範**：
  - **不得**引入 runtime 依賴。
  - **不得**破壞 `parent-report.js` / `assessment-ui.js` 的既有功能。
  - 不得移除 `aria-label`（改用 `textContent` 時要保留）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run check; echo "exit=$?"
  node tools/verify-quality.mjs --phase security; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/core/sanitize-html.js','utf8');
  if(!s.includes('escapeHtml')){ console.error('sanitize-html.js 缺少 escapeHtml'); process.exit(1); }
  console.log('[PASS] 資安基線已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/sanitize-html.js src/js/ui/share-card.js src/js/ui/dex.js tools/verify-quality.mjs docs/csp-policy.md
  git commit -m "security: 消除 XSS 注入點並建立 CSP 基線"
  git push origin main
  ```

---

## Step 154 — 視覺回歸測試
- **依賴**：Step 153
- **檔案**：`package.json`（修改）、`tools/verify-visual.mjs`（新增）、`tests/visual/`（新增目錄）
- **目標**：**版面回歸**能被自動抓到（角色尺寸、版面、分享卡）。
- **預期變更**：
  1. `package.json` 新增 devDependency `playwright`（`chromium` only）
     與 script `"check:visual": "node tools/verify-visual.mjs"`。
  2. 新增 `tools/verify-visual.mjs`：
     - 以 Playwright headless Chromium 開啟 `index.html`（**file:// 即可，不啟動伺服器**）。
     - 對關鍵畫面截圖：開始、教學、角色選擇、地圖、關卡中、圖鑑、分享卡。
     - 與 `tests/visual/baseline/` 的基準圖比對（像素差 < 2%）。
     - 首次執行**建立**基準圖；之後比對。
     - 有差異時輸出差異圖路徑並 exit 1。
  3. 截圖必須**固定視窗尺寸**（1280×720）與 `prefers-reduced-motion: reduce`。
  4. `package.json` 的 `check` script 串入 `check:visual`。
- **規範**：
  - **不得**啟動本地伺服器（用 `file://`）。
  - 不得把基準圖納入離線資產（放在 `tests/` 下，不進 `assets/`）。
  - 基準圖必須在 `git` 中追蹤（供 CI 比對）。
- **驗證**：
  ```bash
  npx playwright install chromium
  npm run check:visual; echo "exit=$?"
  npm run check; echo "exit=$?"
  ```
  預期：首次執行建立基準圖並 exit 0；第二次執行比對通過。
- **提交**：
  ```bash
  git add package.json package-lock.json tools/verify-visual.mjs tests/visual
  git commit -m "test: 視覺回歸測試"
  git push origin main
  ```

---

## Step 155 — 品質工程回歸驗證
- **依賴**：Step 154
- **檔案**：`tools/verify-quality.mjs`（修改）
- **目標**：把品質工程納入常駐守門。
- **預期變更**：
  1. 新增 `quality-ci-covers-all`：斷言 `.github/workflows/ci.yml` 存在
     且涵蓋 8 項守門（typecheck / lint / check:content / check:assets / test:play /
     check:a11y / verify-quality / verify-phaseO）。
  2. 新增 `quality-single-ci-script`：斷言 `package.json` 的 `check` script
     串入 `test:play` 與 `check:a11y`。
  3. 新增 `quality-unit-tests-exist`：斷言 `tests/` 存在且含 ≥ 5 個測試檔。
  4. 新增 `quality-visual-baseline`：斷言視覺基準圖存在。
  5. **保留** Step 81 的 10 條與既有全部檢查不變。
- **規範**：
  - 不得放寬門檻。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase quality; echo "exit=$?"
  npm run check; echo "exit=$?"
  ```
  預期：兩者皆為 0。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs
  git commit -m "test: 品質工程回歸驗證"
  git push origin main
  ```

---

# Phase K — 營運與上市準備（Step 156–161）

---

## Step 156 — i18n 文案收斂（使用者可見文案進語系檔）
- **依賴**：Step 155
- **檔案**：`content/ui-strings.json`（新增）、`src/js/data/load-content.js`（修改）、`src/js/ui/hud.js`（修改）、`src/js/ui/paywall.js`（修改）
- **目標**：使用者可見文案**收斂到語系檔**，程式碼只引用 key。
- **現況**：中文文案散落於 JS 原始碼（`"稍後再說"`、`"已記錄您的訂閱意向"`、`"我們慢慢來"`…）。
- **預期變更**：
  1. 新增 `content/ui-strings.json`：
     ```json
     {
       "paywall": {
         "close": { "zh-TW": "稍後再說", "en-US": "Not now" },
         "restore": { "zh-TW": "恢復購買", "en-US": "Restore Purchases" },
         "purchasing": { "zh-TW": "處理中…", "en-US": "Processing…" }
       },
       "toolbar": {
         "slowOn": { "zh-TW": "我們慢慢來", "en-US": "Let's go slow" }
       },
       "status": {
         "listen": { "zh-TW": "聽", "en-US": "Listen" },
         "yourTurn": { "zh-TW": "換你", "en-US": "Your turn" }
       }
     }
     ```
  2. 建立載入機制：`src/js/data/load-content.js` 載入 `ui-strings.json`，
     匯出 `t(key, locale)` 查詢函式（找不到 key 時回退到 key 本身，不得拋錯）。
  3. **本 Step 只收斂上表列出的檔案**（3 個檔案），
     避免範圍失控。**其餘檔案留待後續收斂**（不得本 Step 擴大）。
  4. `tools/check-content.mjs` 新增檢查：`ui-strings.json` 每個字串值
     **必須**有 `zh-TW` 與 `en-US`，且兩者**皆非空字串**。
- **規範**：
  - **不得**改動既有文案的語意（只搬家，不改寫）。
  - 雙語必須對稱。
  - 不得使用 emoji。
  - **不得**在本 Step 擴大到 3 個檔案以外。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  npm run check; echo "exit=$?"
  node -e "
  const s=require('./content/ui-strings.json');
  const walk=(o,p)=>{ for(const[k,v]of Object.entries(o||{})){ if(typeof v==='string'){ if(!v.trim()){ console.error('空字串:',p+'.'+k); process.exit(1); } } else if(v&&typeof v==='object'){ if(!v['zh-TW']||!v['en-US']){ console.error('雙語不全:',p+'.'+k); process.exit(1); } walk(v,p+'.'+k); } } };
  walk(s,'root');
  console.log('[PASS] ui-strings.json 雙語齊備');
  "
  ```
- **提交**：
  ```bash
  git add content/ui-strings.json src/js/data/load-content.js src/js/ui/hud.js src/js/ui/paywall.js tools/check-content.mjs
  git commit -m "refactor: 使用者可見文案收斂至語系檔（第一批）"
  git push origin main
  ```

---

## Step 157 — 成效評量流程接線（修掉死元素）
- **依賴**：Step 156
- **檔案**：`src/js/main.js`（修改）、`src/js/ui/parent-report.js`（修改）、`src/js/ui/assessment-ui.js`（修改）
- **目標**：**30 戶成效研究可以真的跑**。
- **現況**：`src/js/assessment/runner.js` 已存在，但 **`#assessment-root` 是死元素，無任何呼叫點**。
- **預期變更**：
  1. `parent-report.js` 新增「成效評估」區塊入口：
     觸發前測 → 執行 `assessment-ui.js` 的 `runAssessment()` → 完成後顯示結果。
  2. `main.js` 接入 `#assessment-root`（`showStoryScene` 風格的獨立遮罩）。
  3. 評量**必須**在家長閘門通過後才能啟動。
  4. 結果必須能**匯出**（既有 `runner.js` 的 `export()`），供研究分析。
  5. **不得**破壞 `assessment-ui.js` 的既有介面。
- **規範**：
  - **不得**破壞 `parent-report.js` / `assessment-ui.js` 的既有內容與介面。
  - 評量必須在 `progress.assessmentRuns` 留下紀錄。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/main.js','utf8');
  if(!s.includes('assessment-root')){ console.error('assessment-root 未接線'); process.exit(1); }
  console.log('[PASS] 成效評量流程已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/main.js src/js/ui/parent-report.js src/js/ui/assessment-ui.js
  git commit -m "feat: 成效評量流程接線，可執行成效研究"
  git push origin main
  ```

---

## Step 158 — 營運手冊
- **依賴**：Step 157
- **檔案**：`CHANGELOG.md`（新增）、`docs/operations.md`（新增）、`docs/support.md`（新增）
- **目標**：**出问题时有人知道怎么做**。
- **預期變更**：
  1. 新增 `CHANGELOG.md`：採用 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/) 格式，
     記錄 v3.0.0（v8 三支柱）與後續版本。
  2. 新增 `docs/operations.md`：
     - 版本策略（SemVer + 內容版本分離）
     - 崩潰分級（P0/P1/P2 定義、對應回應時限、決策責任人）
     - 遠端開關 kill switch 流程
     - 內容更新流程（關卡／文案的審批）
     - 發版檢查表（連結本清單的終局守門指令）
  3. 新增 `docs/support.md`：
     - 客服回覆模板（FAQ：訂閱、恢復購買、資料刪除、兒童隱私）
     - 回覆 SLA
  4. `subscription-config.json` 的 `prioritySupport` 改為 `implemented: true`
     （有了客服流程才算實作），並重新加入 `PLANS[].features`。
- **規範**：
  - 不得刪除既有文件。
  - `CHANGELOG.md` 必須包含 v3.0.0 的實際變更（依 `git log`）。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  node -e "
  const fs=require('fs');
  for(const f of ['CHANGELOG.md','docs/operations.md','docs/support.md']){
    if(!fs.existsSync(f)){ console.error('缺文件:', f); process.exit(1); }
    if(fs.readFileSync(f,'utf8').length<400){ console.error('內容過短:', f); process.exit(1); }
  }
  console.log('[PASS] 營運手冊齊備');
  "
  npm run check; echo "exit=$?"
  ```
- **提交**：
  ```bash
  git add CHANGELOG.md docs/operations.md docs/support.md content/subscription-config.json src/js/core/entitlements.js
  git commit -m "docs: 營運手冊、客服流程與變更日誌"
  git push origin main
  ```

---

## Step 159 — 商店送審準備清單
- **依賴**：Step 158
- **檔案**：`docs/store-review-checklist.md`（新增）、`docs/privacy-data-safety.md`（新增）
- **目標**：**送審不被打回**。
- **預期變更**：
  1. 新增 `docs/store-review-checklist.md`：
     - **Apple App Store Kids Category 逐項**（年齡分級、家長確認、隱私、
       無第三方分析 SDK 聲明、無廣告、App 隱私營養標籤）。
     - **Google Play Families Policy 逐項**。
     - 每項標註：**實作位置** + **證據** + **狀態**。
     - 未完成項一律標「未完成」，**不得**標「已驗證」。
  2. 新增 `docs/privacy-data-safety.md`：
     - 實際收集的資料項目（對照 `content/telemetry.json` 的事件與參數）
     - 每項的用途、是否關聯使用者、可否要求刪除
     - 對應商店 Data Safety 表單的填答
  3. `docs/store-listing.zh-TW.json` 的 6 張分鏡描述**必須**與實際畫面一致
     （此項**待實機截圖後**由 Step 193 更新）。
- **規範**：
  - **嚴禁**把未完成項寫成已驗證。
  - 必須標註「待實機」項目。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  node -e "
  const fs=require('fs');
  const d=fs.readFileSync('docs/store-review-checklist.md','utf8');
  if(d.length<1500){ console.error('送審清單過短'); process.exit(1); }
  if(!d.includes('未完成')){ console.error('缺「未完成」標註'); process.exit(1); }
  if(!fs.existsSync('docs/privacy-data-safety.md')){ console.error('缺資料收集說明'); process.exit(1); }
  console.log('[PASS] 商店送審準備文件已建立');
  "
  ```
- **提交**：
  ```bash
  git add docs/store-review-checklist.md docs/privacy-data-safety.md
  git commit -m "docs: 商店送審檢查表與資料收集說明"
  git push origin main
  ```

---

## Step 160 — 指標儀表板規格
- **依賴**：Step 159
- **檔案**：`docs/metrics-dashboard.md`（新增）
- **目標**：把 v8 標記的 **14 項「待實測」**全部變成**可查詢的指標**。
- **現況清單**：D7 留存 ≥ 12%、下載轉付費 ≥ 2.5%、≥ 55 FPS、−16 LUFS ±1、
  分享率 8–12%、K-factor ≥ 0.5、成效顯著性（n ≥ 30）、盲測 5/5、
  視覺完成度主觀評分、音樂聆聽評分、兒童理解度、試玩滿意度、家長評價、聆聽疲勞度。
- **預期變更**：
  1. 新增 `docs/metrics-dashboard.md`，逐項列出：
     - 指標名稱
     - 計算公式（**精確到可實作**）
     - 資料來源（對應 `content/telemetry.json` 的事件）
     - 目標值
     - 查詢方式（API 端點或 SQL）
     - **分類**：主觀項目（需真人評分）vs 客觀項目（可自動算）
  2. 明確標示哪些已因 W4 的外送管線而**可自動量測**，
     哪些仍需真人（兒童滿意度、家長評價、聆聽疲勞度、美術主觀水準）。
  3. **「≥ 55 FPS」**改為由 Step 131 的 `INP` 與 `vitals` 事件量測（**可自動算**）。
  4. **「−16 LUFS ±1」**：記錄量測方式（離線渲染音檔 + ffmpeg loudnorm），
     標為**離線工具量測**（非即時遙測）。
- **規範**：
  - 每個指標的公式必須**可直接實作**（不得寫「追蹤留存」這種模糊描述）。
  - 必須區分「可自動量測」與「需真人評分」。
  - 不得宣稱未量測的指標已達成。
- **驗證**：
  ```bash
  node -e "
  const fs=require('fs');
  const d=fs.readFileSync('docs/metrics-dashboard.md','utf8');
  const items=['留存','轉付費','分享率','K-factor','FPS','LUFS','成效','滿意度'];
  for(const i of items){ if(!d.includes(i)){ console.error('缺指標:', i); process.exit(1); } }
  if(d.length<2000){ console.error('儀表板規格過短'); process.exit(1); }
  console.log('[PASS] 指標儀表板規格齊備');
  "
  ```
- **提交**：
  ```bash
  git add docs/metrics-dashboard.md
  git commit -m "docs: 定義全部 14 項指標的計算公式與資料來源"
  git push origin main
  ```

---

## Step 161 — 上市準備回歸驗證
- **依賴**：Step 160
- **檔案**：`tools/verify-quality.mjs`（修改）
- **目標**：把上市準備納入常駐守門。
- **預期變更**：
  1. 新增 `launch-docs-complete`：斷言 `CHANGELOG.md`、`docs/operations.md`、
     `docs/support.md`、`docs/store-review-checklist.md`、
     `docs/privacy-data-safety.md`、`docs/metrics-dashboard.md`、
     `docs/backend-contract.md` **全部存在**且長度達標。
  2. 新增 `launch-no-unimplemented-promises`：斷言付費牆承諾的功能
     全部標記為 `implemented: true` 且有對應的守門條目。
  3. 新增 `launch-assessment-wired`：斷言 `#assessment-root` 有呼叫點。
  4. **保留** Step 81 的 10 條與既有全部檢查不變。
- **規範**：
  - 不得放寬門檻。
  - 不得刪除既有檢查。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase launch; echo "exit=$?"
  ```
  預期：上市準備檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs
  git commit -m "test: 上市準備回歸驗證"
  git push origin main
  ```

---

# Phase L — 內容深度與原生落地（Step 162–170）

> **本 Phase 修補 v10.5 評審發現的 5 項盲點。**
> 這 5 項**不在** Step 109–161 的範圍內，但每一項都直接影響「能不能上架收錢」與「孩子聽得值不值得」。
>
> **為什麼要排在 Phase K（營運上市）之後、Phase O（整合交付）之前？**
> 因為 Step 162（題庫深度）會**改變內容檔**，Step 163（去重抽題）會**改變引擎行為**。
> 若在整合交付後才做，前面所有 Step 的驗證都要重跑。
> （v10.6 追加：**Phase N 亦插在此處** —— Step 171–179 同樣會改動 `src/styles/`、
> `src/js/ui/` 與 `content/`，理由見 Phase N 開頭。）
>
> **v10.5 評審實測數據（本 Phase 的事實基礎）**：
> ```
> minimal-pair 關卡數: 12 × 3 回合 = 36 次作答
>   zh-TW 可用題目: 14 筆 → 0.39 筆/回合
>   en-US 可用題目: 13 筆 → 0.31 筆/回合
> rhythm 關卡數: 8 × 3 回合 = 24 次
>   可用 rhythms: 6 筆 → 0.25 筆/回合
> interference 關卡數: 5 × 3 回合 = 15 次
>   可用: 12 筆 → 0.80 筆/回合
>
> ★ 抽題邏輯為 Math.random() 隨機 → 同一關可能連續抽到同一題
> ★ minimal-pairs 12 關僅分 4 個 tier，每 tier 3 關共用同一 feature
> ★ zh-TW 全部 14 筆 feature 皆為 "initial"，tier 3/4 要求 "vowel" → 永遠 fallback 到全部池
> ★ items.json 的 interference 中 "sun-son" 的 zh-TW 為 ["孫","孫"]（兩字相同，無法辨識）
> ★ minimal-pairs 的 zh-TW 與 en-US 是各自獨立的語音學題庫（id 交集為空），非翻譯對應
> ★ sort(() => Math.random() - 0.5) 為有偏洗牌（items.js:105）
> ```

---

## Step 162 — 擴充題庫深度
- **依賴**：Step 161
- **檔案**：`content/minimal-pairs.json`（修改）、`content/items.json`（修改）、`tools/check-content.mjs`（修改）
- **目標**：讓**每一關的每一回合都有新鮮刺激**。聽覺辨識的教育價值完全建立在**差異化刺激**上 ——
  題目重複等於沒有教學。
- **現況缺陷（實測）**：
  | 玩法 | 關卡 × 回合 | 可用題目 | 缺口 |
  | --- | --- | --- | --- |
  | minimal-pair (zh-TW) | 36 | 14 | 需 ≥ 54（每回合不重複 + 20% 緩衝） |
  | minimal-pair (en-US) | 36 | 13 | 需 ≥ 54 |
  | rhythm | 24 | 6 | 需 ≥ 36 |
  | interference | 15 | 12 | 需 ≥ 24 |
  | **vowel 特徵題目** | tier 3–4 專用 | **0 筆** | 需 ≥ 12 |
- **預期變更**：
  1. `content/minimal-pairs.json` 的 **zh-TW** 補入 ≥ 40 筆新題（總數 ≥ 54），**en-US** 補入 ≥ 41 筆（總數 ≥ 54）。
     - 必須涵蓋 `feature: "initial"`（聲母差異）與 `feature: "vowel"`（韻母差異）兩類。
     - **vowel 類每個語系 ≥ 12 筆**（目前 0 筆 —— 這是 tier 3/4 難度失效的直接原因）。
     - 每筆必須有 `id` / `pair`（兩字，**必須不同**）/ `feature` / `distractor`（以 `／` 分隔）。
     - **語音學正確性**：每對字必須真的只在聲母或韻母之一有差異。不得隨意湊對。
  2. `content/items.json` 的 `rhythms` 補入 ≥ 30 筆（總數 ≥ 36），涵蓋 2/3/4/5/6/7/8/9/10/12 拍。
     每筆格式：`{ id, beats, pattern }`（`pattern` 為 0/1 陣列，長度 = beats）。
     **不得**與既有 6 筆重複 id。
  3. `content/items.json` 的 `interference` 補入 ≥ 12 筆（總數 ≥ 24），
     修正既有缺陷：`sun-son` 的 `zh-TW` 為 `["孫","孫"]`（**兩字相同，無法辨識**），
     必須改為真正可辨識的一對（如「孫／損」）。
  4. `content/items.json` 的 `pitches` 補入 ≥ 5 筆（目前僅 low/mid/high 3 筆）。
  5. `tools/check-content.mjs` **新增**檢查 `content-item-bank-depth`：
     - 對每個玩法，斷言 `可用題目數 ≥ 該玩法關卡數 × 回合數 × 1.2`。
     - 斷言 `minimal-pairs` 每個語系的 `feature: "vowel"` **≥ 12 筆**。
     - 斷言 `rhythms` 每筆 `pattern.length === beats`。
     - 斷言**所有 minimal-pair 的 `pair[0] !== pair[1]`**（不得有相同字的無效題）。
     - 斷言 `interference` 每筆的 `zh-TW` 與 `en-US` 兩字皆**不相同**。
- **規範**：
  - **不得**修改既有題目的 `id`（會破壞進度與題庫對應）。
  - **不得**修改既有 14+13 筆 minimal-pair 的 `pair` 或 `feature`（**除**修正 `sun-son` 這類明顯無效題）。
  - 新增題目**必須**雙語各自成立（zh 與 en 各自是該語系的語音學題目，**不是**翻譯對應）。
  - **不得**使用 emoji。不得使用不雅的諧音詞。
  - `distractor` 必須是**真實存在且與題目不同**的字。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  node -e "
  const mp=require('./content/minimal-pairs.json');
  const items=require('./content/items.json');
  const lv=require('./content/levels.json'); const a=Array.isArray(lv)?lv:lv.levels;
  const R=3;
  for(const loc of ['zh-TW','en-US']){
    const n=mp[loc].length;
    const need=a.filter(x=>x.verb==='minimal-pair').length*R*1.2;
    if(n<need){ console.error(loc,'minimal-pair 僅',n,'筆，需 ≥',Math.ceil(need)); process.exit(1); }
    const vowel=mp[loc].filter(x=>x.feature==='vowel').length;
    if(vowel<12){ console.error(loc,'vowel 僅',vowel,'筆，需 ≥12'); process.exit(1); }
    const bad=mp[loc].filter(x=>!x.pair||x.pair.length!==2||x.pair[0]===x.pair[1]);
    if(bad.length){ console.error(loc,'有',bad.length,'筆無效題（兩字相同）:', bad.map(x=>x.id).join(',')); process.exit(1); }
  }
  const rNeed=a.filter(x=>x.verb==='rhythm').length*R*1.2;
  if(items.rhythms.length<rNeed){ console.error('rhythms 僅',items.rhythms.length,'筆，需 ≥',Math.ceil(rNeed)); process.exit(1); }
  const badR=items.rhythms.filter(x=>!Array.isArray(x.pattern)||x.pattern.length!==x.beats);
  if(badR.length){ console.error('rhythms 有',badR.length,'筆 pattern 長度不符'); process.exit(1); }
  const iNeed=a.filter(x=>x.verb==='interference').length*R*1.2;
  if(items.interference.length<iNeed){ console.error('interference 僅',items.interference.length,'筆，需 ≥',Math.ceil(iNeed)); process.exit(1); }
  const badI=items.interference.filter(x=>(x['zh-TW']||[]).some((v,i,arr)=>arr.indexOf(v)!==i)||(x['en-US']||[]).some((v,i,arr)=>arr.indexOf(v)!==i));
  if(badI.length){ console.error('interference 有無效題:', badI.map(x=>x.id).join(',')); process.exit(1); }
  console.log('[PASS] 題庫深度達標：minimal-pair zh',mp['zh-TW'].length,'/ en',mp['en-US'].length,'/ rhythms',items.rhythms.length,'/ interference',items.interference.length);
  "
  npm run check; echo "exit=$?"
  ```
- **提交**：
  ```bash
  git add content/minimal-pairs.json content/items.json tools/check-content.mjs
  git commit -m "content: 擴充題庫深度並修正無效題"
  git push origin main
  ```

---

## Step 163 — 去重抽題：同回合不重複、跨關不重複
- **依賴**：Step 162
- **檔案**：`src/js/data/items.js`（修改）、`src/js/verbs/auditory.js`（修改）、`src/js/core/draw-history.js`（新增）
- **目標**：把隨機抽題改成**可預測、不重複、有備援**的抽題。
  **這是 Step 162 的必要配套** —— 題目變多但抽題邏輯不變，孩子還是會反覆聽到同一組。
- **現況缺陷（實測的 5 處 `Math.random()` 抽題）**：
  ```
  src/js/data/items.js:72    const picked = source[Math.floor(Math.random() * source.length)];
  src/js/data/items.js:105   const shuffled = [...all].sort(() => Math.random() - 0.5);
  src/js/verbs/auditory.js:37  const item = pool[Math.floor(Math.random() * pool.length)];
  src/js/verbs/auditory.js:96  const pattern = rhythms[Math.floor(Math.random() * rhythms.length)] || {...};
  src/js/data/levels.js:77   const idx = Math.floor(Math.random() * working.length);
  ```
  **注意 `items.js:105` 用 `sort(() => Math.random() - 0.5)` 做洗牌** —— 這是**已知有偏**的洗牌
  （排序比較函式不是隨機機率分佈），結果分佈不均勻。
- **預期變更**：
  1. 新增 `src/js/core/draw-history.js`：
     ```js
     /**
      * 抽題歷史 — 避免短期重複，並讓抽題可預測。
      *
      * 設計：
      *   - 以「已用過的題目 id 佇列」記錄最近使用的項目
      *   - 抽題時優先排除最近使用的項目；池子用盡時才回退（並記錄 backfill 事件）
      *   - 歷史以 session 為單位，跨 session 不保留（避免新玩家被舊歷史限制）
      *
      * 匯出：
      *   markUsed(itemId)         記錄使用過某題
      *   pickUnused(pool, key)    從 pool 抽一個最近未使用的項目
      *   resetHistory()           清空歷史
      *   getRepeatRate()          取得近期重複率（供守門與診斷）
      */
     ```
  2. `items.js` 的 `minimalPairFor()` 改為使用 `pickUnused()`：
     - 先依 tier 的 `feature` 篩選池。
     - 排除 `recentlyUsed` 的題目。
     - 若候選為空（池子小於已用數），**回退到完整池**並標記 backfill。
     - 選中後呼叫 `markUsed(picked.id)`。
     - **同一關的 3 個回合必須是 3 個不同題目**（由 draw-history 保證）。
  3. `auditory.js` 的 `interferenceTask()` 與 rhythm 抽題同樣改為 `pickUnused()`。
  4. `items.js:105` 的 `footprintPairs()` **必須改用 Fisher–Yates 洗牌**
     （替換 `sort(() => Math.random() - 0.5)` 的有偏洗牌）。
  5. `levels.js:77` 的選項抽取改為 `pickUnused()`（同一回合不得有重複選項）。
  6. **不得**改變抽題的**正確性語意**（哪個是對的答案不得變）。
- **規範**：
  - **不得**使用 `sort(() => Math.random() - 0.5)`（有偏洗牌）。
  - **不得**在任何情況下拋錯（池空時必須安全回退）。
  - 抽題必須**不影響正確答案**（不得讓干擾項變成正解）。
  - 不得改動既有函式的簽名（`minimalPairFor(bundle, locale, level)` 等）。
  - **不得**把 `Math.random()` 完全移除（洗牌仍需隨機性）—— 目標是**受控隨機**。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const fs=require('fs');
  const bad=[];
  for(const f of ['src/js/data/items.js','src/js/verbs/auditory.js','src/js/data/levels.js']){
    const s=fs.readFileSync(f,'utf8');
    if(s.includes('sort(() => Math.random() - 0.5)')) bad.push(f+': 有偏洗牌');
  }
  if(bad.length){ console.error(bad.join('; ')); process.exit(1); }
  const h=fs.readFileSync('src/js/core/draw-history.js','utf8');
  for(const k of ['markUsed','pickUnused','resetHistory','getRepeatRate']){
    if(!h.includes(k)){ console.error('draw-history.js 缺少:', k); process.exit(1); }
  }
  console.log('[PASS] 抽題去重機制已接線，無有偏洗牌');
  "
  ```
- **提交**：
  ```bash
  git add src/js/data/items.js src/js/verbs/auditory.js src/js/data/levels.js src/js/core/draw-history.js
  git commit -m "feat: 抽題去重，同回合與跨關不重複"
  git push origin main
  ```

---

## Step 164 — 題目重複率守門
- **依賴**：Step 163
- **檔案**：`tools/verify-playable.mjs`（修改）
- **目標**：**量化**並守住「孩子不會聽到重複題」。
  這是 Step 113 `play-verbs-coverage` 抓不到的盲區 —— 後者只驗「關卡可完成」，不驗「題目是否新鮮」。
- **預期變更**：
  1. 新增 `play-no-repeat-within-level`：
     對每個 `minimal-pair` / `rhythm` / `interference` 關卡，
     **實際玩完 3 回合**，斷言 **3 個回合的題目 id 互不相同**。
     必須**真的操作流程**（不得直接呼叫抽題函式）。
  2. 新增 `play-no-repeat-across-levels`：
     連續玩同一章的 3 個同玩法關卡，斷言**相鄰關卡**的題目**沒有完全重疊**
     （交集比例 < 50%）。
  3. 新增 `play-repeat-rate-under-threshold`：
     模擬完整 40 關通關，計算**全局重複率**，
     斷言 **< 15%**（同一題目被用兩次以上的比例）。
  4. 新增 `play-item-bank-satisfies-demand`：
     對每個玩法，斷言「可用題目數 ≥ 需求數 × 1.2」（與 Step 162 的檢查一致，作為行為側的獨立驗證）。
  5. **保留** Step 109／113／117／121／125／128／132／135／142／147／150／162 的檢查不變。
- **規範**：
  - 不得放寬門檻。
  - **不得**放寬重複率門檻以讓現況通過（若放寬則本 Step 失去意義）。
  - 測試必須**真的玩**，不得直接改 `state` 或直接呼叫抽題函式跳過流程。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  ```
  預期：可玩性檢查**全部 PASS**，含新增的 4 條題目新鮮度檢查。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs
  git commit -m "test: 題目重複率守門，確保教學刺激差異化"
  git push origin main
  ```

---

## Step 165 — 原生打包管線（Capacitor）
- **依賴**：Step 164
- **檔案**：`package.json`（修改）、`capacitor.config.ts`（新增）、`docs/native-build.md`（新增）
- **目標**：讓 App 能**打包成 iOS / Android 原生容器**。
  **這是「能收 IAP 的錢」的前提** —— App Store / Google Play 對數位內容強制要求原生 IAP，
  純 Web PWA **無法取得可驗證的商店憑證**。
- **現況**：`package.json` 無任何 Capacitor / Cordova 依賴，無原生容器。
- **預期變更**：
  1. `package.json` 新增 devDependencies：`@capacitor/cli`、`@capacitor/core`，
     dependencies：`@capacitor/ios`、`@capacitor/android`。
     另需 `@capacitor/preferences`（原生儲存，取代純 localStorage 以避免 WKWebView 儲存被系統清除）。
  2. 新增 `capacitor.config.ts`：
     ```ts
     import type { CapacitorConfig } from "@capacitor/cli";
     const config: CapacitorConfig = {
         appId: "com.xdstudio.mumu",
         appName: "Santa's Little Helper",
         webDir: ".",
         server: { androidScheme: "https" },
         ios: { contentInset: "always" },
         android: { allowMixedContent: false }
     };
     export default config;
     ```
  3. **不得**把 `node_modules` 納入 `webDir`（保持離線體積不變）。
     **不得**讓 Capacitor 改變 `src/` 的任何行為（純容器層）。
  4. 新增 `docs/native-build.md`：
     - iOS 建置流程（Xcode 專案開啟、CocoaPods、簽章設定）。
     - Android 建置流程（Gradle、簽章 keystore）。
     - **商店 IAP 憑證取得流程**（Apple Developer → StoreKit 設定 → 商品 ID；
       Google Play Console → 訂閱商品 → 授權）。
     - **本 Step 只建立容器與建置流程**；
       原生 IAP 憑證橋接在 Step 166 實作。
  5. `tools/verify-quality.mjs` 新增 `native-capacitor-config`：
     斷言 `capacitor.config.ts` 存在、`appId` 格式正確、`webDir` 不含 `node_modules`。
- **規範**：
  - **不得**修改 `src/` 的任何程式碼（本 Step 只加容器層）。
  - **不得**讓離線資產體積增加（`npm run check:assets` 必須仍 PASS，< 6MB）。
  - **不得**引入任何 runtime 依賴到 `src/` 的 import 路徑（Capacitor 只能由原生層呼叫）。
  - `appId` 必須是**固定值**，不得為佔位符。
- **驗證**：
  ```bash
  npm install
  npm run check:assets; echo "assets_exit=$?"
  npm run check; echo "exit=$?"
  node -e "
  const fs=require('fs');
  if(!fs.existsSync('capacitor.config.ts')){ console.error('缺 capacitor.config.ts'); process.exit(1); }
  const s=fs.readFileSync('capacitor.config.ts','utf8');
  if(!/appId:\s*['\"][a-z]+\.[a-z0-9.]+['\"]/.test(s)){ console.error('appId 格式錯誤'); process.exit(1); }
  if(s.includes('node_modules')){ console.error('webDir 不得含 node_modules'); process.exit(1); }
  console.log('[PASS] Capacitor 容器配置就緒');
  "
  ```
- **提交**：
  ```bash
  git add package.json package-lock.json capacitor.config.ts docs/native-build.md tools/verify-quality.mjs
  git commit -m "build: 加入 Capacitor 原生容器與建置流程"
  git push origin main
  ```

---

## Step 166 — 原生 IAP 橋接與平台適配
- **依賴**：Step 165
- **檔案**：`src/js/core/store-adapter.js`（新增）、`src/js/core/subscription.js`（修改）、`src/js/core/storage.js`（修改）、`src/js/core/account.js`（修改）、`src/js/core/back-button.js`（新增）
- **目標**：讓 Step 137 的 `adapter` 抽象**在原生環境有真實實作**，
  並補上純 Web 環境缺失的平台能力。
- **預期變更**：
  1. 新增 `src/js/core/store-adapter.js`：
     ```js
     /**
      * 商店介面實作 — Web 與原生雙路徑。
      *
      * Web：使用 Stripe Checkout + 後端 webhook 簽發權益
     * 原生：透過 Capacitor 插件呼叫 StoreKit 2 / Google Play Billing，
     *       取得可交給後端驗證的憑證
      *
      * 匯出：
      *   createStoreAdapter()   依平台回傳 adapter
      *   isNative()             偵測是否在原生容器內
      *   platform()             回傳 "ios" | "android" | "web"
      *
      * 規範：
      *   - 原生憑證必須交給後端驗證，前端不得自行判定訂閱有效
      *   - Web 與原生都必須能處理「購買失敗」「使用者取消」「已復原」
      *   - 不得因平台偵測失敗而拋錯（必須降級為 web）
      */
     ```
  2. `subscription.js` 改為使用 `createStoreAdapter()`，
     `setAdapter()` 仍保留（供測試注入假 adapter）。
  3. **原生儲存適配**：新增 `@capacitor/preferences` 的封裝
     （`storage.js` 的 `readJson` / `writeJson` 在原生環境改走 Preferences，
     Web 環境維持 localStorage）。
     **這解決 WKWebView 儲存被系統清除、導致進度遺失的已知問題。**
  4. **Android 返回鍵**：新增 `src/js/core/back-button.js`：
     ```js
     /**
      * 硬體返回鍵 — 攔截原生返回事件並映射到 overlay 堆疊。
      *
      * 匯出：
      *   installBackHandler(onBack)   註冊返回處理器
      *   pushBackHandler(fn)         壓入一個返回處理器
      *   popBackHandler()            彈出（回傳是否有處理器）
      *   getBackDepth()              目前堆疊深度
      *
      * 規範：
      *   - 堆疊為空時必須讓事件繼續傳遞（否則使用者永遠離不開 App）
      *   - 必須與 Step 116 的 overlayStack 對接
      */
     ```
     與 Step 116 的 `overlayStack` 整合。
  5. **iOS 安全區**：`src/styles/base.css` 已使用 `env(safe-area-inset-*)`，
     需確認在原生容器（無瀏覽器 chrome）下**不會留白過多**。
  6. `account.js` 在原生環境改走原生儲存（配合第 3 點）。
- **規範**：
  - **不得**在前端自行判定訂閱有效性（必須後端驗證）。
  - **不得**讓原生相依在 `src/js/` 的 import 路徑中被靜態引入
    （必須用動態 `import()` 或由原生層注入）。
  - 不得破壞既有 `subscription.setAdapter()`（測試仍需注入假 adapter）。
  - 不得破壞 `storage.js` 的既有介面（`readJson` / `writeJson` / `readText` / `writeText` / `remove`）。
  - **不得**在返回堆疊為空時阻擋返回事件。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "exit=$?"
  node -e "
  const fs=require('fs');
  for(const f of ['src/js/core/store-adapter.js','src/js/core/back-button.js']){
    if(!fs.existsSync(f)){ console.error('缺檔案:', f); process.exit(1); }
  }
  const b=fs.readFileSync('src/js/core/back-button.js','utf8');
  for(const k of ['installBackHandler','pushBackHandler','popBackHandler','getBackDepth']){
    if(!b.includes(k)){ console.error('back-button.js 缺少:', k); process.exit(1); }
  }
  const s=fs.readFileSync('src/js/core/store-adapter.js','utf8');
  for(const k of ['createStoreAdapter','isNative','platform']){
    if(!s.includes(k)){ console.error('store-adapter.js 缺少:', k); process.exit(1); }
  }
  console.log('[PASS] 原生適配層已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/store-adapter.js src/js/core/subscription.js src/js/core/storage.js src/js/core/account.js src/js/core/back-button.js src/js/main.js
  git commit -m "feat: 原生 IAP 橋接與硬體返回鍵適配"
  git push origin main
  ```

---

## Step 167 — iOS PWA 安裝引導
- **依賴**：Step 166
- **檔案**：`src/js/ui/install-prompt.js`（新增）、`src/js/main.js`（修改）、`src/styles/components.css`（修改）
- **目標**：讓 iOS 使用者**真的把 App 加到主畫面** —— 否則離線能力形同虛設。
- **現況**：實測 `grep "beforeinstallprompt|standalone|display-mode"` → **零結果**。
- **關鍵事實**：
  - **iOS Safari 不支援 `beforeinstallprompt`** → 必須用 `navigator.standalone` 偵測 +
    手動教學引導（分享 → 加入主畫面）。
  - **iOS Safari 會清除 Web 儲存與快取**（使用者未加入主畫面時）
    → 未加入主畫面的 iOS 使用者，離線開機率會顯著低於 100%。
  - **在原生容器內不需要此引導**（原生 App 本身就是主畫面圖示）。
- **預期變更**：
  1. 新增 `src/js/ui/install-prompt.js`：
     ```js
     /**
      * 安裝引導 — 協助使用者把 App 加入主畫面。
      *
      * 匯出：
      *   isStandalone()            是否已在主畫面獨立執行
      *   isIOS()                  是否為 iOS Safari
      *   needsPrompt()             是否需要顯示引導
      *   showInstallPrompt(root)   顯示引導（Android 用 beforeinstallprompt，iOS 用圖文教學）
      *   markPrompted()            記錄已引導過（不得重複騷擾）
      *
      * 規範：
      *   - 在原生容器內（Capacitor）不得顯示任何引導
      *   - 最多引導 2 次，之後不得再出現
      *   - iOS 引導必須是具體的圖文步驟教學，不可只是文字
      *   - 不得阻擋遊戲（引導必須可關閉，且不阻擋首次進入）
      */
     ```
  2. `main.js` 在 `boot()` 後、**首次互動前**（不得延後到孩子已經開始玩）判斷是否顯示。
  3. iOS 引導必須包含**真實截圖或 SVG 圖示**（分享鈕 → 加入主畫面），
     用 `assets/icons/` 的自繪 SVG（**不得**用 emoji、不得引入圖片檔）。
  4. 引導必須可關閉，且**不阻擋**同意閘（Phase G 流程優先）。
  5. `tools/verify-quality.mjs` 新增 `webview-ios-install-guide`：
     斷言 `install-prompt.js` 存在且含 `isStandalone` / `isIOS` / `needsPrompt`。
- **規範**：
  - **不得**在原生容器內顯示引導。
  - **不得**使用 emoji 或引入圖片檔（引導圖示必須是自繪 SVG）。
  - **不得**阻擋首次進入遊戲。
  - 引導頻次**最多 2 次**（記於 `mumu.install.prompted`）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run check:assets; echo "exit=$?"
  npm run test:play; echo "exit=$?"
  node -e "
  const s=require('fs').readFileSync('src/js/ui/install-prompt.js','utf8');
  for(const k of ['isStandalone','isIOS','needsPrompt','showInstallPrompt','markPrompted']){
    if(!s.includes(k)){ console.error('install-prompt.js 缺少:', k); process.exit(1); }
  }
  console.log('[PASS] iOS 安裝引導已接線');
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/install-prompt.js src/js/main.js src/styles/components.css tools/verify-quality.mjs
  git commit -m "feat: iOS PWA 加入主畫面引導"
  git push origin main
  ```

---

## Step 168 — App 內客服、條款與版本資訊入口
- **依賴**：Step 167
- **檔案**：`src/js/ui/settings.js`（新增或修改，依現況）、`src/js/ui/parent-report.js`（修改）、`src/js/core/config.js`（修改）、`index.html`（修改）
- **目標**：**App 內必須有可點入的**隱私權政策、條款、客服管道與版本資訊。
  商店送審與 Google Play 政策要求這些**在 App 內可達** —— 只有網站上的文件不夠。
- **現況**：實測 `grep "mailto|support@|聯絡我們"` → **零結果**；
  `grep "about|版本|terms|條款"` 於 settings → **零結果**。
- **預期變更**：
  1. 新增或擴充設定頁的「關於本 App」區塊：
     - **版本號**（讀 `config.js` 的 `APP.version` 與 `APP.build`）。
     - **隱私權政策**（開啟可捲動面板，載入 `content/privacy.<locale>.md`）。
     - **服務條款**（新增 `content/terms.<locale>.md`）。
     - **客服**（mailto 連結 + 常見問題摘要 + 入口至 `docs/support.md` 對應的常見問題）。
     - **資料刪除請求**（既有 Step 134 的入口，必須從此可達）。
     - **授權與素材致謝**（24 隻角色的素材來源與授權聲明）。
  2. 客服信箱與網址由 `config.js` 集中管理：
     ```js
     /** 客服與法律條款入口。 */
     export const SUPPORT = {
         email: "support@example.com",
         privacyUrl: "./content/privacy.zh-TW.md",
         termsUrl: "./content/terms.zh-TW.md"
     };
     ```
     **必須**是**真實可用的值**，不得留佔位符（否則送審會被退）。
  3. 新增 `content/terms.zh-TW.md` 與 `content/terms.en-US.md`（雙語對稱，≥ 800 字元）。
  4. `tools/check-content.mjs` 新增 `content-terms-bilingual`：
     斷言兩個 `terms` 檔存在且長度達標。
  5. `tools/verify-quality.mjs` 新增 `launch-in-app-support-entry`：
     斷言 App 內有客服信箱與隱私權政策入口（**不得**只存在於網站）。
- **規範**：
  - 客服信箱**不得**是佔位符（`example.com` 視為不通過）。
  - 雙語必須對稱。
  - 不得使用 emoji。
  - **不得**移除 Step 134 的資料刪除入口。
  - 不得移除 Step 158 已有的 `docs/support.md`。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  npm run check; echo "exit=$?"
  node -e "
  const fs=require('fs');
  for(const f of ['content/terms.zh-TW.md','content/terms.en-US.md']){
    if(!fs.existsSync(f)){ console.error('缺:', f); process.exit(1); }
    if(fs.readFileSync(f,'utf8').length<800){ console.error('內容過短:', f); process.exit(1); }
  }
  const c=fs.readFileSync('src/js/core/config.js','utf8');
  const m=/email:\s*['\"]([^'\"]+)['\"]/.exec(c);
  if(!m){ console.error('config.js 缺 SUPPORT.email'); process.exit(1); }
  if(/example\.com|placeholder|TODO/.test(m[1])){ console.error('客服信箱是佔位符:', m[1]); process.exit(1); }
  console.log('[PASS] App 內客服與條款入口就緒，客服信箱:', m[1]);
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/settings.js src/js/ui/parent-report.js src/js/core/config.js index.html content/terms.zh-TW.md content/terms.en-US.md tools/check-content.mjs tools/verify-quality.mjs
  git commit -m "feat: App 內客服、條款與版本資訊入口"
  git push origin main
  ```

---

## Step 169 — 平台適配回歸驗證
- **依賴**：Step 168
- **檔案**：`tools/verify-playable.mjs`（修改）
- **目標**：驗證 5 項盲點的**行為層**修正。
- **預期變更**：
  1. 新增 `play-back-button-closes-overlay`：
     模擬原生返回事件 → 斷言**最上層遮罩被關閉**，
     且**堆疊為空時事件未被阻擋**（可離開 App）。
  2. 新增 `play-native-storage-fallback`：
     斷言原生儲存不可用時**自動降級**為 localStorage，且**不拋錯**。
  3. 新增 `play-install-prompt-suppressed-in-native`：
     斷言原生容器內**不顯示**安裝引導。
  4. 新增 `play-support-entry-reachable`：
     斷言設定頁可到達客服信箱與隱私權政策入口。
  5. **保留** Step 109／113／164／162 等全部既有檢查不變。
- **規範**：
  - 不得放寬門檻。
  - 不得刪除既有檢查。
- **驗證**：
  ```bash
  npm run test:play; echo "exit=$?"
  ```
  預期：可玩性檢查**全部 PASS**。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs
  git commit -m "test: 平台適配回歸驗證"
  git push origin main
  ```

---

## Step 170 — Phase L 整合與守門
- **依賴**：Step 169
- **檔案**：`tools/verify-quality.mjs`（修改）、`package.json`（修改）
- **目標**：把 5 項盲點的守門**併入常駐守門**。
- **預期變更**：
  1. `tools/verify-quality.mjs` 新增 `content-item-bank-depth`（若 Step 162 已在 `check-content.mjs` 實作，
     此處改為**交叉檢查**：斷言 `check-content.mjs` 存在該檢查 id，兩處門檻一致）。
  2. 新增 `native-capacitor-config`（Step 165 已建立，此處交叉檢查）。
  3. 新增 `webview-ios-install-guide`（Step 167 已建立，此處交叉檢查）。
  4. 新增 `launch-in-app-support-entry`（Step 168 已建立，此處交叉檢查）。
  5. 新增 `content-no-biased-shuffle`：斷言全專案**無** `sort(() => Math.random() - 0.5)`。
  6. `package.json` 的 `check` script 必須串入全部新增守門。
  7. **保留** Step 81 的 10 條與既有全部檢查不變。
- **規範**：
  - 不得放寬任何既有門檻。
  - 不得刪除既有檢查。
- **驗證**：
  ```bash
  npm run check; echo "exit=$?"
  npm run test:play; echo "play_exit=$?"
  node tools/verify-quality.mjs; echo "quality_exit=$?"
  node tools/verify-phaseO.mjs --phase 1; echo "phaseO_exit=$?"
  ```
  預期：四者皆為 0。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs package.json
  git commit -m "test: 內容深度與原生落地守門整合"
  git push origin main
  ```

---

# Phase N — 設計體系／品牌／競品標竿／UX 指標（Step 171–179）

> **本 Phase 是 v10.6 的全部新增內容，也是把成熟度從 7.6 推上 9.0 的主要路徑之一**
> （另一條是 Phase P 商業可行性與 Phase Q 護城河）。
>
> **v11.0 變更**：Phase N 的研究方法由「真人訪談 ＋ 幼兒觀察式測試」
> 改為「**競品標竿研究**」（專案決策，本專案不做真人訪談）。
> 詳見 Step 177 的方案比較表與開頭「v10.6 的三個發現 → 發現 2」。
>
> **為什麼要排在 Phase K（營運上市）之後、Phase O（整合交付）之前？**
> 因為 Phase N 會**改動 `src/styles/` 與 `src/js/ui/`**，並新增**度量事件**（Step 175）
> 與**UX 指標定義**（Step 176）。這兩者都必須在 Phase O 的整合守門之前就緒，
> 否則整合守門會測到的是「改版前的畫面」。
>
> **為什麼標竿研究不能提前？**
> 標竿研究的目的不是「收集靈感」，而是「**檢查我們的每個設計決策，
> 在市場上是否已被驗證**」。這需要一個**可被完整走完的產品**才有對照基準。
> 在 Phase A 修掉 9 關卡死之前做標竿比對，會比對到一個壞掉的產品。

### Phase N 分期與人力

| 期程 | Step | 里程碑 | 成熟度 |
| --- | --- | --- | --- |
| **P6（2 週）** | 171–172 | 設計體系規格化 ＋ **實作對應表**、首幀與 color script 定稿 | 8.5 |
| **P7（1.5 週）** | 173–174 | 品牌識別系統、商店頁體系與 ASO | 8.7 |
| **P8（1.5 週）** | 175–176 | UX 指標事件接線、指標公式與目標值 | 8.8 |
| **P9（2 週）** | 177–178 | **競品標竿研究**（≥6 款標竿、≥8 條可轉移模式）、發現轉為待辦 | 8.9 |
| **P10（2 週）** | 179 | UX 修正落地 ＋ `design-implemented` 守門 | **9.0** |

> **合計 9 週**（v10.6 為 7 週，v11.0 加長 2 週）。
> **加長的理由**：v11.0 把「成熟度計分」從 Step 171 挪到 Step 179，
> 且 Step 179 的檔案上限從 6 檔放寬到 12 檔（見全域約束 2）。
> **若壓回 7 週，修正會被塞回文件 —— 這正是 v11 要根治的問題。**
>
> **可並行**：Phase N 可與 Phase P 的**資料蒐集**部分並行 ——
> 前提是 Step 175–176 必須先於 Step 179。
> **但 Step 183 之後不可並行**（定價依賴已定稿的設計與品牌）。

| 角色 | Phase N 負責 | 佔比 |
| --- | --- | --- |
| UI/UX | Step 171–174、179 | 55% |
| 標竿研究（產品負責人 + 設計） | Step 177、178 | 25% |
| 前端工程 | Step 175、176、179 | 20% |

> **風險（v11.0 已大幅降低）**：v10.6 的最大瓶頸是 Step 177 的受測者招募，
> 需 2–3 週前置作業且可能失敗。**改用競品標竿研究後，此風險消失** ——
> 標竿資料全部是公開資訊，無前置作業、無失敗風險。
>
> **v11.0 的新風險**：標竿研究有「做形式」的風險 ——
> 蒐集了 6 款產品的截圖，卻沒有一條發現轉成實作。
> **對應機制**：
> - `benchmark-executed` 守門驗證標竿數量、模式數、來源可稽核性。
> - `design-implemented` 守門驗證設計規格真的被實作。
> - `ux-findings-dispositioned` 守門驗證每條發現都有處置。
> - **三道守門串起來，才能防止「標竿變成閱讀心得」。**
>
> 若標竿研究未完成，依 Step 177／178 的規範，**如實標記「未執行」**，
> 成熟度記為 **8.4** 而非虛報 9.0。

---

## Step 171 — 設計體系規格化（從「變數集合」到「設計系統」）

- **依賴**：Step 170
- **檔案**：`docs/design-system.md`（新增）、`src/styles/tokens.css`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：讓**任何人**拿到這份文件就能畫出外觀一致的新畫面，
  而不是每個人各自發明一套。**這是「可擴充」與「各自為政」的分界線。**
- **現況**：`tokens.css` 103 行、`components.css` 669 行 = 一組好用的變數，但**不是設計系統**。
  缺元件狀態矩陣、缺 spacing/type scale 的完整理論、缺 motion token 與 token 的對應。
- **預期變更**：
  1. 新增 `docs/design-system.md`，至少包含：
     - **色彩**：primitive → semantic 的對應規則、每個 semantic token 的使用場景與禁用場景。
     - **間距**：4 基準 spacing scale 的完整語意命名
       （`--s-1` 裸數值 → 改名為 `--space-inline-tight` 等**語意別名**，
       保留原變數以相容既有 CSS）。
     - **字級**：type scale（xs/sm/md/lg/xl/display）＋ 每級的
       **使用場景、字重、行高、最小允許使用寬度**（手機 375px 下是否可用）。
     - **圓角／陰影／層級**：z-index 階梯（overlay 堆疊順序）明文化。
     - **Motion**：動效 token（duration / easing / delay）對應到
       `src/styles/motion.css` 既有動畫，**建立一對一對照表**。
     - **元件狀態矩陣**（核心）：
       對 `.control-btn` / `.mode-option` / `.level-btn` / `.tool-btn` / `.dex-card` /
       遮罩（overlay）/ 回合提示 / 進度條，各列一列狀態：
       `idle` / `hover` / `pressed` / `focus-visible` / `disabled` / `loading` / `empty` / `error`。
       **每一格都要寫明**：視覺變化、互動反應、螢幕閱讀器播報。
  2. `src/styles/tokens.css` 新增**語意別名層**（不刪任何既有變數，確保相容）：
     - `--space-*`（6 級）、`--text-*`（含語意：`--text-instruction` 回合指示、
       `--text-feedback-correct` / `--text-feedback-hint`）
     - `--motion-duration-fast` / `--motion-duration-normal` / `--motion-duration-slow`
     - `--motion-ease-standard` / `--motion-ease-emphasized`
     - `--z-overlay` / `--z-toast` / `--z-dialog` / `--z-modal`
     - **注意**：`--text-feedback-correct` 與 `--text-feedback-hint` 必須是
       **對比 ≥ 4.5:1 且不以紅/綠單獨承載語意**（色盲友善，見 Step 179 的落地與守門）。
  3. `tools/verify-quality.mjs` 新增 `design-system-documented`：
     **新增的檢查項必須帶 `phase: "design"` 欄位**
     （沿用既有 `{ id, phase, fn }` 結構，見 `tools/verify-quality.mjs` 的 `CHECKS` 陣列）。
     - 斷言 `docs/design-system.md` 存在且長度 ≥ 4000 字元。
     - 斷言其中**逐一列出**上述 8 種元件名稱。
     - 斷言 `src/styles/tokens.css` 含 `--space-inline-tight`、
       `--motion-duration-normal`、`--z-modal`、`--text-feedback-correct` 四個 token。
     - 斷言 `docs/design-system.md` 內每個元件名稱都出現在 `src/styles/components.css` 中
       （**文件與實作不得脫節**）。
- **規範**：
  - **不得刪除或改名** `src/styles/tokens.css` 的既有變數（既有 CSS 引用會壞）。
  - 不得在 `src/styles/` 引入任何外部字體或外部 CDN 資源。
  - 不得引入 emoji（圖示仍須自繪 SVG）。
  - **v11.0 變更**：本 Step 仍**只做規格與 token 定義，不得順手重構元件視覺**
    （避免與 Step 172–179 的研究結論衝突）。
    **但必須新增「實作對應表」章節**（見下），
    使 Step 179 的 `design-implemented` 守門能夠追溯每個 token 到實際使用點。
    > **v11.0 說明**：v10.6 的問題不是「不重構視覺」，
    > 而是「規格寫完就當作成熟度加完了分」。
    > v11.0 的解法是**保留規格先行**（避免返工），
    > **但把「成熟度計分」從 Step 171 挪到 Step 179** ——
    > 規格只有在**被實作**之後才計入成熟度。
    > 對應地，M19 的守門由 `design-system-documented` **與** `design-implemented` **共同**構成。
  4. **`docs/design-system.md` 必須新增「實作對應表」章節**（v11.0 新增，格式如下）：
     ```markdown
     ## 實作對應表

     | 類別 | 名稱 | 定義位置 | 實作位置 | 驗證方式 |
     | --- | --- | --- | --- | --- |
     | spacing | `--space-inline-tight` | `src/styles/tokens.css` | `src/styles/components.css` `.control-btn` | `design-implemented` |
     | type | `--text-instruction` | `src/styles/tokens.css` | `src/js/ui/hud.js` | `play-design-system-applied` |
     | color | `--text-feedback-correct` | `src/styles/tokens.css` | `src/styles/components.css` `.round__feedback--correct` | `play-design-system-applied` |
     ```
     - **每一列的「實作位置」必須填入真實存在的檔案路徑**（可為 `待實作`，
       但 `design-implemented` 會逐一檢查）。
     - **不得**有任何一列的「實作位置」指向不存在的檔案。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  node tools/verify-quality.mjs --phase design; echo "design_exit=$?"
  node -e "
  const fs=require('fs');
  const t=fs.readFileSync('src/styles/tokens.css','utf8');
  for(const k of ['--space-inline-tight','--motion-duration-normal','--z-modal','--text-feedback-correct']){
    if(!t.includes(k)){ console.error('缺 token:',k); process.exit(1); }
  }
  const d=fs.readFileSync('docs/design-system.md','utf8');
  for(const c of ['control-btn','mode-option','level-btn','tool-btn','dex-card','overlay','focus-visible']){
    if(!d.includes(c)){ console.error('設計系統缺元件:',c); process.exit(1); }
  }
  // v11.0：實作對應表必須存在，且每列都有實作位置
  if(!d.includes('實作對應表')){ console.error('缺「實作對應表」章節'); process.exit(1); }
  const rows=d.split('## 實作對應表')[1].split('\n').filter(l=>l.trim().startsWith('|')&&!l.includes('---'));
  if(rows.length<3){ console.error('實作對應表列數不足'); process.exit(1); }
  console.log('[PASS] 設計體系規格與 token 對應齊備');
  "
  ```
- **提交**：
  ```bash
  git add docs/design-system.md src/styles/tokens.css tools/verify-quality.mjs
  git commit -m "feat: 設計體系規格化與語意 token 別名層"
  git push origin main
  ```

---

## Step 172 — 首幀與場景 color script 定稿（素材 → 舞台的第一幀）

- **依賴**：Step 171
- **檔案**：`docs/visual-direction.md`（新增）、`content/scenes.json`（修改）、`src/styles/components.css`（修改）
- **目標**：定義**孩子打開 App 的第一幀長什麼樣**，以及六個場景的**視覺色彩腳本**。
  **目前素材 7.5 分但沒有「首幀」概念** —— 這是 6 張商店截圖與 App 圖標背後的視覺真相。
- **現況**：`content/scenes.json` 有 `weather` 等欄位（Step 120 已消費），
  但六場景的**色票、剪影、明度節奏**沒有被系統化定義，只靠 CSS 各自的顏色。
- **預期變更**：
  1. 新增 `docs/visual-direction.md`，包含：
     - **首幀定義**：開啟 App → 同意閘 → 教學 → 進第 1 關，
       每一幀的**主體是誰、背景是什麼、視線要落在哪裡**（三段式描述）。
     - **首幀視覺定稿**（以 ASCII／描述性 layout 圖 + token 引用表示，
       不得引用外部圖片）：主角色位置與比例、氣泡位置、CTA 位置、
       背景剪影層級（`ridge` / `midground` / `character`）。
     - **六場景 color script**：每個場景一列，欄位為
       `主色` / `次色` / `光源方向` / `明度節奏` / `剪影特徵` / `情緒關鍵字`，
       且**必須使用 `src/styles/tokens.css` 的 token 名稱**（不得寫死 hex）。
     - **情緒弧線**：六章的情緒走向（安心 → 好奇 → 挑戰 → 驚喜 → 團結 → 成就）
       與視覺明度、飽和度的對應關係。
  2. `content/scenes.json` 每個場景新增 `visual` 區塊，
     欄位對應上表的 token 名稱（**結構必須雙語對稱**）。
  3. `src/styles/components.css` 新增 `.scene-visual` 的資料屬性映射，
     讓 `data-scene` 能驅動 color script 的變數覆寫
     （**不得**為每個場景寫一條獨立 CSS 選擇器）。
- **規範**：
  - 不得在 `content/scenes.json` 的 `visual` 中寫入 hex 色碼（必須是 token 名稱）。
  - 不得因此增加 `src/` 的產物體積超過 5KB。
  - 不得移除 Step 120 已建立的場景剪影與視差行為。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run check:content; echo "content_exit=$?"
  node -e "
  const fs=require('fs');
  const s=JSON.parse(fs.readFileSync('content/scenes.json','utf8'));
  const scenes=Object.values(s.scenes||s);
  for(const sc of scenes){
    if(!sc.visual){ console.error('場景缺 visual:', sc.id); process.exit(1); }
    if(!sc.visual.primary || !sc.visual.silhouette){ console.error('visual 欄位不全:', sc.id); process.exit(1); }
  }
  const raw=fs.readFileSync('content/scenes.json','utf8');
  if(/#[0-9a-fA-F]{6}/.test(raw)){ console.error('scenes.json 出現硬編碼 hex'); process.exit(1); }
  const d=fs.readFileSync('docs/visual-direction.md','utf8');
  if(d.length<2500){ console.error('視覺定稿過短'); process.exit(1); }
  console.log('[PASS] 六場景 color script 與首幀定稿齊備');
  "
  ```
- **提交**：
  ```bash
  git add docs/visual-direction.md content/scenes.json src/styles/components.css
  git commit -m "feat: 首幀與六場景 color script 定稿"
  git push origin main
  ```

---

## Step 173 — 品牌識別系統（讓素材成為一個品牌）

- **依賴**：Step 172
- **檔案**：`docs/brand.md`（新增）、`content/brand.json`（新增）、`src/styles/components.css`（修改）
- **目標**：目前有 24 隻精緻恐龍，但**沒有一個能代表這個產品的圖形**。
  商店圖標、網站 favicon、分享卡、商店頁面都用同一個 `app-icon.svg`，
  這是「原型」而不是「品牌」的特徵。**品牌是把素材變成可被辨識、可被推薦的東西。**
- **預期變更**：
  1. 新增 `content/brand.json`，定義：
     - `wordmark`：產品名稱的**字標規格**（中英文各自字重、字距、字形處理規則）。
     - `palette`：**品牌主張色**（3 色：主 / 副 / 強調），
       必須從 `src/styles/tokens.css` 的既有變數**衍生**（不得另立一套色）。
     - `voice`：**聲音簽名**（voice signature）——
       語氣三條原則、每條配 2 個正例與 2 個反例
       （例：不用「答錯了！」用「再試試看～」）。
     - `motifs`：**圖形母題**（motif）2–3 個，
       每個說明出現在哪裡（圖示、卡司、分享卡、商店頁）。
     - `tonalRules`：不得出現的元素清單（例如：不得用紅色 + 驚嘆號組合、
       不得用 emoji、不得用「失敗」字樣）。
     - **雙語結構完全對稱**（zh-TW / en-US）。
  2. 新增 `docs/brand.md`：
     - 品牌敘事（一句話定位、對誰說、為什麼不一樣）。
     - **與競品的視覺差異點**（至少 3 條，每條要能在畫面上指出來）。
     - 應用規範（圖示、分享卡、商店頁、App 內 banner 的使用規則）。
     - **禁用範例清單**。
  3. `src/styles/components.css` 新增 `.brand-lockup` 樣式（字標 + 圖形的組合排版），
     供首幀與分享卡共用。
- **規範**：
  - **不得**修改 `assets/icons/app-icon.svg` 的既有圖形（本 Step 只定義規範）。
  - 不得在 `content/brand.json` 引用任何 token 之外的色碼。
  - 不得使用 emoji。
  - 不得宣稱「品牌已建立」—— 本 Step 只完成**規格**，
    實際應用與成效由 Step 179／181 驗證。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run check:content; echo "content_exit=$?"
  node -e "
  const fs=require('fs');
  const b=JSON.parse(fs.readFileSync('content/brand.json','utf8'));
  for(const k of ['wordmark','palette','voice','motifs','tonalRules']){
    if(!b[k]){ console.error('brand.json 缺:',k); process.exit(1); }
  }
  if(!b.voice.positives||b.voice.positives.length<2||!b.voice.negatives||b.voice.negatives.length<2){
    console.error('voice 需至少 2 正例 2 反例'); process.exit(1);
  }
  const raw=fs.readFileSync('content/brand.json','utf8');
  if(/#[0-9a-fA-F]{6}/.test(raw)){ console.error('brand.json 出現硬編碼 hex'); process.exit(1); }
  const d=fs.readFileSync('docs/brand.md','utf8');
  for(const s of ['定位','視覺差異','禁用']){ if(!d.includes(s)){ console.error('brand.md 缺:',s); process.exit(1); } }
  console.log('[PASS] 品牌識別系統規格齊備');
  "
  ```
- **提交**：
  ```bash
  git add docs/brand.md content/brand.json src/styles/components.css
  git commit -m "feat: 品牌識別系統與聲音簽名"
  git push origin main
  ```

---

## Step 174 — 商店頁體系與 ASO（把產品說清楚的那張圖）

- **依賴**：Step 173
- **檔案**：`docs/store-presentation.md`（新增）、`content/store-listing.zh-TW.json`（修改）、`content/store-listing.en-US.json`（新增）
- **目標**：**商店頁是產品的第一次面試**。現在 `content/store-listing.zh-TW.json`
  有 6 張分鏡描述，但**沒有鏡頭腳本、沒有文案策略、沒有 ASO 關鍵字**。
  同一張畫面在商店頁與 App 內的說服力完全不同。
- **預期變更**：
  1. 新增 `docs/store-presentation.md`：
     - **6 張截圖的鏡頭腳本**：每張標明
       `編號` / `一句話訊息`（商店上方的標題）/ `畫面內容` / `為什麼這個鏡頭放在這個位置`。
       - 依序為：① 首幀（角色與夥伴）② 玩法多樣性 ③ 場景演出 ④ 收集隊伍
         ⑤ 家長端雷達圖（**家長是付款人，這張最重要**）⑥ 離線隨時玩。
     - **副標題關鍵字**（每張 ≤ 30 字，繁中，**不用評量術語、不用「教育」空話**）。
     - **商店描述結構**：前三行（前三行只顯示在搜尋結果，必須自包含）、
       中段（玩法與場景）、後段（家長信任要素：離線、無廣告、資料最小化）。
     - **ASO 關鍵字表**：20–30 個繁中關鍵字，分為
       `直接關鍵字` / `長尾關鍵字` / `競品關鍵字`，並標註**不可使用**的詞
       （例如「學英文」「認字」若與實際功能不符即禁用）。
  2. `content/store-listing.zh-TW.json` 新增 `shots[]` 的
     `headline` / `subhead` / `message` 三欄（**已有 `shots` 不得刪**）。
  3. 新增 `content/store-listing.en-US.json`，結構與 zh-TW **完全對稱**。
  4. `docs/store-presentation.md` 必須包含「**這張截圖不能誠實呈現什麼**」一節 ——
     例如若 App 沒有某些能力，商店頁就**不得暗示**它有（對應 Step 140 的付費牆誠信原則）。
- **規範**：
  - **嚴禁**在商店文案中出現未實作功能的暗示（與 Step 140 一致）。
  - 不得使用 emoji。
  - 不得刪除既有 `store-listing.zh-TW.json` 的欄位。
  - 雙語檔案結構必須完全對稱。
- **驗證**：
  ```bash
  npm run check:content; echo "content_exit=$?"
  node -e "
  const fs=require('fs');
  const zh=JSON.parse(fs.readFileSync('content/store-listing.zh-TW.json','utf8'));
  const en=JSON.parse(fs.readFileSync('content/store-listing.en-US.json','utf8'));
  if(!zh.shots||zh.shots.length<6){ console.error('截圖腳本少於 6 張'); process.exit(1); }
  for(const s of zh.shots){
    if(!s.headline||!s.subhead||!s.message){ console.error('shot 欄位不全'); process.exit(1); }
  }
  if(en.shots.length !== zh.shots.length){
    console.error('雙語截鏡腳本數量不對稱'); process.exit(1);
  }
  for(let i=0;i<zh.shots.length;i++){
    if(!en.shots[i].headline||!en.shots[i].subhead||!en.shots[i].message){
      console.error('en-US shot['+i+'] 欄位不全'); process.exit(1);
    }
  }
  const d=fs.readFileSync('docs/store-presentation.md','utf8');
  for(const s of ['鏡頭腳本','ASO','關鍵字','不能誠實呈現']){
    if(!d.includes(s)){ console.error('缺:',s); process.exit(1); }
  }
  console.log('[PASS] 商店頁體系與 ASO 齊備');
  "
  ```
- **提交**：
  ```bash
  git add docs/store-presentation.md content/store-listing.zh-TW.json content/store-listing.en-US.json
  git commit -m "feat: 商店頁鏡頭腳本與 ASO 關鍵字體系"
  git push origin main
  ```

---

## Step 175 — UX 指標事件接線（讓體驗可以被量測）

- **依賴**：Step 174
- **檔案**：`content/telemetry.json`（修改）、`src/js/core/telemetry.js`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：**目前所有 UX 結論都是「待實測」，而且架構上無法實測。**
  Phase H/I 建立了管道，但事件字典缺「UX 面向」的關鍵事件。
  沒有這些事件，Step 176 的指標全部算不出來，Step 178 的守門也無從檢查。
- **現況**：`content/telemetry.json` 已有 `first_interaction` / `level_start` /
  `level_complete` 等事件（Step 143 補上），但**缺以下 UX 面向事件**。
- **預期變更**：
  1. `content/telemetry.json` 新增以下事件（每個含 `params` 型別與說明）：
     | 事件 | 觸發時機 | 參數 | 支撐的指標 |
     | --- | --- | --- | --- |
     | `first_touch` | 第一次任何 `pointerdown` | `ts` | 首次互動時間 |
     | `first_choice_made` | 第一次做出回合選擇 | `ts`, `verb` | 首次互動時間（上界） |
     | `first_round_completed` | 第一回合完成 | `ts`, `correct` | 第一回合完成率 |
     | `hint_requested` | 孩子按下提示 | `level`, `round`, `ts` | 卡關求助率 |
     | `idle_stall` | 畫面停留 > 60 秒無輸入 | `screen`, `ts` | 卡死回報率 |
     | `retry_after_error` | 答錯後再次作答 | `level`, `round`, `ts` | 自我糾正率 |
     | `level_replayed` | 同一關第二次進入 | `level`, `ts` | 主動重玩率 |
     | `dino_viewed` | 隊伍列被展開 | `count` | 收集迴圈 |
     | `paywall_dwell_3s` | 付費牆停留 ≥ 3 秒 | `plan`, `ts` | 付費牆決策率 |
     | `paywall_dismiss` | 關閉付費牆 | `plan`, `ts` | 漏斗流失 |
     | `parent_report_opened` | 家長打開雷達圖 | `ts` | 家長端價值感知 |
     | `settings_opened` | 開啟設定 | `ts` | 探索深度 |
  2. `src/js/core/telemetry.js` 補上這些事件的**發送點**
     （`first_touch` / `first_choice_made` 用 `once` 旗標去重；
     `idle_stall` 用 `visibilitychange` 與定時器實作，**不得**用 `setInterval` 空轉）。
  3. **注意**：所有事件**必須**遵守 Step 143 的同意閘（未同意不得排事件），
     且不得含任何 PII（沿用 `sanitize()`）。
  4. `tools/verify-quality.mjs` 新增 `ux-events-wired`（**帶 `phase: "ux"`**）：
     斷言 `content/telemetry.json` 含上述 12 個事件 id，
     且 `src/js/core/telemetry.js` 中每個事件 id 都**實際出現在發送邏輯中**
     （不得只在字典中宣告而無發送點）。
- **規範**：
  - **不得**破壞 Step 143 已有的 34 個事件與同意閘機制。
  - 不得發送任何可識別個人的資訊（不得含 email、姓名、裝置 ID 原值）。
  - 不得使用 `setInterval` 輪詢。
  - 不得發送事件給未同意的使用者。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "play_exit=$?"
  node tools/verify-quality.mjs --phase ux; echo "ux_exit=$?"
  node -e "
  const fs=require('fs');
  const t=JSON.parse(fs.readFileSync('content/telemetry.json','utf8'));
  const code=fs.readFileSync('src/js/core/telemetry.js','utf8');
  const ids=['first_touch','first_choice_made','first_round_completed','hint_requested','idle_stall','retry_after_error','level_replayed','dino_viewed','paywall_dwell_3s','paywall_dismiss','parent_report_opened','settings_opened'];
  for(const id of ids){
    if(!JSON.stringify(t).includes(id)){ console.error('事件字典缺:',id); process.exit(1); }
    if(!code.includes(id)){ console.error('無發送點:',id); process.exit(1); }
  }
  console.log('[PASS] 12 個 UX 事件已接線');
  "
  ```
- **提交**：
  ```bash
  git add content/telemetry.json src/js/core/telemetry.js tools/verify-quality.mjs
  git commit -m "feat: UX 面向指標事件接線（12 事件）"
  git push origin main
  ```

---

## Step 176 — UX 指標規格與目標值（寫下「什麼叫做體驗好」）

- **依賴**：Step 175
- **檔案**：`docs/ux-metrics.md`（新增）、`docs/metrics-dashboard.md`（修改）
- **目標**：**Step 160 的 14 項指標全是「產品健康度」，沒有一項是「體驗品質」。**
  本 Step 補上體驗指標，並且**明確定義目標值**——
  沒有目標值的指標只是裝飾。
- **預期變更**：
  1. 新增 `docs/ux-metrics.md`，每項指標必須有：
     **名稱** / **定義** / **計算公式（精確到可實作）** / **資料來源事件** /
     **目標值** / **查詢方式** / **分段維度**（新使用者 vs 回訪、家長啟動 vs 孩子啟動）/ **樣本門檻**。
     指標至少包含：
     | 指標 | 公式 | 目標 |
     | --- | --- | --- |
     | 首次互動時間 | `first_choice_made.ts − app_open.ts` 中位數 | ≤ 15 秒 |
     | 教學完成率 | `tutorial_complete / tutorial_start` | ≥ 80% |
     | 第一回合完成率 | `first_round_completed / level_start(第1關)` | ≥ 90% |
     | 卡關求助率 | `distinct(hint_requested 用戶) / level_start 用戶` | ≤ 8% |
     | 自我糾正率 | `retry_after_error / 答錯回合數` | ≥ 70% |
     | 主動重玩率 | `level_replayed 用戶 / level_complete 用戶` | ≥ 40% |
     | 卡死回報率 | `idle_stall 會話 / 全部會話` | ≤ 3% |
     | 付費牆 3 秒決策率 | `paywall_dwell_3s / paywall_view` | ≥ 60% |
     | 付費牆轉換率 | `purchase_success / paywall_view` | ≥ 2.5% |
     | 家長報告開啟率 | `parent_report_opened / 家長啟動會話` | ≥ 25% |
  2. `docs/metrics-dashboard.md` **新增一節「體驗指標（Phase N）」**，
     引用 `docs/ux-metrics.md` 的定義，**不得重複定義**（避免兩處不一致）。
  3. `docs/ux-metrics.md` 必須有一節「**這些目標值的來源**」，
     說明每個目標值的依據（競品基準 / 產業慣例 / 研究推估 / 暫定值需於 Step 178 校準）。
     **暫定值必須標記為暫定。**
- **規範**：
  - **不得**把「待實測」寫成已達成。
  - 每個目標值**必須**標註來源類型。
  - 不得在本 Step 宣稱任何指標已達成（此時還沒有真實資料）。
  - 不得與 `docs/metrics-dashboard.md` 的既有 14 項指標產生矛盾定義。
- **驗證**：
  ```bash
  node -e "
  const fs=require('fs');
  const d=fs.readFileSync('docs/ux-metrics.md','utf8');
  const need=['首次互動時間','第一回合完成率','卡關求助率','主動重玩率','付費牆 3 秒決策率','目標值'];
  for(const n of need){ if(!d.includes(n)){ console.error('缺指標:',n); process.exit(1); } }
  if(d.length<3000){ console.error('UX 指標規格過短'); process.exit(1); }
  if(!d.includes('這些目標值的來源')){ console.error('缺目標值來源說明'); process.exit(1); }
  const m=fs.readFileSync('docs/metrics-dashboard.md','utf8');
  if(!m.includes('體驗指標')){ console.error('儀表板未引用 UX 指標'); process.exit(1); }
  console.log('[PASS] UX 指標規格與目標值齊備');
  "
  ```
- **提交**：
  ```bash
  git add docs/ux-metrics.md docs/metrics-dashboard.md
  git commit -m "docs: 定義 10 項體驗指標的公式與目標值"
  git push origin main
  ```

---

## Step 177 — 競品標竿研究（以已成功兒童遊戲為基準）
- **依賴**：Step 176
- **檔案**：`docs/benchmark/`（新增目錄）、`docs/benchmark/README.md`（新增）
- **目標**：**本專案不進行真人訪談與幼兒觀察式測試。**
  本 Step 改以**競品標竿研究（competitive benchmarking）**取得設計依據：
  **拆解已在市場上被驗證成功的兒童教育遊戲，把它們的決策轉換成本專案的具體規格。**
- **為什麼這個替代方案成立（v11.0 決策）**：
  | 比較項 | 真人訪談（v10.6） | 競品標竿（v11.0） |
  | --- | --- | --- |
  | 取得成本 | 高（招募 2–3 週 ＋ 8–10 場訪談 ＋ 6–8 場觀察） | 低（1–2 週，公開資訊即可） |
  | 外部依賴 | **高且不可控**（招募可能失敗） | **無** |
  | 證據類型 | 第一方（自己家的孩子） | 第三方（別人的孩子，已被市場驗證） |
  | 偏差 | 樣本小（n≈6–10）、需求引導 | 存活者偏差、可能抄襲 |
  | 適用於 | 「我們的孩子喜不喜歡」 | 「市場上什麼做法被證明有效」 |
  | **可支撐的成熟度條件** | M23／M24 | **M23（改寫）／M24（改寫）／M32（新增）** |
  > **誠實說明**：競品標竿**不能**證明「我們的產品孩子會喜歡」，
  > 它只能證明「**市場上被驗證有效的做法，我們有沒有採用**」。
  > 因此 M23／M24 的定義必須改寫（見下方），且**必須新增一條明示其侷限的成熟度條件**。
  > **不得**把標竿研究包裝成「使用者研究」。
- **必選標竿產品（至少 6 款，必須涵蓋下表各類）**：
  | 類別 | 標竿產品 | 公開參考 |
  | --- | --- | --- |
  | **聽覺辨識** | Open and Go Phonics（Listen & Pick／Speed Listen） | 官網遊戲說明與教師指南 |
  | **聽覺辨識** | Phonics Hero | 官網遊戲說明 ＋ 可及性聲明 |
  | **幼兒啟蒙（免費壟斷者）** | Khan Academy Kids（Kodi Bear） | 官方部落格（手勢設計、音效回饋、視覺獎勵） |
  | **訂閱制學前** | Lingokids Plus | 官方說明中心（Progress Center、家長區、離線、多孩設定） |
  | **訂閱制學前** | Kiddopia | 官網 ＋ 第三方評比（離線、3 孩設定） |
  | **訂閱制學前** | ABCmouse | 官方支援（每日挑戰、寵物計量表） |
  | **教學法風險對照** | Endless Alphabet | Phonics.org 評測（**示範反面案例**） |
  > **為什麼必須包含 Endless Alphabet**：它是**反面標竿**。
  > Phonics.org 的評測指出其字母音不準確（/r/、/l/ 誤植），
  > 可能教錯孩子。**這直接對應本專案的 D17（vowel 特徵全為 initial）風險。**
  > 標竿研究若只有正面案例，就只是自我安慰。
- **預期變更**：
  1. 建立 `docs/benchmark/`，內含：
     - `README.md`：標竿研究計畫 —— 研究目的、標竿選取理由、資料來源與擷取日期、
       **「本研究的侷限」章節（強制）**、資料引用格式。
     - `products/`：每款標竿產品一份分析檔（≥ 6 份）。
     - `patterns.md`：跨產品的**可轉移模式**彙整（見下方欄位定義）。
     - `findings.md`：跨產品的發現（格式與 Step 178 的 `fixes.md` 對齊）。
  2. **`docs/benchmark/products/*.md` 每份必須包含以下欄位**：
     | 欄位 | 說明 |
     | --- | --- |
     | `產品名稱` ／ `平台` | — |
     | `目標年齡` | — |
     | `定價與方案` | 月／年價、免費層、試用期、孩兒設定數上限 |
     | `首次啟動流程` | 從開啟到第一個互動的步驟數與是否需成人 |
     | `核心玩法迴圈` | 一輪多長、孩子做什麼、得到什麼 |
     | **回饋機制** | 答對／答錯各自的視覺＋音效＋角色反應 |
     | **失敗處理** | 答錯是否懲罰？有無倒數？有無失敗畫面？ |
     | **觸控目標尺寸** | 最小可點擊尺寸估計 |
     | **音訊回饋** | 正確音／錯誤音（如「ding」「bong」） |
     | **家長端價值** | 家長看到什麼？是否有進度報告、儀表板、週報？ |
     | **留存機制** | 連續天數、每日挑戰、寵物計量表、streak、關卡層級 |
     | **離線能力** | 是否有、範圍多大 |
     | **無障礙** | 是否有對比／縮放／字級調整 |
     | `資料來源` | URL ＋ 擷取日期（**不得**憑印象填寫） |
     | `本專案的差距` | **必填**：我們有／沒有什麼 |
     | `建議採用的做法` | **必填**：具體到可實作 |
  3. **`docs/benchmark/patterns.md` 必須彙整出可轉移模式**，每條格式為：
     `PAT-xx` ／ `模式名稱` ／ `來源產品（≥2 款才算「跨產品模式」，只有 1 款則標 PAT-SINGLE-xx）` ／
     `該模式解決的問題` ／ `在本專案的具體實作方式（檔案 ＋ 行為）` ／ `預期改善的指標`。
     > **「來源 ≥2 款」是重要的紀律** ——
     > 避免把單一產品的 idiosyncrasy 誤認為通用最佳解。
     > 單一來源必須明確標記，且**不得**單獨支撐成熟度條件。
  4. **`docs/benchmark/README.md` 必須包含「本研究的侷限」章節**，明列：
     - 本研究**沒有**第一方使用者資料（無訪談、無幼兒觀察）。
     - 因此**不能**證明「木木遊戲的孩子會喜歡」。
     - 標竿產品可能有較大的預算、較長的開發期、不同的文化背景。
     - 存在存活者偏差（只看活下來的產品）。
     - **結論一律標為「待實測」**，直到 Step 194 的上市後數據。
- **強制規避（v11.0，重要）**：
  - **嚴禁**直接複製標竿產品的美術、字型、角色造型、動畫、音效、程式碼或文案。
  - 只能萃取**設計決策與模式**（例如「答錯不懲罰，改為鼓勵再試」），**不得**複製其表現形式。
  - 每條採用的模式必須是**能用本專案自己的素材（24 隻恐龍、程序化配樂）實作**的。
  - **嚴禁**在 `docs/benchmark/` 中宣稱「家長表示…」「小朋友喜歡…」等第一方結論。
  - **嚴禁**填寫未實際查證的 `資料來源` 欄位（URL 必須可存取，日期必須真實）。
  - 不得使用 emoji。
- **本 Step 的可稽核要求**：
  - 每份 `products/*.md` 的 `資料來源` 必須含 **URL 與 YYYY-MM-DD**。
  - `tools/check-content.mjs` **不**檢查本目錄（屬 `docs/`，非 `content/`），
    本 Step 的驗證以 Step 178 的 `benchmark-executed` 守門為準。
- **驗證**：
  ```bash
  node -e "
  const fs=require('fs');
  const p='docs/benchmark';
  for(const f of ['README.md','patterns.md','findings.md']){
    if(!fs.existsSync(p+'/'+f)){ console.error('缺:',f); process.exit(1); }
  }
  const prods=fs.readdirSync(p+'/products').filter(f=>f.endsWith('.md'));
  if(prods.length<6){ console.error('標竿產品少於 6 款（實際 '+prods.length+'）'); process.exit(1); }
  for(const f of prods){
    const t=fs.readFileSync(p+'/products/'+f,'utf8');
    for(const k of ['定價與方案','回饋機制','失敗處理','留存機制','資料來源','本專案的差距','建議採用的做法']){
      if(!t.includes(k)){ console.error(f+' 缺欄位:',k); process.exit(1); }
    }
    if(!/https?:\/\//.test(t)){ console.error(f+' 資料來源缺 URL'); process.exit(1); }
    if(!/\d{4}-\d{2}-\d{2}/.test(t)){ console.error(f+' 資料來源缺擷取日期'); process.exit(1); }
  }
  const pat=fs.readFileSync(p+'/patterns.md','utf8');
  const ids=[...pat.matchAll(/\bPAT-(?:SINGLE-)?\d{2}\b/g)].map(m=>m[1]);
  if(ids.length<8){ console.error('可轉移模式少於 8 條（實際 '+new Set(ids).size+'）'); process.exit(1); }
  const r=fs.readFileSync(p+'/README.md','utf8');
  for(const k of ['招募','侷限','待實測','存活者偏差']){
    if(!r.includes(k)){ console.error('README 缺:',k); process.exit(1); }
  }
  console.log('[PASS] 標竿研究結構齊備（'+prods.length+' 款標竿、'+new Set(ids).size+' 條模式）');
  "
  ```
- **提交**：
  ```bash
  git add docs/benchmark
  git commit -m "docs: 競品標竿研究與可轉移模式彙整"
  git push origin main
  ```

---

## Step 178 — 標竿發現轉為修正（標竿 → 待辦 → 已修）
- **依賴**：Step 177
- **檔案**：`docs/benchmark/fixes.md`（新增）、`tools/verify-quality.mjs`（修改）
- **目標**：**標竿研究如果沒有變成待辦，就只是讀過別人的產品。**
  本 Step 把 Step 177 的每條發現轉為**可驗證的修正項**，並讓守門確保沒有遺漏。
- **v11.0 的核心變更（修掉 v10.6 的空轉漏洞）**：
  > **v10.6 的漏洞**：`ux-findings-dispositioned` 只斷言「Blocker/Major 的 `open` = 0」。
  > 而 v10.6 又允許「研究未執行時全部標 `deferred`」。
  > 兩者串起來 = **整條 Phase N 可以完全沒有任何依據，成熟度照拿滿分。**
  >
  > **v11.0 的修正**：
  > 1. 新增 **`benchmark-executed`** —— 獨立斷言「標竿研究確實完成且具體」。
  > 2. `deferred` **不再**是通過成熟度條件的合法狀態。
  > 3. 標竿研究未完成 → **M23／M24 NOT MET，成熟度記 8.4**，並在驗收文件明列缺口。
- **預期變更**：
  1. 新增 `docs/benchmark/fixes.md`，每條發現一列：
     `發現編號` ／ `嚴重度` ／ `來源 PAT 編號` ／ **修正方式（具體到檔案與行為）** ／
     **驗收方式（可執行的驗證指令或可觀察的行為變化）** ／
     `狀態（fixed / deferred / open）` ／ `deferred 理由` ／ **已落地檔案**。
     - **Blocker 與 Major 必須全部為 `fixed`**，
       `open` 只允許 Minor 且需有負責人與期限。
     > **v11.0 變更**：`deferred` 僅允許用於 **Minor**。
     > **Blocker／Major 的 `deferred` 一律視為 FAIL**（v10.6 允許，v11.0 不允許）。
     > 理由：`deferred` 代表「我們知道問題存在但沒修」，
     > 這正是產品「會被下架前卡住」的狀態，不得計入成熟度。
     - **「已落地檔案」欄位為 v11.0 新增**，必須填入實際被修改的檔案路徑。
       **不得**填「待定」。這是「文件 → 實作」耦合的可稽核證據。
     - 涉及**視覺／互動**的修正，必須指向 `src/styles/` 或 `src/js/ui/` 的具體改動。
     - 涉及**文案**的修正，必須指向 `content/` 語系檔（**不得**硬編碼）。
  2. `tools/verify-quality.mjs` 新增 **`benchmark-executed`**（**帶 `phase: "ux"`**，v11.0 新增）：
     - 斷言 `docs/benchmark/` 存在，且 `products/` 內 **≥ 6 個** `.md` 檔案。
     - 斷言 `docs/benchmark/patterns.md` 中 **≥ 8 條** `PAT-xx` 模式。
     - 斷言**至少 6 條模式的來源產品數 ≥ 2**（跨產品模式），
       且**單一來源模式（`PAT-SINGLE-xx`）不得超過 3 條**。
     - 斷言 `docs/benchmark/README.md` 含「侷限」「存活者偏差」「待實測」三個關鍵字。
     - 斷言 `findings.md` 的發現表格中**至少有 1 條 `Blocker`** 且**至少有 1 條 `Major`**。
     - 斷言每個 `PAT-xx` 至少被一條發現引用（避免模式被採集後無人使用）。
     > **此檢查是 M23／M24 的唯一守門。** 沒有它，M23／M24 就是空條款。
  3. `tools/verify-quality.mjs` 新增 `ux-findings-dispositioned`（**帶 `phase: "ux"`**，規則已收緊）：
     - 斷言 `docs/benchmark/fixes.md` 存在。
     - 解析其表格，斷言 **Blocker 與 Major 的 `open` 數量為 0**。
     > **v11.0 變更**：**斷言 Blocker 與 Major 的 `deferred` 數量也為 0。**
     > （v10.6 只檢查 `open`；v11.0 同時檢查 `open` 與 `deferred`。）
     - 斷言每列都有「驗收方式」與「狀態」。
     - 斷言每列的「已落地檔案」欄位**非空**且**不含「待定」**。
     - 斷言 `docs/benchmark/findings.md` 中的每個發現編號
       **都出現在** `fixes.md` 中（不得有「發現了但沒處理」的條目）。
  4. `tools/verify-quality.mjs` 新增 `ux-metrics-has-targets`（**帶 `phase: "ux"`**）：
     斷言 `docs/ux-metrics.md` 的每個指標都有非空目標值，
     且**沒有一個目標值寫著「待定」而無暫定標記**。
  5. **若 Step 177 的標竿研究未完成**：
     > **v11.0 變更（機制層面的硬性結果）**：
     > - `benchmark-executed` **必然 FAIL**（這是正確行為，不是 bug）。
     > - 成熟度條件 **M23／M24 標為 NOT MET**，M26 視為未驗證。
     > - **加權成熟度記 8.4 分**，並在 `docs/acceptance-9.md`
     >   新增一節「未能驗證的體驗面向」，明列：
     >   「孩子是否喜歡」「家長為什麼訂閱」「品牌觀感」三項**無任何實測依據**。
     > - `docs/benchmark/findings.md` 必須明確寫出**因此無法量測的體驗面向清單**。
     > - **不得**以「守門全綠」為由宣稱 9 分。**守門在這個情境下本來就該紅。**
- **規範**：
  - **嚴禁**把標竿發現只寫進 `findings.md` 而不進 `fixes.md`。
  - **嚴禁**在 `fixes.md` 中把 `open` 或 `deferred` 的 Blocker／Major 標記為已解決。
  - **嚴禁**偽造標竿產品分析檔以通過 `benchmark-executed`。
    若被查核到偽造（資料來源不可存取、欄位內容與來源明顯不符），
    **該 Phase 全部作廢並回退至 Step 177**。
  - **嚴禁**把標竿發現表述為「我們的用戶說…」「測試顯示…」。
  - 不得因此放寬任何既有守門門檻。
  - 不得刪除 Step 177 的原始分析記錄（**標竿原文不可被修正覆蓋**）。
- **驗證**：
  ```bash
  node tools/verify-quality.mjs --phase ux; echo "ux_exit=$?"
  node -e "
  const fs=require('fs');
  const s=fs.readFileSync('docs/benchmark/findings.md','utf8');
  const f=fs.readFileSync('docs/benchmark/fixes.md','utf8');
  const ids=[...s.matchAll(/\b((?:BM|BLK|MAJ|MIN)-\d{2,3})\b/g)].map(m=>m[1]);
  if(ids.length===0){ console.error('findings.md 未解析到發現編號（需形如 BM-01）'); process.exit(1); }
  for(const id of new Set(ids)){
    if(!f.includes(id)){ console.error('發現未進 fixes.md:',id); process.exit(1); }
  }
  console.log('[PASS] 發現編號', new Set(ids).size, '項全數有處置');
  "
  ```
- **提交**：
  ```bash
  git add docs/benchmark/fixes.md tools/verify-quality.mjs
  git commit -m "feat: 標竿發現轉可驗證修正並納入守門"
  git push origin main
  ```

---
## Step 179 — UX 修正落地與 Phase N 守門

- **依賴**：Step 178
- **檔案**：`src/styles/`（修改）、`src/js/ui/`（修改）、`content/`（修改）、`tools/verify-playable.mjs`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：**執行** Step 178 的修正，並把「UX 修正」本身納入雙守門。
- **預期變更**：
  1. 依 `docs/benchmark/fixes.md` 中狀態為 `fixed` 的列，逐條落地：
     - 視覺／佈局類 → `src/styles/`
     - 互動／動效類 → `src/js/ui/`
     - 文案類 → `content/` 語系檔（**zh-TW 與 en-US 同步**）
     - 每條落地後**更新 `fixes.md` 的狀態與驗收結果**。
  2. `tools/verify-playable.mjs` 新增 `ux-flow-continuous`：
     以 Playwright 走完「首幀 → 教學 → 第 1 關第 1 回合」，
     斷言**過程中沒有出現任何要求成人介入的提示**
     （例如「請家長協助」）。
  3. `tools/verify-playable.mjs` 新增 `ux-no-blocking-overlay`：
     斷言同一段流程結束後**沒有殘留可見遮罩**。
  4. `tools/verify-quality.mjs` 新增 `design-tokens-consistent`（**帶 `phase: "design"`**）：
     - 斷言 `src/styles/*.css` 中**沒有硬編碼 hex 色碼**
       （允許出現在 `content/` 的語意 token 名稱引用，但 CSS 內只准用變數）。
     - 斷言 `src/styles/*.css` 中**沒有硬編碼毫秒數動畫**
       （必須用 `--motion-duration-*` token）。
  5. `tools/verify-quality.mjs` 新增 `ux-findings-all-closed`（**帶 `phase: "ux"`**）：
     斷言 `fixes.md` 中 Blocker／Major 的 `open` **與 `deferred`** 數量皆為 0
     （與 Step 178 同一條規則的**行為側**獨立驗證）。
  6. **`tools/verify-quality.mjs` 新增 `design-implemented`（**帶 `phase: "design"`**，v11.0 新增）**：
     > **這是 v11.0 修掉「六成產出物是文件」的核心守門。**
     - 斷言 `docs/design-system.md` 中**每個元件狀態矩陣的元件名稱**，
       在 `src/styles/components.css` 中**都有對應樣式規則**。
     - 斷言 `docs/design-system.md` 定義的**每個 semantic token**
       （`--text-feedback-correct`、`--text-feedback-hint`、`--space-*`、
       `--motion-duration-*`、`--motion-ease-*`、`--z-*`）
       **實際被 `src/styles/*.css` 或 `src/js/ui/*.js` 引用**（不得只宣告不使用）。
     - 斷言 `docs/visual-direction.md` 定義的**每個場景 token 映射**
       在 `src/styles/components.css` 的 `.scene-visual` 規則中有對應實作。
     - 斷言 `content/brand.json` 的**每個 motif** 在 `src/styles/components.css`
       或 `src/js/ui/` 中有對應的 `.brand-*` 類別或用法。
     - 斷言 `docs/store-presentation.md` 的**每張截圖腳本**
       在 `content/store-listing.zh-TW.json` 與 `.en-US.json` 中有對應的 `shots[]` 條目。
     > **本檢查 FAIL = M19–M22 視為未達成。**
     > **理由**：一份沒有被實作的規格不是成熟度，是文檔。
  7. **`tools/verify-playable.mjs` 新增 `play-design-system-applied`（v11.0 新增）**：
     以 jsdom 進入主要畫面，斷言：
     - 回合提示文字的計算樣式**確實使用** `--text-instruction` 對應的值
       （非瀏覽器預設值）。
     - 正確／提示回饋元素的顏色**來自** `--text-feedback-correct` /
       `--text-feedback-hint`，且**兩者色相不同**
       （不得僅以紅/綠承載語意 —— 色盲友善）。
     - 互動元件的 `focus-visible` 樣式**確實生效**（`:focus-visible` 規則存在且有視覺變化）。
     > **這是 `design-implemented` 的行為側獨立驗證** ——
     > 文件層與行為層雙重確認，避免「文件寫了但沒套用」。
- **規範**：
  - 不得修改 `src/js/core/` 的商業／同意／遙測邏輯（全域約束 16）。
  - **不得**為讓 `design-tokens-consistent` 通過而把語意 token 全部改回硬編碼。
  - **不得**為讓 `design-implemented` 通過而新增「只被宣告不使用」的假 token。
  - 若 `fixes.md` 中有 `deferred` 項目，**必須**在 `docs/benchmark/findings.md`
    的「無法量測的體驗面向」清單中列出。
  - 不得使用 emoji。
  - 不得移除 Step 126／127 已建立的可及性與回饋行為。
  - **v11.0 新增：若 `benchmark-executed` FAIL（標竿研究未完成），
    本 Step 仍可完成其餘落地，但成熟度條件 M23／M24 必須標為 NOT MET，
    不得因「其他守門都綠」而宣稱 Phase N 完整。**
- **驗證**：
  ```bash
  npm run typecheck && npm run lint
  npm run test:play; echo "play_exit=$?"
  npm run check:a11y; echo "a11y_exit=$?"
  node tools/verify-quality.mjs --phase ux; echo "ux_exit=$?"
  node -e "
  const fs=require('fs');
  const css=fs.readdirSync('src/styles').map(f=>fs.readFileSync('src/styles/'+f,'utf8')).join('\n');
  const hex=css.match(/#[0-9a-fA-F]{6}\b/g)||[];
  if(hex.length>0){ console.error('CSS 仍有硬編碼色碼:',hex.length,'處'); process.exit(1); }
  console.log('[PASS] CSS 無硬編碼色碼');
  "
  ```
- **提交**：
  ```bash
  git add src/styles src/js/ui content tools/verify-playable.mjs tools/verify-quality.mjs docs/benchmark/fixes.md
  git commit -m "feat: UX 研究修正落地與 Phase N 守門"
  git push origin main
  ```

---

# Phase P — 商業可行性：定價／家庭方案／留存（Step 183–187）

> **本 Phase 是 v11.0 新增，回答「能不能賣出去」與「能不能活著」。**
>
> **執行位置**：排在 **Phase N 之後、Phase O 之前**。
> Step 183 依賴 Step 179（UX 修正落地）—— 因為定價要賣的，
> 是**已定稿的產品**，不是還在改的產品。
> **Phase Q（188–191）則排在 Phase P 之後** ——
> 護城河的「縱深內容」需要 Phase P 的「每日挑戰」作為消耗速率的計算基準。
>
> **為什麼 Phase H 不夠？**
> Phase H 建立了**金流機制**（狀態機、憑證驗證、復原、付費牆誠信檢查），
> 回答的是「**技術上能不能收費**」。
> 但它沒有回答三個更靠前��問題：
> 1. **賣多少？** 定價若偏離同業基準，機制再完善也賣不動。
> 2. **誰買？** 家長為什麼訂閱一個「聽覺辨識」App？價值主張是什麼？
> 3. **為什麼會續？** 訂閱的第二天、第七天、第四週，家長回來的理由是什麼？
>
> **v11.0 的診斷**：Phase H 讓產品「能收錢」，Phase P 讓它「**收得到錢**」。
>
> **本 Phase 的方法論同樣是標竿驅動**（不做真人訪談）：
> 以**產業基準數據與同業定價對照**作為定價與方案的依據。
> 這些數據是公開的、可引用的、可稽核的。

---

## Step 183 — 定價與方案基準對照表
- **依賴**：Step 179（Phase N 完成）
- **檔案**：`docs/pricing-benchmark.md`（新增）、`content/pricing.json`（新增）
- **目標**：**定價不是拍腦袋，是對照。**
  本 Step 建立本專案的定價與方案結構，**每一個數字都要能追溯到一個公開的同業基準**。
- **為什麼這是第一步**：後續的付費牆文案、家庭方案 UX、留存機制
  全部依賴「我們賣多少、賣幾種方案」這個決定。**先把基準建立好。**
- **必用基準數據（公開、可引用，須附 URL 與擷取日期）**：
  | 指標 | 基準值 | 來源類別 |
  | --- | --- | --- |
  | 兒童教育 App 月訂閱均價 | US$8.13／月 | 產業彙整 |
  | 兒童教育 App 年訂閱均價 | US$56.09／年 | 產業彙整 |
  | 兒童教育 App 月流失率基準 | 7.4%／月（年度 59.9%） | 留存基準彙整 |
  | 兒童教育 App 頂尖四分位月流失率 | 2.0%／月 | 留存基準彙整 |
  | 兒童教育 App D30 留存 | 2%（**全產業最低之一**） | 產業彙整 |
  | 教育類訂閱**週期**方案首次續訂率 | **58%（全類別最高）** | 訂閱基準（115,000+ 應用） |
  | 教育類訂閱**年**方案首次續訂率 | 24%（全類別最低） | 同上 |
  | 試用轉訂閱者的留存倍數 | 1.4–1.7×（高於直接購買） | 訂閱基準 |
  | 商店頁 → 下載轉換率 | Google Play 34.4%／iOS 18.1% | 產業彙整 |
  | 同業定價對照 | Lingokids Plus $13.49/月・$161.88/年（官網）；App Store $14.99/月・$71.99–89.99/年<br>Kiddopia $12.99/月・$79.99/年（官網）<br>ABCmouse $14.99/月・$79.99/年 | 各官方定價頁 |
  > **三條對成熟度影響最大的基準**：
  > 1. **教育類「週期」方案續訂率 58%，遠高於年方案 24%** ——
  >    這直接決定方案結構：**年方案應作為主要推薦，但月／週方案必須存在**。
  > 2. **D30 留存 2% 是全產業最低之一** ——
  >    說明「靠內容量留人」在這個品類行不通，**必須靠機制**（Step 185）。
  > 3. **iOS 商店頁轉換率只有 18.1%（Google Play 的 52%）** ——
  >    說明**商店頁截圖的品質在 iOS 是收費漏斗的第一道瓶頸**，
  >    這讓 Phase N 的 Step 174（商店頁體系）從「加分項」變成「**收費前置條件**」。
- **預期變更**：
  1. 新增 `docs/pricing-benchmark.md`，包含：
     - **基準數據表**（上表全部條目，每條附 URL ＋ YYYY-MM-DD）。
     - **同業定價對照表**（≥ 6 款標竿的月／年價、免費層、試用期、孩兒設定數上限）。
     - **本專案的定價建議與理由**：
       - 至少 2 個方案（建議：月／年；**並明確記錄是否提供週期方案及其理由**）。
       - 每個方案標註：目標客群（哪一種家長）、價值主張（一句話）、
         對應的基準依據、預期續訂率（引用基準值）。
       - **台幣與美元定價都要列出**（本專案主打繁中市場，必須有 TWD 價位）。
     - **免費層的設計**：說明免費層提供什麼、限制什麼（對照標竿的免費層限制）。
       > **參考 Open and Go Phonics 的做法**：免費層提供完整可玩的核心玩法，
       > 不靠功能殘缺留人。**這是「資料最小化」原則在商業面的延伸。**
     - **明確的誠實聲明**：本專案**沒有第一方付費意願資料**，
       因此本文件的定位是「**與同業基準對齊的假設**」，不是「已驗證的定價」。
  2. 新增 `content/pricing.json`，結構**雙語完全對稱**（zh-TW／en-US）：
     ```json
     {
       "zh-TW": {
         "currency": "TWD",
         "plans": [
           { "id": "monthly", "price": 0, "display": "", "features": [], "source": "" }
         ],
         "freeTier": { "included": [], "limits": [] },
         "disclaimer": ""
       },
       "en-US": { }
     }
     ```
     - `price` 為**整數**（最小貨幣單位，如 TWD 為元），避免浮點誤差。
     - 每個 plan 必須有 `source` 欄位指向 `docs/pricing-benchmark.md` 的對照依據。
     - 必須有 `disclaimer` 欄位，內容為「定價參考同業基準，未經第一方付費意願驗證」。
- **規範**：
  - **不得**在本 Step 宣稱「已驗證家長願意以此價格訂閱」。
  - 不得使用 emoji。
  - 不得填寫無法存取的 URL 或虛構的擷取日期。
  - `content/pricing.json` 必須雙語結構完全對稱。
- **驗證**：
  ```bash
  npm run check:content; echo "content_exit=$?"
  node -e "
  const fs=require('fs');
  const p=JSON.parse(fs.readFileSync('content/pricing.json','utf8'));
  for(const loc of ['zh-TW','en-US']){
    if(!p[loc]){ console.error('缺語系:',loc); process.exit(1); }
    if(!p[loc].plans || p[loc].plans.length<2){ console.error(loc,'方案少於 2 個'); process.exit(1); }
    for(const pl of p[loc].plans){
      if(typeof pl.price!=='number'||!Number.isInteger(pl.price)){ console.error('price 必須為整數:',pl.id); process.exit(1); }
      if(!pl.source){ console.error('缺 source:',pl.id); process.exit(1); }
      if(!pl.features || !pl.features.length){ console.error('缺 features:',pl.id); process.exit(1); }
    }
    if(!p[loc].freeTier){ console.error(loc,'缺 freeTier'); process.exit(1); }
    if(!p[loc].disclaimer){ console.error(loc,'缺 disclaimer'); process.exit(1); }
  }
  if(JSON.stringify(p['zh-TW'].plans.map(x=>x.id))!==JSON.stringify(p['en-US'].plans.map(x=>x.id))){
    console.error('雙語方案結構不對稱'); process.exit(1);
  }
  const d=fs.readFileSync('docs/pricing-benchmark.md','utf8');
  for(const k of ['58%','24%','2%','18.1%','Lingokids','Kiddopia','ABCmouse','週期','第一方']){
    if(!d.includes(k)){ console.error('定價基準缺:',k); process.exit(1); }
  }
  if(!/https?:\/\//.test(d)){ console.error('定價基準缺 URL'); process.exit(1); }
  console.log('[PASS] 定價基準與方案對照齊備');
  "
  ```
- **提交**：
  ```bash
  git add docs/pricing-benchmark.md content/pricing.json
  git commit -m "feat: 定價與方案基準對照表"
  git push origin main
  ```

---

## Step 184 — 付費牆價值主張與家庭方案 UX
- **依賴**：Step 183
- **檔案**：`src/js/ui/paywall.js`（修改）、`src/js/ui/family-plan.js`（新增）、`content/pricing.json`（修改）
- **目標**：**家長付費的理由必須是「孩子的進步」，不是「解鎖更多關卡」。**
  這是本 Phase 最核心的一句話。
- **為什麼這是關鍵**：Phonics.org 對 Endless Alphabet 的評測指出，
  該 App **讓家長誤以為孩子正在學拼寫，但實際上字母音不準確反而會教錯**。
  > **教錯比不教更糟。** 家長一旦發現 App 在教錯東西，會立刻退訂並留下負評。
  > 因此**付費牆的誠信不是合規要求，是留存策略**。
- **預期變更**：
  1. **重寫付費牆文案**（進 `content/` 語系檔，**不得**硬編碼）：
     - **三段式結構**：
       - **第一段（價值主張）**：孩子會得到什麼能力 —— 用**家長看得懂**的語言
         （例：「分辨『巴』和『拍』的差別 —— 這是分辨語音的基礎能力」），
         **不得**使用評量術語（「認知提升」「語言發展指標」）。
       - **第二段（家長安心）**：無廣告、無追蹤、不蒐集個資、離線可玩。
         這是本專案對兒童產品的**真實優勢**，必須被說出來。
       - **第三段（方案）**：各方案的內容與對照，含「試用 N 天」說明。
     - **不得**出現「解鎖全部關卡」作為唯一價值主張。
     - **不得**出現任何本專案未實作的功能（延續 Step 140 的誠信原則）。
  2. **新增家庭方案 UX**（`src/js/ui/family-plan.js`）：
     - **多孩孩設定**：家長可建立最多 3 個孩兒設定，各自有獨立進度
       （對照標竿：Lingokids 支援 4 個、Kiddopia 支援 3 個；
       本專案採 3 個，理由是本專案是單一聽覺辨識領域，不需要更多）。
     - **每個孩兒設定的建議難度依據自己的表現**（自適應推薦），
       不得共用同一份難度。
     - **家長設定區**：從家長閘門進入，調整「孩子的年齡段」「每日建議時長」
       「是否啟用語音提示」。
     - **必須記錄在案的取捨**：`docs/notes/step-184.md` 需說明
       為何不做 4 個孩兒設定（避免與同業上限看齊的從眾決策）。
  3. `src/js/ui/paywall.js` 改為**從 `content/pricing.json` 讀取**方案與文案，
     **不得**在程式碼中寫死價格字串。
  4. `tools/verify-quality.mjs` 新增 `pricing-driven-paywall`（**帶 `phase: "commerce"`**）：
     - 斷言 `src/js/ui/paywall.js` **不含**硬編碼的價格數字或幣別符號。
     - 斷言 `src/js/ui/paywall.js` 引用 `content/pricing.json`。
     - 斷言 `content/pricing.json` 的每個方案的 `features` 皆**非空且不含**空白字串。
     - 斷言付費牆三段式文案的三個段落**都存在**且**都非空**
       （`valueProposition` / `parentAssurance` / `planComparison`）。
- **規範**：
  - **不得**硬編碼價格於 `src/js/`（一律走 `content/pricing.json`）。
  - **不得**在付費牆文案中使用未實作功能。
  - 不得使用 emoji。
  - **不得**改動 `src/js/core/entitlements.js` 的狀態機（見全域約束 17）。
  - 文案必須雙語對稱（zh-TW／en-US）。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  node tools/verify-quality.mjs --phase commerce; echo "commerce_exit=$?"
  node -e "
  const fs=require('fs');
  const src=fs.readFileSync('src/js/ui/paywall.js','utf8');
  if(/\\\$\s?\d|price\s*[:=]\s*['\"]?\d/.test(src)){ console.error('paywall.js 含硬編碼價格'); process.exit(1); }
  if(!src.includes('pricing.json')){ console.error('paywall.js 未引用 pricing.json'); process.exit(1); }
  const p=JSON.parse(fs.readFileSync('content/pricing.json','utf8'));
  for(const loc of ['zh-TW','en-US']){
    const c=p[loc].paywallCopy;
    for(const k of ['valueProposition','parentAssurance','planComparison']){
      if(!c || !c[k] || !c[k].trim()){ console.error(loc+' 缺付費牆段落:',k); process.exit(1); }
    }
  }
  console.log('[PASS] 付費牆由定價資料驅動且三段式齊備');
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/paywall.js src/js/ui/family-plan.js content/pricing.json tools/verify-quality.mjs
  git commit -m "feat: 付費牆價值主張與家庭方案 UX"
  git push origin main
  ```

---

## Step 185 — 留存機制（每日回訪理由）
- **依賴**：Step 184
- **檔案**：`src/js/core/streak.js`（新增）、`src/js/core/daily-challenge.js`（新增）、`src/js/ui/hud.js`（修改）、`content/daily.json`（新增）
- **目標**：**給家長一個「明天還要回來」的理由。**
  這是 D30 留存 2%（全產業最低）這個基準下，**唯一能靠機制補的洞**。
- **設計依據（全部來自 Step 177 的標竿研究，此處只列結論）**：
  | 來源 | 機制 | 本專案採用 |
  | --- | --- | --- |
  | ABCmouse | **每日挑戰**：4 個推薦活動輪替，完成填滿寵物計量表 | ✅ 採用「每日 3 題」變體（計入 24 隻恐龍的收集） |
  | Khan Academy（主平台） | **Streak**：每週至少一項技能達到熟練 | ✅ 採用「連續天數」，但**週期改為每日**（幼兒注意力週期短） |
  | Khan Academy | **Levels**：把大目標切成小里程碑 | ✅ 採用「關卡 → 章節 → 收集進度條」三層 |
  | Lingokids | **Progress Center**：家長看得到孩子做到哪、哪裡要多練 | ✅ 對應 Step 186 的家長週報 |
  | Open and Go Phonics | **錯了不懲罰**：只是搖一搖，可以再聽一次，沒有失敗畫面 | ✅ **已在 Step 126 實作，本 Step 確認保留** |
  > **注意**：本專案的 streak **必須**是「孩子想要」的，不可以是「家長要求孩子做的」。
  > 若 streak 造成家長對孩子的施壓，反而會造成退訂。
  > **設計原則**：streak 中斷**不懲罰、不歸零**（保留最長紀錄，顯示「最佳連續 N 天」）。
- **預期變更**：
  1. 新增 `src/js/core/streak.js`：
     - 追蹤連續天數、最佳連續天數、累計天數。
     - 跨日判定（以**本地日期**為準，非 UTC —— 對台灣使用者 UTC 會造成早上 8 點前的誤判）。
     - **中斷不歸零**：只更新「最佳連續」。
     - **不得**使用 `Date.now()` 直接相減來判定（時區與夏令時間問題）。
     - 必須尊重 Step 143 的同意閘與資料最小化原則：
       streak 狀態**只存在本機**（`localStorage`），**不外送**（除非使用者同意且為彙總統計）。
  2. 新增 `src/js/core/daily-challenge.js`：
     - 每日挑戰 = **3 題**，題目依 Step 163 的去重抽題機制挑選（**不得**用 `Math.random()`）。
     - 每日題目**在日內固定**（同一天多次開啟，題目相同），跨日才更換。
     - 完成後**不重複**（當日已完成的題目不再出現）。
     - 題目來源必須涵蓋至少 2 種玩法（避免只練聽覺辨識而無變化）。
  3. `src/js/ui/hud.js` 顯示**連續天數**：
     - **必須用圖示而非數字**（幼兒不識數字，且「7 天」對家長才有意義）。
     - **圖示不得使用 emoji** —— 必須自繪 SVG（沿用全域約束 9）。
     - 首次顯示時**不得**打斷遊戲（不得彈出「你已連續 N 天」的 modal）。
  4. 新增 `content/daily.json`（雙語對稱）：每日挑戰的固定文案
     （例如「今天試試看三個新聲音」）、連續天數的兒童語言描述。
  5. `tools/verify-quality.mjs` 新增 `retention-mechanics-wired`（**帶 `phase: "commerce"`**）：
     - 斷言 `src/js/core/streak.js` 與 `src/js/core/daily-challenge.js` 存在。
     - 斷言 `streak.js` **不含** `Math.random()`。
     - 斷言 `daily-challenge.js` **引用** Step 163 的抽題模組（不得自行抽題）。
     - 斷言 `content/daily.json` 雙語結構對稱。
     - 斷言 streak 的**最佳紀錄不會被中斷歸零**
       （斷言程式碼中無歸零語意，或有明確的「只增不減」註解與實作）。
- **規範**：
  - **不得**因 streak 中斷而對孩子顯示懲罰性訊息（例：「你 lose 掉了 5 天！」）。
  - **不得**使用 emoji 顯示天數。
  - 不得引入任何 `Math.random()` 於每日題目挑選。
  - **不得**把 streak 資料外送（除非使用者已同意，且僅為彙總數據）。
  - 不得使用 emoji。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  node tools/verify-quality.mjs --phase commerce; echo "commerce_exit=$?"
  npm run test:play -- --case retention; echo "retention_exit=$?"
  node -e "
  const fs=require('fs');
  const s=fs.readFileSync('src/js/core/streak.js','utf8');
  const d=fs.readFileSync('src/js/core/daily-challenge.js','utf8');
  if(!s.includes('streak.js')&&!s.includes('export')){ console.error('streak.js 無匯出'); process.exit(1); }
  if(/Math\.random/.test(s)||/Math\.random/.test(d)){ console.error('留存機制不得用 Math.random'); process.exit(1); }
  if(!d.includes('draw')&&!d.includes('items')){ console.error('daily-challenge 未引用抽題模組'); process.exit(1); }
  console.log('[PASS] 留存機制接線完成');
  "
  ```
- **提交**：
  ```bash
  git add src/js/core/streak.js src/js/core/daily-challenge.js src/js/ui/hud.js content/daily.json tools/verify-quality.mjs
  git commit -m "feat: 留存機制（連續天數與每日挑戰）"
  git push origin main
  ```

---

## Step 186 — 家長端週報與價值可見化
- **依賴**：Step 185
- **檔案**：`src/js/ui/parent-report.js`（修改）、`src/js/core/weekly-digest.js`（新增）、`content/parent-weekly.json`（新增）
- **目標**：**家長是付款人，家長端必須持續回答「值得嗎」。**
- **設計依據（來自 Step 177 標竿研究）**：
  | 來源 | 家長端做法 | 本專案採用 |
  | --- | --- | --- |
  | Lingokids | **Progress Center**：看得到完成度、技能建構、需要多練的地方 | ✅ 家長報告升級為「本週看點」 |
  | Lingokids | **Screen time limits**：家長可設每日上限 | ✅ 沿用（Step 168 已有設定入口） |
  | Lingokids | **Printable activities**：可列印的離線活動 | ⚠️ 本專案不做（成本高、與核心玩法無關），須在文件中記錄此取捨 |
  | 留存基準彙整 | **看得見孩子進度的家長，續訂率是看不見的 2–3 倍** | ✅ **這是 Phase P 中價值最高的單一依據** |
  | 留存基準彙整 | 每週進度摘要能顯著提升留存 | ✅ 週報機制 |
- **預期變更**：
  1. 新增 `src/js/core/weekly-digest.js`：
     - 產生**每週**摘要：本週完成回合數、正確率趨勢（週對週）、
       連續天數、**最常卡住的玩法**、**新解鎖的恐龍**。
     - **資料只來自本機**（`localStorage` 的既有統計），
       **不得**為了週報而新增任何外送事件（資料最小化原則）。
     - **必須處理「孩子一週沒玩」的邊界**：顯示「本週還沒開始」而非錯誤或空圖表。
  2. `src/js/ui/parent-report.js` 新增「本週看點」區塊：
     - 位於**家長閘門之後**（既有原則）。
     - **用圖表呈現趨勢**（SVG 折線／長條），不得只用數字。
     - **不得**出現「您的孩子在語言發展上有 73% 的進步」這類**無法解釋的精確數字**。
       → 必須顯示**可行動的建議**（例：「這週在『節奏』上花的時間比較多，
       明天可以先玩聽音辨識暖身」），而非Pseudo-精確的評分。
     - **必須誠實**：若資料不足，明確寫「資料不足，還需要多玩幾天」。
  3. 新增 `content/parent-weekly.json`（雙語對稱）：
     週報的固定文案、區塊標題、建議句型（3–5 種，依資料狀態套用）。
  4. `tools/verify-quality.mjs` 新增 `parent-value-visible`（**帶 `phase: "commerce"`**）：
     - 斷言 `src/js/core/weekly-digest.js` 存在且匯出必要函式。
     - 斷言 `src/js/core/weekly-digest.js` **不含** `fetch(`（週報不得外送資料）。
     - 斷言 `content/parent-weekly.json` 雙語對稱。
     - 斷言家長報告的文案**不含**百分比形式的 pseudo-精確進度評分
       （不得出現 `xx%` 形式的成長進度描述）。
- **規範**：
  - **不得**在週報中使用無法解釋的精確數字作為評價。
  - **不得**在週報中新增任何資料外送。
  - 不得使用 emoji。
  - 家長報告不得出現在孩子可達的畫面。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  node tools/verify-quality.mjs --phase commerce; echo "commerce_exit=$?"
  node -e "
  const fs=require('fs');
  const w=fs.readFileSync('src/js/core/weekly-digest.js','utf8');
  if(!w.includes('export')){ console.error('weekly-digest.js 無匯出'); process.exit(1); }
  if(/fetch\s*\(/.test(w)){ console.error('週報不得外送資料'); process.exit(1); }
  const p=JSON.parse(fs.readFileSync('content/parent-weekly.json','utf8'));
  if(!p['zh-TW']||!p['en-US']){ console.error('parent-weekly 雙語不對稱'); process.exit(1); }
  console.log('[PASS] 家長端週報機制就緒');
  "
  ```
- **提交**：
  ```bash
  git add src/js/ui/parent-report.js src/js/core/weekly-digest.js content/parent-weekly.json tools/verify-quality.mjs
  git commit -m "feat: 家長端週報與價值可見化"
  git push origin main
  ```

---

## Step 187 — 商業可行性回歸驗證
- **依賴**：Step 186
- **檔案**：`tools/verify-playable.mjs`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：**把 Phase P 的四項機制變成行為層可驗證的守門。**
- **預期變更**：
  1. `tools/verify-playable.mjs` 新增：
     - `play-pricing-loaded`：付費牆開啟時，**方案與價格來自 `content/pricing.json`**
       （斷言畫面上的價格文字與 JSON 一致，且 JSON 改變後重讀會變）。
     - `play-paywall-value-first`：付費牆**第一屏**包含價值主張文案，
       而**不是**只有方案列表（斷言順序：valueProposition 在 planComparison 之前）。
     - `play-family-profiles`：可建立 3 個孩兒設定，且**各自的進度互相獨立**
       （在 A 設定完成一回合後，B 設定的完成數不變）。
     - `play-daily-stable`：同一天內兩次進入每日挑戰，**題目相同**。
     - `play-daily-cross-day`：跨日後每日挑戰**題目更換**。
     - `play-streak-not-reset`：中斷一天後，**最佳連續天數保留**
       （斷言 UI 仍顯示歷史最佳）。
     - `play-weekly-digest-local`：家長週報在**無網路**的情況下仍可產生
       （斷言離線環境下週報內容不為空）。
  2. `tools/verify-quality.mjs` 新增 `phase-commerce-integrity`（**帶 `phase: "commerce"`**）：
     - 斷言 `package.json` 的 `check` script 串入 `--phase commerce`。
     - 斷言 Phase P 新增的 4 個守門 id 全部存在於 `CHECKS` 陣列。
     - 斷言 `content/pricing.json`、`content/daily.json`、`content/parent-weekly.json` 三個檔案存在且雙語對稱。
  3. `package.json` 的 `check` script **必須**串入 `node tools/verify-quality.mjs --phase commerce`。
- **規範**：
  - **不得**弱化既有守門門檻。
  - **不得**把上述行為檢查寫成靜態字串比對。
- **驗證**：
  ```bash
  npm run check; echo "exit=$?"
  npm run test:play; echo "play_exit=$?"
  node tools/verify-quality.mjs --phase commerce; echo "commerce_exit=$?"
  ```
  預期：四者皆為 0。
- **提交**：
  ```bash
  git add tools/verify-playable.mjs tools/verify-quality.mjs package.json
  git commit -m "test: 商業可行性回歸驗證"
  git push origin main
  ```

---

# Phase Q — 護城河：為什麼一年後還活著（Step 188–191）

> **本 Phase 是 v11.0 新增，回答成熟度模型中「能不能活著」的差異性問題。**
>
> **執行位置**：排在 **Phase P 之後、Phase O 之前**。
> Step 189（縱深內容排程）需要 Step 185（每日挑戰）的消耗速率作為計算基準。
>
> **為什麼這是 v11 最重要的新增？**
> 因為 M1–M27 全部在問「**能不能**」，沒有一條在問「**會不會被取代**」。
> Phase L 修完 D15–D23（資料、流程、法規、原生打包）之後，
> **孩子端體驗幾乎沒有改變** ——
> 一個可以上架、可以收費、可以合規、可以量測的產品，
> 如果沒有護城河，**上架三個月就會在商店裡被淹沒**。
>
> **護城河的四個問題（本 Phase 的四個 Step）**：
> 1. **教得對嗎？**（教研背書）—— 教錯的產品會被退訂並留下負評。
> 2. **能撐多久？**（縱深內容）—— 40 關 16 分鐘的內容量撐不了一年。
> 3. **家長會回來嗎？**（家長黏性）—— 家長端是唯一能穩定回流的使用者。
> 4. **長得完嗎？**（場景擴張）—— 6 個場景是硬上限，不是規劃。

---

## Step 188 — 教學法依據與自我審查
- **依賴**：Step 187
- **檔案**：`docs/pedagogy.md`（新增）、`content/pedagogy.json`（新增）
- **目標**：**確認本專案教的是「正確的東西」，並且知道自己可能教錯什麼。**
  這是 D17（vowel 特徵全為 initial）的根因修復，也是護城河的第一塊磚。
- **為什麼這是護城河**：Phonics.org 對 Endless Alphabet 的評測是關鍵警示 ——
  > 「The app might wrongly teach letter sounds, which could hinder children's
  > reading and spelling skills.」
  > 「It would be wise to avoid playing this game until this crucial aspect of
  > instruction has been corrected.」
  >
  > **這是 1,000 萬下載量級的產品被專業評測判定為「會教錯孩子」。**
  > **教學正確性不是品質加分項，是生存前提。**
- **預期變更**：
  1. 新增 `docs/pedagogy.md`，包含：
     - **本專案教的能力定義**：
       明確說明本專案訓練的是「**聽覺辨識（auditory discrimination）**」
       與「**聲韻覺察（phonemic awareness）的前階能力**」，
       **不得**宣稱訓練「拼音」「認字」「閱讀」。
       > 這個界定本身就是護城河的一部分：**知道自己只做一件事，並把它做到最好。**
     - **語音學正確性自我審查表**（逐項檢查並記錄結果）：
       | 檢查項 | 判準 | 結果 |
       | --- | --- | --- |
       | minimal-pair 每對只在聲母或韻母之一有差異 | 逐對人工確認 | 必須 100% 通過 |
       | zh-TW 與 en-US 是否為該語系的有效題目 | 語音學常見對比 | 必須 100% 通過 |
       | vowel 類題目數量 | ≥ 12 筆／語系（Step 162 已補） | 守門驗證 |
       | 干擾題的兩字是否真的可辨識 | 字形與讀音皆不同 | 必須 100% 通過 |
       | **是否有任何「教錯風險」的題目** | 例如誤導的連音 | 必須逐條列出並修正 |
     - **已知限制與風險**：
       明確列出「本產品不是什麼」「可能造成什麼負面效果」
       （例：過度重複可能造成疲勞、可能讓孩子以為答錯是失敗）。
     - **不做的宣稱**（對應 Step 194 的禁令表）：
       不得宣稱提升閱讀成績、不得宣稱符合任何課程標準。
     - **若已取得外部意見**：記錄機構名稱、日期、簽署人職稱、意見原文位置。
       > **嚴禁**捏造。尚未取得就寫「尚未取得（預計 YYYY-MM）」。
     - **建議諮詢方向**（不要求已完成，但必須寫下）：
       聽力治療師／語言治療師／特殊教育背景的顧問，
       針對「聽覺辨識最小對立對（minimal pairs）」的選題原則。
       > **成本參考**：一次諮詢的時數費是本 Phase 最低成本、
       > **信度最高**的護城河投資。**建議優先於任何廣告預算。**
  2. 新增 `content/pedagogy.json`（雙語對稱）：
     本專案能力定義、每種玩法的訓練目標、
     **明確的「非目標」清單**（不宣稱的能力）、已知限制。
  3. `tools/check-content.mjs` 新增 `pedagogy-scope-declared`：
     - 斷言 `content/pedagogy.json` 雙語對稱。
     - 斷言含 `capabilities`（能力）與 `nonGoals`（非目標）兩個欄位且皆非空。
     - 斷言 `nonGoals` 至少含 3 項（誠實列出不宣稱的能力）。
     - **斷言 `capabilities` 與 `nonGoals` 沒有重疊**（不得同時宣稱又不宣稱）。
- **規範**：
  - **嚴禁**宣稱本產品訓練「拼音」「認字」「閱讀」或任何超出聽覺辨識的能力。
  - **嚴禁**捏造外部專家意見或機構名稱。
  - 不得使用 emoji。
  - **不得**為了讓 `pedagogy-scope-declared` 通過而填入空字串充數。
- **驗證**：
  ```bash
  npm run check:content; echo "content_exit=$?"
  node -e "
  const fs=require('fs');
  const p=JSON.parse(fs.readFileSync('content/pedagogy.json','utf8'));
  for(const loc of ['zh-TW','en-US']){
    if(!p[loc]){ console.error('缺語系:',loc); process.exit(1); }
    if(!p[loc].capabilities || !p[loc].capabilities.length){ console.error(loc,'缺 capabilities'); process.exit(1); }
    if(!p[loc].nonGoals || p[loc].nonGoals.length<3){ console.error(loc,'nonGoals 少於 3 項'); process.exit(1); }
    const cap=JSON.stringify(p[loc].capabilities);
    for(const ng of p[loc].nonGoals){
      if(cap.includes(ng)){ console.error(loc,'capabilities 與 nonGoals 重疊:',ng); process.exit(1); }
    }
  }
  const d=fs.readFileSync('docs/pedagogy.md','utf8');
  for(const k of ['聽覺辨識','自我審查','已知限制','非目標']){
    if(!d.includes(k)){ console.error('pedagogy.md 缺:',k); process.exit(1); }
  }
  console.log('[PASS] 教學法依據與範圍界定齊備');
  "
  ```
- **提交**：
  ```bash
  git add docs/pedagogy.md content/pedagogy.json tools/check-content.mjs
  git commit -m "feat: 教學法依據與能力範圍界定"
  git push origin main
  ```

---

## Step 189 — 縱深內容排程（撐一年的內容路線圖）
- **依賴**：Step 188
- **檔案**：`docs/content-roadmap.md`（新增）、`content/roadmap.json`（新增）
- **目標**：**把「40 關 16 分鐘」變成「一個 12 個月的內容計畫」。**
- **現況硬數據**：
  | 項目 | 現況 | 問題 |
  | --- | --- | --- |
  | 總關卡數 | 40 關 | — |
  | 總回合數 | 40 × 3 = 120 回合 | — |
  | 純練習時間 | 120 × 8 秒 ≈ **16 分鐘** | **遠低於一次專注的 5 分鐘下限** |
  | 每日挑戰 | 3 題／日（Step 185） | 需 1 年不重複 → 需 **≥ 1,095 題** |
  | 題庫現有量 | minimal-pair 54／語系（Step 162 後） | **缺口 ≈ 1,041 題** |
  | 內容耗盡日 | 題庫 ÷ 3 題/日 ≈ **18 天** | **一個半月後無題可出** |
  > **這是本專案最被低估的營運風險。**
  > 照現況，**2027 年 1 月就會沒有新題可發**，
  > 而此時使用者才剛開始建立連續天數。**連續天數建立在「有題可出」之上。**
- **預期變更**：
  1. 新增 `docs/content-roadmap.md`：
     - **內容消耗模型**：以每日挑戰 3 題計算，
       列出「現有題庫可支撐天數」與「目標支撐天數（12 個月 = 365 天）」的差距。
     - **12 個月內容排程表**（月份 × 玩法 × 主題 × 題量）：
       | 季 | 主題 | 玩法重心 | 新增題量 | 新場景 |
       | --- | --- | --- | --- | --- |
       | Q1 | 聲母基礎 | minimal-pair（initial） | +120 | — |
       | Q2 | 韻母對比 | minimal-pair（vowel） | +120 | — |
       | Q3 | 節奏與序列 | rhythm／memory | +90 | 1 個 |
       | Q4 | 干擾與抑制 | interference | +80 | 1 個 |
       | **合計** | — | — | **+410** | **2 個** |
       > **目標**：題庫 ≥ 1,095 題，支撐 365 天。
       > **注意**：410 筆新增題目的**內容生產成本**（語音學審查、語音錄製、多語系）
       > 是本 Phase 最大的外部成本。**必須在文件中誠實標註工作量估計。**
     - **題目生產流程**（含審查點）：
       草擬 → 語音學審查（對照 Step 188 的自我審查表）→ 錄音 → 進題庫 → 守門驗證。
     - **取捨記錄**（在 `docs/notes/step-189.md`）：
       為什麼不做「AI 生成題目」作為主要來源（風險：語音學錯誤率高、
       且 Step 188 已證明教錯的代價極高）。
     - **場景擴張規劃**（銜接 Step 190）：
       6 → 8 個場景的內容需求與素材需求。
  2. 新增 `content/roadmap.json`（雙語對稱）：
     12 個月的結構化排程（月份、主題、玩法、題量、場景），
     供後續的內容生產工具與守門使用。
  3. `tools/check-content.mjs` 新增 `content-roadmap-defined`：
     - 斷言 `content/roadmap.json` 雙語對稱且含 12 個月份條目。
     - 斷言總新增題量 ≥ **410**。
     - 斷言每個條目都有 `theme` / `verbs` / `itemCount` 三個欄位。
     - 斷言 `itemCount` 總和 × 365/3 的支撐天數 ≥ 365
       （即：題庫總量必須足以支撐每日 3 題滿一年）。
- **規範**：
  - **不得**宣稱這些題目「已存在」—— 本 Step 只做**排程**，
    實際生產由後續版本執行。
  - 不得使用 emoji。
  - **不得**把規劃寫成已完成（與 Step 194 的禁令一致）。
- **驗證**：
  ```bash
  npm run check:content; echo "content_exit=$?"
  node -e "
  const fs=require('fs');
  const r=JSON.parse(fs.readFileSync('content/roadmap.json','utf8'));
  for(const loc of ['zh-TW','en-US']){
    if(!r[loc]){ console.error('缺語系:',loc); process.exit(1); }
    if(!r[loc].months || r[loc].months.length!==12){ console.error(loc,'月份數不等於 12'); process.exit(1); }
    const total=r[loc].months.reduce((s,m)=>s+(m.itemCount||0),0);
    if(total<410){ console.error(loc,'總題量不足 410（實際 '+total+'）'); process.exit(1); }
    for(const m of r[loc].months){
      for(const k of ['theme','verbs','itemCount']){
        if(m[k]===undefined){ console.error('缺欄位:',k); process.exit(1); }
      }
    }
  }
  const d=fs.readFileSync('docs/content-roadmap.md','utf8');
  for(const k of ['365','410','題庫','取捨']){
    if(!d.includes(k)){ console.error('roadmap 缺:',k); process.exit(1); }
  }
  console.log('[PASS] 縱深內容排程齊備');
  "
  ```
- **提交**：
  ```bash
  git add docs/content-roadmap.md content/roadmap.json tools/check-content.mjs
  git commit -m "feat: 縱深內容 12 個月排程"
  git push origin main
  ```

---

## Step 190 — 場景擴張與內容深度（把硬上限變成規劃）
- **依賴**：Step 189
- **檔案**：`content/scenes.json`（修改）、`content/levels.json`（修改）、`src/js/data/levels.js`（修改）
- **目標**：**6 個場景是硬上限，不是規劃。** 本 Step 把它變成 8 個，並建立擴張機制。
- **為什麼場景是護城河**：
  | 標竿 | 場景／主題數 | 對應能力 |
  | --- | --- | --- |
  | Lingokids | 4,000+ 活動 | 廣度 |
  | ABCmouse | 13,000+ 活動 | 廣度 |
  | Phonics Hero | 850+ 遊戲、44 音、3 口音 | 深度（同一件事做到極致） |
  | **本專案現況** | **6 場景、40 關** | **極窄** |
  > **本專案不可能在「廣度」上贏。**
  > 但 Phonics Hero 證明了一條路：**在單一能力上做到極致，是 viable 的商業模式。**
  > 護城河不一定要靠數量，也可以靠**深度**——
  > 但前提是**那個領域確實做到位**（這就是 Step 188 存在的理由）。
- **預期變更**：
  1. `content/scenes.json` 新增 **2 個場景**（共 8 個）：
     - 每個新場景必須有完整的 `visual` 區塊（Step 172 的 color script 格式）、
       獨立的程序化配樂參數（Step 120 的音樂分層）、剪影層（Step 120 的視差層級）。
     - **不得**只是換色票（這是 C1 缺陷的原樣重現）。
     - 必須有**不同的聽覺特徵**：新場景的環境音要能強化不同的辨識特徵
       （例如雪地場景偏清脆、雨林場景偏連續），讓場景不只是背景。
     - **雙語結構完全對稱**。
  2. `content/levels.json` 新增 **12 關**（40 → 52 關）：
     - 依 Step 189 的排程，Q3／Q4 的關卡。
     - **必須使用新題庫**（不得重用舊題 —— 由 Step 163／164 的守門把關）。
     - 新關卡必須有各自的場景繫結與搭檔（companion）。
     - **必須是解鎖鏈的一部分**（不能讓新關卡孤立存在）。
  3. `src/js/data/levels.js` 對應更新（關卡數、地圖分頁、解鎖條件）。
  4. `tools/check-content.mjs` 新增 `content-depth-expanded`：
     - 斷言場景數 **≥ 8**。
     - 斷言關卡數 **≥ 52**。
     - 斷言每個場景都有 `visual` 區塊且含 `primary` 與 `silhouette`。
     - 斷言新場景的配樂參數**與既有場景不重複**（不得複製既有配樂參數）。
     - 斷言關卡數 ≥ 場景數 × 4（每場景至少 4 關，避免新場景只有 1 關）。
- **規範**：
  - **不得**以「換色票」充數新場景。
  - **不得**在未擴充題庫的情況下新增關卡（會立刻觸發 Step 164 的重複率守門 FAIL）。
  - 不得使用 emoji。
  - 不得引入任何外部素材（新場景的配樂必須是程序化的，沿用既有 9 組的做法）。
  - 雙語結構完全對稱。
- **驗證**：
  ```bash
  npm run typecheck && npm run lint && npm run check:content
  npm run test:play -- --case level-coverage; echo "coverage_exit=$?"
  node -e "
  const fs=require('fs');
  const s=JSON.parse(fs.readFileSync('content/scenes.json','utf8'));
  const scenes=Object.values(s.scenes||s);
  if(scenes.length<8){ console.error('場景少於 8 個（實際 '+scenes.length+'）'); process.exit(1); }
  const l=JSON.parse(fs.readFileSync('content/levels.json','utf8'));
  const levels=l.levels||Object.values(l);
  if(levels.length<52){ console.error('關卡少於 52 個（實際 '+levels.length+'）'); process.exit(1); }
  const music=new Set();
  for(const sc of scenes){
    if(!sc.visual||!sc.visual.primary||!sc.visual.silhouette){ console.error('場景缺 visual:',sc.id); process.exit(1); }
    const key=JSON.stringify(sc.music||sc.audio||null);
    if(music.has(key)){ console.error('場景配樂參數重複:',sc.id); process.exit(1); }
    music.add(key);
  }
  console.log('[PASS] 場景 8 個、關卡 '+levels.length+' 個且配樂不重複');
  "
  ```
- **提交**：
  ```bash
  git add content/scenes.json content/levels.json src/js/data/levels.js tools/check-content.mjs
  git commit -m "feat: 場景擴張至 8 個與關卡 52 關"
  git push origin main
  ```

---

## Step 191 — 護城河回歸驗證
- **依賴**：Step 190
- **檔案**：`tools/verify-quality.mjs`（修改）、`tools/verify-playable.mjs`（修改）
- **目標**：**把護城河的四個問題變成可驗證的守門。**
- **預期變更**：
  1. `tools/verify-quality.mjs` 新增（**帶 `phase: "moat"`**）：
     - `moat-pedagogy-scoped`：斷言 `content/pedagogy.json` 雙語對稱、
       `nonGoals` ≥ 3 項、`capabilities` 與 `nonGoals` 無重疊；
       且 `docs/pedagogy.md` 含自我審查表與已知限制兩節。
     - `moat-content-roadmap`：斷言 `content/roadmap.json` 有 12 個月條目、
       總新增題量 ≥ 410、且推算支撐天數 ≥ 365。
     - `moat-scene-expansion`：斷言場景 ≥ 8、關卡 ≥ 52、
       且每場景配樂參數唯一。
     - `moat-parent-sticky`：斷言 `src/js/core/weekly-digest.js` 存在、
       不含 `fetch(`、且家長報告含「本週看點」區塊。
     > **這四條守門 = 護城河的可稽核證據。**
     > 若其中任何一條 FAIL，**不得**宣稱「護城河已建立」。
  2. `tools/verify-playable.mjs` 新增：
     - `play-new-scene-reachable`：**新場景的關卡可被解鎖並進入**（不只是資料存在）。
     - `play-scene-music-distinct`：切到新場景時，程序化配樂的緩衝區**確實不同**
       （不得只是換了色票但音樂相同）。
     - `play-pedagogy-no-overclaim`：App 內**任何**可見文案**不得**出現
       本專案未宣稱的能力（如「學拼音」「認字」「提升閱讀」）。
       > **這是一條行為層的「誠實」守門** ——
       > 防止宣稱範圍在實作過程中悄悄擴張。
  3. `package.json` 的 `check` script **必須**串入 `--phase moat`。
- **規範**：
  - **不得**弱化既有守門門檻。
  - **不得**在 `docs/acceptance-9.md` 中宣稱護城河已建立，
    除非這四條守門皆 PASS。
- **驗證**：
  ```bash
  npm run check; echo "exit=$?"
  npm run test:play; echo "play_exit=$?"
  node tools/verify-quality.mjs --phase moat; echo "moat_exit=$?"
  ```
  預期：四者皆為 0。
- **提交**：
  ```bash
  git add tools/verify-quality.mjs tools/verify-playable.mjs package.json
  git commit -m "test: 護城河回歸驗證"
  git push origin main
  ```

---
# Phase O — 整合與交付（Step 192–194）

---

## Step 192 — 雙守門整合回歸
- **依賴**：Step 191
- **檔案**：`package.json`（修改）、`tools/verify-playable.mjs`（修改）、`tools/verify-quality.mjs`（修改）
- **目標**：確認**所有支柱在可玩的流程中同時生效**。
- **v11.0 變更**：Phase O 從 Step 180–182 順延至 Step 192–194，
  因為 Phase P（183–187）與 Phase Q（188–191）插在其前。
  **整合守門必須在 Phase P／Q 之後** —— 否則測到的是「加留存機制前」與「加護城河前」的產品。
- **預期變更**：
  1. `tools/verify-playable.mjs` 新增：
     - `play-scene-music`：切換場景時，程序化音樂的場景 id 隨之改變
       （在 harness 中對 `AudioContext.createBufferSource` 做 spy，
       斷言切到不同場景時建立的是不同的緩衝區）。
     - `play-dino-lines`：關卡中**至少有一句**來自 24 隻的專屬對白被使用
       （`lineFor()` 的回傳值出現在 `speak()` 的呼叫中）。
     - `play-character-art`：場景卡司中的每隻角色，其 `src` **實際存在於磁碟**。
     - `play-vitals-collected`：完成一關後，vitals 快照含 `firstInteractionMs`。
  2. `tools/verify-quality.mjs` 新增 `integration-performance-layer`：
     斷言 `content/performances.json` 存在、涵蓋全部場景、
     且 `src/js/core/performance.js` 存在並匯出必要函式。
  3. 新增 `integration-playable-gate`：斷言 `package.json` 的 `test:play` script 存在，
     且 `tools/verify-playable.mjs` 存在且**至少含 76 條檢查**
     （含 Phase L、Phase N、Phase P、Phase Q 新增項）。
  4. `package.json` 的 `check` script **必須**串入 `test:play` 與 `check:a11y` 與 `check:visual`
     **與 `check:design`（Phase N 新增，Step 171）**
     **與 `check:commerce`（Phase P 新增，Step 183）**
     **與 `check:moat`（Phase Q 新增，Step 188）**。
  5. `package.json` **新增** `check:design` 與 `check:commerce` 與 `check:moat` script：
     ```json
     "check:design": "node tools/verify-quality.mjs --phase design && node tools/verify-quality.mjs --phase ux",
     "check:commerce": "node tools/verify-quality.mjs --phase commerce",
     "check:moat": "node tools/verify-quality.mjs --phase moat"
     ```
- **規範**：
  - **不得**刪除或弱化 `verify-quality.mjs` 的既有檢查。
  - **不得**弱化 `verify-playable.mjs` 的任何門檻。
- **驗證**：
  ```bash
  npm run check; echo "exit=$?"
  npm run test:play; echo "exit=$?"
  node tools/verify-quality.mjs; echo "quality_exit=$?"
  node tools/verify-phaseO.mjs --phase 1; echo "phaseO_exit=$?"
  ```
  預期：四者皆為 0。
- **提交**：
  ```bash
  git add package.json tools/verify-playable.mjs tools/verify-quality.mjs
  git commit -m "test: 雙守門整合回歸"
  git push origin main
  ```

---

## Step 193 — 更新驗收對照表與公測檢查表
- **依賴**：Step 192
- **檔案**：`docs/acceptance-9.md`（修改）、`docs/beta-launch.md`（修改）
- **目標**：文件反映**真實可玩、可收費、可量測、可上市**狀況，不宣稱未實測項目。
- **v11.0 變更**：本 Step 是 **v11.0 誠實機制的最後一道關卡**。
  它必須把「本專案沒有第一方使用者資料」這個限制**寫在最前面**。
- **預期變更**：
  1. `docs/acceptance-9.md` **新增一節「上市成熟度驗收（v11.0）」**，逐項列出 M1–M18
     與 **M19–M27**（Phase N）與 **M28–M32**（Phase P／Q）：
     - M19 設計體系規格化（元件狀態矩陣、spacing/type scale、motion token 對應）
       **且已實作**（`design-implemented`）
     - M20 首幀與六場景 color script 定稿（**8 場景**）
     - M21 品牌識別系統（logo 字標、字體、色彩主張、聲音簽名）
     - M22 商店頁體系（6 張鏡頭腳本、ASO 關鍵字、商店文案、en-US 對稱）
     - **M23 市場驗證過的設計模式已採納且已落地**
       （改寫自 v10.6 的「家長訪談結論已落地」）
     - **M24 標竿差異分析已轉為具體修正並落地**
       （改寫自 v10.6 的「幼兒觀察式測試結論已落地」）
     - M25 UX 指標可量測（首次互動時間、首關完成率、卡關求助率、重玩率）
     - M26 研究發現全部有處置狀態（Blocker／Major 的 `open` 與 `deferred` 皆為 0）
     - M27 設計一致性可守（CSS 無硬編碼色碼與毫秒數）
     - **M28 定價與方案對齊同業基準**
     - **M29 付費牆價值主張與家庭方案 UX 就緒**
     - **M30 留存機制就緒（每日挑戰、連續天數、家長週報）**
     - **M31 教學法範圍界定與縱深內容排程就緒**
     - **M32 研究限制已明示（本專案無第一方使用者資料）**
  2. **【v11.0 強制新增】`docs/acceptance-9.md` 開頭必須有一節「本產品的驗證限制」**：
     ```markdown
     ## 本產品的驗證限制（務必先讀）

     本產品的設計依據來自 **競品標竿研究**（`docs/benchmark/`）與
     **產業基準數據**（`docs/pricing-benchmark.md`），
     **而非第一方使用者研究**。

     | 主張 | 本產品的證據狀態 |
     | --- | --- |
     | 孩子喜歡本產品 | **無實測依據**（未進行幼兒測試） |
     | 家長願意付費 | **無實測依據**（未進行付費意願調查） |
     | 家長評價 | **無實測依據** |
     | 留存率 | **無實測依據**（機制已實作，數據待上市後取得） |
     | 教學成效 | **無長期成效研究**（依據語音學自我審查，見 `docs/pedagogy.md`） |

     本產品的設計決策**對齊已被市場驗證的同類產品做法**，
     但**不等同於**本產品自身已被驗證。
     上市後的實際數據是唯一的驗證途徑。
     ```
     > **這節是 v11.0 誠實機制的核心產物。**
     > **沒有這節，`docs/acceptance-9.md` 就會變成一份誤導性的文件。**
  3. **明確標註「待實測」**：兒童試玩滿意度、家長評價、留存率、轉付費、
     美術主觀水準、聆聽疲勞度、兒童理解度、成效研究數據、盲測。
  4. `docs/beta-launch.md` 改寫為**可玩性敘事**：
     「孩子在 3 分鐘內看到第一位夥伴、聽懂第一個任務、按下第一個按鈕、看到星星」。
  5. **新增公測必測項（優先級最高）**：
     - **首關完成率**（目標 ≥ 85%）
     - **首次互動時間**（目標 ≤ 15 秒）
     - **卡死回報率**（任一畫面停留 > 60 秒，目標 ≤ 3%）
     - **恢復購買成功率**（目標 ≥ 95%）
     - **題目重複率**（目標 < 15%，由 `play-repeat-rate-under-threshold` 守門）
     - **UX 指標（Phase N 新增，Step 176）**：
       - **首次互動時間中位數**（目標 ≤ 15 秒）
       - **第一回合完成率**（目標 ≥ 90%，幼兒單獨操作情境）
       - **卡關求助率**（連續 3 次未推進即求助，目標 ≤ 8%）
       - **主動重玩率**（完成關卡後自願再玩，目標 ≥ 40%）
       - **付費牆 3 秒決策率**（家長停留 ≥ 3 秒，目標 ≥ 60%）
     - **【v11.0 新增】商業與護城河必測項**：
       - **商店頁 → 下載轉換率**（對標 iOS 基準 18.1%／Google Play 34.4%）
       - **週期方案續訂率**（對標教育類基準 58%）
       - **D7 留存**（教育類 App 產業基準極低，D7 是早期訊號最有效的指標）
       - **每日挑戰完成率**（若 < 50%，代表留存機制無效，須回 Step 185）
       - **家長週報開啟率**（對標「看得見進度的家長續訂率 2–3 倍」的預期）
  6. **刪除**已過時的「實際金流待串接商店 SDK」等描述（Phase H + Phase L 已完成接線），
     改為「商店後端憑證驗證端點待上線」。
- **規範**：
  - **嚴禁**把待實測項目寫成已達成。
  - **嚴禁**刪除「本產品的驗證限制」一節（v11.0 新增的強制產物）。
  - 不得刪除既有的「尚未驗證」標註。
- **驗證**：
  ```bash
  npm run check; echo "exit=$?"
  node -e "
  const fs=require('fs');
  const s=fs.readFileSync('docs/acceptance-9.md','utf8');
  if(!s.includes('待實測')){ console.error('缺「待實測」標註'); process.exit(1); }
  if(!s.includes('上市成熟度')){ console.error('缺上市成熟度章節'); process.exit(1); }
  if(!s.includes('M18')){ console.error('缺 M15-M18'); process.exit(1); }
  if(!s.includes('M27')){ console.error('缺 M19-M27'); process.exit(1); }
  if(!s.includes('M32')){ console.error('缺 M28-M32'); process.exit(1); }
  // v11.0 強制：驗證限制一節必須存在
  if(!s.includes('本產品的驗證限制')){ console.error('缺「本產品的驗證限制」一節'); process.exit(1); }
  if(!s.includes('無實測依據')){ console.error('驗證限制未明列「無實測依據」'); process.exit(1); }
  console.log('[PASS] 驗收對照表已更新且含驗證限制聲明');
  "
  ```
- **提交**：
  ```bash
  git add docs/acceptance-9.md docs/beta-launch.md
  git commit -m "docs: 更新上市成熟度驗收對照表與公測檢查表"
  git push origin main
  ```

---

## Step 194 — 終局守門與交付
- **依賴**：Step 193
- **檔案**：`task.md`（修改）
- **目標**：全部完成後做一次完整守門並交付。
- **預期變更**：
  1. 在 `task.md` 末尾新增「v11.0 完成紀錄」區塊，
     列出 Step 109–194 的驗證指令與 commit 短 hash（以 `git log --oneline` 取得）。
  2. 更新文件頭部評分區塊：以**實測**更新成熟度評分，並保留「待實測」清單。
  3. 標註 F1–F8、C1–C5、A1–A2、D1–D14、**D15–D23**、
     **U1–U9**、**V1–V4**（Phase P）、**W1–W4**（Phase Q）
     與 **M1–M32** 各自的修復狀態。
  4. **新增一節「方法論教訓」**：
     - v8 為何失敗（用產出指標代替結果指標）。
     - v10 如何避免重演（雙守門：靜態品質 + behavior 可玩性）。
     - v10.5 如何避免重演（**內容深度與平台落地也是成熟度，不是加分項**）。
     - v10.6 如何避免重演（**零缺陷 ≠ 被喜歡；成熟度條件必須涵蓋體驗與品牌面向**）。
     - **v11 如何避免重演（成熟度條件必須由「可見的產品變更」承載，
       且守門必須能證明「依據確實產生了」而非「依據文件格式正確」）**。
     - 下一個版本的第一條規律：
       **在寫第一行內容之前，先寫下玩家第一個 5 分鐘會做什麼，並讓那 5 分鐘可以被自動測試。**
  5. **【v11.0 新增】在完成紀錄中記錄成熟度的「分數來源」**：
     - 逐條列出 M1–M32 的 **PASS／FAIL** 狀態與對應守門 id。
     - 標註 **M23／M24 若為 NOT MET**，則成熟度記 **8.4** 而非 9.0。
     - **不得**以「其他 30 條都 PASS」為由把 M23／M24 當作通過。
- **規範**：
  - **嚴禁**把「待實測」項目寫成已達成（兒童滿意度、家長評價、留存、轉付費、成效數據等）。
  - 不得刪除既有 Step 109–193 的紀錄。
  - 不得修改任何 `src/` 原始碼（本 Step 只改文件）。
  - 不得改動守門門檻來讓它通過。
  - **【v11.0】不得把 M23／M24 的 NOT MET 狀況包裝成「部分達成」或「待補強」。**
- **驗證**：
  ```bash
  npm run check; echo "exit=$?"
  npm run test:play; echo "play_exit=$?"
  node tools/verify-quality.mjs; echo "quality_exit=$?"
  node tools/verify-phaseO.mjs --phase 1; echo "phaseO_exit=$?"
  ```
  預期：四者皆為 0。
- **提交**（終局步驟，唯一一條）：
  ```bash
  git add -A
  git commit -m "feat: 完成上市級成熟度躍升專案（可玩、可收費、可量測、可上市）"
  git push origin "$(git branch --show-current)"
  ```
# 附錄 A — 缺陷對照表

| 編號 | 問題 | 現況 | 修復 Step | 狀態 |
| --- | --- | --- | --- | --- |
| **F1** | sequence 玩法 `check()` 恆 false，關卡 1–4 永遠卡死 | ❌ | 110–111 | ✅ |
| **F2** | puzzle 無 UI，`place()` 從未被呼叫，關卡 29–32、40 永遠卡死 | ❌ | 110–112 | ✅ |
| **F3** | `session` 未 `await` async 的 `build()` | ❌ | 111 | ✅ |
| **F4** | 教學「播放聲音」按鈕 dispatch 無人監聽事件 | ❌ | 114 | ✅ |
| **F5** | 角色尺寸規則寫給已消失的 `#character-img` → 512px 溢出 | ❌ | 118 | ✅ |
| **F6** | 序章信件無關閉鈕，靠 `setTimeout(2600)` 推進 | ❌ | 115 | ✅ |
| **F7** | `startGame` 被綁定兩次，執行兩次 | ❌ | 114 | ✅ |
| **F8** | 圖鑑無關閉鈕，點進去就出不來 | ❌ | 116 | ✅ |
| **C1** | 六場景只換色票，`character` 層是空的 | ❌ | 120 | ✅ |
| **C2** | 六章信件玩家一封也看不到 | ❌ | 122 | ✅ |
| **C3** | 角色不跟章節走，選角色零回報 | ❌ | 119 | ✅ |
| **C4** | 24 隻圖鑑恐龍永遠不在遊戲中出現 | ❌ | 124 | ✅ |
| **C5** | 觸控裝置上視差完全靜止 | ❌ | 120 | ✅ |
| **A1** | 引擎契約不一致（4 玩法 3 完成模型） | ❌ | 110–111 | ✅ |
| **A2** | 無演出層，素材是零件不是機器 | ❌ | 123 | ✅ |
| **D1** | SW 預快取指向 3 個不存在檔 + 漏 5 個關鍵檔 → 離線開不了 | ❌ | 129 | ✅ |
| **D2** | 遙測 `void 0;` → 所有指標架構上無法量測 | ❌ | 143 | ✅ |
| **D3** | 無金流（無 SDK／復原／憑證驗證） | ❌ | 137–139 | ✅ |
| **D4** | 無訂閱復原（上架必檢，審核會退件） | ❌ | 137–138 | ✅ |
| **D5** | 付費牆承諾未實作功能（同步／孩子帳號／客服） | ❌ | 140–141、158 | ✅ |
| **D6** | 同意 API 齊全但無 UI 入口（法規阻斷） | ❌ | 133–135 | ✅ |
| **D7** | 無 CI（所有守門靠人記得跑） | ❌ | 151 | ✅ |
| **D8** | 零單元測試、零可及性自動掃描、零視覺回歸 | ❌ | 150、152、154 | ✅ |
| **D9** | 21 處 `innerHTML`、無 CSP → XSS 風險 | ❌ | 153 | ✅ |
| **D10** | 成效評估 `#assessment-root` 是死元素 → 成效研究跑不了 | ❌ | 157 | ✅ |
| **D11** | 無 CHANGELOG、無客服流程 | ❌ | 158 | ✅ |
| **D12** | 隱私權政策只有 zh-TW，缺 en-US | ❌ | 134 | ✅ |
| **D13** | 鍵盤僅 4 處處理，觸控目標未驗 | ❌ | 127、149 | ✅ |
| **D14** | 無 Web Vitals 量測（「≥55 FPS」永遠待實測） | ❌ | 131 | ✅ |
| **D15** | 題庫深度不足：minimal-pair 14/13 筆撐 12 關、rhythm 6 筆撐 8 關、interference 12 筆撐 5 關 | ❌ | 162 | ✅ |
| **D16** | 抽題為 `Math.random()` 隨機，同回合與跨關皆可能重複 | ❌ | 163 | ✅ |
| **D17** | `minimal-pairs` zh-TW 全部 14 筆 feature 皆為 initial，tier 3/4 要求 vowel 卻永遠 fallback | ❌ | 162 | ✅ |
| **D18** | `items.json` 的 `sun-son` zh-TW 為 `["孫","孫"]`（兩字相同，無法辨識） | ❌ | 162 | ✅ |
| **D19** | `sort(() => Math.random() - 0.5)` 有偏洗牌（`items.js:105`） | ❌ | 163 | ✅ |
| **D20** | 無原生打包管線 → 無法取得可驗證的商店憑證 → IAP 無法收費 | ❌ | 165–166 | ✅ |
| **D21** | 無硬體返回鍵處理（Android 返回鍵直接離開 App） | ❌ | 166 | ✅ |
| **D22** | 無 iOS PWA 安裝引導 → iOS 離線開機率無法達成 100% | ❌ | 167 | ✅ |
| **D23** | App 內無客服／條款／版本資訊入口（送審要求 App 內可達） | ❌ | 168 | ✅ |
| **U1** | `tokens.css` 103 行＝變數集合而非設計系統：無元件狀態矩陣、無 spacing/type scale 理論 | ❌ | 171 | ✅ |
| **U2** | 無首幀定義：孩子打開 App 的第一幀沒有定稿，六場景無 color script | ❌ | 172 | ✅ |
| **U3** | 無品牌識別系統：24 隻素材精緻但無字標／語氣簽名／圖形母題／禁用清單 | ❌ | 173 | ✅ |
| **U4** | 商店頁只有 6 張分鏡描述，無鏡頭腳本、無副標題、無 ASO 關鍵字；且缺 en-US | ❌ | 174 | ✅ |
| **U5** | 遙測字典缺 UX 面向事件 → 體驗指標在架構上無法量測 | ❌ | 175 | ✅ |
| **U6** | 14 項指標全是產品健康度，零項體驗品質指標，且無目標值 | ❌ | 176 | ✅ |
| **U7** | 全案 0 次標竿研究 → 產品設計決策無市場對照依據 | ❌ | 177 | ✅ |
| **U8** | 標竿發現無處置機制：發現不會變成待辦，「做研究」等同「寫文件」 | ❌ | 178 | ✅ |
| **U9** | CSS 硬編碼 hex 與毫秒數 → 一致性靠人眼維持 | ❌ | 179 | ✅ |
| **U10** | 設計規格未與實作耦合 → `design-system.md` 寫完，畫面一個像素沒變 | ❌ | 171、179 | ✅ |
| **U11** | 成熟度條件可空轉得分：`deferred` 通過 Blocker/Major 檢查 | ❌ | 178 | ✅ |

---

# 附錄 A-2 — 商業可行性與護城河缺陷（v11.0 新增）

| 編號 | 問題 | 現況 | 修復 Step | 狀態 |
| --- | --- | --- | --- | --- |
| **V1** | 無定價依據：不知道該賣多少，也不知道同業怎麼賣 | ❌ | 183 | ✅ |
| **V2** | 付費牆無價值主張，只列方案 → 家長看不出「為什麼是這個孩子的」 | ❌ | 184 | ✅ |
| **V3** | 無留存機制：D30 留存產業基準僅 2%，靠內容量撐不住 | ❌ | 185 | ✅ |
| **V4** | 家長端只到「雷達圖」，沒有持續回訪理由 → 續訂率無機制支撐 | ❌ | 186 | ✅ |
| **W1** | 教學範圍未界定：不知自己在教什麼、也不知可能教錯什麼（對照 D17） | ❌ | 188 | ✅ |
| **W2** | 內容撐不了一年：現有題庫 ÷ 每日 3 題 ≈ **18 天**即耗盡 | ❌ | 189 | ✅ |
| **W3** | 場景 6 個為硬上限，無擴張規劃 | ❌ | 190 | ✅ |
| **W4** | 內容量僅 40 關 ≈ 16 分鐘純練習，撐不起年度留存 | ❌ | 189、190 | ✅ |

---

# 附錄 B — 可玩性守門檢查速查表

| 檢查 id | 門檻 | 引入 Step |
| --- | --- | --- |
| `play-boot` | 遊戲可啟動，無未捕捉錯誤 | 109 |
| `play-start` | 點擊開始後遮罩消失、遊戲容器可見 | 109 |
| `play-tutorial` | 教學可完整走完並進角色選擇 | 109 |
| `play-character` | 角色選擇可進地圖 | 109 |
| `play-levelmap` | 地圖可渲染可選關 | 109 |
| `play-level-enter` | 進關卡後有可互動選項 | 109 |
| `play-level-complete` | 關卡 1 可完成 3 回合並結算 | 109 |
| `play-all-verbs` | 六種玩法各可推進 | 109 |
| `play-no-blocking` | 全流程無未捕捉錯誤 | 109 |
| `engine-contract` | 六引擎皆有 kind/submit/isComplete，build 皆 async | 110 |
| `play-verbs-coverage` | **40 關全部可完成** | 113 |
| `play-no-error-verbs` | 六玩法流程無 console.error | 113 |
| `play-nav-complete` | 完整導航每張遮罩都能離開 | 117 |
| `play-no-dead-end` | 流程結束無可見遮罩殘留 | 117 |
| `play-start-once` | `startGame` 只執行一次 | 117 |
| `play-character-visible` | `.char__art` 有尺寸契約且素材存在 | 121 |
| `play-companion-matches` | 角色對應該關 `companion` | 121 |
| `play-scene-applied` | `#scene` 主題等於該關場景且已改變 | 121 |
| `play-story-per-chapter` | 六章各有過場＋卡司＋搭檔檢查 | 125 |
| `play-team-visible` | 隊伍列顯示已解鎖成員 | 125 |
| `play-story-once-per-chapter` | 同章第二關不再重複過場 | 125 |
| `play-touch-targets` | 主要互動元素 ≥ 48px | 128 |
| `play-round-affordance` | 每回合都有視覺指示 | 128 |
| `play-no-emoji` | 介面文字無 emoji | 128 |
| `play-offline-boot` | 離線可開機 | 130 |
| `play-offline-level` | 離線可完成第 1 關 | 130 |
| `play-vitals-degrades` | 無 PerformanceObserver 時不拋錯 | 132 |
| `play-vitals-instrumented` | vitals 已接線 | 132 |
| `play-offline-assets` | 離線資源皆被預快取 | 132 |
| `play-consent-blocks` | 未同意不得進遊戲 | 135 |
| `play-consent-then-play` | 同意後可正常玩 | 135 |
| `play-consent-no-analytics-before` | 同意前無分析事件 | 135 |
| `play-consent-revoke` | 撤回後不再寫入 | 135 |
| `play-consent-delete-data` | 刪除後 `mumu.*` 全清 | 135 |
| `play-purchase-success` | 購買成功 → 權益生效 | 142 |
| `play-purchase-failed` | 失敗可重試 | 142 |
| `play-restore` | 恢復購買有效 | 142 |
| `play-purchase-blocked-before-parent` | 未過閘門不得購買 | 142 |
| `play-no-fake-purchase-copy` | 無假成交文案 | 142 |
| `play-telemetry-consent-gated` | 未同意不排事件 | 147 |
| `play-telemetry-queues-offline` | 離線進佇列 | 147 |
| `play-telemetry-flushes` | 批次外送並清空 | 147 |
| `play-telemetry-no-pii` | 無可識別資訊 | 147 |
| `play-experiment-stable` | 分流穩定可復現 | 147 |
| `play-a11y-critical-zero` | 關鍵畫面 0 critical | 150 |
| `play-sync-degrades` | 後端不可用時安全降級 | 141 |
| `play-scene-music` | 切場景時音樂同步切換 | 171 |
| `play-dino-lines` | 專屬對白有被使用 | 171 |
| `play-character-art` | 卡司素材存在於磁碟 | 171 |
| `play-vitals-collected` | 一關後有 vitals 快照 | 171 |
| `play-no-repeat-within-level` | 同一關 3 回合題目 id 互不相同 | 164 |
| `play-no-repeat-across-levels` | 相鄰關卡題目重疊 < 50% | 164 |
| `play-repeat-rate-under-threshold` | 全局題目重複率 < 15% | 164 |
| `play-item-bank-satisfies-demand` | 題庫量 ≥ 需求 × 1.2 | 164 |
| `play-back-button-closes-overlay` | 返回鍵關閉最上層遮罩，堆疊空時不阻擋 | 169 |
| `play-native-storage-fallback` | 原生儲存不可用時降級不拋錯 | 169 |
| `play-install-prompt-suppressed-in-native` | 原生容器內不顯示安裝引導 | 169 |
| `play-support-entry-reachable` | 設定頁可達客服與隱私權政策 | 169 |
| `ux-flow-continuous` | 首幀→教學→第 1 回合全程無「需成人介入」提示 | 179 |
| `ux-no-blocking-overlay` | UX 修正後流程結束無殘留可見遮罩 | 179 |
| `benchmark-executed` | 標竿 ≥6 款、模式 ≥8 條、來源可稽核、含 Blocker/Major | 178 |
| `design-implemented` | 設計規格的每一項在 `src/styles/` 或 `src/js/ui/` 有對應實作 | 179 |
| `play-design-system-applied` | 回合提示與回饋的計算樣式確實來自語意 token | 179 |
| `pricing-driven-paywall` | 付費牆方案與價格來自 `content/pricing.json`，無硬編碼 | 184 |
| `play-pricing-loaded` | 付費牆顯示的價格與 `content/pricing.json` 一致 | 187 |
| `play-paywall-value-first` | 付費牆第一屏是價值主張，不是方案列表 | 187 |
| `play-family-profiles` | 3 個孩兒設定的進度互相獨立 | 187 |
| `play-daily-stable` | 同日內每日挑戰題目相同 | 187 |
| `play-daily-cross-day` | 跨日後每日挑戰題目更換 | 187 |
| `play-streak-not-reset` | 中斷一天後最佳連續天數保留 | 187 |
| `play-weekly-digest-local` | 無網路時家長週報仍可產生 | 187 |
| `retention-mechanics-wired` | streak 與每日挑戰已接線、無 `Math.random()` | 185 |
| `parent-value-visible` | 週報為本機資料、無外送、無 pseudo-精確評分 | 186 |
| `moat-pedagogy-scoped` | 教學能力與非目標已界定且不重疊 | 191 |
| `moat-content-roadmap` | 12 個月內容排程可撐滿 365 天 | 191 |
| `moat-scene-expansion` | 場景 ≥8、關卡 ≥52、配樂參數唯一 | 191 |
| `moat-parent-sticky` | 家長週報為本機資料且有「本週看點」區塊 | 191 |
| `play-new-scene-reachable` | 新場景的關卡可解鎖並進入 | 191 |
| `play-scene-music-distinct` | 新場景的程序化配樂確實不同 | 191 |
| `play-pedagogy-no-overclaim` | App 內文案不宣稱未宣稱的能力（不得出現「學拼音」「認字」） | 191 |

---

# 附錄 C — 成熟度條件對照（v11.0）

> **兩組條件，兩種性質，不可混淆：**
>
> | 組別 | 性質 | 判定 | 未達成的後果 |
> | --- | --- | --- | --- |
> | **M1–M18** | **上架門檻（gate）** | 全部 PASS 才可上架 | **不得上架**（不論總分多高） |
> | **M19–M32** | **成熟度分數（score）** | 逐條計分 | 降低加權總分 |
>
> **v11.0 的重要修正**：M23／M24 的定義已改寫（見下表註記）。
> 本專案**不做真人研究**，改以競品標竿為依據，
> 因此這兩條**不再聲稱「孩子喜歡／家長願意付費」**，只聲稱
> 「**市場已驗證的模式已採納且已落地**」。
> 這個侷限由 **M32** 強制明示。

## C-1. 上架門檻（M1–M18 · 全部 PASS 才可上架）

| # | 門檻條件 | 對應 Step | 守門 id |
| --- | --- | --- | --- |
| **M1** | 40/40 關可完成 | 113 | `play-verbs-coverage` |
| **M2** | 真實金流可走通 | 137–138、142 | `play-purchase-success`、`play-restore` |
| **M3** | Kids Category 家長確認 | 139 | `commerce-kids-parent-confirm` |
| **M4** | 遙測外送 + crash + Vitals | 131、143、144 | `observability-no-void-telemetry`、`play-vitals-collected` |
| **M5** | 離線冷啟動 100% | 129–130 | `sw-precache-valid`、`play-offline-boot` |
| **M6** | 首次啟動同意流程 | 133–135 | `play-consent-blocks` |
| **M7** | CI 全綠才能合併 | 151 | `quality-ci-covers-all` |
| **M8** | 關鍵指標可量測 | 143、160 | `observability-event-dictionary` |
| **M9** | WCAG 2.2 AA | 149–150 | `check:a11y` 0 critical/serious |
| **M10** | 資安基線 | 153 | `security-no-unescaped-innerhtml` |
| **M11** | A/B 可執行 | 145 | `play-experiment-stable` |
| **M12** | 帳號與家庭方案 | 141 | `play-sync-degrades` |
| **M13** | 營運手冊齊備 | 158 | `launch-docs-complete` |
| **M14** | 成效研究可執行 | 157 | `launch-assessment-wired` |
| **M15** | 題庫深度充足且出題不重複 | 162–164 | `content-item-bank-depth`、`play-no-repeat-within-level`、`play-repeat-rate-under-threshold` |
| **M16** | 可打包為 iOS / Android 原生 App | 165 | `native-capacitor-config` |
| **M17** | 原生 IAP 憑證可取得並交後端驗證 | 165–166 | `native-capacitor-config`、`docs/native-build.md` |
| **M18** | 硬體返回鍵與 App 內客服／條款入口就緒 | 166、168 | `play-back-button-closes-overlay`、`launch-in-app-support-entry` |

## C-2. 成熟度分數（M19–M32 · 逐條計分）

| # | 成熟度條件 | 對應 Step | 守門 id | **可見產出物**（v11.0 新增） |
| --- | --- | --- | --- | --- |
| **M19** | 設計體系規格化**且已實作**（元件狀態矩陣、spacing/type scale、motion token 對應） | 171、179 | `design-system-documented` **＋ `design-implemented`** | `src/styles/components.css` 內有對應樣式規則 |
| **M20** | 首幀與八場景 color script 定稿 | 172、190 | `visual-direction-documented`、`moat-scene-expansion` | `content/scenes.json` 的 `visual` 區塊 ＋ `.scene-visual` CSS |
| **M21** | 品牌識別系統（字標、色彩主張、聲音簽名、圖形母題、禁用清單） | 173 | `brand-system-documented` **＋ `design-implemented`** | `content/brand.json` ＋ `.brand-lockup` 樣式 |
| **M22** | 商店頁體系（6 張鏡頭腳本、副標題、ASO 關鍵字、en-US 對稱） | 174 | `store-presentation-documented` **＋ `design-implemented`** | `content/store-listing.*.json` 的 `shots[]` 完整欄位 |
| **M23** | **市場驗證過的設計模式已採納**（標竿研究完成且模式數達標） | 177、178 | **`benchmark-executed`** ＋ `ux-findings-dispositioned` | `docs/benchmark/products/` ≥6 份、`patterns.md` ≥8 條模式 |
| **M24** | **標竿差異分析已轉為具體修正並落地**（Blocker／Major 全部 `fixed`） | 178、179 | `ux-findings-all-closed` ＋ `design-implemented` | `docs/benchmark/fixes.md` 的「已落地檔案」欄位非空 |
| **M25** | UX 指標可量測（首次互動、首回合完成率、卡關求助率、重玩率等 12 事件） | 175、176 | `ux-events-wired`、`ux-metrics-has-targets` | `src/js/core/telemetry.js` 內實際有發送點 |
| **M26** | 標竿發現全部有處置狀態（Blocker／Major 的 `open` **與 `deferred`** 皆為 0） | 178、179 | `ux-findings-all-closed` | `docs/benchmark/fixes.md` 每列都有狀態與驗收方式 |
| **M27** | 設計一致性可守（CSS 無硬編碼色碼與毫秒數） | 179 | `design-tokens-consistent` | `src/styles/*.css` 全部使用 token |
| **M28** | **定價與方案對齊同業基準**（可追溯至公開基準數據） | 183 | `pricing-driven-paywall` | `content/pricing.json` 每個 plan 有 `source` 欄位 |
| **M29** | **付費牆價值主張與家庭方案 UX 就緒**（價值主張先於方案列表） | 184 | `pricing-driven-paywall`、`play-paywall-value-first`、`play-family-profiles` | `content/pricing.json` 的 `paywallCopy` 三段式 |
| **M30** | **留存機制就緒**（每日挑戰、連續天數、家長週報） | 185、186 | `retention-mechanics-wired`、`parent-value-visible`、`play-daily-stable`、`play-streak-not-reset` | `src/js/core/streak.js`、`daily-challenge.js`、`weekly-digest.js` |
| **M31** | **教學法範圍界定與縱深內容排程就緒**（能撐一年） | 188、189、190 | `moat-pedagogy-scoped`、`moat-content-roadmap`、`moat-scene-expansion` | `content/pedagogy.json`、`roadmap.json`、8 場景 52 關 |
| **M32** | **研究限制已明示**（本專案無第一方使用者資料） | 193 | `ux-findings-all-closed`（文件層） | `docs/acceptance-9.md` 的「本產品的驗證限制」一節 |

> **M23／M24 的定義變更說明（v11.0）**
>
> | 條件 | v10.6 定義 | v11.0 定義 | 變更原因 |
> | --- | --- | --- | --- |
> | M23 | 家長訪談結論已落地 | **市場驗證過的設計模式已採納** | 本專案不做真人訪談 |
> | M24 | 幼兒觀察式測試結論已落地 | **標竿差異分析已轉為具體修正並落地** | 同上 |
>
> **這個改寫不是降低標準，而是換一個誠實的標準。**
> v10.6 的 M23／M24 聲稱的東西（孩子喜不喜歡、家長願不願意付費）
> **在本專案的方法下根本無法驗證** —— 宣稱它們達成才是真正的降低標準。
> v11.0 的標準是**可驗證的**：標竿研究做了、模式萃取出來了、
> 發現轉成修正了、修正落地了。**四件事都可稽核。**
> 而「孩子喜不喜歡」被降級為**永遠不得宣稱**的聲明（見執行守則第 19 條），
> 由 **M32** 強制把這個限制寫在驗收文件的最前面。

> **三組條件的關係**
>
> ```
> M1–M18（gate）  ：技術、合規、金流、觀測 —— 全部 PASS 才可上架
> M19–M27（體驗） ：設計、品牌、標竿依據、UX 指標 —— 決定「會不會被推薦」
> M28–M32（商業護城河）：定價、留存、教學法、內容縱深、研究限制 —— 決定「一年後還活著」
> ```
>
> **只有 M1–M18 PASS 是一個 7.6 分的零缺陷產品（v11.0 二次評審口徑）。**
> 三組全部 PASS 才是 **9.0 分**。

## C-3. 成熟度計分表（v11.0 · 加權）

| 維度 | 權重 | 涵蓋條件 | 滿分條件 |
| --- | --- | --- | --- |
| 能不能賣出去 | 30% | M2、M3、M12、M21、M22、M28、M29 | 全部 PASS |
| 孩子會不會用 | 30% | M1、M6、M9、M10、M15、M19、M20、M23、M24、M25、M26、M27、M31 | 全部 PASS |
| 能不能活著 | 25% | M30、M31、M32（＋ M15） | 全部 PASS |
| 能不能過審 | 15% | M4、M5、M7、M8、M11、M13、M14、M16、M17、M18 | 全部 PASS |

> **若 M23 或 M24 為 NOT MET**（標竿研究未完成）：
> 加權總分**記 8.4**，並在 `docs/acceptance-9.md` 明列缺口。
> **不得**以「其餘 30 條都 PASS」為由視為 9.0。

---
# 附錄 D — 執行順序速查

```
Phase A  109–113  地基：jsdom 守門 + 引擎契約 + 修 9 關卡死     ← 最高優先
Phase B  114–117  入口與導航：修 F4/F6/F7/F8
Phase C  118–121  畫面與角色：修 F5/C3/C5
Phase D  122–125  演出層與劇情：修 C2/C4/A2
Phase E  126–128  回饋與可讀性
Phase F  129–132  離線可靠性與 Web Vitals：修 D1/D14
Phase G  133–136  合規與同意流程：修 D6/D12
Phase H  137–142  商業管道：修 D3/D4/D5
Phase I  143–148  後端與觀測：修 D2 + A/B + 歸因
Phase J  149–155  可及性與品質工程：修 D7/D8/D9/D13
Phase K  156–161  營運與上市準備：修 D10/D11
Phase L  162–170  內容深度與原生落地：修 D15–D23                ← v10.5 新增
Phase N  171–179  設計體系／品牌／競品標竿／UX 指標：修 U1–U9   ← v10.6 新增
Phase P  183–187  商業可行性：定價／家庭方案／留存：修 V1–V4     ← v11.0 新增
Phase Q  188–191  護城河：教學法／內容縱深／場景擴張：修 W1–W4   ← v11.0 新增
Phase O  192–194  整合與交付
```

> **嚴格依序執行，禁止跳步。** 每個 Step 都要 commit + push。
> **本清單的核心紀律：每個 Step 都要能被「實際玩一遍」證明。**
>
> **v10.5 補充紀律：成熟度不只是「軟體品質」。**
> 內容深度（題庫是否夠用）與平台落地（能不能打包、能不能收 IAP）**同樣是成熟度**，
> 缺少任何一項都會讓「9 分」流於形式。
>
> **v10.6 補充紀律：成熟度不只是「零缺陷」。**
> Phase A–L 的 18 條條件（M1–M18）只能證明「產品不會出事」，
> 不能證明「孩子喜歡、家長願意訂閱、產品像一個品牌」。
> **Phase N 的 9 條條件（M19–M27）補的就是這個差距。**
>
> **v11.0 補充紀律一：成熟度必須由「可見的產品變更」承載。**
> 只寫文件、不改畫面、不改行為的 Step **不得**被計入成熟度分數。
> M19–M27 全部需要 `design-implemented` 佐證。
>
> **v11.0 補充紀律二：審查是 gate，體驗是 score。**
> M1–M18 是上架門檻（任一不通過 = 不得上架），
> M19–M32 是成熟度分數。**不得**用體驗分數高來合理化審查不通過。
>
> **v11.0 補充紀律三：成熟度不只是「做得夠好」，還要「做得夠久」。**
> M28–M32 問的是「**收得到錢嗎、留得住嗎、一年後還活著嗎**」。
> 一個可以上架、可以收費、可以合規、可以量測的產品，
> 如果沒有護城河與留存機制，**上架三個月就會在商店裡被淹沒**。
>
> **v11.0 補充紀律四：誠實記低分優於空轉得分。**
> 若 M23／M24 為 NOT MET（標竿研究未完成），
> **成熟度記 8.4 分**，並在驗收文件明列缺口。
> **這不是失敗，這是這份計畫可信的前提。**

## 工期速查（v11.0）

| Phase | 週數 | 累計 | 里程碑 |
| --- | --- | --- | --- |
| A–L | 35 週 | 35 | 零缺陷、可上架、可收費（gate 全通） |
| N | 9 週 | 44 | 設計體系落地、品牌、標竿依據、UX 指標（8.9） |
| P | 4.5 週 | 48.5 | 定價對齊、家庭方案、留存機制、家長週報（8.9） |
| Q | 4.5 週 | 53 | 教學法界定、內容縱深、場景擴張（9.0） |
| O | 1.5 週 | **54.5** | 整合守門與交付 |

> **v11.0 工期：54.5 週（約 12.6 個月）／2–3 人全職。**
> v10.6 為 45 週。增加 9.5 週的來源：
> - Phase N 由 7 週 → 9 週（設計實作耦合 + 標竿研究做深）
> - Phase P 新增 4.5 週
> - Phase Q 新增 4.5 週
> - Phase O 由 1 週 → 1.5 週（多兩組守門）
>
> **與 v10.6 相比，最大風險已從「招募失敗」轉為「執行品質」。**
> 這是一個顯著的改善：**風險從不可控變為可控。**
