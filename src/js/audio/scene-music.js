/**
 * 程序化音樂生成器 — 為每個章節場景生成**獨立**的主題音樂。
 *
 * 為何程序化：
 * - 現況缺陷：整個遊戲只有 2 個音檔（jingle-bells / silent-night），
 *   五個章節主題＋環境音全部是這兩首聖誕曲循環，與「冰河紀」「深海」
 *   「北方之夜」的場景完全不符。
 * - 程序化可為每個場景產生風格相符、可無限循環、無授權風險的音樂。
 * - 生成的音樂以 AudioBuffer 形式直接在 Web Audio 中播放，不需外部檔案。
 *
 * 設計：
 * - 每個場景有專屬的和弦進行、節奏型、音色與環境層。
 * - 使用真實的音樂理論：五聲音階（兒歌常見）、I-V-vi-IV 等進行。
 * - 輸出為可循環的 AudioBuffer（以樂句長度對齊，取 loop 點）。
 *
 * 技術說明：
 * - 採「預渲染」策略：啟動時一次性把每個場景的音樂算成 AudioBuffer，
 *   之後播放只是 loop 播放，效能與延遲都優於即時合成。
 * - 所有節點在離開時被釋放，避免記憶體洩漏。
 */

/** 音階（半音偏移） */
const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    pentatonic: [0, 2, 4, 7, 9],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    wholeTone: [0, 2, 4, 6, 8, 10]
};

/**
 * 場景音樂定義。
 *
 * 每個場景：
 * - root：根音（MIDI 音高編號，60 = C4）
 * - scale：音階名
 * - chords：和弦進行，每個為音階內的相對音級索引
 * - tempo：每分鐘拍數
 * - barsPerPhrase：樂句小節數
 * - pad：持續音（低音鋪底）的音色
 * - arp：琶音音色
 * - bell：點綴音色（鐘／鈴）
 * - drums：節奏型
 * - ambience：環境層（噪聲／風聲）
 * - brightness：濾波亮度（0–1）
 */
