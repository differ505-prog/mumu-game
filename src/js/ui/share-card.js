/**
 * 分享成果卡 — 可炫耀視覺。
 *
 * 兩種視角：
 * - child（預設）：**收集成果圖**。孩子版不得出現評量構件（雷達圖、多軸統計圖），
 *   也不得出現任何認知心理學或教育評量術語。圖上只放孩子看得懂的成就。
 * - parent：保留雷達圖與正式技能名，供家長查看數據。
 *
 * 三種卡：
 * - learning：孩子版＝學會的小秘密＋星星；家長版＝掌握度雷達圖
 * - dex：新解鎖恐龍插畫＋名稱
 * - puzzle：拼完成品
 *
 * 規範：圖上含推薦碼；不顯示可識別資訊。
 */

import { axisStats, totalStars, childVoice } from "../core/dex.js";

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
 * @param {{ view?:"child"|"parent" }} [options]
 * @returns {{ dataUrl:string, text:string }}
 */
export function buildShareCard(bundle, progress, kind, payload = {}, options = {}) {
    const view = options.view === "parent" ? "parent" : "child";
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
        text = view === "parent"
            ? drawParentLearningCard(ctx, bundle, progress, referral)
            : drawChildLearningCard(ctx, bundle, progress, referral);
    } else if (kind === "dex") {
        text = drawDexCard(ctx, bundle, progress, referral, payload, view);
    } else {
        text = drawPuzzleCard(ctx, bundle, progress, referral, payload, view);
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
 * 孩子版學習成果卡 — 收集成果圖，**不含任何評量構件**。
 *
 * 只有：學會的小秘密、星星數、已收集恐龍剪影排列。
 * 不得使用雷達圖、多軸統計圖或達成率指標。
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} bundle
 * @param {any} progress
 * @param {string} _referral
 * @returns {string}
 */
function drawChildLearningCard(ctx, bundle, progress, _referral) {
    const voice = childVoice() || {};
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";
    const key = en ? "en-US" : "zh-TW";

    const title = voice.shareChildTitle?.learning?.[key] || (en ? "I learned something new!" : "我學會了新東西！");
    const body = voice.shareChildBody?.learning?.[key] || (en ? "I learned the secret of hearing sounds apart" : "我學會了聽出聲音的小秘密");
    const stars = totalStars(progress);
    const unlocked = progress.unlockedDex || [];
    const total = bundle?.dex?.length || 24;

    // 標題
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 58px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(title, W / 2, 90);

    ctx.fillStyle = "rgba(247,251,255,.72)";
    ctx.font = "400 32px system-ui, sans-serif";
    ctx.fillText("Santa's Little Helper", W / 2, 165);

    // 星星列
    const starCount = Math.min(12, stars);
    for (let i = 0; i < starCount; i++) {
        const x = W / 2 - (starCount - 1) * 42 + i * 84;
        drawStar(ctx, x, 320, 32, "#f1c40f");
    }

    // 恐龍剪影排列（已收集的彩色，未收集的剪影）
    const show = Math.min(8, total);
    for (let i = 0; i < show; i++) {
        const entry = bundle?.dex?.[i];
        if (!entry) continue;
        const x = W / 2 - (show - 1) * 118 + i * 236;
        const y = 620;
        const unlockedHere = unlocked.includes(entry.id);
        const img = new Image();
        img.onload = () => {
            ctx.save();
            if (!unlockedHere) ctx.globalAlpha = 0.22;
            ctx.drawImage(img, x - 100, y - 100, 200, 200);
            ctx.restore();
        };
        img.src = entry.art?.file || "";
    }

    // 文案
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 42px system-ui, sans-serif";
    ctx.fillText(body, W / 2, 880);

    ctx.fillStyle = "rgba(247,251,255,.72)";
    ctx.font = "400 32px system-ui, sans-serif";
    ctx.fillText(en
        ? `${unlocked.length} of ${total} dinosaurs in my team`
        : `隊伍裡有 ${unlocked.length} / ${total} 隻恐龍`, W / 2, 950);

    ctx.fillStyle = "rgba(247,251,255,.72)";
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillText(en ? `${stars} stars collected` : `收集了 ${stars} 顆星星`, W / 2, 1000);

    return `${title}！${body}。`;
}

/**
 * 家長版學習成果卡 — 掌握度雷達圖。
 *
 * 僅在 view === "parent" 時產生；孩子流程不得呼叫。
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} bundle
 * @param {any} progress
 * @param {string} _referral
 * @returns {string}
 */
