import {BoundingBox} from "./BoundingBox.js";
import {getEntityName, GRAVITY_FORCE} from "../metadata/Entities.js";
import {Ids} from "../metadata/Ids.js";

export class Entity {
    /*** @type {number | null} */
    lastChunkX = null;
    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    eyeHeight = 0;

    /**
     * @param {number} id
     * @param {number} type
     * @param {World | C_World | S_World} world
     * @param {BoundingBox} bb
     */
    constructor(id, type, world, bb) {
        this.id = id;
        this.type = type;
        this.world = world;
        this.baseBB = bb;
        this.bb = bb?.clone();
        this.downBB = bb?.clone();
    };

    getHandItem() {
        return null;
    };

    getMainInventory() {
        return null;
    };

    getHandIndex() {
        return 0;
    };

    getGamemode() {
        return 0;
    };

    isSurvival() {
        return this.getGamemode() === 0;
    };

    isCreative() {
        return this.getGamemode() === 1;
    };

    isAdventure() {
        return this.getGamemode() === 2;
    };

    isSpectator() {
        return this.getGamemode() === 3;
    };

    getBlockReach() {
        return 0;
    };

    getTouchReach() {
        return 0;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    canReachBlock(x, y) {
        return (x - this.x) ** 2 + (y - this.y) ** 2 <= this.getBlockReach() ** 2;
    };

    /**
     * @param {Entity} entity
     * @return {boolean}
     */
    canTouchEntity(entity) {
        return this.distance(entity.x, entity.y) <= this.getTouchReach();
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    canInteractBlockAt(x, y) {
        return this.world.canInteractBlockAt(x, y, this.getHandItem(), this);
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    canPlaceBlockAt(x, y) {
        const item = this.getHandItem();
        return item && this.world.canPlaceBlockAt(x, y, item.id, item.meta, this);
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    canBreakBlockAt(x, y) {
        return this.world.canBreakBlockAt(x, y, this.getHandItem(), this.isCreative(), this);
    };

    getName() {
        return getEntityName(this.type);
    };

    getWorld() {
        return this.world;
    };

    update(dt) {
        if (this.isOnGround()) this.vx *= 0.9;
        else this.vx *= 0.999;
        this.vy *= 0.999;
        return this.move(this.vx * dt, this.vy * dt);
    };

    recalculateBoundingBox() {
        this.bb.x1 = this.x + this.baseBB.x1;
        this.bb.y1 = this.y + this.baseBB.y1;
        this.bb.x2 = this.x + this.baseBB.x2;
        this.bb.y2 = this.y + this.baseBB.y2;

        this.downBB.x1 = this.bb.x1;
        this.downBB.y1 = this.bb.y1 - 0.01 - 0.01;
        this.downBB.x2 = this.bb.x2;
        this.downBB.y2 = this.bb.y1 - 0.01;
    };

    forceMove(dx, dy) {
        if (dx === 0 && dy === 0) return false;
        this.x += dx;
        this.y += dy;
        this.handleMovement();
        return true;
    };

    applyVelocity(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    };

    knockFrom(x) {
        this.applyVelocity(x > this.x ? -2 : 2, 3);
    };

    move(dx, dy) {
        if (dx === 0 && dy === 0) return false;
        const already = this.world.getCollidingBlocks(this.bb, false, 1)[0];
        if (already) {
            this.vy = 0;
            this.y += 0.05;
            this.handleMovement();
        }
        let moved = false;
        if (Math.abs(dx) > 0.0000001) {
            this.x += dx;
            const onGround = this.isOnGround();
            this.recalculateBoundingBox();
            const b = this.world.getCollidingBlocks(this.bb, false, 1)[0];
            if (!already && b) {
                //const maxY = b.collisions.sort((a, b) => b.y2 - a.y2)[0].y2 + b.y;
                //const dy = maxY - this.bb.y1;
                const dy = 0.5002;
                if (onGround) {
                    this.y += dy;
                    this.recalculateBoundingBox();
                    // check if it will bump into something if it steps up
                    if (this.world.getCollidingBlocks(this.bb, false, 1)[0]) {
                        this.y -= dy;
                        this.x -= dx;
                        this.recalculateBoundingBox();
                        this.vx = 0;
                    } else moved = true;
                } else {
                    this.x -= dx;
                    this.recalculateBoundingBox();
                    this.vx = 0;
                }
            } else moved = true;
        }
        if (!already && Math.abs(dy) > 0.0000001) {
            this.y += dy;
            this.recalculateBoundingBox();
            const b = this.world.getCollidingBlocks(this.bb, false, 1)[0];
            if (b) {
                this.y -= dy;
                this.recalculateBoundingBox();
                this.vy = 0;
            } else moved = true;
        }
        if (!moved) return false;
        this.handleMovement();
        return true;
    };

    handleMovement() {
        this.updateChunk();
        this.recalculateBoundingBox();
    };

    updateChunk() {
        const newCX = this.x >> 4;
        if (newCX === this.lastChunkX) return false;
        if (this.world.dirtyChunks) {
            if (this.lastChunkX !== null) this.world.dirtyChunks.add(this.lastChunkX);
            this.world.dirtyChunks.add(newCX);
        }
        this.world.getChunkEntities(this.lastChunkX).delete(this);
        this.world.getChunkEntities(newCX).add(this);
        this.lastChunkX = newCX;
        return true;
    };

    isOnGround() {
        return !!this.world.getCollidingBlocks(this.downBB, false, 1)[0];
    };

    isTouchingFire() {
        return !!this.world.getCollidingBlocks(this.bb, true, 1, [[Ids.FIRE, -1]])[0];
    };

    isTouchingWater() {
        return !!this.world.getCollidingBlocks(this.bb, true, 1, [[Ids.WATER, -1]])[0];
    };

    isTouchingLava() {
        return !!this.world.getCollidingBlocks(this.bb, true, 1, [[Ids.LAVA, -1]])[0];
    };

    isTouchingLiquid() {
        return this.isTouchingWater() || this.isTouchingLava();
    };

    isExposedToAir() {
        return !this.world.getCollidingBlocks(this.bb, true, 1, [[Ids.AIR, -1]])[0];
    };

    isUnderwater() {
        return this.isTouchingWater() && !this.isExposedToAir();
    };

    remove() {
        if (this.lastChunkX !== null) {
            this.world.getChunkEntities(this.lastChunkX).delete(this);
        }
        delete this.world.entityMap[this.id];
    };

    applyGravity(dt) {
        this.vy -= dt * GRAVITY_FORCE;
    };

    distance(x, y) {
        return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
    };

    distanceBasic(x, y) {
        return Math.abs(this.x - x) + Math.abs(this.y - y);
    };

    distanceEye(x, y) {
        return Math.sqrt((this.x - x) ** 2 + (this.y + this.eyeHeight - y) ** 2);
    };

    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y
        };
    };
}