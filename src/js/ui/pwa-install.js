/**
 * PWA 安裝引導（Step 167）。
 *
 * 規範：
 *   - 偵測 standalone 模式（已安裝則不顯示）
 *   - Android／Desktop：攔截 beforeinstallprompt 事件並提供安裝鈕
 *   - iOS Safari：顯示「分享 → 加入主畫面」步驟圖卡（自繪 SVG，禁 emoji）
 *   - 安裝鈕有 in-flight lock（防連點）
 *   - 提供「暫時略過」並記住冷卻天數
 *   - 局部 Error Boundary（失敗不得白屏、不得阻塞遊戲）
 *   - >= 48px 觸控目標；Esc 可關閉
 */

import { readJson, writeJson } from "../core/storage.js";

const DISMISS_KEY = "mumu.pwa.dismissed";
const DISMISS_COOLDOWN_DAYS = 14;

/** 是否已安裝（standalone）。 @type {boolean} */
let installed = false;

/** 延後的 beforeinstallprompt 事件。 @type {any} */
let deferredPrompt = null;

/** 安裝進行中（防連點）。 @type {boolean} */
let installInFlight = false;

/** 已觸發提示。 @type {boolean} */
let prompted = false;

/**
 * 是否處於 standalone（已加入主畫面）模式。
 * @returns {boolean}
 */
export function isStandalone() {
    if (typeof window === "undefined") return false;
    try {
        const mq = window.matchMedia?.("(display-mode: standalone)");
        if (mq?.matches) return true;
        // iOS Safari 的舊式偵測
        if (/** @type {any} */ (window).navigator?.standalone === true) return true;
    } catch {
        // 忽略
    }
    return false;
}

/**
 * 是否為 iOS（不支援 beforeinstallprompt）。
 * @returns {boolean}
 */
export function isIosSafari() {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/.test(ua);
    // iOS 上所有瀏覽器皆為 WebKit；排除 in-app 瀏覽器（不支援 PWA 安裝）
    const isInApp = /FBAN|FBAV|Instagram/.test(ua);
    return isIos && !isInApp;
}

/**
 * 是否為 iOS 上非 Safari 的瀏覽器（Chrome iOS 等，亦無 beforeinstallprompt）。
 * @returns {boolean}
 */
