/**
 * 動畫執行器 — 以 CSS token 驅動，所有動畫一律透過 .anim-<name> 類別。
 */

/**
 * 套用動畫。
 * @param {string} target CSS 選擇器
 * @param {string} anim 動畫名稱（對應 .anim-<name>）
 * @param {{ duration?: string, easing?: string, delay?: number }} [opts]
 */
export function animate(target, anim, opts = {}) {
    const el = /** @type {HTMLElement} */ (document.querySelector(target));
    if (!el) return;

    const reduced = prefersReducedMotion();
    const duration = reduced ? "1ms" : opts.duration || "";
    const easing = opts.easing || "";

    const className = `anim-${anim}`;
    el.classList.remove(className);
    // 強制重排以允許連續套用同一動畫
    void el.offsetWidth;
    el.classList.add(className);

    if (duration) el.style.setProperty("--anim-duration", duration);
    if (easing) el.style.setProperty("--anim-easing", easing);
    if (opts.delay) el.style.animationDelay = `${opts.delay}ms`;

    const done = () => {
        el.classList.remove(className);
        el.style.removeProperty("--anim-duration");
        el.style.removeProperty("--anim-easing");
        el.style.removeProperty("animation-delay");
    };
    el.addEventListener("animationend", done, { once: true });
}

/**
 * 數字滾動。
 * @param {string} target
 * @param {number} value
 */
export function animateNumber(target, value) {
    const el = /** @type {HTMLElement} */ (document.querySelector(target));
    if (!el) return;
    if (prefersReducedMotion()) {
        el.textContent = String(value);
        return;
    }
    const from = Number(el.textContent) || 0;
    const start = performance.now();
    const dur = 450;
    const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(from + (value - from) * eased));
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

/**
 * 數值補間。
 * @param {Element} target
 * @param {string} property
 * @param {number|string} from
 * @param {number|string} to
 * @param {number} duration
 */
export function tween(target, property, from, to, duration) {
    const el = /** @type {HTMLElement} */ (target);
    if (prefersReducedMotion()) {
        el.style.setProperty(property, String(to));
        return;
    }
    const start = performance.now();
    const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const num = Number(from) + (Number(to) - Number(from)) * eased;
        el.style.setProperty(property, String(num));
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

/**
 * 使用者是否偏好減少動效。
 * @returns {boolean}
 */
export function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
