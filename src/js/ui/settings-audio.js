/**
 * 音量設定介面 — 四滑桿（主／音樂／音效／語音）＋ 靜音開關。
 *
 * 變更即時生效並持久化；持久化透過 storage.js 的 readJson／writeJson。
 *
 * Z5：整個介面必須完整包覆在**置中的 `.settings-card` 卡片容器**內，
 * 且含清楚的「設定」標題 —— 滑桿與所有操作鈕都不得散落在遮罩層上。
 *
 * 另修補「設定卡被清空」的缺陷：`showLevelMap()` 會清空所有遮罩的 innerHTML
 * （包含 `#audio-settings-root`），導致再次開啟設定時滑桿與操作鈕全部消失。
 * 因此本模組提供 `mount()` —— 容器為空時**重新建立**整張設定卡，
 * 確保滑桿與 5 顆操作鈕永遠包覆在同一張卡片內。
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

    /**
     * 建立（必要時重建）設定卡 DOM。
     *
     * Z5：所有滑桿與操作鈕都必須在 `.settings-card` 內。
     * @returns {boolean} 是否實際重建了卡片
     */
    function mount() {
        const needsRebuild = !root.querySelector(".settings-card");
        if (needsRebuild) {
            /*
             * Z5：
             *   - 標題為「設定」（家長可辨識的入口），下方再標「音量」區段。
             *   - `#settings-card-actions` 為**卡片內**的動作列，
             *     main.js 追加的 5 顆操作鈕（無障礙／加入主畫面／隱私權同意／
             *     回到地圖／關閉）都會落在同一張卡片內，不會溢出到遮罩層上。
             */
            root.innerHTML = `
        <div class="settings-card settings-card--settings" role="dialog" aria-modal="true" aria-labelledby="settings-card-title">
            <h2 class="settings-card__title" id="settings-card-title">${zh("設定", "Settings")}</h2>
            <div class="settings settings-card__body">
                <p class="settings-card__subtitle" id="settings-card-subtitle">${zh("音量", "Sound")}</p>
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

            root.querySelectorAll("[data-vol]").forEach((slider) => {
                slider.addEventListener("input", apply);
            });
            root.querySelector("#settings-mute")?.addEventListener("change", apply);
        }
        apply();
        return needsRebuild;
    }

    // 初始建立
    mount();

    return {
        /**
         * 重新讀取持久化的音量。
         */
        reload() {
            const v = readJson(STORAGE_KEY, {});
            setVolumes(v);
        },

        /**
         * 確保設定卡存在（容器被清空時重建）。
         * @returns {boolean} 是否重建
         */
        mount,

        /**
         * 卡片內部的動作列（5 顆操作鈕掛載處）。
         * @returns {HTMLElement|null}
         */
        actions() {
            return root.querySelector("#settings-card-actions");
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
