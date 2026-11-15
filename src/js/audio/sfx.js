/**
 * 音效系統 — 44 個材質音效，全部由 Web Audio 合成（無外部音檔依賴）。
 *
 * 為何合成而非取樣：
 * - 零資產體積（離線快取小）
 * - 音高與包絡可依語速調整（對聽覺辨識遊戲尤其重要）
 * - 不需處理音檔授權
 */

import { bus, context, ensureAudio } from "./mixer.js";

/** @type {Record<string, any>} */
let sfxMap = {};

/**
 * 載入音效定義。
 * @param {any} data
 */
export function setSfxMap(data) {
    sfxMap = data || {};
}

/**
 * 音效分類清單。
 * @param {string} category
 * @returns {string[]}
 */
export function sfxIdsByCategory(category) {
    return Object.keys(sfxMap).filter((id) => sfxMap[id].category === category);
}

/**
 * 以確定性隨機取變體（同一 seed 結果一致）。
 * @param {string[]} variants
 * @param {number} seed
 */
function pickVariant(variants, seed) {
    if (!variants.length) return null;
    const idx = Math.abs(Math.floor(seed)) % variants.length;
    return variants[idx];
}

/**
 * 播放音效。
 * @param {string} id
 * @param {{ seed?: number, rate?: number }} [opts]
 */
export function playSfx(id, opts = {}) {
    const def = sfxMap[id];
    if (!def) return;

    const ctx = context() || ensureAudio();
    if (!ctx) return;

    const variant = /** @type {any} */ (pickVariant(def.variants || [], opts.seed ?? Math.floor(Math.random() * 1000)));
    if (!variant) return;

    const dest = bus("sfx");
    if (!dest) return;

    const now = ctx.currentTime;
    const dur = (def.durationMs || 120) / 1000;
    const rate = opts.rate ?? 1;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = def.wave || "sine";
    const baseFreq = (variant.freq ?? def.freq ?? 440) * rate;
    const endFreq = variant.freqEnd ?? def.freqEnd ?? baseFreq;
    osc.frequency.setValueAtTime(baseFreq, now);
    if (endFreq !== baseFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);
    }

    filter.type = variant.filterType || def.filterType || "lowpass";
    filter.frequency.value = variant.filterFreq ?? def.filterFreq ?? 8000;

    const peak = Math.pow(10, (def.gainDb ?? -6) / 20);
    const attack = variant.attack ?? 0.005;
    const release = variant.release ?? dur * 0.8;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + attack + release + 0.05);
}

/**
 * 播放恐龍吼聲，依音色參數選擇對應音效。
 * @param {string} roar deep | loud | soft | sharp | mid | warm
 */
export function playDinoRoar(roar = "mid") {
    playSfx(`dino.roar.${roar}`, { seed: roar.length });
}

/**
 * 播放多諧波鈴聲。
 * @param {number[]} freqs
 * @param {number} dur
 * @param {number} gainDb
 */
export function playChord(freqs, dur = 0.6, gainDb = -8) {
    const ctx = context() || ensureAudio();
    const dest = bus("sfx");
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const peak = Math.pow(10, gainDb / 20);

    for (const f of freqs) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + dur + 0.05);
    }
}

/**
 * 播放純音（音高辨識玩法用）。
 * @param {number} hz
 * @param {number} durationMs
 * @param {number} [gainDb]
 */
export function playTone(hz, durationMs = 400, gainDb = -6) {
    const ctx = context() || ensureAudio();
    const dest = bus("sfx");
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const dur = durationMs / 1000;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = hz;
    const peak = Math.pow(10, gainDb / 20);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.02);
    gain.gain.setValueAtTime(peak, now + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.05);
}

/**
 * 播放節拍（節奏玩法用）。
 * @param {number} [durationMs]
 */
export function playBeat(durationMs = 120) {
    playSfx("ui.tap", { seed: Math.floor(Math.random() * 1000), rate: 0.9 });
    playTone(160, durationMs, -12);
}
