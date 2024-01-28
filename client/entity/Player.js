import {Texture} from "../loader/Texture.js";
import {CREATIVE_REACH, EntityIds, PLAYER_BB, SURVIVAL_REACH} from "../common/metadata/Entities.js";
import {CServer} from "../main/Game.js";
import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";
import {getItemTexture} from "../common/metadata/Items.js";
import {C_Entity} from "./Entity.js";
import DefaultSkin from "../main/DefaultSkin.js";
import {Metadata} from "../common/metadata/Metadata.js";

function getSwing() {
    const p = 400;
    const mod = performance.now() % p;
    return (mod > p / 2 ? -1 : 1) * Math.PI / 2.5
}

export class C_Player extends C_Entity {
    breaking = null;
    breakingTime = 0;
    handItem = null;

    // the rendering x,y positions of the player for smoothing the movement
    renderX = 0;
    renderY = 0;

    // (head rotation)
    rotation = 0; // IN DEGREES

    // self explanatory properties:
    renderHeadRotation = 0; // IN DEGREES

    walkingRemaining = 0; // the seconds for walking to end
    swingRemaining = 0; // the seconds for hand swinging to end

    renderLeftArmRotation = 0;
    renderRightArmRotation = 0;
    renderLeftLegRotation = 0;
    renderRightLegRotation = 0;

    leftArmRotation = 0;
    rightArmRotation = 0;
    leftLegRotation = 0;
    rightLegRotation = 0;

    constructor(id, world, username, skinData) {
        super(id, EntityIds.PLAYER, world, PLAYER_BB);
        this.username = username;
        this.skinData = skinData ?? DefaultSkin;
    };

    handleMovement() {
        if (this === CServer.player) CServer.canUpdateMovement = true;
        this.walkingRemaining = this === CServer.player ? 0.1 : 0.3;
        super.handleMovement();
    };

    update(dt) {
        this.walkingRemaining -= dt;
        this.swingRemaining -= dt;
        if (this.walkingRemaining <= 0) this.walkingRemaining = 0;
        if (this.swingRemaining <= 0) this.swingRemaining = 0;
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

            const head = [
                pos.x + this.baseBB.x1 * BASE_BLOCK_SIZE, pos.y - (this.baseBB.y2 + 0.125) * BASE_BLOCK_SIZE,
                BASE_BLOCK_SIZE * 0.5, BASE_BLOCK_SIZE * 0.5
            ];

            const leg = [
                pos.x + (this.baseBB.x1 + 0.125) * BASE_BLOCK_SIZE, pos.y - (this.baseBB.y2 - 1.25 + 0.125) * BASE_BLOCK_SIZE,
                BASE_BLOCK_SIZE * 0.25, BASE_BLOCK_SIZE * 0.75
            ];

            const armBody = [
                pos.x + (this.baseBB.x1 + 0.125) * BASE_BLOCK_SIZE, pos.y - (this.baseBB.y2 - 0.5 + 0.125) * BASE_BLOCK_SIZE,
                BASE_BLOCK_SIZE * 0.25, BASE_BLOCK_SIZE * 0.75
            ];

            this.renderRightArmRotation += (this.rightArmRotation - this.renderRightArmRotation) / 20;
            this.renderLeftArmRotation += (this.leftArmRotation - this.renderLeftArmRotation) / 20;
            this.renderRightLegRotation += (this.rightLegRotation - this.renderRightLegRotation) / 20;
            this.renderLeftLegRotation += (this.leftLegRotation - this.renderLeftLegRotation) / 20;

            // f(0) = 0
            // f(250) = pi / 4
            // f(500) = 0
            // f(750) = -pi / 4
            // f(1000) = 0 (period)
            const isWalking = this.walkingRemaining > 0;
            const isSwinging = this.swingRemaining > 0;
            const isBreaking = this.breaking;

            if (isWalking) {
                const f = getSwing();
                if (isSwinging) {
                    this.leftArmRotation = 0;
                    this.rightArmRotation = (bodyRotation ? -1 : 1) * Math.PI / 2.5;
                } else if (isBreaking) {
                    this.leftArmRotation = 0;
                    this.rightArmRotation = f;
                } else {
                    this.leftArmRotation = f;
                    this.rightArmRotation = -f;
                }
                const onGround = this.isOnGround();
                const mul = onGround ? 0.7 : 0.5;
                this.rightLegRotation = -f * mul;
                this.leftLegRotation = f * mul;
            } else {
                if (isSwinging) {
                    this.rightArmRotation = (bodyRotation ? -1 : 1) * Math.PI / 2.5;
                } else if (isBreaking) {
                    this.rightArmRotation = Math.max(0, getSwing()) * (bodyRotation ? -1 : 1);
                } else this.rightArmRotation = 0;
                this.leftArmRotation = 0;
                this.rightLegRotation = this.leftLegRotation = 0;
            }

            ctx.save();
            ctx.translate(armBody[0] + armBody[2] / 2, armBody[1]);
            ctx.rotate(this.renderLeftArmRotation);
            ctx.drawImage(side.back_arm, -armBody[2] / 2, 0, armBody[2], armBody[3]);
            ctx.restore();

            ctx.save();
            ctx.translate(leg[0] + leg[2] / 2, leg[1]);
            ctx.rotate(this.renderLeftLegRotation);
            ctx.drawImage(side.back_leg, -leg[2] / 2, 0, leg[2], leg[3]);
            ctx.restore();

            ctx.drawImage(side.body, ...armBody);

            ctx.save();
            ctx.translate(leg[0] + leg[2] / 2, leg[1]);
            ctx.rotate(this.renderRightLegRotation);
            ctx.drawImage(side.front_leg, -leg[2] / 2, 0, leg[2], leg[3]);
            ctx.restore();

            const item = this === CServer.player ? CServer.getHandItem() : this.handItem;

            ctx.save();
            ctx.translate(armBody[0] + armBody[2] / 2, armBody[1]);
            ctx.rotate(this.renderRightArmRotation);
            ctx.fillStyle = "white";
            ctx.drawImage(side.front_arm, -armBody[2] / 2, 0, armBody[2], armBody[3]);
            if (item) {
                const texture = Texture.get(getItemTexture(item.id, item.meta));
                if (Metadata.toolTypeItems[item.id]) {
                    ctx.drawImage(
                        bodyRotation ? texture.image : texture.flip(),
                        bodyRotation ? -armBody[2] * 0.5 : -armBody[2] * 2.5, 0,
                        BASE_BLOCK_SIZE * 0.8, BASE_BLOCK_SIZE * 0.8
                    );
                } else ctx.drawImage(
                    texture.image,
                    bodyRotation ? 0 : -armBody[2] * 1.5, armBody[3] * 0.8,
                    BASE_BLOCK_SIZE * 0.4, BASE_BLOCK_SIZE * 0.4
                );
            }
            ctx.restore();

            ctx.save();
            ctx.translate(head[0] + head[2] / 2, head[1] + head[3] * 0.55);
            ctx.rotate((this.renderHeadRotation + (bodyRotation ? 0 : 180)) * Math.PI / 180);
            ctx.drawImage(side.head, -head[2] / 2, -head[3] / 2, head[2], head[3]);
            head[0] -= 0.015 * BASE_BLOCK_SIZE;
            head[1] -= 0.015 * BASE_BLOCK_SIZE;
            head[3] = head[2] += 0.03 * BASE_BLOCK_SIZE;
            ctx.drawImage(side.head_topping, -head[2] / 2, -head[3] / 2, head[2], head[3]);
            ctx.restore();
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