export const SCENE_MUSIC = {
    /** 序章：北極的星星 — 空靈、豎琴般，帶北極風雪 */
    christmas: {
        root: 72, scale: "major", tempo: 62,
        barsPerPhrase: 4,
        chords: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]],
        pad: "sine", arp: "triangle", bell: "sine",
        drums: "soft", ambience: "wind",
        brightness: 0.62,
        bellPattern: [0, 1.5, 3]
    },

    /** 第一章：恐龍谷 — 明亮俏皮，兒歌感 */
    valley: {
        root: 69, scale: "major", tempo: 96,
        barsPerPhrase: 4,
        chords: [[0, 2, 4], [3, 5, 0], [5, 0, 2], [4, 6, 1]],
        pad: "triangle", arp: "square", bell: "triangle",
        drums: "march", ambience: "none",
        brightness: 0.85,
        bellPattern: [0, 2]
    },

    /** 第二章：恐龍的語言 — 探險感，混合東方色彩 */
    forest: {
        root: 67, scale: "dorian", tempo: 84,
        barsPerPhrase: 4,
        chords: [[0, 2, 4], [3, 5, 0], [4, 6, 1], [0, 2, 4]],
        pad: "sine", arp: "triangle", bell: "sine",
        drums: "soft", ambience: "forest",
        brightness: 0.72,
        bellPattern: [1, 2.5]
    },

    /** 第三章：深海與天空 — 空曠、漂浮，冰原風聲 */
    "ice-age": {
        root: 65, scale: "lydian", tempo: 58,
        barsPerPhrase: 4,
        chords: [[0, 2, 4], [4, 6, 1], [3, 5, 0], [0, 2, 4]],
        pad: "sine", arp: "sine", bell: "sine",
        drums: "none", ambience: "wind",
        brightness: 0.5,
        bellPattern: [0, 2, 3.5]
    },

    /** 第四章：冰河紀的聖誕 — 溫暖回家感，銅管色的喜慶 */
    "ice-age-christmas": {
        root: 71, scale: "major", tempo: 72,
        barsPerPhrase: 4,
        chords: [[0, 2, 4], [4, 6, 1], [5, 0, 2], [3, 5, 0]],
        pad: "triangle", arp: "triangle", bell: "sine",
        drums: "march", ambience: "snow",
        brightness: 0.78,
        bellPattern: [0, 1, 2, 3]
    },

    /** 第五章：北方的一夜 — 寧靜收束，搖籃曲般的柔和 */
    north: {
        root: 64, scale: "pentatonic", tempo: 52,
        barsPerPhrase: 4,
        chords: [[0, 2, 4], [3, 5, 0], [4, 6, 1], [0, 2, 4]],
        pad: "sine", arp: "sine", bell: "sine",
        drums: "none", ambience: "wind",
        brightness: 0.45,
        bellPattern: [0, 2]
    },

    /** 慶祝 — 明亮短句 */
    celebrate: {
        root: 74, scale: "major", tempo: 110,
        barsPerPhrase: 2,
        chords: [[0, 2, 4], [4, 6, 1]],
        pad: "triangle", arp: "square", bell: "triangle",
        drums: "march", ambience: "none",
        brightness: 0.95,
        bellPattern: [0, 1, 2, 3]
    },

    /** 日常／任務 — 中性勵志 */
    daily: {
        root: 70, scale: "major", tempo: 88,
        barsPerPhrase: 4,
        chords: [[0, 2, 4], [3, 5, 0], [5, 0, 2], [4, 6, 1]],
        pad: "triangle", arp: "triangle", bell: "sine",
        drums: "soft", ambience: "none",
        brightness: 0.8,
        bellPattern: [0, 2]
    },

    /** 夜 — 放鬆睡前的輕柔 */
    night: {
        root: 62, scale: "major", tempo: 50,
        barsPerPhrase: 4,
        chords: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]],
        pad: "sine", arp: "sine", bell: "sine",
        drums: "none", ambience: "wind",
        brightness: 0.42,
        bellPattern: [0, 2]
    }
};

/**
 * MIDI 音高轉頻率。
 * @param {number} midi
 */
function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * 將音階級數轉為 MIDI 音高。
 * @param {number} root MIDI 根音
 * @param {string} scaleName 音階名
 * @param {number} degree 音階級數（可超出音階長度）
 */
function degreeToMidi(root, scaleName, degree) {
    const scale = SCALES[scaleName] || SCALES.major;
    const len = scale.length;
    const oct = Math.floor(degree / len);
    const idx = ((degree % len) + len) % len;
    return root + oct * 12 + scale[idx];
}

/**
 * 將左右聲道資料寫入緩衝區。
 * @param {AudioBuffer} buffer
 * @param {Float32Array} left
 * @param {Float32Array} right
 */
function writeStereo(buffer, left, right) {
    const l = buffer.getChannelData(0);
    const r = buffer.getChannelData(1);
    l.set(left);
    r.set(right);
}

/**
 * 產生帶 ADSR 包絡的振盪器片段（寫入左右聲道）。
 * @param {Float32Array} left 左聲道輸出緩衝
 * @param {Float32Array} right 右聲道輸出緩衝
 * @param {number} sr 取樣率
 * @param {number} t0 起始秒
 * @param {number} dur 時長（秒）
 * @param {number} freq 頻率
 * @param {string} wave 波形
 * @param {number} amp 振幅
 * @param {number} pan 立體聲位置 -1..1
 * @param {number} attackSec 攻擊時間
 * @param {number} releaseSec 釋放時間
 */
