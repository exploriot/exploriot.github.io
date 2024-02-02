const imagePlaceholder = typeof global === "undefined" ? document.createElement("canvas") : null;

// BASED ON 64x64
const SKIN_PARTS = [
    ["head", [0, 8, 8, 8], [16, 8, 8, 8]],
    ["head_topping", [32, 8, 8, 8], [48, 8, 8, 8]],

    ["body", [16, 20, 4, 12], [28, 20, 4, 12]],

    ["front_arm", [40, 20, 4, 12], [40, 52, 4, 12]],
    ["back_arm", [32, 52, 4, 12], [48, 20, 4, 12]],

    ["front_leg", [0, 20, 4, 12], [24, 52, 4, 12]],
    ["back_leg", [16, 52, 4, 12], [8, 20, 4, 12]]
];

function cropImage(image, x, y, width, height) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    return canvas;
}

export class Texture {
    static EXTENSIONS = [
        "png", "jpg", "jpeg"
    ];

    /*** @type {Object<string, Texture>} */
    static textures = {};
    /*** @type {Object<string, HTMLCanvasElement>} **/
    static shadows = {};

    image = imagePlaceholder;
    _flipped = [null, null];
    _rotated = {};
    _skin = null;

    /**
     * @param {Promise<Image>} promise
     * @param {string} actualSrc
     */
    constructor(promise, actualSrc) {
        this._promise = promise;
        promise.then(image => this.image = image);
        this.actualSrc = actualSrc;
    };

    destroy() {
        delete Texture.textures[this.actualSrc];
        delete this._flipped;
        delete this.image;
        delete this._rotated;
        delete this._skin;
    };

    get loaded() {
        return this.image !== imagePlaceholder;
    };

    static flipImage(image, way = 1) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.save();
        ctx.translate(canvas.width, 0);
        if (way === 1) ctx.scale(-1, 1);
        else ctx.scale(1, -1);
        ctx.drawImage(image, 0, 0);
        ctx.restore();
        return canvas;
    };

    static rotateImage(image, degrees = 90) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(image, -canvas.width / 2, -canvas.height / 2);
        ctx.restore();
        return canvas;
    };

    static readSkin(image) {
        const dim = image.width / 64;
        const sides = [{}, {}];
        for (const part of SKIN_PARTS) {
            let d = false;
            for (let i = 0; i < 2; i++) {
                let p = part[i + 1];
                if ((p[0] + p[2] > image.width || p[1] + p[2] > image.height)) {
                    if (i === 0) d = true;
                    else sides[i][part[0]] = sides[0][part[0]];
                    continue;
                }
                sides[i][part[0]] = cropImage(image, p[0] * dim, p[1] * dim, p[2] * dim, p[3] * dim);
                if (d) sides[1 - i][part[0]] = sides[i][part[0]];
            }
        }
        return sides;
    };

    static get(src) {
        if (!src) return texturePlaceholder;
        if (Texture.textures[src]) return Texture.textures[src];
        const startMs = performance.now();
        if (!src) throw new Error("Invalid texture src.");
        const image = new Image;
        let resolve;
        const prom = new Promise(r => resolve = r);
        image.src = src;
        image.addEventListener("load", () => {
            resolve(image);
            console.log("%cLoaded " + src + " in " + Math.floor(performance.now() - startMs) + "ms.", "color: #00ff00");
        });
        image.addEventListener("error", () => {
            console.log("%cFailed to load " + src, "color: #ff0000");
        });
        return Texture.textures[src] = new Texture(prom, src);
    };

    flip(way = 1) {
        if (!this.loaded) return imagePlaceholder;
        return this._flipped[way] ??= Texture.flipImage(this.image, way);
    };

    rotate(degrees = 90) {
        if (!this.loaded) return imagePlaceholder;
        return this._rotated[degrees] ??= Texture.rotateImage(this.image, degrees);
    };

    /**
     * @return {{head, head_topping, body, front_arm, back_arm, front_leg, back_leg}[] | null}
     */
    skin() {
        if (!this.loaded) return null;
        return this._skin ??= Texture.readSkin(this.image);
    };

    async wait() {
        await this._promise;
    };
}

const texturePlaceholder = new Texture(new Promise(() => imagePlaceholder), "");