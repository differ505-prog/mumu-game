/**
 * 產生 App icon PNG。
 *
 * 以 sharp 將 assets/icons/app-icon.svg 轉為 icon-192/512/1024.png，
 * 確保是真實 PNG、alpha 正確、尺寸正確。
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/**
 * 輸出報告（避免 console.log 殘留）。
 * @param {...any} args
 */
function out(...args) {
    process.stdout.write(args.map(String).join(" ") + "\n");
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "assets/icons/app-icon.svg");

/** @type {Array<{ file:string, size:number }>} */
const targets = [
    { file: "icon-192.png", size: 192 },
    { file: "icon-512.png", size: 512 },
    { file: "icon-1024.png", size: 1024 }
];

for (const t of targets) {
    const buf = await sharp(source, { density: 384 })
        .resize(t.size, t.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9, palette: false })
        .toBuffer();

    writeFileSync(join(root, t.file), buf);

    const meta = await sharp(buf).metadata();
    if (meta.width !== t.size || meta.height !== t.size) {
        throw new Error(`${t.file} 尺寸錯誤：${meta.width}×${meta.height}（預期 ${t.size}×${t.size}）`);
    }
    if (!meta.hasAlpha) {
        throw new Error(`${t.file} 缺少 alpha 通道`);
    }
    out(`[OK] ${t.file}：${meta.width}×${meta.height}，${meta.channels} 通道，${(buf.length / 1024).toFixed(1)}KB`);
}

out("[OK] App icon 產生完成");
