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
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = `hsl(${p.hue}, 85%, ${60 + p.life * 20}%)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
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
