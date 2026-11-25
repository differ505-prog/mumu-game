/**
 * 音量設定介面 — 四滑桿（主／音樂／音效／語音）＋ 靜音開關。
 *
 * 變更即時生效並持久化；持久化透過 storage.js 的 readJson／writeJson。
 */

import { getVolumes, setVolumes } from "../audio/mixer.js";
import { readJson, writeJson } from "../core/storage.js";

const STORAGE_KEY = "mumu.audio.v1";

/**
 * 建立音量設定介面。
 * @param {HTMLElement} root
 */
export function createAudioSettings(root) {
    const saved = readJson(STORAGE_KEY, {});
    const initial = { ...getVolumes(), ...saved };

    root.innerHTML = `
        <div class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-card-title">
            <h2 class="settings-card__title" id="settings-card-title">${zh("音量設定", "Sound Settings")}</h2>
            <div class="settings settings-card__body">
                <label class="settings__row">
                    <span class="settings__label">${zh("主音量", "Master")}</span>
                    <input type="range" class="settings__slider" data-vol="master" min="0" max="100" value="${Math.round(initial.master * 100)}" aria-label="${zh("主音量", "Master")}" />
                    <span class="settings__value" data-out="master">${Math.round(initial.master * 100)}</span>
                </label>
                <label class="settings__row">
                    <span class="settings__label">${zh("音樂", "Music")}</span>
                    <input type="range" class="settings__slider" data-vol="music" min="0" max="100" value="${Math.round(initial.music * 100)}" aria-label="${zh("音樂", "Music")}" />
                    <span class="settings__value" data-out="music">${Math.round(initial.music * 100)}</span>
                </label>
                <label class="settings__row">
                    <span class="settings__label">${zh("音效", "Sound")}</span>
                    <input type="range" class="settings__slider" data-vol="sfx" min="0" max="100" value="${Math.round(initial.sfx * 100)}" aria-label="${zh("音效", "Sound")}" />
                    <span class="settings__value" data-out="sfx">${Math.round(initial.sfx * 100)}</span>
                </label>
                <label class="settings__row">
                    <span class="settings__label">${zh("語音", "Voice")}</span>
                    <input type="range" class="settings__slider" data-vol="voice" min="0" max="100" value="${Math.round(initial.voice * 100)}" aria-label="${zh("語音", "Voice")}" />
                    <span class="settings__value" data-out="voice">${Math.round(initial.voice * 100)}</span>
                </label>
                <label class="settings__row settings__row--toggle">
                    <span class="settings__label">${zh("靜音", "Mute all")}</span>
                    <input type="checkbox" id="settings-mute" ${initial.muted ? "checked" : ""} />
                </label>
            </div>
            <div class="settings-card__actions" id="settings-card-actions"></div>
        </div>
    `;

    /**
     * 套用目前音量到混音器並持久化。
     */
    function apply() {
        const values = {};
        Array.from(root.querySelectorAll("[data-vol]")).forEach((/** @type {HTMLInputElement} */ slider) => {
            const key = /** @type {any} */ (slider.dataset.vol);
            values[key] = Number(slider.value) / 100;
            const out = root.querySelector(`[data-out="${key}"]`);
            if (out) out.textContent = slider.value;
        });
        const mute = /** @type {HTMLInputElement} */ (root.querySelector("#settings-mute"));
        values.muted = Boolean(mute?.checked);
        if (values.muted) {
            values.master = 0;
        }
        setVolumes(values);
        writeJson(STORAGE_KEY, values);
    }

    root.querySelectorAll("[data-vol]").forEach((slider) => {
        slider.addEventListener("input", apply);
    });
    root.querySelector("#settings-mute")?.addEventListener("change", apply);

    apply();

    return {
        /**
         * 重新讀取持久化的音量。
         */
        reload() {
            const v = readJson(STORAGE_KEY, {});
            setVolumes(v);
        }
    };
}

/**
 * 依語系取字串。
 * @param {string} zhText
 * @param {string} enText
 * @returns {string}
 */
function zh(zhText, enText) {
    const locale = localStorage.getItem("mumu.locale") || "zh-TW";
    return locale === "en-US" ? enText : zhText;
}
