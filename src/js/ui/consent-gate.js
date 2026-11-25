/**
 * 首次啟動同意閘 — 未取得法定代理人家長同意前，不得進入遊戲。
 *
 * 規範：
 *   - 必須由法定代理人家長主動點選，不可預設勾選
 *   - 分析與廣告必須分開授權，可獨立撤回
 *   - 隱私權政策必須可完整捲動閱讀（不得截斷）
 *   - 未同意時不得寫入任何分析事件
 *   - Focus Trap：Tab / Shift+Tab 焦點困於對話框；Esc 不得繞過同意
 *
 * 匯出：
 *   requireConsent(root, locale)       回傳 Promise<boolean>；已同意時立即 resolve(true)
 *   openConsentSettings(root, locale)   家長可隨時開啟設定頁修改同意
 */

import { getConsent, setConsent, revokeConsent } from "../core/consent.js";

/**
 * 同意項目定義（分析與廣告分離）。
 * @type {{ key: "analytics"|"personalization"|"marketing", labelZh: string, labelEn: string, descZh: string, descEn: string }[]}
 */
const ITEMS = [
    {
        key: "analytics",
        labelZh: "分析用途",
        labelEn: "Analytics",
        descZh: "了解功能使用狀況，僅收集不含身分的統計資料。",
        descEn: "Learn how features are used. Only anonymous statistics are collected."
    },
    {
        key: "personalization",
        labelZh: "個人化內容",
        labelEn: "Personalization",
        descZh: "依孩子的表現調整關卡難度，資料僅存於本機。",
        descEn: "Adjust difficulty to your child's progress. Data stays on this device."
    },
    {
        key: "marketing",
        labelZh: "行銷用途",
        labelEn: "Marketing",
        descZh: "接收產品消息與活動資訊。",
        descEn: "Receive product news and event updates."
    }
];

/**
 * 目前同意閘是否開啟（避免重複開啟）。
 * @type {boolean}
 */
let gateOpen = false;

/**
 * 被困住的焦點元素（關閉時歸位）。
 * @type {HTMLElement|null}
 */
let lastFocused = null;

/**
 * 取得可聚焦元素清單。
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function focusables(container) {
    const list = /** @type {HTMLElement[]} */ (Array.from(container.querySelectorAll(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )));
    return list.filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);
}
/**
 * 在容器內循環移動焦點。
 * @param {HTMLElement} container
 * @param {KeyboardEvent} event
 */
function trapFocus(container, event) {
    const items = focusables(container);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = /** @type {HTMLElement|null} */ (document.activeElement);

    if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
            event.preventDefault();
            last.focus();
        }
        return;
    }
    if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
    }
}

/**
 * 建立同意閘的 DOM（骨架狀態）。
 * @param {HTMLElement} root
 * @param {string} locale
 * @returns {HTMLElement}
 */
function buildGate(root, locale) {
    const en = locale === "en-US";
    root.innerHTML = `
        <div class="consent-gate" role="dialog" aria-modal="true"
             aria-labelledby="consent-gate-title" aria-describedby="consent-gate-desc">
            <h2 class="consent-gate__title" id="consent-gate-title">
                ${en ? "Before you start" : "開始之前"}
            </h2>
            <p class="consent-gate__desc" id="consent-gate-desc">
                ${en
                    ? "Please choose which data uses to turn on. Nothing is sent until you agree."
                    : "請選擇要開啟的資料用途。未同意前不會傳送任何資料。"}
            </p>
            <div class="consent-gate__loading" data-consent-loading>
                ${en ? "Loading…" : "載入中…"}
            </div>
            <div class="consent-gate__items" data-consent-items></div>
            <p class="consent-gate__error" data-consent-error role="alert"></p>
            <div class="consent-gate__actions">
                <button class="level-btn" id="consent-agree" type="button" disabled>
                    ${en ? "Continue" : "繼續"}
                </button>
                <button class="level-btn level-btn--secondary" id="consent-policy" type="button">
                    ${en ? "Privacy policy" : "隱私權政策"}
                </button>
            </div>
        </div>
    `;
    return /** @type {HTMLElement} */ (root.querySelector(".consent-gate"));
}

/**
 * 渲染同意項目（每一項獨立勾選，預設全部不勾）。
 * @param {HTMLElement} root
 * @param {string} locale
 * @param {Record<string, boolean>} current
 */
function renderItems(root, locale, current) {
    const en = locale === "en-US";
    const host = root.querySelector("[data-consent-items]");
    if (!host) return;

    host.innerHTML = ITEMS.map((item) => `
        <label class="consent-gate__item">
            <input type="checkbox" data-consent-key="${item.key}" ${current[item.key] ? "checked" : ""} />
            <span class="consent-gate__item-label">${en ? item.labelEn : item.labelZh}</span>
            <span class="consent-gate__item-desc">${en ? item.descEn : item.descZh}</span>
        </label>
    `).join("");

    host.querySelectorAll("[data-consent-key]").forEach((el) => {
        el.addEventListener("change", () => {
            const key = /** @type {any} */ (/** @type {HTMLElement} */ (el).dataset.consentKey);
            setConsent({ [key]: /** @type {HTMLInputElement} */ (el).checked });
        });
    });
}