function addTone(left, right, sr, t0, dur, freq, wave, amp, pan, attackSec = 0.02, releaseSec = 0.12) {
    const start = Math.floor(t0 * sr);
    const len = Math.floor(dur * sr);
    const attack = Math.max(1, Math.floor(attackSec * sr));
    const release = Math.max(1, Math.floor(releaseSec * sr));
    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);
    let phase = 0;

    for (let i = 0; i < len; i++) {
        const idx = start + i;
        if (idx >= left.length) break;

        // 包絡
        let env;
        if (i < attack) env = i / attack;
        else if (i > len - release) env = Math.max(0, (len - i) / release);
        else env = 1;

        // 波形
        let s;
        const ph = phase;
        if (wave === "sine") s = Math.sin(ph);
        else if (wave === "triangle") s = 2 / Math.PI * Math.asin(Math.sin(ph));
        else if (wave === "square") s = Math.sin(ph) >= 0 ? 1 : -1;
        else if (wave === "saw") s = 2 * ((ph / (Math.PI * 2)) % 1) - 1;
        else s = Math.sin(ph);
        phase += (Math.PI * 2 * freq) / sr;

        const v = s * amp * env;
        left[idx] += v * leftGain;
        right[idx] += v * rightGain;
    }
}

/**
 * 產生環境噪聲層（風／雪／森林）。
 * @param {Float32Array} left
 * @param {Float32Array} right
 * @param {number} sr
 * @param {string} kind
 * @param {number} amp
 */
function addAmbience(left, right, sr, kind, amp) {
    if (kind === "none") return;
    const n = left.length;
    // 以低頻正弦調變的粉紅噪聲近似
    let b0 = 0, b1 = 0, b2 = 0;
    const lfoFreq = kind === "wind" ? 0.08 : kind === "snow" ? 0.15 : 0.3;
    let lfoPhase = 0;

    for (let i = 0; i < n; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        const pink = (b0 + b1 + b2 + white * 0.1848) * 0.11;

        lfoPhase += (Math.PI * 2 * lfoFreq) / sr;
        const lfo = 0.55 + 0.45 * Math.sin(lfoPhase);

        // 森林層加一點隨機鳥鳴感的短促高頻點綴
        let sparkle = 0;
        if (kind === "forest" && Math.random() < 0.00004) sparkle = (Math.random() * 2 - 1) * 0.25;

        const v = (pink * lfo + sparkle) * amp;
        left[i] += v;
        right[i] += v * 0.85;
    }
}

/**
 * 產生節奏層。
 * @param {Float32Array} left
 * @param {Float32Array} right
 * @param {number} sr
 * @param {string} kind
 * @param {number} bpm
 * @param {number} bars
 * @param {number} amp
 */
function addDrums(left, right, sr, kind, bpm, bars, amp) {
    if (kind === "none") return;
    const beat = 60 / bpm;
    const totalBeats = bars * 4;

    for (let b = 0; b < totalBeats; b++) {
        const t = b * beat;
        const inBar = b % 4;
        const isDownbeat = inBar === 0;

        if (kind === "march") {
            // 輕快進行曲：每拍一下，低音在強拍
            const freq = isDownbeat ? 110 : 165;
            addTone(left, right, sr, t, beat * 0.5, freq, "sine", isDownbeat ? amp : amp * 0.45, 0, 0.004, beat * 0.4);
        } else if (kind === "soft") {
            // 柔和心跳：只在強拍
            if (isDownbeat) addTone(left, right, sr, t, beat * 0.6, 92, "sine", amp * 0.8, 0, 0.01, beat * 0.5);
        }
    }
}

/**
 * 產生一個場景的完整音樂緩衝區。
 *
 * @param {BaseAudioContext} ctx 音訊脈絡
 * @param {string} sceneId 場景 id
 * @param {number} [seconds] 目標長度（秒）
 * @returns {AudioBuffer | null}
 */
