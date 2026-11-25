/**
 * 付費牆 — 僅推年訂閱，不推月訂閱。
 *
 * 規範：
 *   - 需家長閘門通過才顯示購買按鈕
 *   - 所有插值必須經 escapeHtml（不得直接注入未信任內容）
 *   - **不得**假成交：點擊訂閱後在對話框內呈現清楚回饋與「我知道了」按鈕
 *   - 必須支援 Esc 關閉、Focus Trap、>= 48px 觸控目標
 */

import { escapeHtml } from "../core/sanitize-html.js";
import { requireParentalGate } from "../core/parental-gate.js";
import { PLANS } from "../core/entitlements.js";
import { track } from "../core/telemetry.js";

/**
 * 回饋文案（雙語）。
 * @type {{ zh: { recorded: string, detail: string, ack: string, note: string }, en: { recorded: string, detail: string, ack: string, note: string } }}
 */
const COPY = {
    zh: {
        recorded: "已收到您的訂閱意向",
        detail: "目前是 PWA 免費公測階段，尚未接入商店金流，因此不會產生任何費用，也不會自動扣款。正式訂閱開放時，會由本機通知您，再由家長確認付款。",
        ack: "我知道了",
        note: "本 App 為 PWA 免費公測版：資料僅儲存於本機裝置，可隨時清除；尚未接入任何商店金流，不會自動扣款。"
    },
    en: {
        recorded: "We received your subscription interest",
        detail: "The app is currently in a free PWA public beta. No store billing is connected yet, so nothing is charged and no payment is taken automatically. When subscriptions open, this device will notify you and a parent will confirm the payment.",
        ack: "Got it",
        note: "This app is a free PWA public beta: your data stays on this device and can be cleared at any time. No store billing is connected, so nothing is charged automatically."
    }
};

/**
 * 目前開啟中的付費牆鍵盤處理器（用於移除監聽）。
 * @type {WeakMap<HTMLElement, (event: KeyboardEvent) => void>}
 */
const keyHandlers = new WeakMap();

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
 * 判斷語系。
 * @returns {boolean} 是否英文
 */
