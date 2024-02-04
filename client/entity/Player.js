import {Texture} from "../loader/Texture.js";
import {CREATIVE_REACH, EntityIds, PLAYER_BB, SURVIVAL_REACH} from "../common/metadata/Entities.js";
import {CServer, ctx} from "../main/Game.js";
import {BASE_BLOCK_SIZE, getCanvasPosition, renderPlayerModel} from "../Utils.js";
import {C_Entity} from "./Entity.js";
import DefaultSkin from "../main/DefaultSkin.js";

export function getCurrentSwing() {
    const p = 400;
    const mod = performance.now() % p;
    return (mod > p / 2 ? -1 : 1) * Math.PI / 2.5
}

export class C_Player extends C_Entity {
    HAS_RENDER_POS = true;

    breaking = null;
    breakingTime = 0;
    handItem = null;

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
        const texture = Texture.get(this.skinData);
        texture.wait().then(() => this.skin = texture.skin());
    };

    getGamemode() {
        return CServer.getGamemode();
    };

    getHandItem() {
        return CServer.player === this ? CServer.getHandItem() : this.handItem;
    };

    handleMovement() {
        if (this === CServer.player) {
            CServer.canUpdateMovement = true;
            CServer.canUpdateMouse = true;
            if (this.lastX !== this.x) {
                this.lastX = this.x;
                this.walkingRemaining = 0.3;
            }
        }
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

    getTouchReach() {
        return CServer.getGamemode() % 2 ? CREATIVE_REACH : SURVIVAL_REACH;
    };

    render() {
        super.render();
        ctx.textAlign = "center";
        // this.renderHeadRotation += (this.rotation - this.renderHeadRotation) / 3;
        this.renderHeadRotation = this.rotation;
        if (this === CServer.player) {
            this.renderHeadRotation = this.rotation;
        }
        const pos = getCanvasPosition(this.renderX, this.renderY);
        ctx.font = "16px Minecraft";
        ctx.fillStyle = "white";
        ctx.fillText(this.username, pos.x, pos.y - (this.baseBB.y2 + 0.125) * BASE_BLOCK_SIZE - 10);
        const bodyRotation = this.renderHeadRotation > -90 && this.renderHeadRotation < 90;
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
            const f = getCurrentSwing();
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
                this.rightArmRotation = Math.max(0, getCurrentSwing()) * (bodyRotation ? -1 : 1);
            } else this.rightArmRotation = 0;
            this.leftArmRotation = 0;
            this.rightLegRotation = this.leftLegRotation = 0;
        }

        if (this.skin) renderPlayerModel(ctx, {
            SIZE: BASE_BLOCK_SIZE,
            pos: getCanvasPosition(this.renderX, this.renderY),
            renderX: this.renderX,
            renderY: this.renderY,
            skin: this.skin,
            bodyRotation,
            leftArmRotation: this.renderLeftArmRotation,
            leftLegRotation: this.renderLeftLegRotation,
            rightLegRotation: this.renderRightLegRotation,
            rightArmRotation: this.renderRightArmRotation,
            headRotation: this.renderHeadRotation,
            handItem: this === CServer.player ? CServer.getHandItem() : this.handItem
        });
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