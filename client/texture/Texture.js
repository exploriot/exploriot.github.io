const placeholderImage = document.createElement("canvas");

const textures = {};
const flippedTextures = {};

export async function loadTexture(loc) {
    if (textures[loc]) return await textures[loc];
    const img = new Image;
    img.src = loc;
    return textures[loc] = new Promise(r => {
        img.onload = () => r(textures[loc] = img);
    });
}

export function getTexture(loc, load = true) {
    const e = textures[loc];
    if (load) loadTexture(loc).then(r => r);
    return !e || e instanceof Promise ? placeholderImage : e;
}

export function getFlippedTexture(loc, load = true) {
    const e = textures[loc];
    if (load) loadTexture(loc).then(r => r);
    if (!e || e instanceof Promise) return placeholderImage;
    return flippedTextures[loc] ??= flipImage(e);
}

export function flipImage(image, horizontal = true) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(horizontal ? -1 : 1, horizontal ? 1 : -1);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
    return canvas;
}