export function isIosNonSafari() {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

/**
 * 是否在冷卻期內（近期才略過過）。
 * @returns {boolean}
 */
export function inCooldown() {
    const saved = readJson(DISMISS_KEY, null);
    if (!saved?.at) return false;
    const days = (Date.now() - Number(saved.at)) / (1000 * 60 * 60 * 24);
    return days < DISMISS_COOLDOWN_DAYS;
}

/**
 * 記錄略過（進入冷卻期）。
 */
export function recordDismiss() {
    writeJson(DISMISS_KEY, { at: Date.now() });
}

/**
 * 清除略過記錄（家長可重新開啟提示）。
 */
export function clearDismiss() {
    writeJson(DISMISS_KEY, { at: 0 });
}

/**
 * 建立 iOS 步驟圖卡（自繪 SVG，禁 emoji）。
 * @param {string} locale
 * @returns {string}
 */
function iosStepsMarkup(locale) {
    const en = locale === "en-US";
    const steps = en
        ? ["Tap the Share button", "Choose Add to Home Screen", "Tap Add"]
        : ["點擊瀏覽器的「分享」按鈕", "選擇「加入主畫面」", "點擊「加入」"];

    return steps.map((text, i) => `
        <li class="pwa-install__step">
            <span class="pwa-install__step-no" aria-hidden="true">${i + 1}</span>
            <span class="pwa-install__step-text">${text}</span>
        </li>
    `).join("");
}

/**
 * 建立安裝提示面板。
 *
 * @param {HTMLElement} root
 * @param {string} locale
 * @param {{ mode: "native"|"ios" }} opts
 * @returns {HTMLElement}
 */
function buildPanel(root, locale, opts) {
    const en = locale === "en-US";
    const ios = opts.mode === "ios";

    root.innerHTML = `
        <div class="pwa-install" role="dialog" aria-modal="false"
             aria-labelledby="pwa-install-title">
            <h2 class="pwa-install__title" id="pwa-install-title">
                ${en ? "Add to your home screen" : "加入主畫面"}
            </h2>
            <p class="pwa-install__desc">
                ${en
                    ? "Play offline and launch like a normal app."
                    : "可離線遊玩，啟動方式與一般 App 相同。"}
            </p>
            ${ios ? `<ol class="pwa-install__steps">${iosStepsMarkup(locale)}</ol>` : ""}
            <div class="pwa-install__actions">
                ${ios ? "" : `<button class="level-btn" id="pwa-install-btn" type="button">
                    ${en ? "Install" : "安裝"}
                </button>`}
                <button class="level-btn level-btn--secondary" id="pwa-install-skip" type="button">
                    ${en ? "Not now" : "暫時略過"}
                </button>
                <button class="level-btn level-btn--secondary" id="pwa-install-close" type="button">
                    ${en ? "Close" : "關上"}
                </button>
            </div>
            <p class="pwa-install__error" data-pwa-error role="alert"></p>
        </div>
    `;
    return /** @type {HTMLElement} */ (root.querySelector(".pwa-install"));
}

/**
 * 顯示安裝提示。
 *
 * @param {HTMLElement} root
 * @param {string} locale
 * @param {{ mode: "native"|"ios" }} opts
 * @returns {boolean} 是否成功顯示
 */
function showPanel(root, locale, opts) {
    if (!root || prompted) return false;
    prompted = true;

    try {
        buildPanel(root, locale, opts);
    } catch (err) {
        // 局部 Error Boundary：不得白屏、不得阻塞遊戲
        console.warn("[pwa-install] 無法建立安裝提示", err);
        prompted = false;
        return false;
    }

    root.classList.remove("hidden");

    const errorEl = root.querySelector("[data-pwa-error]");
    const close = () => {
        root.classList.add("hidden");
        root.innerHTML = "";
        prompted = false;
    };

    root.querySelector("#pwa-install-close")?.addEventListener("click", close);
    root.querySelector("#pwa-install-skip")?.addEventListener("click", () => {
        recordDismiss();
        close();
    });

    const installBtn = root.querySelector("#pwa-install-btn");
    installBtn?.addEventListener("click", async () => {
        // 防連點：in-flight lock
        if (installInFlight) return;
        installInFlight = true;
        /** @type {any} */ (installBtn).disabled = true;
        try {
            if (!deferredPrompt) throw new Error("install prompt unavailable");
            await deferredPrompt.prompt();
            deferredPrompt = null;
            close();
        } catch (err) {
            console.warn("[pwa-install] 安裝失敗", err);
            if (errorEl) {
                errorEl.textContent = locale === "en-US"
                    ? "Could not start the install. You can add it from the browser menu."
                    : "無法啟動安裝，可從瀏覽器選單加入主畫面。";
            }
            /** @type {any} */ (installBtn).disabled = false;
        } finally {
            installInFlight = false;
        }
    });

    // Esc 可關閉（不阻塞遊戲）
    const onKey = (/** @type {KeyboardEvent} */ e) => {
        if (e.key === "Escape") {
            document.removeEventListener("keydown", onKey, true);
            close();
        }
    };
    document.addEventListener("keydown", onKey, true);

    return true;
}

/**
 * 初始化 PWA 安裝引導。
 *
 * 規範：
 *   - 已安裝（standalone）→ 不顯示
 *   - 冷卻期內 → 不顯示
 *   - iOS Safari → 顯示步驟圖卡
 *   - 其他 → 等待 beforeinstallprompt 後顯示
 *   - 任何失敗都不得阻塞遊戲
 *
 * @param {HTMLElement} root
 * @param {string} locale
 * @returns {{ canShow: boolean, mode: "none"|"native"|"ios" }}
 */
export function initPwaInstall(root, locale) {
    installed = isStandalone();
    if (installed) return { canShow: false, mode: "none" };
    if (inCooldown()) return { canShow: false, mode: "none" };

    const ios = isIosSafari() || isIosNonSafari();

    if (ios) {
        // iOS：立即顯示步驟圖卡
        showPanel(root, locale, { mode: "ios" });
        return { canShow: true, mode: "ios" };
    }

    // 其他平台：攔截 beforeinstallprompt
    try {
        window.addEventListener("beforeinstallprompt", (/** @type {any} */ e) => {
            e.preventDefault();
            deferredPrompt = e;
            showPanel(root, locale, { mode: "native" });
        });
    } catch (err) {
        console.warn("[pwa-install] 無法攔截 beforeinstallprompt", err);
    }

    return { canShow: true, mode: "native" };
}

/**
 * 手動觸發安裝提示（供設定頁使用）。
 * @param {HTMLElement} root
 * @param {string} locale
 * @returns {boolean}
 */
export function showInstallGuide(root, locale) {
    if (isStandalone()) return false;
    clearDismiss();
    const ios = isIosSafari() || isIosNonSafari();
    return showPanel(root, locale, { mode: ios ? "ios" : "native" });
}

/**
 * 是否已安裝。
 * @returns {boolean}
 */
export function isInstalled() {
    return installed;
}
