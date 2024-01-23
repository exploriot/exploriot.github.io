const imagePlaceholder = document.createElement("canvas");

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

    /**
     * @param {Promise<Image>} promise
     * @param {string} actualSrc
     */
    constructor(promise, actualSrc) {
        this._promise = promise;
        promise.then(image => this.image = image);
        this.actualSrc = actualSrc;
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

    static shadow(opacity, size) {
        if (Texture.shadows[opacity + ";" + size]) return Texture.shadows[opacity + ";" + size];
        const cnv = document.createElement("canvas");
        const ct = cnv.getContext("2d");
        cnv.width = size;
        cnv.height = size;
        ct.globalAlpha = opacity;
        ct.fillRect(0, 0, size, size);
        return Texture.shadows[opacity + ";" + size] = cnv;
    };

    flip(way = 1) {
        if (!this.loaded) return imagePlaceholder;
        return this._flipped[way] = this._flipped[way] || Texture.flipImage(this.image, way);
    };

    async wait() {
        await this._promise;
    };
}

const texturePlaceholder = new Texture(new Promise(() => imagePlaceholder), "");