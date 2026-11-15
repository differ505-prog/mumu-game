/**
 * 音樂與環境音播放。
 *
 * 兩條獨立軌道：music（HTMLAudioElement → mixer 的 music 軌）與 ambience（→ ambience 軌）。
 * 兩者皆支援 loopStart／loopEnd 區段循環與淡入淡出。
 */

import { bus, context } from "./mixer.js";

/** @type {any} */
let musicMap = { music: {}, chapters: {}, ambience: {} };

/** @type {HTMLAudioElement | null} */
let musicEl = null;

/** @type {HTMLAudioElement | null} */
let ambienceEl = null;

/** @type {any} */
let musicSource = null;

/** @type {any} */
let ambienceSource = null;

/** @type {string} */
let currentId = "";

/**
 * 載入音樂定義。
 * @param {any} data
 */
export function setMusicMap(data) {
    musicMap = data || { music: {}, chapters: {}, ambience: {} };
}

/**
 * 取得曲目定義。
 * @param {string} id
 */
function lookup(id) {
    return musicMap.music?.[id]
        || Object.values(musicMap.chapters || {}).find((/** @type {any} */ m) => m.id === id)
        || musicMap.ambience?.[id]
        || null;
}

/**
 * 取得音訊節點，轉成 gain。
 * @param {string} file
 * @param {number} gainDb
 * @param {"music"|"ambience"} track
 */
function buildSource(file, gainDb, track) {
    const ctx = context();
    if (!ctx) return null;

    const el = new Audio(file);
    el.crossOrigin = "anonymous";
    el.loop = true;

    const src = ctx.createMediaElementSource(el);
    const gain = ctx.createGain();
    gain.gain.value = Math.pow(10, gainDb / 20);
    src.connect(gain);
    const dest = bus(track);
    if (dest) gain.connect(dest);

    return { el, src, gain };
}

/**
 * 播放音樂。
 * @param {string} id
 */
export function playMusic(id) {
    const def = lookup(id);
    if (!def) return;
    if (currentId === id && musicEl && !musicEl.paused) return;

    stopMusic(200);

    const built = buildSource(def.file, def.gainDb ?? -14, "music");
    if (!built) return;

    musicEl = built.el;
    musicSource = built;
    currentId = id;

    // 區段循環：loopStart 至 loopEnd
    const start = def.loopStart || 0;
    const end = def.loopEnd || def.durationSec || 0;

    musicEl.addEventListener("timeupdate", () => {
        if (end && musicEl && musicEl.currentTime >= end) {
            musicEl.currentTime = start;
        }
    });

    musicEl.play().catch(() => {
        // 自動播放政策阻擋時靜默忽略；使用者互動後會重試
    });
}

/**
 * 停止音樂（淡出）。
 * @param {number} fadeMs
 */
export function stopMusic(fadeMs = 400) {
    if (!musicEl || !musicSource) return;
    const el = musicEl;
    const src = musicSource;
    musicEl = null;
    musicSource = null;
    currentId = "";

    const ctx = context();
    if (!ctx) {
        el.pause();
        return;
    }
    const now = ctx.currentTime;
    src.gain.gain.cancelScheduledValues(now);
    src.gain.gain.setValueAtTime(src.gain.gain.value, now);
    src.gain.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
    setTimeout(() => {
        try {
            el.pause();
            src.src.disconnect();
        } catch {
            // 已斷線時忽略
        }
    }, fadeMs + 40);
}

/**
 * 播放環境音。
 * @param {string} id
 */
export function playAmbience(id) {
    const def = lookup(id);
    if (!def) return;
    if (ambienceEl && !ambienceEl.paused) return;

    const built = buildSource(def.file, def.gainDb ?? -26, "ambience");
    if (!built) return;

    ambienceEl = built.el;
    ambienceSource = built;

    const end = def.loopEnd || def.durationSec || 0;
    const start = def.loopStart || 0;
    ambienceEl.addEventListener("timeupdate", () => {
        if (end && ambienceEl && ambienceEl.currentTime >= end) {
            ambienceEl.currentTime = start;
        }
    });

    ambienceEl.play().catch(() => { });
}

/**
 * 停止環境音。
 */
export function stopAmbience() {
    if (ambienceEl) {
        ambienceEl.pause();
        ambienceEl = null;
    }
    ambienceSource = null;
}

/**
 * 依章節主題取得曲目 id。
 * @param {string} theme
 * @returns {string}
 */
export function musicForTheme(theme) {
    const found = Object.values(musicMap.chapters || {}).find((/** @type {any} */ m) => m.theme === theme);
    return found?.id || "daily";
}

/**
 * 依章節主題取得曲目 id（別名，便於呼叫端使用）。
 * @param {string} theme
 * @returns {string}
 */
export function trackForTheme(theme) {
    return musicForTheme(theme);
}