function drawParentLearningCard(ctx, bundle, progress, _referral) {
    const voice = childVoice() || {};
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";
    const key = en ? "en-US" : "zh-TW";
    const formal = voice.parentVerbLabel || {};

    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 58px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(en ? "Learning Report" : "學習成果", W / 2, 90);

    ctx.fillStyle = "rgba(247,251,255,.72)";
    ctx.font = "400 32px system-ui, sans-serif";
    ctx.fillText("Santa's Little Helper", W / 2, 165);

    // 雷達圖
    const axes = [
        { key: "minimalPairCorrect", verb: "minimal-pair" },
        { key: "sequenceCorrect", verb: "sequence" },
        { key: "rhythmCorrect", verb: "rhythm" },
        { key: "interferenceCorrect", verb: "interference" },
        { key: "pitchCorrect", verb: "pitch" },
        { key: "puzzleCorrect", verb: "puzzle" },
        { key: "memoryCorrect", verb: "memory" }
    ];
    const labels = axes.map((a) => formal[a.verb]?.[key] || a.verb);

    const cx = W / 2;
    const cy = 640;
    const R = 300;

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

    for (let i = 0; i < axes.length; i++) {
        const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < axes.length; i++) {
        const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const stats = axisStats(progress, axes[i].key);
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

    ctx.fillStyle = "rgba(247,251,255,.82)";
    ctx.font = "400 26px system-ui, sans-serif";
    for (let i = 0; i < axes.length; i++) {
        const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const x = cx + Math.cos(a) * (R + 52);
        const y = cy + Math.sin(a) * (R + 52);
        ctx.textAlign = Math.abs(x - cx) < 20 ? "center" : (x > cx ? "left" : "right");
        ctx.textBaseline = "middle";
        ctx.fillText(labels[i], x, y);
    }

    const mp = axisStats(progress, "minimalPairCorrect");
    const stars = totalStars(progress);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.fillText(en ? `${mp.correct} minimal pairs answered correctly` : `孩子已學會辨認 ${mp.correct} 組語音對照`, W / 2, 1030);

    ctx.fillStyle = "rgba(247,251,255,.72)";
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillText(en ? `${stars} stars earned` : `並完成 ${stars} 顆星星的練習`, W / 2, 1090);

    void bundle;
    return en
        ? `${mp.correct} minimal pairs answered correctly, ${stars} stars earned.`
        : `孩子已學會辨認 ${mp.correct} 組語音對照，並完成 ${stars} 顆星星的練習。`;
}

/**
 * 五角星。
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {string} color
 */
function drawStar(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const x = cx + Math.cos(a) * rad;
        const y = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

/**
 * 圖鑑卡。
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} bundle
 * @param {any} progress
 * @param {string} _referral
 * @param {any} payload
 * @param {"child"|"parent"} [view]
 * @returns {string}
 */
function drawDexCard(ctx, bundle, progress, _referral, payload, view = "child") {
    const voice = childVoice() || {};
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";
    const key = en ? "en-US" : "zh-TW";
    const dinoId = payload.dinoId || (progress.unlockedDex || [])[0] || "";
    const entry = bundle?.dex?.find((/** @type {any} */ d) => d.id === dinoId);
    const name = entry?.name?.[key] || entry?.name?.["zh-TW"] || dinoId;
    const milestone = entry?.personality?.[key] || entry?.personality?.["zh-TW"] || "";

    const title = voice.shareChildTitle?.dex?.[key] || (en ? "My dino team" : "我的恐龍隊伍");

    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 58px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(view === "parent"
        ? (en ? "New companion!" : "新夥伴加入！")
        : title, W / 2, 90);

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
    const total = bundle?.dex?.length || 24;
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 44px system-ui, sans-serif";
    ctx.fillText(en
        ? `${unlockedCount} / ${total} dinosaurs collected`
        : `收集了 ${unlockedCount} / ${total} 隻恐龍`, W / 2, 1060);

    return view === "parent"
        ? `孩子收集到恐龍「${name}」，圖鑑已完成 ${unlockedCount} 隻。`
        : `${title}！我收集了 ${unlockedCount} 隻恐龍。`;
}

/**
 * 拼圖卡。
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} bundle
 * @param {any} progress
 * @param {string} _referral
 * @param {any} payload
 * @param {"child"|"parent"} [view]
 * @returns {string}
 */
function drawPuzzleCard(ctx, bundle, progress, _referral, payload, view = "child") {
    const voice = childVoice() || {};
    const en = (localStorage.getItem("mumu.locale") || "zh-TW") === "en-US";
    const key = en ? "en-US" : "zh-TW";
    const title = voice.shareChildTitle?.puzzle?.[key] || (en ? "I built a dinosaur!" : "我拼好了恐龍！");
    const body = voice.shareChildBody?.puzzle?.[key] || (en ? "I put a dinosaur back together" : "我把恐龍的骨頭拼回來了");
    const formalPuzzle = voice.parentPuzzleUnit?.[key] || "";

    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 58px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(view === "parent"
        ? (en ? "Puzzle complete!" : "拼圖完成！")
        : title, W / 2, 90);

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
    ctx.fillText(view === "parent"
        ? `孩子完成了 ${puzzleCount} 個${formalPuzzle}`
        : body, W / 2, 1000);

    ctx.fillStyle = "rgba(247,251,255,.72)";
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillText(view === "parent"
        ? "每一次拼好，都是一次推理的勝利"
        : (en ? "I want to play more!" : "我還想再玩！"), W / 2, 1070);

    return view === "parent"
        ? `孩子完成了 ${puzzleCount} 個${formalPuzzle}，每一次拼好都是一次推理的勝利。`
        : `${title}！${body}！`;
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
