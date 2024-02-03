import {Particle} from "./Particle.js";
import {ParticleIds} from "../common/metadata/ParticleIds.js";
import {randFloat} from "../common/Utils.js";
import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";
import {getBlockTexture} from "../common/metadata/Blocks.js";
import {ctx} from "../main/Game.js";

const PART_SIZE = 10;

export class BlockParticle extends Particle {
    constructor(x, y, extra) {
        super(ParticleIds.BLOCK_BREAK, x, y, extra);
        this.parts = [];
        for (let i = 0; i < PART_SIZE; i++) this.parts.push({
            x: randFloat(-0.5, 0.5), y: randFloat(-0.5, 0.5),
            vx: randFloat(-0.0025, 0.0025), vy: randFloat(-0.006, 0.006)
        });
    };

    getDuration() {
        return 1000;
    };

    render() {
        const pos = getCanvasPosition(this.x, this.y);
        const texture = getBlockTexture(this.extra.id, this.extra.meta);
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.globalAlpha = (this.endsAt - Date.now()) / this.getDuration();
        for (let i = 0; i < PART_SIZE; i++) {
            const part = this.parts[i];
            part.vy -= 0.0001;
            part.x += part.vx;
            part.y += part.vy;
            ctx.drawImage(texture.image, part.x * BASE_BLOCK_SIZE, -part.y * BASE_BLOCK_SIZE, BASE_BLOCK_SIZE * 0.1, BASE_BLOCK_SIZE * 0.1);
        }
        ctx.restore();
    };
}