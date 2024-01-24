import {Texture} from "../loader/Texture.js";
import {CREATIVE_REACH, EntityIds, PLAYER_BB, SURVIVAL_REACH} from "../common/metadata/Entities.js";
import {C_BodyEntity} from "./BodyEntity.js";
import {CServer} from "../main/Game.js";
import {getCanvasPosition} from "../Utils.js";
import {getItemTexture} from "../common/metadata/Items.js";

export const STEVE_TEXTURE_PATH = "./assets/entities/steve.png";

export class C_Player extends C_BodyEntity {
    breaking = null;
    breakingTime = 0;
    handItem = null;
    renderX = 0;
    renderY = 0;

    constructor(id, world, username) {
        super(id, EntityIds.PLAYER, world, PLAYER_BB);
        this.username = username;
    };

    handleMovement() {
        if (this === CServer.player) CServer.canUpdateMovement = true;
        super.handleMovement();
    };

    update(dt) {
        return super.update(dt);
    };

    getBlockReach() {
        return CServer.getGamemode() % 2 ? CREATIVE_REACH : SURVIVAL_REACH;
    };

    canReachBlock(x, y) {
        return (x - this.x) ** 2 + (y - this.y) ** 2 <= this.getBlockReach() ** 2;
    };

    render(ctx, size) {
        ctx.textAlign = "center";
        this.renderX += (this.x - this.renderX) / 5;
        this.renderY += (this.y - this.renderY) / 5;
        if (this === CServer.player) {
            this.renderX = this.x;
            this.renderY = this.y;
        }
        const pos = getCanvasPosition(this.renderX, this.renderY, size);
        ctx.font = "16px monospace";
        ctx.fillStyle = "white";
        ctx.fillText(this.username, pos.x, pos.y - this.baseBB.y2 * size - 10);
        this.renderImage(
            this.bodyRotation ? Texture.get(STEVE_TEXTURE_PATH).image : Texture.get(STEVE_TEXTURE_PATH).flip(),
            ctx, size
        );
        const item = this === CServer.player ? CServer.getHandItem() : this.handItem;
        if (item) {
            const texture = getItemTexture(item.id, item.meta);
            ctx.drawImage(
                Texture.get(texture).image, pos.x + (this.bodyRotation ? 0 : -size * 0.4), pos.y - size * 0.4, size * 0.4, size * 0.4
            );
        }
    };

    removeBlockBreakProcess() {
        if (this.breaking) {
            const breaks = this.world.breakChunks[this.breaking.x >> 4] ??= [];
            if (breaks.includes(this)) breaks.splice(breaks.indexOf(this), 1);
        }
    };

    reAddBlockBreakProcess(chunkX) {
        this.removeBlockBreakProcess();
        const breaks = this.world.breakChunks[chunkX] ??= [];
        if (!breaks.includes(this)) breaks.push(this);
    };

    remove() {
        super.remove();
        this.removeBlockBreakProcess();
    };
}