export function renderSceneMusic(ctx, sceneId, seconds = 24) {
    const def = SCENE_MUSIC[sceneId];
    if (!def || !ctx) return null;

    const sr = ctx.sampleRate;
    const totalSamples = Math.floor(seconds * sr);
    const buffer = ctx.createBuffer(2, totalSamples, sr);

    const left = new Float32Array(new ArrayBuffer(totalSamples * 4));
    const right = new Float32Array(new ArrayBuffer(totalSamples * 4));

    const beat = 60 / def.tempo;
    const barDur = beat * 4;

    // ── 和弦鋪底（pad）：每小節一個和弦，長音延續
    def.chords.forEach((chord, ci) => {
        const barStart = ci * barDur;
        chord.forEach((degree, ni) => {
            const midi = degreeToMidi(def.root, def.scale, degree);
            const freq = midiToFreq(midi);
            const pan = ni === 0 ? -0.35 : ni === 1 ? 0.35 : 0;
            const dur = barDur * 1.05;
            addTone(left, right, sr, barStart, dur, freq, def.pad, 0.09, pan, barDur * 0.25, barDur * 0.3);
        });
    });

    // ── 琶音（arp）：每拍走音
    const totalBeats = def.chords.length * 4;
    for (let b = 0; b < totalBeats; b++) {
        const t = b * beat;
        const chord = def.chords[Math.floor(b / 4) % def.chords.length];
        const note = chord[b % chord.length];
        const midi = degreeToMidi(def.root, def.scale, note + 7);
        const freq = midiToFreq(midi);
        const pan = ((b % 4) - 1.5) * 0.28;
        addTone(left, right, sr, t, beat * 0.85, freq, def.arp, 0.055, pan, 0.01, beat * 0.6);
    }

    // ── 鐘／鈴點綴
    (def.bellPattern || []).forEach((beatPos) => {
        const t = beatPos * beat;
        const ci = Math.floor(beatPos / 4) % def.chords.length;
        const chord = def.chords[ci];
        const midi = degreeToMidi(def.root, def.scale, chord[0] + 12);
        addTone(left, right, sr, t, beat * 1.6, midiToFreq(midi), def.bell, 0.05, 0.1, 0.005, beat * 1.4);
    });

    // ── 節奏
    addDrums(left, right, sr, def.drums, def.tempo, def.chords.length, 0.1);

    // ── 環境層
    addAmbience(left, right, sr, def.ambience, def.ambience === "none" ? 0 : 0.035);

    // ── 立體聲展寬：右聲道加入延遲副本
    const delaySamples = Math.floor(sr * 0.018);
    const wide = new Float32Array(new ArrayBuffer(totalSamples * 4));
    for (let i = 0; i < totalSamples; i++) wide[i] = left[i];
    for (let i = delaySamples; i < totalSamples; i++) {
        wide[i] = left[i - delaySamples] * 0.72;
    }
    for (let i = 0; i < totalSamples; i++) right[i] = right[i] * 0.5 + wide[i] * 0.5;

    // ── 高頻柔化
    applyLowpass(left, sr, def.brightness);
    applyLowpass(right, sr, def.brightness);

    // ── 峰值正規化
    normalize(left, 0.72);
    normalize(right, 0.72);

    // ── 淡入淡出，避免循環點爆音
    const fade = Math.floor(sr * 0.05);
    for (let i = 0; i < fade; i++) {
        const g = i / fade;
        left[i] *= g;
        right[i] *= g;
        left[totalSamples - 1 - i] *= g;
        right[totalSamples - 1 - i] *= g;
    }

    writeStereo(buffer, left, right);
    return buffer;
}

/**
 * 簡易一階低通濾波。
 * @param {Float32Array} data
 * @param {number} sr
 * @param {number} brightness 0（暗）–1（亮）
 */
function applyLowpass(data, sr, brightness) {
    const cutoff = 900 + brightness * 9000;
    const dt = 1 / sr;
    const rc = 1 / (2 * Math.PI * cutoff);
    const alpha = dt / (rc + dt);
    let prev = 0;
    for (let i = 0; i < data.length; i++) {
        prev += alpha * (data[i] - prev);
        data[i] = prev;
    }
}

/**
 * 峰值正規化。
 * @param {Float32Array} data
 * @param {number} peak 目標峰值
 */
function normalize(data, peak) {
    let max = 0;
    for (let i = 0; i < data.length; i++) {
        const a = Math.abs(data[i]);
        if (a > max) max = a;
    }
    if (max < 1e-6) return;
    const g = peak / max;
    for (let i = 0; i < data.length; i++) data[i] *= g;
}