/**
 * 顯示可完整捲動的隱私權政策面板。
 *
 * 規範：沿用與頁尾條款同一套硬化實作（骨架屏／載入失敗重試／
 * Focus Trap／Esc 關閉／>= 48px 觸控）。
 *
 * @param {HTMLElement} root
 * @param {string} locale
 * @param {() => void} [onClose]
 */
export function openPrivacyPolicy(root, locale, onClose) {
    openLegalDocument(root, "privacy", locale, onClose);
}

/**
 * 顯示可捲動的條款文件面板（隱私權政策／服務條款）。
 *
 * 規範（Round 1 L3）：
 *   - 必須在**應用內**呈現可捲動內容（不得跳到獨立模式看原始 `.md`）
 *   - 必須有 Loading 骨架、載入失敗的重試按鈕、Focus Trap、Esc 關閉
 *   - 關閉鈕觸控區域必須 >= 48px
 *
 * @param {HTMLElement} root 容器（通常是頁尾條款連結的父層）
 * @param {"privacy"|"terms"} kind
 * @param {string} locale
 * @param {() => void} [onClose]
 */
export function openLegalDocument(root, kind, locale, onClose) {
    if (!root) return;
    const en = locale === "en-US";
    const isPrivacy = kind === "privacy";
    const file = isPrivacy
        ? (en ? "./content/privacy.en-US.md" : "./content/privacy.zh-TW.md")
        : (en ? "./content/terms.en-US.md" : "./content/terms.zh-TW.md");
    const title = isPrivacy
        ? (en ? "Privacy policy" : "隱私權政策")
        : (en ? "Terms of Service" : "服務條款");

    const panel = document.createElement("div");
    panel.className = "consent-policy legal-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", title);

    const heading = document.createElement("h2");
    heading.className = "legal-panel__title";
    heading.id = "legal-panel-title";
    heading.textContent = title;
    panel.setAttribute("aria-labelledby", "legal-panel-title");

    const body = document.createElement("div");
    body.className = "consent-policy__body";
    body.setAttribute("data-legal-body", "");
    body.setAttribute("aria-busy", "true");

    // Loading 骨架（不得白屏）
    const skeleton = document.createElement("div");
    skeleton.className = "legal-panel__skeleton";
    skeleton.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 4; i++) {
        const line = document.createElement("span");
        line.className = "legal-panel__skeleton-line";
        skeleton.appendChild(line);
    }
    body.appendChild(skeleton);

    const status = document.createElement("p");
    status.className = "legal-panel__status";
    status.setAttribute("role", "status");
    status.textContent = en ? "Loading…" : "載入中…";

    const actions = document.createElement("div");
    actions.className = "legal-panel__actions";

    const retryBtn = document.createElement("button");
    retryBtn.className = "level-btn level-btn--secondary";
    retryBtn.type = "button";
    retryBtn.id = "legal-retry";
    retryBtn.textContent = en ? "Try again" : "重新載入";
    retryBtn.hidden = true;

    const closeBtn = document.createElement("button");
    closeBtn.className = "level-btn";
    closeBtn.type = "button";
    closeBtn.id = "legal-close";
    closeBtn.textContent = en ? "Close" : "關上";

    actions.append(retryBtn, closeBtn);
    panel.append(heading, body, status, actions);
    root.appendChild(panel);

    /** 載入文件（失敗時顯示重試鈕）。 */
    const load = async () => {
        retryBtn.hidden = true;
        status.textContent = en ? "Loading…" : "載入中…";
        body.setAttribute("aria-busy", "true");
        body.textContent = "";
        const skeleton2 = document.createElement("div");
        skeleton2.className = "legal-panel__skeleton";
        skeleton2.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 4; i++) {
            const line = document.createElement("span");
            line.className = "legal-panel__skeleton-line";
            skeleton2.appendChild(line);
        }
        body.appendChild(skeleton2);

        try {
            const res = await fetch(file, { cache: "no-cache" });
            const text = res.ok ? await res.text() : "";
            if (!text) throw new Error("empty document");
            body.textContent = text;
            body.setAttribute("aria-busy", "false");
            status.textContent = "";
        } catch (err) {
            console.warn("[consent-gate] 條款載入失敗", err);
            body.textContent = "";
            body.setAttribute("aria-busy", "false");
            status.textContent = en
                ? "The document could not be loaded."
                : "條款文件載入失敗，請重試或確認網路連線。";
            retryBtn.hidden = false;
        }
    };

    let lastFocused = /** @type {HTMLElement|null} */ (document.activeElement);

    const close = () => {
        document.removeEventListener("keydown", onKeyDown, true);
        panel.remove();
        lastFocused?.focus?.();
        onClose?.();
    };

    /**
     * 鍵盤流：Tab 焦點陷阱 + Esc 關閉。
     * @param {KeyboardEvent} event
     */
    const onKeyDown = (event) => {
        if (event.key === "Tab") {
            trapFocus(panel, event);
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            close();
        }
    };
    document.addEventListener("keydown", onKeyDown, true);

    retryBtn.addEventListener("click", () => {
        if (retryBtn.disabled) return;
        retryBtn.disabled = true;
        void load().finally(() => {
            retryBtn.disabled = false;
        });
    });
    closeBtn.addEventListener("click", close);

    void load();
    closeBtn.focus();
}

