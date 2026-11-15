/**
 * 分享成果卡 — 可炫耀視覺。
 *
 * 三種卡：
 * - learning：掌握度雷達圖
 * - dex：新解鎖恐龍插畫＋名稱
 * - puzzle：拼完成品
 *
 * 規範：文案必須是家長驕傲向（「他學會了辨認 8 種動物名稱」）而非操作向
 * （「你玩了 100 分」）；圖上含推薦碼；不顯示可識別資訊。
 */

import { axisStats } from "../core/dex.js";
import { totalStars } from "../core/dex.js";

/**
 * @typedef {"learning"|"dex"|"puzzle"} ShareCardKind
 */

/** 卡片尺寸。 */
const W = 1080;
const H = 1350;

/**
 * 建立分享卡。
 * @param {any} bundle
 * @param {any} progress
 * @param {ShareCardKind} kind
 * @param {any} [payload]
 * @returns {{ dataUrl:string, text:string }}
 */
export function buildShareCard(bundle, progress, kind, payload = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { dataUrl: "", text: "" };

    const referral = payload.referralCode || progress.referralCode || "";

    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#16294f");
    grad.addColorStop(1, "#0a1a3c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 裝飾圓
    ctx.fillStyle = "rgba(241,196,15,.10)";
    ctx.beginPath();
    ctx.arc(W - 120, 160, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(39,174,96,.12)";
    ctx.beginPath();
    ctx.arc(120, H - 200, 240, 0, Math.PI * 2);
    ctx.fill();

    let text = "";

    if (kind === "learning") {
        text = drawLearningCard(ctx, bundle, progress, referral);
    } else if (kind === "dex") {
        text = drawDexCard(ctx, bundle, progress, referral, payload);
    } else {
        text = drawPuzzleCard(ctx, bundle, progress, referral, payload);
    }

    // 推薦碼
    if (referral) {
        ctx.fillStyle = "rgba(255,255,255,.10)";
        roundRect(ctx, W / 2 - 130, H - 130, 260, 62, 31);
        ctx.fill();
        ctx.fillStyle = "#f7fbff";
        ctx.font = "600 26px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(referral, W / 2, H - 99);
    }

    return { dataUrl: canvas.toDataURL("image/png"), text };
}

/**
 * 學習成果卡：掌握度雷達圖。
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} bundle
 * @param {any} progress
 * @param {string} _referral
 * @returns {string}
 */
function drawLearningCard(ctx, bundle, progress, _referral) {
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 58px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("學習成果", W / 2, 90);

    ctx.fillStyle = "rgba(247,251,255,.72)";
    ctx.font = "400 32px system-ui, sans-serif";
    ctx.fillText("Santa's Little Helper", W / 2, 165);

    // 雷達圖
    const axes = [
        { key: "minimalPairCorrect", label: "語音覺辨" },
        { key: "sequenceCorrect", label: "序列回憶" },
        { key: "rhythmCorrect", label: "節奏模仿" },
        { key: "interferenceCorrect", label: "干擾抑制" },
        { key: "pitchCorrect", label: "音高模仿" },
        { key: "puzzleCorrect", label: "圖像推理" },
        { key: "memoryCorrect", label: "空間記憶" }
    ];

    const cx = W / 2;
    const cy = 640;
    const R = 300;

    // 網格
    ctx.strokeStyle = "rgba(247,251,255,.16)";
    ctx.lineWidth = 2;
    for (let ring = 1; ring <= 4; ring++) {
        ctx.beginPath();
        for (let i = 0; i <= axes.length; i++) {
            const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
            const r = (R * ring) / 4;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // 軸線
    for (let i = 0; i < axes.length; i++) {
        const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
    }

    // 資料多邊形
    ctx.beginPath();
    for (let i = 0; i < axes.length; i++) {
        const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const stats = axisStats(progress, axes[i].key);
        // 以答對率為基礎，未作答時給一個穩妥的起始值（避免空圖）
        const value = stats.total ? Math.min(1, stats.rate) : 0.18;
        const r = R * value;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(241,196,15,.30)";
    ctx.fill();
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 4;
    ctx.stroke();

    // 軸標籤
    ctx.fillStyle = "rgba(247,251,255,.82)";
    ctx.font = "400 26px system-ui, sans-serif";
    for (let i = 0; i < axes.length; i++) {
        const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const x = cx + Math.cos(a) * (R + 52);
        const y = cy + Math.sin(a) * (R + 52);
        ctx.textAlign = Math.abs(x - cx) < 20 ? "center" : (x > cx ? "left" : "right");
        ctx.textBaseline = "middle";
        ctx.fillText(axes[i].label, x, y);
    }

    // 家長驕傲向文案
    const mp = axisStats(progress, "minimalPairCorrect");
    const stars = totalStars(progress);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.fillText(`孩子已學會辨認 ${mp.correct} 組語音對照`, W / 2, 1030);

    ctx.fillStyle = "rgba(247,251,255,.72)";
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillText(`並完成 ${stars} 顆星星的練習`, W / 2, 1090);

    void bundle;
    return `孩子已學會辨認 ${mp.correct} 組語音對照，並完成 ${stars} 顆星星的練習。`;
}

/**
 * 圖鑑卡。
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} bundle
 * @param {any} progress
 * @param {string} _referral
 * @param {any} payload
 * @returns {string}
 */
function drawDexCard(ctx, bundle, progress, _referral, payload) {
    const dinoId = payload.dinoId || (progress.unlockedDex || [])[0] || "";
    const entry = bundle?.dex?.find((/** @type {any} */ d) => d.id === dinoId);
    const name = entry?.name?.["zh-TW"] || entry?.name?.["en-US"] || dinoId;
    const milestone = entry?.personality?.["zh-TW"] || entry?.personality?.["en-US"] || "";

    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 58px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("新夥伴加入！", W / 2, 90);

    // 恐龍插畫（以圖片繪製；失敗則以剪影代替）
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, W / 2 - 300, 220, 600, 600);
    };
    img.src = entry?.art?.file || "";

    ctx.fillStyle = "#f1c40f";
    ctx.font = "700 72px system-ui, sans-serif";
    ctx.fillText(name, W / 2, 880);

    ctx.fillStyle = "rgba(247,251,255,.78)";
    ctx.font = "400 34px system-ui, sans-serif";
    ctx.fillText(milestone, W / 2, 980);

    const unlockedCount = (progress.unlockedDex || []).length;
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 44px system-ui, sans-serif";
    ctx.fillText(`恐龍圖鑑已收集 ${unlockedCount} / ${bundle?.dex?.length || 24}`, W / 2, 1060);

    return `孩子收集到恐龍「${name}」，圖鑑已完成 ${unlockedCount} 隻。`;
}

/**
 * 拼圖卡。
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} bundle
 * @param {any} progress
 * @param {string} _referral
 * @param {any} payload
 * @returns {string}
 */
function drawPuzzleCard(ctx, bundle, progress, _referral, payload) {
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 58px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("拼圖完成！", W / 2, 90);

    const artUrl = payload.image || "";
    if (artUrl) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, W / 2 - 340, 230, 680, 680);
        };
        img.src = artUrl;
    } else {
        ctx.fillStyle = "rgba(255,255,255,.08)";
        roundRect(ctx, W / 2 - 340, 230, 680, 680, 32);
        ctx.fill();
    }

    const puzzleCount = axisStats(progress, "puzzleCorrect").correct;
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 46px system-ui, sans-serif";
    ctx.fillText(`孩子完成了 ${puzzleCount} 個圖像推理挑戰`, W / 2, 1000);

    ctx.fillStyle = "rgba(247,251,255,.72)";
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillText("每一次拼好，都是一次推理的勝利", W / 2, 1070);

    return `孩子完成了 ${puzzleCount} 個圖像推理挑戰，每一次拼好都是一次推理的勝利。`;
}

/**
 * 產生帶推薦碼的 LINE 分享連結與文字。
 * @param {string} dataUrl
 * @param {string} text
 * @param {{ code:string }} referral
 */
export function shareToLine(dataUrl, text, referral) {
    const code = referral?.code || "";
    const url = code
        ? `https://mumu-game.pages.dev/?ref=${encodeURIComponent(code)}`
        : "https://mumu-game.pages.dev/";

    const shareText = `${text}\n\n一起來玩：${url}\n我的推薦碼：${code}`;

    // LINE 的分享 URL scheme（行動端）；桌機退回一般網址
    const lineUrl = `https://line.me/R/msg/text/?text=${encodeURIComponent(shareText)}`;

    return { url, shareText, lineUrl, image: dataUrl };
}

/**
 * 圓角矩形。
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 */
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
