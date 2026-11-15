/**
 * 玩法制程路由 — 依關卡的 verb 建立對應引擎。
 */

import { createAuditoryVerb } from "./auditory.js";
import { createPuzzleVerb } from "./puzzle.js";
import { createMemoryVerb } from "./memory.js";

/**
 * 依 verb 建立引擎。
 * @param {any} bundle
 * @param {string} locale
 * @param {any} spec 關卡規格
 * @param {string} verb 玩法 id
 */
export function createVerb(bundle, locale, spec, verb) {
    switch (verb) {
        case "sequence":
            return createAuditoryVerb(bundle, locale, spec, "sequence");
        case "minimal-pair":
            return createAuditoryVerb(bundle, locale, spec, "minimal-pair");
        case "rhythm":
            return createAuditoryVerb(bundle, locale, spec, "rhythm");
        case "interference":
            return createAuditoryVerb(bundle, locale, spec, "interference");
        case "puzzle":
            return createPuzzleVerb(bundle, locale, spec, "assembly");
        case "memory":
            return createMemoryVerb(bundle, locale, spec, "match");
        default:
            throw new Error(`[verbs] 未知玩法: ${verb}`);
    }
}

/**
 * 依關卡 verb 建立引擎（含 pattern 與 dual 的子類型判斷）。
 *
 * pattern 用於序列推理拼圖（第 5 章），dual 用於雙通道序列記憶。
 *
 * @param {any} bundle
 * @param {string} locale
 * @param {any} level 關卡物件
 */
export function createVerbForLevel(bundle, locale, level) {
    const spec = level.spec || {};
    switch (level.verb) {
        case "puzzle":
            return spec.variant === "pattern"
                ? createPuzzleVerb(bundle, locale, spec, "pattern")
                : createPuzzleVerb(bundle, locale, spec, "assembly");
        case "memory":
            return spec.variant === "dual"
                ? createMemoryVerb(bundle, locale, spec, "dual")
                : createMemoryVerb(bundle, locale, spec, "match");
        default:
            return createVerb(bundle, locale, spec, level.verb);
    }
}
