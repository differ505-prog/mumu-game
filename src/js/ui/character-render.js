/**
 * 角色渲染 — 載入去背素材並套用情緒／動作狀態。
 */

/**
 * @typedef {"idle"|"listen"|"happy"|"sad"|"hint"|"roar"|"walk"|"hatch"} CharacterMood
 */

/**
 * 渲染角色。
 * @param {HTMLElement} mount
 * @param {any} character
 * @param {CharacterMood} mood
 */
export function renderCharacter(mount, character, mood = "idle") {
    if (!mount || !character) return;

    const art = character.art?.file || "";
    mount.className = `char char--${mood}`;
    mount.innerHTML = `
        <img class="char__art" src="${art}" alt="${character.name?.["zh-TW"] || character.id}" />
        <div class="char__shadow"></div>
    `;
}

/**
 * 視線追隨游標。
 * @param {HTMLElement} mount
 * @param {number} x
 * @param {number} y
 */
export function lookAt(mount, x, y) {
    if (!mount) return;
    const art = /** @type {HTMLElement} */ (mount.querySelector(".char__art"));
    if (!art) return;
    const rect = mount.getBoundingClientRect();
    const dx = (x - rect.left - rect.width / 2) / rect.width;
    const dy = (y - rect.top - rect.height / 2) / rect.height;
    art.style.transform = `translate(${dx * 8}px, ${dy * 4}px)`;
}

/**
 * 隨機眨眼（僅閒置時）。
 * @param {HTMLElement} mount
 */
export function blink(mount) {
    if (!mount) return;
    const art = /** @type {HTMLElement} */ (mount.querySelector(".char__art"));
    if (!art) return;
    art.classList.remove("anim-blink");
    void art.offsetWidth;
    art.classList.add("anim-blink");
}

/**
 * 播放吼叫演出。
 * @param {HTMLElement} mount
 */
export function playRoar(mount) {
    if (!mount) return;
    mount.classList.remove("char--roar");
    void mount.offsetWidth;
    mount.classList.add("char--roar");
    setTimeout(() => mount.classList.remove("char--roar"), 1200);
}

/**
 * 播放步行循環。
 * @param {HTMLElement} mount
 */
export function playWalk(mount) {
    if (!mount) return;
    mount.classList.add("char--walk");
}

/**
 * 停止步行循環。
 * @param {HTMLElement} mount
 */
export function stopWalk(mount) {
    if (!mount) return;
    mount.classList.remove("char--walk");
}

/**
 * 播放破殼演出。
 * @param {HTMLElement} mount
 */
export function playHatch(mount) {
    if (!mount) return;
    mount.classList.remove("char--hatch");
    void mount.offsetWidth;
    mount.classList.add("char--hatch");
    setTimeout(() => mount.classList.remove("char--hatch"), 900);
}
