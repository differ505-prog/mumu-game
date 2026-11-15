/**
 * 付費牆 — 僅推年訂閱，不推月訂閱。
 *
 * 規範：需家長閘門通過才顯示購買按鈕。
 */

import { requireParentalGate } from "../core/parental-gate.js";
import { PLANS } from "../core/entitlements.js";
import { track } from "../core/telemetry.js";

/**
 * 顯示付費牆。
 * @param {HTMLElement} root
 * @param {{ id:string, title:string, body:string, cta:string, price:string, features:string[] }} offer
 */
export function showPaywall(root, offer) {
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";

    root.innerHTML = `
        <div class="paywall" role="dialog" aria-modal="true" aria-label="${offer.title}">
            <h2 class="paywall__title">${offer.title}</h2>
            <p class="paywall__body">${offer.body}</p>

            <div class="paywall__plans">
                ${PLANS.map((p) => `
                    <div class="paywall__plan" data-plan="${p.id}">
                        <div class="paywall__plan-title">${en ? p.titleEn : p.title}</div>
                        <div class="paywall__plan-price">${en ? p.priceEn : p.price}</div>
                        <ul class="paywall__features">
                            ${p.features.map((f) => `<li>${f}</li>`).join("")}
                        </ul>
                        <button class="level-btn" data-buy="${p.id}" type="button">
                            ${offer.cta || (en ? "Subscribe" : "立即訂閱")}
                        </button>
                    </div>
                `).join("")}
            </div>

            <p class="paywall__note">
                ${en
                    ? "Only annual plans are available. Cancel anytime from your App Store account."
                    : "本 App 僅提供年訂閱方案，可於 App Store 帳號隨時取消。"}
            </p>

            <button class="level-btn level-btn--secondary" id="paywall-close" type="button">
                ${en ? "Not now" : "稍後再說"}
            </button>
        </div>
    `;

    root.classList.remove("hidden");
    track("paywall_view", { feature: offer.id });

    root.querySelector("#paywall-close")?.addEventListener("click", () => {
        root.classList.add("hidden");
    });

    // 購買按鈕需先通過家長閘門
    root.querySelectorAll("[data-buy]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const plan = /** @type {"year"|"family"} */ (/** @type {HTMLElement} */ (btn).dataset.buy || "year");
            const passed = await requireParentalGate(root, { reason: offer.title });
            if (!passed) return;

            const planDef = PLANS.find((p) => p.id === plan);
            recordIntent(root, plan, priceOf(planDef));
        });
    });
}

/**
 * 記錄付費意向（供定價 A/B 使用）。
 * @param {HTMLElement} root
 * @param {"year"|"family"} plan
 * @param {number} amount
 */
export function recordIntent(root, plan, amount) {
    track("purchase", { plan, amount });
    const note = root.querySelector(".paywall__note");
    if (note) {
        note.textContent = "已記錄您的訂閱意向，敬請期待。";
    }
    root.classList.add("hidden");
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
