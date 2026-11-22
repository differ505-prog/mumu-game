/**
 * 場景天氣粒子 — 消費 content/scenes.json 的 `weather` 欄位。
 *
 * Step 120：每個場景的天氣都必須有對應的環境粒子；
 * 沒有對應天氣的場景，**必須**在 scenes.json 移除該欄位（不留死欄位）。
 */

/** 天氣 → 粒子種類。 @type {Record<string,string>} */
const WEATHER_KIND = {
    snow: "snow",
    mist: "mist",
    aurora: "aurora"
};

/**
 * 判斷是否為已支援的天氣。
 * @param {string} weather
 * @returns {boolean}
 */
export function isSupportedWeather(weather) {
    return Boolean(weather) && Boolean(WEATHER_KIND[weather]);
}

/**
 * 取得天氣的粒子種類。
 * @param {string} weather
 * @returns {string}
 */
export function weatherKind(weather) {
    return WEATHER_KIND[weather] || "none";
}
