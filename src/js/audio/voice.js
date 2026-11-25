/**
 * 語音層 — Web Speech API 朗讀，附字幕 fallback。
 *
 * 最小對朗讀（speakMinimalPair）是教育核心：
 * 兩個音必須以等長間隔呈現，讓幼兒能直接比較。
 */

import { duckMusic, context } from "./mixer.js";
import { emit } from "../core/events.js";

/** @type {{ pitch: number, rate: number, voice?: SpeechSynthesisVoice }} */
let voiceProfile = { pitch: 1.0, rate: 0.85 };

/**
 * 語音輸出是否被使用者關閉（視覺輔助模式）。
 * @type {boolean}
 */
let speechEnabled = true;

/**
 * 降級原因。
 * @typedef {"unsupported"|"muted"|"no-voice"|"error"} VoiceDegradeReason
 */

/**
 * 設定語音輸出開關（關閉後改由視覺替代提示接手）。
 * @param {boolean} enabled
 */
export function setSpeechEnabled(enabled) {
    speechEnabled = enabled !== false;
    if (!speechEnabled) {
        stopSpeaking();
    }
}

/**
 * 語音輸出是否開啟。
 * @returns {boolean}
 */
export function speechEnabledNow() {
    return speechEnabled;
}

/**
 * 取得可觀測的語音降級狀態（Step 205／206）。
 *
 * @returns {{ supported: boolean, muted: boolean, hasVoice: boolean, reason: VoiceDegradeReason|null }}
 */
export function getVoiceState() {
    const supported = typeof window !== "undefined" && Boolean(window.speechSynthesis);
    if (!supported) {
        return { supported: false, muted: false, hasVoice: false, reason: "unsupported" };
    }
    if (!speechEnabled) {
        return { supported: true, muted: true, hasVoice: false, reason: "muted" };
    }
    // 語音清單尚未載入（getVoices() 為空）→ 視為尚未就緒但不得誤判為降級
    let voices = [];
    try {
        voices = window.speechSynthesis.getVoices() || [];
    } catch {
        voices = [];
    }
    if (!voices.length) {
        return { supported: true, muted: false, hasVoice: true, reason: null };
    }
    const hasVoice = Boolean(pickVoice("zh-TW"));
    if (!hasVoice) {
        return { supported: true, muted: false, hasVoice: false, reason: "no-voice" };
    }
    return { supported: true, muted: false, hasVoice: true, reason: null };
}

/**
 * 設定語音設定檔。
 * @param {string} locale
 * @param {{ pitch: number, rate: number }} voice
 */
export function setVoiceProfile(locale, voice) {
    voiceProfile = { pitch: voice?.pitch ?? 1, rate: voice?.rate ?? 0.85 };
    const picked = pickVoice(locale);
    if (picked) {
        voiceProfile.voice = picked;
    }
}

/**
 * 挑選可用語音。
 * @param {string} locale
 * @returns {SpeechSynthesisVoice | null}
 */
export function pickVoice(locale) {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    const lang = locale === "en-US" ? "en" : "zh";
    const exact = voices.find((v) => v.lang?.toLowerCase().startsWith(lang));
    return exact || voices[0] || null;
}

/**
 * 朗讀文字。
 *
 * @param {string} text
 * @param {{ locale?: string, pitch?: number, rate?: number, onEnd?: () => void }} [opts]
 */
export function speak(text, opts = {}) {
    if (!text) return;

    const state = getVoiceState();
    if (!state.supported || state.muted || !state.hasVoice) {
        // 降級：語音不可用／靜音／無語音包 → 交由視覺替代提示接手
        emit({
            type: "voice:unavailable",
            payload: { text, reason: state.reason || "no-voice", locale: opts.locale || "zh-TW" }
        });
        showSubtitle(text);
        opts.onEnd?.();
        return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = opts.locale || "zh-TW";
    utter.pitch = opts.pitch ?? voiceProfile.pitch;
    utter.rate = opts.rate ?? voiceProfile.rate;
    utter.volume = 1;

    const picked = pickVoice(utter.lang);
    if (picked) utter.voice = picked;

    utter.onerror = () => {
        emit({
            type: "voice:unavailable",
            payload: { text, reason: "error", locale: opts.locale || "zh-TW" }
        });
        showSubtitle(text);
        opts.onEnd?.();
    };

    // 朗讀正常結束
    utter.onend = () => {
        opts.onEnd?.();
    };

    // 語音期間壓低背景音樂（側鏈 ducking）
    duckMusic(600, -12);
    showSubtitle(text);
    window.speechSynthesis.speak(utter);
}

/**
 * 朗讀最小對：兩個音以等長間隔呈現。
 *
 * @param {string} locale
 * @param {string[]} pairs 兩個音
 * @param {number} [gapMs] 間隔毫秒（預設 900ms，讓幼兒能聽清差異）
 */
export function speakMinimalPair(locale, pairs, gapMs = 900) {
    if (!pairs || pairs.length < 2) return;
    const [a, b] = pairs;

    // 最小對的視覺替代：兩個音以大字卡片並列，供不識字／無聲環境的幼兒比較
    emit({ type: "voice:pair", payload: { pair: [a, b], locale } });

    speak(a, { locale, rate: voiceProfile.rate * 0.92 });
    setTimeout(() => {
        speak(b, { locale, rate: voiceProfile.rate * 0.92 });
    }, gapMs);
}

/**
 * 顯示字幕。
 * @param {string} text
 */
export function showSubtitle(text) {
    const live = document.getElementById("sr-live");
    if (live) live.textContent = text;
    const bubble = document.getElementById("bubble-content");
    if (bubble) bubble.setAttribute("data-subtitle", text);
}

/**
 * 停止所有語音。
 */
export function stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
}

/**
 * 語音是否可用。
 * @returns {boolean}
 */
export function voiceAvailable() {
    return Boolean(window.speechSynthesis);
}

/**
 * 語音是否需要視覺替代（不可用／靜音／無語音包）。
 * @returns {boolean}
 */
export function needsVisualFallback() {
    const state = getVoiceState();
    return state.reason !== null;
}

/**
 * 取得目前語音設定。
 * @returns {{ pitch: number, rate: number }}
 */
export function getVoiceProfile() {
    return { pitch: voiceProfile.pitch, rate: voiceProfile.rate };
}

/**
 * 取得音訊 context（供其他模組判斷語音是否已解鎖）。
 */
export function audioReady() {
    return Boolean(context());
}
