import {EntityIds, ZOMBIE_BB} from "../common/metadata/Entities.js";
import {CServer, ctx} from "../main/Game.js";
import {BASE_BLOCK_SIZE, getCanvasPosition, renderPlayerModel} from "../Utils.js";
import {C_Entity} from "./Entity.js";
import {getCurrentSwing} from "./Player.js";
import {Texture} from "../loader/Texture.js";

let zombieTexture;
let zombieSkin;

export class C_ZombieEntity extends C_Entity {
    HAS_RENDER_POS = true;

    walkingRemaining = 0;

    renderLeftArmRotation = 0;
    renderRightArmRotation = 0;
    renderLeftLegRotation = 0;
    renderRightLegRotation = 0;

    leftArmRotation = 0;
    rightArmRotation = 0;
    leftLegRotation = 0;
    rightLegRotation = 0;

    constructor(id, world) {
        super(id, EntityIds.ZOMBIE, world, ZOMBIE_BB);

        if (!zombieTexture) {
            zombieTexture = Texture.get("assets/entities/zombie.png");
            zombieTexture.wait().then(() => zombieSkin = zombieTexture.skin());
        }
    };

    update(dt) {
        this.walkingRemaining -= dt;
        if (this.walkingRemaining <= 0) this.walkingRemaining = 0;
        return super.update(dt);
    };

    render() {
        super.render();

        this.renderRightArmRotation += (this.rightArmRotation - this.renderRightArmRotation) / 20;
        this.renderLeftArmRotation += (this.leftArmRotation - this.renderLeftArmRotation) / 20;
        this.renderRightLegRotation += (this.rightLegRotation - this.renderRightLegRotation) / 20;
        this.renderLeftLegRotation += (this.leftLegRotation - this.renderLeftLegRotation) / 20;

        const isWalking = this.walkingRemaining > 0;

        if (isWalking) {
            const f = getCurrentSwing();
            this.leftArmRotation = f;
            this.rightArmRotation = -f;
            const onGround = this.isOnGround();
            const mul = onGround ? 0.7 : 0.5;
            this.rightLegRotation = -f * mul;
            this.leftLegRotation = f * mul;
        } else {
            this.rightArmRotation = 0;
            this.leftArmRotation = 0;
            this.rightLegRotation = this.leftLegRotation = 0;
        }

        if (zombieSkin) renderPlayerModel(ctx, {
            SIZE: BASE_BLOCK_SIZE,
            pos: getCanvasPosition(this.renderX, this.renderY),
            renderX: this.renderX,
            renderY: this.renderY,
            skin: zombieSkin,
            bodyRotation: true,
            leftArmRotation: this.renderLeftArmRotation,
            leftLegRotation: this.renderLeftLegRotation,
            rightLegRotation: this.renderRightLegRotation,
            rightArmRotation: this.renderRightArmRotation,
            headRotation: this.renderHeadRotation,
            handItem: this === CServer.player ? CServer.getHandItem() : this.handItem
        });
    };
}