/**
 * 開啟同意閘。
 * @param {HTMLElement} root
 * @param {string} locale
 * @param {{ mode?: "first"|"settings" }} [opts]
 * @returns {Promise<boolean>}
 */
function openGate(root, locale, opts = {}) {
    const en = locale === "en-US";
    const isSettings = opts.mode === "settings";

    if (gateOpen) return Promise.resolve(false);
    gateOpen = true;

    lastFocused = /** @type {HTMLElement|null} */ (document.activeElement);
    const panel = buildGate(root, locale);
    root.classList.remove("hidden");

    const loading = panel.querySelector("[data-consent-loading]");
    const errorEl = panel.querySelector("[data-consent-error]");
    const agreeBtn = /** @type {HTMLButtonElement|null} */ (panel.querySelector("#consent-agree"));
    const policyBtn = panel.querySelector("#consent-policy");

    return new Promise((resolve) => {
        /**
         * 完成並關閉。
         * @param {boolean} ok
         */
        const finish = (ok) => {
            root.classList.add("hidden");
            root.innerHTML = "";
            gateOpen = false;
            document.removeEventListener("keydown", onKeyDown, true);
            lastFocused?.focus?.();
            resolve(ok);
        };

        /**
         * 鍵盤處理：Tab 焦點陷阱；Esc 不得繞過（首次）或僅關閉設定頁。
         * @param {KeyboardEvent} event
         */
        const onKeyDown = (event) => {
            if (event.key === "Tab") {
                // 條款面板開啟時，焦點陷阱交由條款面板處理（避免兩層搶焦點）
                if (document.querySelector(".legal-panel")) return;
                trapFocus(panel, event);
                return;
            }
            if (event.key === "Escape") {
                // 首次同意：Esc 不得繞過（不得直接關閉）
                if (isSettings) finish(false);
            }
        };
        document.addEventListener("keydown", onKeyDown, true);

        // 骨架屏 → 實際項目
        window.setTimeout(() => {
            loading?.remove();
            renderItems(panel, locale, /** @type {any} */ (getConsent()));
            if (agreeBtn) agreeBtn.disabled = false;
            agreeBtn?.focus();
        }, 0);

        agreeBtn?.addEventListener("click", () => {
            // 防連點：送出中即鎖定
            if (agreeBtn.disabled) return;
            agreeBtn.disabled = true;
            agreeBtn.textContent = en ? "Saving…" : "儲存中…";
            try {
                setConsent(getConsent());
                finish(true);
            } catch (err) {
                agreeBtn.disabled = false;
                agreeBtn.textContent = en ? "Continue" : "繼續";
                if (errorEl) {
                    errorEl.textContent = en
                        ? "Could not save. Please try again."
                        : "無法儲存，請再試一次。";
                }
                console.warn("[consent-gate] 儲存同意失敗", err);
            }
        });

        policyBtn?.addEventListener("click", () => {
            openPrivacyPolicy(root, locale, () => {
                /** @type {HTMLElement} */ (policyBtn).focus();
            });
        });
    });
}

/**
 * 首次啟動同意閘 — 未取得法定代理人家長同意前，不得進入遊戲。
 *
 * @param {HTMLElement} root
 * @param {string} locale
 * @returns {Promise<boolean>}
 */
export function requireConsent(root, locale) {
    if (!root) return Promise.resolve(false);

    // 已同意過（存在同意記錄）→ 立即放行
    const saved = getConsent();
    if (saved.updatedAt) return Promise.resolve(true);

    return openGate(root, locale, { mode: "first" });
}

/**
 * 家長可隨時開啟設定頁修改同意。
 * @param {HTMLElement} root
 * @param {string} locale
 * @returns {Promise<boolean>}
 */
export function openConsentSettings(root, locale) {
    if (!root) return Promise.resolve(false);
    return openGate(root, locale, { mode: "settings" });
}

/**
 * 撤回某項同意（供設定頁使用）。
 * @param {"analytics"|"personalization"|"marketing"} key
 */
export function revoke(key) {
    revokeConsent(key);
}
