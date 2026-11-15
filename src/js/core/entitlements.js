/**
 * 權益控管 — 免費公測邊界。
 *
 * 免費＝序章＋第 1–3 章（共 12 關）
 * 付費＝第 4–5 章、恐龍谷主題包、家長報告完整版、跨裝置同步
 *
 * 規範：**不提供月訂閱選項**，只推年訂閱（台港 NT$790，另測 NT$990）。
 */

import { readJson, writeJson } from "./storage.js";

/**
 * @typedef {"free"|"premium"} Entitlement
 */

const STORAGE_KEY = "mumu.entitlement";

/**
 * 免費章節範圍（第 0–3 章，即序章＋第 1–3 章）。
 * 與 APP.freeChapters 保持一致。
 */
export const FREE_CHAPTERS = [0, 1, 2, 3];

/**
 * 可控管的功能。
 * @typedef {"chapter4"|"chapter5"|"dinoTheme"|"parentReportFull"|"sync"|"extraPack"} Feature
 */

/**
 * 目前權益。
 * @returns {Entitlement}
 */
export function getEntitlement() {
    return readJson(STORAGE_KEY, "free") === "premium" ? "premium" : "free";
}

/**
 * 設定權益。
 * @param {Entitlement} e
 */
export function setEntitlement(e) {
    writeJson(STORAGE_KEY, e === "premium" ? "premium" : "free");
    return getEntitlement();
}

/**
 * 判斷某功能是否可用。
 * @param {Feature} feature
 * @param {Entitlement} [current]
 * @returns {boolean}
 */
export function canAccess(feature, current = getEntitlement()) {
    if (current === "premium") return true;

    // 免費範圍內的功能
    switch (feature) {
        case "chapter4":
            // 第 4 章（chapter index 3）為免費（APP.freeChapters 含 3）
            return false;
        case "chapter5":
            return false;
        case "dinoTheme":
            return false;
        case "parentReportFull":
            return false;
        case "sync":
            return false;
        case "extraPack":
            return false;
        default:
            return false;
    }
}

/**
 * 章節是否免費。
 * @param {number} chapter
 * @returns {boolean}
 */
export function isChapterFree(chapter) {
    return FREE_CHAPTERS.includes(chapter);
}

/**
 * 訂閱方案（僅年訂閱）。
 */
export const PLANS = [
    {
        id: "year",
        title: "年訂閱",
        titleEn: "Annual",
        price: "NT$790 / 年",
        priceEn: "NT$790 / year",
        features: ["第 4–5 章完整內容", "恐龍谷主題包", "家長報告完整版", "跨裝置同步"]
    },
    {
        id: "family",
        title: "家庭方案",
        titleEn: "Family",
        price: "NT$990 / 年",
        priceEn: "NT$990 / year",
        features: ["年訂閱全部權益", "最多 3 個孩子帳號", "優先客服"]
    }
];
