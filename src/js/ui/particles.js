/**
 * 粒子引擎 — 單一 canvas 繪製所有粒子，避免 DOM 過載。
 */

/**
 * @param {HTMLElement} layer
 * @param {{ kind?: "sparkle"|"snow"|"firework"|"star"|"dust", count?: number, origin?: {x:number,y:number}, gravity?: number, drag?: number, seed?: number }} opts
 */
export function burst(layer, opts = {}) {
    const canvas = ensureCanvas(layer);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const kind = opts.kind || "sparkle";
    const count = opts.count || 12;
    const gravity = opts.gravity ?? 0.05;
    const drag = opts.drag ?? 0.99;
    const seed = opts.seed ?? Math.floor(Math.random() * 10000);

    const w = canvas.width;
    const h = canvas.height;
    const ox = opts.origin?.x ?? w / 2;
    const oy = opts.origin?.y ?? h / 2;

    // 確定性亂數（同一 seed 結果一致，便於重現）
    let s = seed;
    const rand = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };

    /** @type {any[]} */
    const particles = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + rand() * 0.5;
        const speed = kind === "firework" ? 2 + rand() * 3 : 0.5 + rand() * 1.5;
        particles.push({
            x: ox,
            y: oy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.012 + rand() * 0.02,
            size: kind === "snow" ? 2 + rand() * 3 : 3 + rand() * 4,
            hue: kind === "firework" ? Math.floor(rand() * 60) + 10 : 45
        });
    }

    const step = () => {
        ctx.clearRect(0, 0, w, h);
        let alive = false;
        for (const p of particles) {
            if (p.life <= 0) continue;
            alive = true;
            p.vx *= drag;
            p.vy = p.vy * drag + gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            // 半徑必須恆正 —— ctx.arc 的半徑 <= 0 會拋 IndexSizeError
            const radius = p.size * Math.max(0, p.life);
            if (radius <= 0) continue;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = `hsl(${p.hue}, 85%, ${60 + p.life * 20}%)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (alive) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

/**
 * 三層視差環境雪花。
 * @param {HTMLElement} layer
 */
export function startAmbientSnow(layer) {
    const canvas = ensureCanvas(layer);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /** @type {any[]} */
    const flakes = [];
    const w = canvas.width;
    const h = canvas.height;
    for (let i = 0; i < 60; i++) {
        const depth = Math.random();
        flakes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 1 + depth * 3,
            speed: 0.2 + depth * 1.2,
            drift: (Math.random() - 0.5) * 0.4,
            depth
        });
    }

    const step = () => {
        ctx.clearRect(0, 0, w, h);
        for (const f of flakes) {
            f.y += f.speed;
            f.x += f.drift;
            if (f.y > h) {
                f.y = -5;
                f.x = Math.random() * w;
            }
            ctx.globalAlpha = 0.3 + f.depth * 0.6;
            ctx.fillStyle = "#f7fbff";
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

/**
 * 停止環境雪花。
 * @param {HTMLElement} layer
 */
export function stopAmbientSnow(layer) {
    const canvas = layer?.querySelector("canvas");
    if (canvas) canvas.remove();
}

/**
 * 取得或建立 canvas。
 * @param {HTMLElement} layer
 */
function ensureCanvas(layer) {
    if (!layer) return null;
    let canvas = /** @type {HTMLCanvasElement} */ (layer.querySelector("canvas"));
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
        layer.appendChild(canvas);
    }
    const resize = () => {
        const rect = layer.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    window.addEventListener("resize", resize, { once: true });
    return canvas;
}

/**
 * 依天氣啟動環境粒子（Step 120）。
 *
 * 支援的 `weather`：
 * - `snow`  → 三層視差雪花
 * - `mist`  → 緩慢上升的霧帶
 * - `aurora`→ 極光帶（半透明漸層橫帶）
 * - 其他    → 不啟動任何粒子（不得留下死欄位）
 *
 * @param {HTMLElement} layer
 * @param {string} weather
 */
export function startAmbientWeather(layer, weather) {
    stopAmbientWeather(layer);
    if (!layer || !weather) return;

    if (weather === "mist") {
        startAmbientMist(layer);
    } else if (weather === "aurora") {
        startAmbientAurora(layer);
    } else {
        // `snow` 與既有環境雪花相同
        startAmbientSnow(layer);
    }
}

/**
 * 停止所有環境粒子。
 * @param {HTMLElement} layer
 */
export function stopAmbientWeather(layer) {
    const canvas = layer?.querySelector("canvas");
    if (canvas) canvas.remove();
}

/**
 * 緩慢上升的霧帶。
 * @param {HTMLElement} layer
 */
function startAmbientMist(layer) {
    const canvas = ensureCanvas(layer);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const bands = Array.from({ length: 7 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        rx: 90 + Math.random() * 160,
        ry: 26 + Math.random() * 44,
        speed: 0.12 + Math.random() * 0.22,
        alpha: 0.05 + Math.random() * 0.07
    }));

    const step = () => {
        ctx.clearRect(0, 0, w, h);
        for (const b of bands) {
            b.y -= b.speed;
            b.x += 0.18;
            if (b.y + b.ry < 0) {
                b.y = h + b.ry;
                b.x = Math.random() * w;
            }
            if (b.x - b.rx > w) b.x = -b.rx;
            const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.rx);
            g.addColorStop(0, `rgba(220,235,245,${b.alpha})`);
            g.addColorStop(1, "rgba(220,235,245,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

/**
 * 極光帶。
 * @param {HTMLElement} layer
 */
function startAmbientAurora(layer) {
    const canvas = ensureCanvas(layer);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const ribbons = Array.from({ length: 3 }, (_, i) => ({
        offset: 0.08 + i * 0.12,
        amp: 26 + i * 14,
        speed: 0.004 + i * 0.002,
        hue: 130 + i * 42,
        alpha: 0.1 + i * 0.045
    }));

    const step = () => {
        ctx.clearRect(0, 0, w, h);
        ribbons.forEach((r, idx) => {
            const t = performance.now() * r.speed;
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let x = 0; x <= w; x += 12) {
                const y = h * r.offset
                    + Math.sin((x / w) * Math.PI * 2 + t) * r.amp
                    + Math.sin((x / w) * Math.PI * 5 + t * 1.7) * (r.amp * 0.35);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            const g = ctx.createLinearGradient(0, h * r.offset - r.amp, 0, h * r.offset + r.amp);
            g.addColorStop(0, `hsla(${r.hue}, 80%, 70%, 0)`);
            g.addColorStop(0.5, `hsla(${r.hue}, 80%, 70%, ${r.alpha})`);
            g.addColorStop(1, `hsla(${r.hue}, 80%, 70%, 0)`);
            ctx.fillStyle = g;
            ctx.fill();
            void idx;
        });
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
