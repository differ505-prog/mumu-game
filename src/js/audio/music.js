/**
 * 音樂與環境音播放。
 *
 * 兩條獨立軌道：music（HTMLAudioElement → mixer 的 music 軌）與 ambience（→ ambience 軌）。
 * 兩者皆支援 loopStart／loopEnd 區段循環與淡入淡出。
 */

import { bus, context } from "./mixer.js";
import { renderSceneMusic, SCENE_MUSIC } from "./scene-music.js";

/** @type {any} */
let musicMap = { music: {}, chapters: {}, ambience: {} };

/** @type {HTMLAudioElement | null} */
let musicEl = null;

/** @type {HTMLAudioElement | null} */
let ambienceEl = null;

/** @type {any} */
let musicSource = null;

/** @type {string} */
let currentId = "";

/** 程序化音樂緩衝區快取（同一場景只渲染一次）。 @type {Map<string, AudioBuffer>} */
const sceneBuffers = new Map();

/** @type {AudioBufferSourceNode | null} */
let sceneSource = null;

/** @type {GainNode | null} */
let sceneGain = null;

/** 目前播放中的程序化場景。 @type {string} */
let currentSceneId = "";

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
    // 場景鍵改走程序化軌道，讓呼叫端不必分辨兩套機制
    if (SCENE_MUSIC[id]) {
        playSceneMusic(id);
        return;
    }

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
    stopSceneMusic(fadeMs);
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
 * 判斷某場景是否有程序化音樂。
 * @param {string} sceneId
 * @returns {boolean}
 */
export function hasSceneMusic(sceneId) {
    return Boolean(SCENE_MUSIC[sceneId]);
}

/**
 * 播放程序化場景音樂。
 *
 * 規範：同一場景只渲染一次（快取）；不得與檔案音樂同時播放；
 * 節點停止時必須 disconnect()，避免記憶體洩漏。
 *
 * @param {string} sceneId
 * @param {{ gainDb?:number, seconds?:number }} [opts]
 * @returns {boolean} 是否成功啟動
 */
export function playSceneMusic(sceneId, opts = {}) {
    if (!SCENE_MUSIC[sceneId]) return false;
    if (currentSceneId === sceneId && sceneSource) return true;

    const ctx = context();
    if (!ctx) return false;

    stopSceneMusic(700);
    stopMusic(700);

    let buffer = sceneBuffers.get(sceneId);
    if (!buffer) {
        buffer = renderSceneMusic(ctx, sceneId, opts.seconds ?? 24);
        if (!buffer) return false;
        sceneBuffers.set(sceneId, buffer);
    }

    const dest = bus("music");
    if (!dest) return false;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const gain = ctx.createGain();
    const gainDb = opts.gainDb ?? -15;
    gain.gain.value = Math.pow(10, gainDb / 20);

    src.connect(gain);
    gain.connect(dest);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gain.gain.value, now + 1.2);

    src.start(0);

    sceneSource = src;
    sceneGain = gain;
    currentSceneId = sceneId;

    return true;
}

/**
 * 停止程序化場景音樂（淡出）。
 * @param {number} fadeMs
 */
export function stopSceneMusic(fadeMs = 800) {
    if (!sceneSource || !sceneGain) return;

    const src = sceneSource;
    const gain = sceneGain;
    sceneSource = null;
    sceneGain = null;
    currentSceneId = "";

    const ctx = context();
    if (!ctx) {
        try {
            src.stop();
        } catch {
            // 已停止時忽略
        }
        return;
    }

    const now = ctx.currentTime;
    try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
    } catch {
        // 節點可能已被斷線
    }
    setTimeout(() => {
        try {
            src.stop();
            src.disconnect();
            gain.disconnect();
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
