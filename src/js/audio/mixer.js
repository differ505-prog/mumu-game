/**
 * 四軌混音器 — music / sfx / voice / ambience，外加 master。
 */

/**
 * @typedef {"music"|"sfx"|"voice"|"ambience"} Bus
 */

/**
 * @typedef {Object} Volumes
 * @property {number} music
 * @property {number} sfx
 * @property {number} voice
 * @property {number} ambience
 * @property {number} master
 */

/** @type {AudioContext | null} */
let ctx = null;

/** @type {Partial<Record<Bus, GainNode>>} */
const buses = {};

/** @type {GainNode | null} */
let masterGain = null;

/** @type {Volumes} */
let volumes = { music: 0.6, sfx: 0.8, voice: 1.0, ambience: 0.4, master: 0.9 };

/**
 * 取得音訊 context（僅在使用者互動後建立，避免瀏覽器自動播放限制）。
 * @param {string} [_locale]
 */
export function ensureAudio(_locale = "zh-TW") {
    if (!ctx) {
        const Ctor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
        if (!Ctor) return null;
        ctx = new Ctor();
        masterGain = ctx.createGain();
        masterGain.gain.value = volumes.master;
        masterGain.connect(ctx.destination);

        for (const name of ["music", "sfx", "voice", "ambience"]) {
            const g = ctx.createGain();
            g.gain.value = volumes[name];
            g.connect(masterGain);
            buses[name] = g;
        }
    }
    if (ctx.state === "suspended") {
        ctx.resume();
    }
    return ctx;
}

/**
 * 取得音訊 context（不建立）。
 * @returns {AudioContext | null}
 */
export function context() {
    return ctx;
}

/**
 * 取得某軌的 gain node。
 * @param {Bus} name
 */
export function bus(name) {
    return buses[name] || null;
}

/**
 * 設定音量。
 * @param {Partial<Volumes>} v
 */
export function setVolumes(v) {
    volumes = { ...volumes, ...v };
    if (masterGain) masterGain.gain.value = volumes.master;
    for (const name of ["music", "sfx", "voice", "ambience"]) {
        const g = buses[name];
        if (g) g.gain.value = volumes[name];
    }
}

/**
 * 取得目前音量。
 * @returns {Volumes}
 */
export function getVolumes() {
    return { ...volumes };
}

/**
 * 側鏈 ducking：音樂在語音播放時暫時衰減。
 * @param {number} ms 衰減持續毫秒
 * @param {number} db 衰減量（負值）
 */
export function duckMusic(ms = 600, db = -12) {
    const g = buses.music;
    if (!g || !ctx) return;
    const now = ctx.currentTime;
    const target = volumes.music * Math.pow(10, db / 20);
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(target, now + 0.08);
    g.gain.linearRampToValueAtTime(volumes.music, now + ms / 1000);
}
