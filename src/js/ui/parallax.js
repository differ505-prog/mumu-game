/**
 * 五層視差場景與章節主題。
 *
 * 層位移係數：sky 0.05／ridge 0.12／midground 0.22／character 0.35／foreground 0.55。
 * 層深越大，位移越大（近景跟手）。
 */

/**
 * @typedef {"sky"|"ridge"|"midground"|"character"|"foreground"} SceneLayer
 */

/** 層位移係數。 */
const DEPTH = {
    sky: 0.05,
    ridge: 0.12,
    midground: 0.22,
    character: 0.35,
    foreground: 0.55
};

/** 章節主題的光色設定。 */
const THEMES = {
    christmas: { sky: "#0a1a3c", glow: "#f1c40f", fog: "#1b2f5e" },
    valley: { sky: "#0f2d3f", glow: "#7fd4c1", fog: "#16414f" },
    forest: { sky: "#12301f", glow: "#8fd694", fog: "#1c4430" },
    "ice-age": { sky: "#16243d", glow: "#bfe8ff", fog: "#243c5e" },
    "ice-age-christmas": { sky: "#2c1f45", glow: "#ffd98a", fog: "#4a3767" },
    north: { sky: "#0b1830", glow: "#9fd0ff", fog: "#172a4d" }
};

/**
 * 建立五層場景。
 * @param {HTMLElement} sceneRoot
 */
export function buildScene(sceneRoot) {
    if (!sceneRoot) return;
    sceneRoot.innerHTML = "";
    sceneRoot.classList.add("scene");

    /** @type {SceneLayer[]} */
    const layers = ["sky", "ridge", "midground", "character", "foreground"];

    for (const layer of layers) {
        const el = document.createElement("div");
        el.className = "scene__layer";
        el.dataset.layer = layer;
        el.dataset.depth = String(DEPTH[layer]);
        el.style.setProperty("--depth", String(DEPTH[layer]));
        sceneRoot.appendChild(el);
    }

    applyTheme(sceneRoot, "christmas");
}

/**
 * 場景色票（可由 content/scenes.json 注入）。
 * @type {any}
 */
let scenePalettes = {};

/**
 * 注入場景色票資料。
 * @param {any} data
 */
export function setScenePalettes(data) {
    scenePalettes = data || {};
}

/**
 * 取得場景色票。
 * @param {string} scene
 */
function paletteFor(scene) {
    return scenePalettes?.[scene]?.palette || THEMES[scene] || THEMES.christmas;
}

/**
 * 套用章節主題（場景色票）。
 *
 * 規範：所有色值來自 content/scenes.json 的 palette，不得硬編碼。
 * @param {HTMLElement} sceneRoot
 * @param {string} theme
 */
export function applyTheme(sceneRoot, theme) {
    if (!sceneRoot) return;
    const p = paletteFor(theme);
    sceneRoot.dataset.theme = theme;
    sceneRoot.style.setProperty("--scene-sky", p.sky);
    sceneRoot.style.setProperty("--scene-glow", p.glow);
    sceneRoot.style.setProperty("--scene-fog", p.fog);
    sceneRoot.style.setProperty("--scene-ridge", p.ridge || p.sky);
    sceneRoot.style.setProperty("--scene-midground", p.midground || p.sky);
    sceneRoot.style.setProperty("--scene-foreground", p.foreground || p.sky);
}

/**
 * 依層深位移各層。
 * @param {HTMLElement} sceneRoot
 * @param {number} px
 */
export function setParallax(sceneRoot, px) {
    if (!sceneRoot) return;
    Array.from(sceneRoot.querySelectorAll(".scene__layer")).forEach((/** @type {HTMLElement} */ layer) => {
        const depth = Number(layer.dataset.depth ?? layer.style.getPropertyValue("--depth") ?? 0);
        layer.style.transform = `translate3d(0, ${(px * depth).toFixed(2)}px, 0)`;
    });
}

/**
 * 銷毀場景。
 * @param {HTMLElement} sceneRoot
 */
export function destroyScene(sceneRoot) {
    if (!sceneRoot) return;
    sceneRoot.innerHTML = "";
    sceneRoot.classList.remove("scene");
    delete sceneRoot.dataset.theme;
}

/**
 * 取得主題光色（供其他模組使用）。
 * @param {string} theme
 * @returns {{ sky:string, glow:string, fog:string }}
 */
export function themeColors(theme) {
    return THEMES[theme] || THEMES.christmas;
}

/**
 * 章節到主題的對應。
 *
 * 索引對應 story-arcs.json 的 chapter 0–5：
 * christmas / valley / forest / ice-age / ice-age-christmas / north。
 *
 * @param {number} chapter
 * @returns {string}
 */
export function themeForChapter(chapter) {
    const map = ["christmas", "valley", "forest", "ice-age", "ice-age-christmas", "north"];
    return map[chapter] || "christmas";
}