/**
 * 產生 48 個統一風格 SVG icon。
 *
 * 全部 24×24 viewBox、stroke="currentColor"、fill="none"、線寬 1.8、
 * 圓頭圓角（stroke-linecap/linejoin: round），以確保在各種尺寸下視覺一致。
 *
 * 分組：ui / game / feedback / hud / parent / theme / dino
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "assets/icons");
mkdirSync(outDir, { recursive: true });

/**
 * @typedef {Object} IconSpec
 * @property {string} id
 * @property {string} group
 * @property {string} body SVG 內容（不含外層 svg 標籤）
 * @property {string} [fill] 是否為填色圖示
 */

/** @type {IconSpec[]} */
const icons = [
    // ---- feedback ----
    { id: "star", group: "feedback", body: `<path d="M12 3.2l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.4l5.9-.9z"/>` },
    { id: "star-filled", group: "feedback", fill: "true", body: `<path d="M12 3.2l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.4l5.9-.9z" fill="currentColor" stroke="none"/>` },
    { id: "medal", group: "feedback", body: `<circle cx="12" cy="15" r="5.4"/><path d="M8.2 9.6L6 3h12l-2.2 6.6"/>` },
    { id: "crown", group: "feedback", body: `<path d="M3 17h18l1.2-11-5.6 4L12 4.5 7.4 10 1.8 6z"/>` },
    { id: "trophy", group: "feedback", body: `<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11"/><path d="M12 14v3M8.5 20h7l-.7-3h-5.6z"/>` },
    { id: "check", group: "feedback", body: `<path d="M4.5 12.5l5 5 10-11"/>` },
    { id: "cross", group: "feedback", body: `<path d="M6 6l12 12M18 6L6 18"/>` },
    { id: "close-circle", group: "feedback", body: `<circle cx="12" cy="12" r="8.6"/><path d="M9.3 9.3l5.4 5.4M14.7 9.3l-5.4 5.4"/>` },
    { id: "hint", group: "feedback", body: `<path d="M9.5 18.5h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.2.9 2h5.4c0-.8.3-1.5.9-2A6 6 0 0 0 12 3z"/>` },
    { id: "heart", group: "feedback", body: `<path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>` },
    { id: "rocket", group: "feedback", body: `<path d="M12 2.5c3.4 2.2 5.4 5.8 5.4 10.2L12 18l-5.4-5.3C6.6 8.3 8.6 4.7 12 2.5z"/><circle cx="12" cy="10" r="2"/><path d="M9 18.5l-2 3 3.5-1.5M15 18.5l2 3-3.5-1.5"/>` },

    // ---- ui ----
    { id: "lock", group: "ui", body: `<rect x="4.5" y="10.5" width="15" height="9.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>` },
    { id: "unlock", group: "ui", body: `<rect x="4.5" y="10.5" width="15" height="9.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 7.6-1.7"/>` },
    { id: "settings", group: "ui", body: `<circle cx="12" cy="12" r="3.1"/><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6L6 18M18 18l-1.4-1.4M7.4 7.4L6 6"/>` },
    { id: "volume", group: "ui", body: `<path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.2 6.5a7.8 7.8 0 0 1 0 11"/>` },
    { id: "volume-mute", group: "ui", body: `<path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>` },
    { id: "speaker", group: "ui", body: `<path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6"/>` },
    { id: "play", group: "ui", body: `<path d="M7 4.8L19 12 7 19.2z"/>` },
    { id: "pause", group: "ui", body: `<path d="M8.5 5v14M15.5 5v14"/>` },
    { id: "replay", group: "ui", body: `<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5V10H9"/>` },
    { id: "slow", group: "ui", body: `<circle cx="12" cy="12" r="8.6"/><path d="M12 7v5.2l3.4 2"/>` },
    { id: "music", group: "ui", body: `<path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="16.5" cy="16" r="2.6"/>` },
    { id: "back", group: "ui", body: `<path d="M15 5l-7 7 7 7"/>` },
    { id: "close", group: "ui", body: `<path d="M6 6l12 12M18 6L6 18"/>` },
    { id: "home", group: "ui", body: `<path d="M3.5 11L12 3.8l8.5 7.2"/><path d="M6 9.6V20h12V9.6"/>` },
    { id: "chevron", group: "ui", body: `<path d="M9 5l7 7-7 7"/>` },
    { id: "map", group: "ui", body: `<path d="M9 4.5L3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z"/><path d="M9 4.5v12.7M15 6.8v12.7"/>` },
    { id: "calendar", group: "ui", body: `<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>` },
    { id: "chart", group: "ui", body: `<path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/>` },
    { id: "star-chart", group: "ui", body: `<path d="M4 20V9M10 20V4M16 20v-7"/><path d="M3 5.5l1.6 3.2 3.5.5-2.6 2.5.6 3.5L3 13.4.9 15.2l.6-3.5-2.6-2.5 3.5-.5z"/>` },
    { id: "shield", group: "ui", body: `<path d="M12 3l7.5 3v6c0 4.4-3 8.2-7.5 9.5C7.5 20.2 4.5 16.4 4.5 12V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>` },
    { id: "parent", group: "ui", body: `<circle cx="12" cy="7" r="3.4"/><path d="M4.5 20.5c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5"/>` },

    // ---- game ----
    { id: "dino-footprint", group: "game", body: `<path d="M8 15c-2.2 0-3.5-1.6-3.5-3.7S6 7.5 8 7.5s3.5 1.7 3.5 3.8S10.2 15 8 15z"/><path d="M15.5 9.5c-1.8 0-3-1.3-3-3s1.2-3 3-3 3 1.3 3 3-1.2 3-3 3z"/><path d="M16 20c-1.6 0-2.6-1.2-2.6-2.7s1-2.7 2.6-2.7 2.7 1.2 2.7 2.7S17.6 20 16 20z"/>` },
    { id: "dino-egg", group: "game", body: `<path d="M12 3c3.6 0 6.2 4.2 6.2 8.2S15.6 21 12 21s-6.2-5.6-6.2-9.8S8.4 3 12 3z"/><path d="M9.5 11.5l2 2 3.5-4"/>` },
    { id: "roar", group: "game", body: `<path d="M4 9.5c1.8-1.4 3.5-1.4 5 0s3 1.4 4.5 0 3-1.4 4.5 0"/><path d="M4 15c1.8-1.4 3.5-1.4 5 0s3 1.4 4.5 0 3-1.4 4.5 0"/><path d="M6 4.5l1.6 2M12 3.5V6M18 4.5L16.4 6"/>` },
    { id: "echo", group: "game", body: `<path d="M4 12h3l2-4 3 8 2.5-6 1.5 2h4"/>` },
    { id: "twin", group: "game", body: `<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>` },
    { id: "drum", group: "game", body: `<ellipse cx="12" cy="8" rx="7.5" ry="3"/><path d="M4.5 8v8c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V8"/><path d="M8 10.5l1 6M16 10.5l-1 6"/>` },
    { id: "maze", group: "game", body: `<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M3.5 9h8V4.5M11.5 20.5V13H20M20 13V7"/>` },
    { id: "leaf", group: "game", body: `<path d="M4.5 19.5C4.5 11 9 5.5 19.5 4.5c1 10.5-4.5 15-13 15z"/><path d="M8.5 15.5C11 12 14 10 17.5 9"/>` },
    { id: "gift", group: "game", body: `<rect x="3.5" y="9" width="17" height="11.5" rx="1.5"/><path d="M2.5 9h19v3.5h-19zM12 9v11.5"/><path d="M12 9C10.5 5.5 8 5 8 7s4 2 4 2zM12 9c1.5-3.5 4-4 4-2s-4 2-4 2z"/>` },

    // ---- hud ----
    { id: "bell", group: "hud", body: `<path d="M6 17V10.5a6 6 0 0 1 12 0V17l1.8 2.4H4.2z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>` },
    { id: "candle", group: "hud", body: `<rect x="9" y="10" width="6" height="11" rx="1"/><path d="M12 10V6.5M12 3.2c1.2 1.3 1.8 2.3 1.8 3.2a1.8 1.8 0 0 1-3.6 0c0-.9.6-1.9 1.8-3.2z"/>` },
    { id: "light", group: "hud", body: `<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>` },
    { id: "snowflake", group: "hud", body: `<path d="M12 2.5v19M4 7.2l16 9.6M20 7.2L4 16.8"/><path d="M9 5l3 2.5L15 5M9 19l3-2.5 3 2.5M4.8 10.2L7.6 9l.4-3M19.2 13.8L16.4 15l-.4 3M4.8 13.8L7.6 15l.4 3M19.2 10.2L16.4 9l-.4-3"/>` },
    { id: "tree", group: "hud", body: `<path d="M12 3l5 7h-3l4 6H6l4-6H7z"/><path d="M12 16v5"/>` },
    { id: "house", group: "hud", body: `<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.8V20h12V9.8"/><path d="M10 20v-5.5h4V20"/>` },
    { id: "puzzle", group: "game", body: `<path d="M4 9.5h4.2a2 2 0 1 0 3.6 0H20V4h-5.5a2 2 0 1 1 0-3.6V4H4z"/><path d="M4 14.5h2.8a2 2 0 1 1 0 3.6V20H4z"/>` }
];

/**
 * 產出 SVG 檔案。
 * @param {IconSpec} spec
 */
function writeIcon(spec) {
    const fill = spec.fill === "true";
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
     fill="${fill ? "currentColor" : "none"}" stroke="${fill ? "none" : "currentColor"}"
     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${spec.id}">
  ${spec.body}
</svg>
`;
    writeFileSync(join(outDir, `${spec.id}.svg`), svg);
}

for (const spec of icons) {
    writeIcon(spec);
}

// manifest
const manifest = icons.map((i) => ({ id: i.id, group: i.group, file: `${i.id}.svg` }));
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(`[OK] 產生 ${icons.length} 個 SVG icon`);
