import {Texture} from "../loader/Texture.js";
import {CREATIVE_REACH, EntityIds, PLAYER_BB, SURVIVAL_REACH} from "../common/metadata/Entities.js";
import {CServer} from "../main/Game.js";
import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";
import {getItemTexture} from "../common/metadata/Items.js";
import {C_Entity} from "./Entity.js";
import DefaultSkin from "../main/DefaultSkin.js";

export class C_Player extends C_Entity {
    breaking = null;
    breakingTime = 0;
    handItem = null;
    renderX = 0;
    renderY = 0;
    rotation = 0; // IN DEGREES
    renderHeadRotation = 0; // IN DEGREES
    renderLeftArmRotation = 0;
    renderRightArmRotation = 0;
    renderLeftLegRotation = 0;
    renderRightLegRotation = 0;

    constructor(id, world, username, skinData) {
        super(id, EntityIds.PLAYER, world, PLAYER_BB);
        this.username = username;
        this.skinData = skinData ?? DefaultSkin;
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

    render(ctx) {
        ctx.textAlign = "center";
        this.renderX += (this.x - this.renderX) / 5;
        this.renderY += (this.y - this.renderY) / 5;
        // this.renderHeadRotation += (this.rotation - this.renderHeadRotation) / 3;
        this.renderHeadRotation = this.rotation;
        if (this === CServer.player) {
            this.renderX = this.x;
            this.renderY = this.y;
            this.renderHeadRotation = this.rotation;
        }
        const pos = getCanvasPosition(this.renderX, this.renderY);
        ctx.font = "16px monospace";
        ctx.fillStyle = "white";
        ctx.fillText(this.username, pos.x, pos.y - (this.baseBB.y2 + 0.125) * BASE_BLOCK_SIZE - 10);
        const skin = Texture.get(this.skinData).skin();
        const bodyRotation = this.renderHeadRotation > -90 && this.renderHeadRotation < 90;

        if (skin) {
            const side = skin[bodyRotation ? 0 : 1];
            const pos = getCanvasPosition(this.renderX ?? this.x, this.renderY ?? this.y);

            const armBody = [
                pos.x + (this.baseBB.x1 + 0.125) * BASE_BLOCK_SIZE, pos.y - (this.baseBB.y2 - 0.5 + 0.125) * BASE_BLOCK_SIZE,
                BASE_BLOCK_SIZE * 0.25, BASE_BLOCK_SIZE * 0.75
            ];

            ctx.save();
            ctx.translate(armBody[0] + armBody[2] / 2, armBody[1]);
            ctx.rotate(this.renderLeftArmRotation);
            ctx.drawImage(side.back_arm, -armBody[2] / 2, 0, armBody[2], armBody[3]);
            ctx.restore();

            const head = [
                pos.x + this.baseBB.x1 * BASE_BLOCK_SIZE, pos.y - (this.baseBB.y2 + 0.125) * BASE_BLOCK_SIZE,
                BASE_BLOCK_SIZE * 0.5, BASE_BLOCK_SIZE * 0.5
            ];
            ctx.save();
            ctx.translate(head[0] + head[2] / 2, head[1] + head[3] / 2);
            ctx.rotate((this.renderHeadRotation + (bodyRotation ? 0 : 180)) * Math.PI / 180);
            ctx.drawImage(side.head, -head[2] / 2, -head[3] / 2, head[2], head[3]);
            head[0] -= 0.015 * BASE_BLOCK_SIZE;
            head[1] -= 0.015 * BASE_BLOCK_SIZE;
            head[3] = head[2] += 0.03 * BASE_BLOCK_SIZE;
            ctx.drawImage(side.head_topping, -head[2] / 2, -head[3] / 2, head[2], head[3]);
            ctx.restore();

            ctx.drawImage(side.body, ...armBody);

            ctx.save();
            ctx.translate(armBody[0] + armBody[2] / 2, armBody[1]);
            ctx.rotate(this.renderRightArmRotation);
            ctx.drawImage(side.front_arm, -armBody[2] / 2, 0, armBody[2], armBody[3]);
            ctx.restore();

            const leg = [
                pos.x + (this.baseBB.x1 + 0.125) * BASE_BLOCK_SIZE, pos.y - (this.baseBB.y2 - 1.25 + 0.125) * BASE_BLOCK_SIZE,
                BASE_BLOCK_SIZE * 0.25, BASE_BLOCK_SIZE * 0.75
            ];

            ctx.save();
            ctx.translate(leg[0] + leg[2] / 2, leg[1]);
            ctx.rotate(this.renderLeftLegRotation);
            ctx.drawImage(side.back_leg, -leg[2] / 2, 0, leg[2], leg[3]);
            ctx.restore();

            ctx.save();
            ctx.translate(leg[0] + leg[2] / 2, leg[1]);
            ctx.rotate(this.renderRightLegRotation);
            ctx.drawImage(side.front_leg, -leg[2] / 2, 0, leg[2], leg[3]);
            ctx.restore();
        }

        /*this.renderImage(
            this.bodyRotation ? Texture.get(STEVE_TEXTURE_PATH).image : Texture.get(STEVE_TEXTURE_PATH).flip(),
            ctx
        );*/
        const item = this === CServer.player ? CServer.getHandItem() : this.handItem;
        if (item) {
            const texture = getItemTexture(item.id, item.meta);
            ctx.drawImage(
                Texture.get(texture).image,
                pos.x + (bodyRotation ? 0 : -BASE_BLOCK_SIZE * 0.4),
                pos.y - BASE_BLOCK_SIZE * 0.4,
                BASE_BLOCK_SIZE * 0.4, BASE_BLOCK_SIZE * 0.4
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