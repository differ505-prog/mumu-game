/**
 * 資產轉碼與瘦身管線。
 *
 * - 以 sharp 將圖片轉 WebP（品質 82、寬度上限 512）輸出至 assets/generated/
 * - 音檔以 ffmpeg（若可用）轉 AAC 96kbps mono，否則保留原檔並警告
 * - 輸出 assets/manifest.json（檔案、大小、hash）
 */

import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from "node:fs";
import { dirname, join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "assets/generated");
mkdirSync(outDir, { recursive: true });

// 音檔需隨 repo 部署（music.json 會引用），故輸出到受版本控制的目錄
const audioDir = join(root, "assets/audio");
mkdirSync(audioDir, { recursive: true });

const warnings = [];

/**
 * 遞迴列出檔案。
 * @param {string} dir
 * @param {string[]} exts
 * @returns {string[]}
 */
function walk(dir, exts) {
    if (!existsSync(dir)) return [];
    /** @type {string[]} */
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "generated") continue;
            out.push(...walk(full, exts));
        } else if (exts.some((e) => extname(entry.name).toLowerCase() === e)) {
            out.push(full);
        }
    }
    return out;
}

/**
 * 檔案 hash。
 * @param {string} path
 */
function hashFile(path) {
    return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 16);
}

/**
 * 檢查 ffmpeg 是否可用。
 */
function hasFfmpeg() {
    try {
        execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

/* ---------- 圖片 → WebP ---------- */
const images = [
    ...walk(join(root, "assets"), [".png", ".jpg", ".jpeg"]),
    ...walk(join(root, "外部資源"), [".png", ".jpg", ".jpeg"])
];

let convertedImages = 0;
for (const src of images) {
    const rel = relative(root, src);
    const target = join(outDir, rel.replace(/[\\/]/g, "__").replace(/\.[^.]+$/, ".webp"));
    try {
        const buf = await sharp(src)
            .resize({ width: 512, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
        writeFileSync(target, buf);
        convertedImages++;
    } catch (err) {
        warnings.push(`圖片轉碼失敗：${rel}（${/** @type {Error} */ (err).message}）`);
    }
}

/* ---------- 音檔 → AAC（依 music.json 的循環區段裁切） ---------- */
const audio = [
    ...walk(join(root, "外部資源"), [".mp3", ".m4a", ".wav", ".ogg"]),
    ...walk(join(root, "assets"), [".mp3", ".m4a", ".wav", ".ogg"])
];

/**
 * 讀取 music.json 的曲目定義，找出某音檔被引用的最大循環區段。
 * @param {string} filename
 * @returns {{ start:number, end:number } | null}
 */
function loopRangeFor(filename) {
    const musicPath = join(root, "content/music.json");
    if (!existsSync(musicPath)) return null;

    const music = JSON.parse(readFileSync(musicPath, "utf8"));
    /** @type {any[]} */
    const tracks = [
        ...Object.values(music.music || {}),
        ...Object.values(music.chapters || {}),
        ...Object.values(music.ambience || {})
    ];

    let range = null;
    for (const t of tracks) {
        const file = String(t.file || "");
        if (!file.endsWith(filename)) continue;
        const start = Number(t.loopStart) || 0;
        const end = Number(t.loopEnd) || Number(t.durationSec) || 0;
        if (!range) {
            range = { start, end };
        } else {
            range.start = Math.min(range.start, start);
            range.end = Math.max(range.end, end);
        }
    }
    return range;
}

/** 音檔裁切上限（秒）— 超過此長度對遊戲而言沒有額外價值。 */
const MAX_AUDIO_SEC = 45;

let convertedAudio = 0;
const ffmpegOk = hasFfmpeg();
if (!ffmpegOk) {
    warnings.push("ffmpeg 不可用：音檔保留原格式未轉碼");
}

for (const src of audio) {
    const rel = relative(root, src);
    const filename = src.split("/").pop() || "";
    const target = join(audioDir, rel.replace(/[\\/]/g, "__").replace(/\.[^.]+$/, ".m4a"));

    if (ffmpegOk) {
        try {
            const range = loopRangeFor(filename);
            const start = range ? range.start : 0;
            const end = Math.min(range?.end || MAX_AUDIO_SEC, start + MAX_AUDIO_SEC);
            const duration = Math.max(1, end - start);

            execFileSync("ffmpeg", [
                "-y", "-ss", String(start), "-t", String(duration), "-i", src,
                "-vn", "-ac", "1", "-b:a", "96k",
                "-movflags", "+faststart",
                target
            ], { stdio: "ignore" });
            convertedAudio++;
            continue;
        } catch {
            warnings.push(`音檔轉碼失敗（保留原檔）：${rel}`);
        }
    }
    // 保留原檔
    try {
        copyFileSync(src, target);
    } catch {
        warnings.push(`音檔複製失敗：${rel}`);
    }
}

/* ---------- manifest ---------- */
const generated = [
    ...readdirSync(outDir).filter((f) => !f.startsWith(".")).map((f) => `generated/${f}`),
    ...readdirSync(audioDir).filter((f) => !f.startsWith(".")).map((f) => `audio/${f}`)
].map((rel) => {
    const full = rel.startsWith("audio/") ? join(audioDir, rel.slice(6)) : join(outDir, rel.slice(9));
    return {
        file: `assets/${rel}`,
        size: statSync(full).size,
        hash: hashFile(full)
    };
});

writeFileSync(
    join(root, "assets/manifest.json"),
    JSON.stringify({
        version: 1,
        generatedAt: new Date().toISOString(),
        policy: {
            webp: { quality: 82, maxWidth: 512 },
            audio: { codec: "aac", bitrate: "96k", channels: 1 },
            ffmpegAvailable: ffmpegOk
        },
        files: generated
    }, null, 2) + "\n"
);

/* ---------- 報告 ---------- */
const total = generated.reduce((s, f) => s + f.size, 0);
console.log("── 資產轉碼報告 ──");
console.log(`  圖片 → WebP：${convertedImages} 個`);
console.log(`  音檔 → AAC：${convertedAudio} 個（ffmpeg ${ffmpegOk ? "可用" : "不可用"}）`);
console.log(`  產出檔案：${generated.length} 個，合計 ${(total / 1024 / 1024).toFixed(2)} MB`);
console.log(`  音檔目錄：assets/audio/（受版本控制，供 music.json 引用）`);
console.log(`  圖片目錄：assets/generated/（建置快取，已 gitignore）`);
console.log(`  manifest：assets/manifest.json`);

for (const w of warnings) {
    console.warn(`  [WARN] ${w}`);
}
