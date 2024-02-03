import {Particle} from "./Particle.js";
import {ParticleIds} from "../common/metadata/ParticleIds.js";
import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";
import {ctx} from "../main/Game.js";
import {Texture} from "../loader/Texture.js";

export class ExplosionParticle extends Particle {
    constructor(x, y, extra) {
        super(ParticleIds.EXPLOSION, x, y, extra);
    };

    getDuration() {
        return 300;
    };

    render() {
        const pos = getCanvasPosition(this.x, this.y);
        const r = BASE_BLOCK_SIZE * this.extra.radius;
        ctx.drawImage(
            Texture.get("assets/particles/explosion_" + Math.min(Math.floor(16 - (this.endsAt - Date.now()) / this.getDuration() * 16), 15) + ".png").image,
            pos.x - r / 2, pos.y - r / 2,
            r, r
        )
    };
}