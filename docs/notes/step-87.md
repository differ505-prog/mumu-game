# Step 87 — 清理重複音檔紀錄

日期：2026-11-16

## 問題

`assets/audio/` 有 4 個音檔，其中兩組檔名在**正規化後**（轉小寫並移除所有非英數字元）相同：

| 檔名 | 正規化後 | 大小 | MD5 |
| --- | --- | --- | --- |
| `外部資源__Jingle Bells.m4a` | `外部資源jinglebells.m4a` | 553,541 | `8e28ef66169b24b89a049e4f4fbd9d8a` |
| `外部資源__jingle-bells.m4a` | `外部資源jinglebells.m4a` | 556,886 | `43baa8220ede16eab357560b53e19c14` |
| `外部資源__Silent Night - Instrumental.m4a` | `外部資源silentnightinstrumentalm4a` | 555,143 | `4298376e7cb248a40a573ffeb3d13dee` |
| `外部資源__silent-night.m4a` | `外部資源silentnightm4a` | 554,887 | `b102114e7f7bb1a8183819dfcc5d0d58` |

注意：`Silent Night` 那組**正規化後並不相同**（`silentnightinstrumentalm4a` vs `silentnightm4a`），守門只抓到 Jingle Bells 一組。

## 內容比對結論

四個檔案的 MD5 **互不相同**，代表它們是同一首曲目／同一首曲目的**不同轉碼版本**，而非完全相同的副本。

| 比對組 | 結果 |
| --- | --- |
| Jingle Bells（大寫空格版 vs 小寫連字號版） | hash 不同 → 不同轉碼 |
| Silent Night（Instrumental 版 vs 小寫版） | hash 不同 → 不同轉碼 |

## 處置

1. **程式碼引用盤點**：`content/music.json` 的 9 處 `file` 欄位全部指向**小寫連字號版**（`外部資源__jingle-bells.m4a`、`外部資源__silent-night.m4a`）。`src/` 與 `tools/` 中無任何其他引用。
2. **保留**：`外部資源__jingle-bells.m4a`、`外部資源__silent-night.m4a`（程式碼實際引用的退路音檔）。
3. **刪除未被引用的重複檔**：
   - `外部資源__Jingle Bells.m4a`（MD5 `8e28ef66…`）
   - `外部資源__Silent Night - Instrumental.m4a`（MD5 `4298376e…`）
4. **記錄**（本檔）：大寫版是不同轉碼版本，刪除後若素材方需要該版本，可依上方 MD5 與大小向來源比對索取。

## 為什麼值得保留這兩個退路音檔

Step 83 之後，場景主題曲改由 `src/js/audio/scene-music.js` **程序化生成**（零授權風險、每場景獨立）。
這兩個檔案的定位已改為：

- 程序化生成失敗時的**退路**（`music.json` 的 `file` 欄位）
- 音訊設定面板中可讓家長試聽的**實體曲目**

因此保留小寫版、刪除未引用的大寫版是最小風險的處置。

## 驗證

```bash
node tools/verify-quality.mjs --phase music
npm run check:assets
```