function isEnglish() {
    return (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";
}

/**
 * 關閉付費牆（含鍵盤監聽釋放）。
 * @param {HTMLElement} root
 */
function closePaywall(root) {
    const handler = keyHandlers.get(root);
    if (handler) {
        document.removeEventListener("keydown", handler, true);
        keyHandlers.delete(root);
    }
    root.classList.add("hidden");
}

/**
 * 綁定對話框的鍵盤流（Tab 焦點陷阱 + Esc 關閉）。
 * @param {HTMLElement} root
 * @param {HTMLElement} panel
 */
function wireDialogKeys(root, panel) {
    const handler = (/** @type {KeyboardEvent} */ event) => {
        if (event.key === "Tab") {
            trapFocus(panel, event);
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            closePaywall(root);
        }
    };
    keyHandlers.set(root, handler);
    document.addEventListener("keydown", handler, true);
}

/**
 * 渲染回饋畫面（假成交 → 明確回饋）。
 * @param {HTMLElement} root
 * @param {{ plan: string, amount: number, label: string }} info
 */
function renderFeedback(root, info) {
    const en = isEnglish();
    const copy = en ? COPY.en : COPY.zh;

    root.innerHTML = `
        <div class="paywall paywall--feedback" role="dialog" aria-modal="true" aria-labelledby="paywall-feedback-title">
            <h2 class="paywall__title" id="paywall-feedback-title">
                ${escapeHtml(copy.recorded)}
            </h2>
            <p class="paywall__body">${escapeHtml(copy.detail)}</p>
            <p class="paywall__plan-summary">
                ${escapeHtml(info.label)}
                ${info.amount > 0 ? `— ${escapeHtml(String(info.amount))}` : ""}
            </p>
            <p class="paywall__note">${escapeHtml(copy.note)}</p>
            <button class="level-btn" id="paywall-ack" type="button">
                ${escapeHtml(copy.ack)}
            </button>
        </div>
    `;
    root.classList.remove("hidden");

    const panel = /** @type {HTMLElement|null} */ (root.querySelector(".paywall"));
    if (panel) {
        wireDialogKeys(root, panel);
        /** @type {HTMLElement|null} */ (panel.querySelector("#paywall-ack"))?.focus();
    }

    root.querySelector("#paywall-ack")?.addEventListener("click", () => {
        closePaywall(root);
    });
}

/**
 * 渲染付費牆本體。
 * @param {HTMLElement} root
 * @param {{ id:string, title:string, body:string, cta?:string, price?:string, features?:string[] }} offer
 */
function renderPaywall(root, offer) {
    const en = isEnglish();
    const copy = en ? COPY.en : COPY.zh;

    root.innerHTML = `
        <div class="paywall" role="dialog" aria-modal="true" aria-labelledby="paywall-title" aria-describedby="paywall-body">
            <h2 class="paywall__title" id="paywall-title">${escapeHtml(offer.title)}</h2>
            <p class="paywall__body" id="paywall-body">${escapeHtml(offer.body)}</p>

            <div class="paywall__plans">
                ${PLANS.map((p) => `
                    <div class="paywall__plan" data-plan="${escapeHtml(p.id)}">
                        <div class="paywall__plan-title">${escapeHtml(en ? p.titleEn : p.title)}</div>
                        <div class="paywall__plan-price">${escapeHtml(en ? p.priceEn : p.price)}</div>
                        <ul class="paywall__features">
                            ${p.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
                        </ul>
                        <button class="level-btn" data-buy="${escapeHtml(p.id)}" type="button">
                            ${escapeHtml(offer.cta || (en ? "Subscribe" : "立即訂閱"))}
                        </button>
                    </div>
                `).join("")}
            </div>

            <p class="paywall__note">${escapeHtml(copy.note)}</p>

            <button class="level-btn level-btn--secondary" id="paywall-close" type="button">
                ${escapeHtml(en ? "Not now" : "稍後再說")}
            </button>
        </div>
    `;
    root.classList.remove("hidden");

    const panel = /** @type {HTMLElement|null} */ (root.querySelector(".paywall"));
    if (panel) {
        wireDialogKeys(root, panel);
        /** @type {HTMLElement|null} */ (panel.querySelector("#paywall-close"))?.focus();
    }

    root.querySelector("#paywall-close")?.addEventListener("click", () => {
        closePaywall(root);
    });

    // 購買按鈕需先通過家長閘門（閘門會覆寫容器內容，因此流程結束後需重新渲染）
    root.querySelectorAll("[data-buy]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            // 防連點：進行中鎖定
            if (/** @type {HTMLButtonElement} */ (btn).disabled) return;
            /** @type {HTMLButtonElement} */ (btn).disabled = true;

            const plan = /** @type {"year"|"family"} */ (/** @type {HTMLElement} */ (btn).dataset.buy || "year");
            const planDef = PLANS.find((p) => p.id === plan);
            const label = planDef ? (en ? planDef.titleEn : planDef.title) : plan;

            let passed = false;
            try {
                passed = await requireParentalGate(root, { reason: offer.title });
            } catch (err) {
                console.warn("[paywall] 家長閘門異常", err);
                passed = false;
            }

            if (!passed) {
                // 取消或驗證失敗 → 回到付費牆（重新渲染以還原按鈕）
                renderPaywall(root, offer);
                return;
            }

            recordIntent(root, plan, priceOf(planDef), label);
        });
    });
}

/**
 * 顯示付費牆。
 * @param {HTMLElement} root
 * @param {{ id:string, title:string, body:string, cta?:string, price?:string, features?:string[] }} offer
 */
export function showPaywall(root, offer) {
    if (!root) return;
    renderPaywall(root, offer);
    track("paywall_view", { feature: offer.id });
}

/**
 * 記錄付費意向（供定價 A/B 使用）。
 *
 * 規範：**不得**假成交或直接關閉對話框 —— 必須在對話框內呈現清楚回饋。
 * @param {HTMLElement} root
 * @param {"year"|"family"} plan
 * @param {number} amount
 * @param {string} [label]
 */
export function recordIntent(root, plan, amount, label) {
    track("purchase", { plan, amount });
    renderFeedback(root, {
        plan,
        amount,
        label: label || (plan === "family" ? "家庭方案" : "年訂閱")
    });
}

/**
 * 方案價格數值。
 * @param {any} plan
 */
function priceOf(plan) {
    if (!plan) return 0;
    const match = /NT\$(\d+)/.exec(plan.price || "");
    return match ? Number(match[1]) : 0;
}
