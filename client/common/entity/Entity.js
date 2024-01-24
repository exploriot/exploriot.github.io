import {BoundingBox} from "./BoundingBox.js";
import {GRAVITY_FORCE} from "../metadata/Entities.js";
import {SLAB_BB, STAIRS_BB} from "../metadata/Blocks.js";

export class Entity {
    lastChunkX = null;
    x = 0;
    y = 0;
    vx = 0;
    vy = 0;

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
        this.bb = bb.clone();
        this.downBB = bb.clone();
    };

    getWorld() {
        return this.world;
    };

    update(dt) {
        this.vx *= 0.999;
        this.vy *= 0.999;
        //if (this.type === EntityIds.ITEM) return;
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

    move(dx, dy) {
        if (dx === 0 && dy === 0) return false;
        const already = this.world.getCollidingBlock(this.bb);
        if (already) {
            this.vy = 0;
            this.y += 0.05;
            this.handleMovement();
        }
        let moved = false;
        if (Math.abs(dx) > 0.0000001) {
            this.x += dx;
            this.recalculateBoundingBox();
            const b = this.world.getCollidingBlock(this.bb);
            if (!already && b) {
                const maxY = b.collisions.sort((a, b) => b.y2 - a.y2)[0].y2 + b.y;
                const dy = maxY - this.bb.y1;
                if (
                    b.collisions.length === 1
                    && (SLAB_BB.includes(b.bb) || STAIRS_BB.includes(b.bb))
                    && dy < 0.5
                ) {
                    this.y += dy + 0.002;
                    this.recalculateBoundingBox();
                    // check if it will bump into something if it steps up
                    if (this.world.getCollidingBlock(this.bb)) {
                        this.y -= dy
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
            const b = this.world.getCollidingBlock(this.bb);
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
        const oldChunk = this.world.chunkEntities[this.lastChunkX];
        if (oldChunk) {
            const index = oldChunk.indexOf(this);
            if (index !== -1) oldChunk.splice(index, 1);
        }
        const newEntities = this.world.chunkEntities[newCX] ??= [];
        if (!newEntities.includes(this)) {
            newEntities.push(this);
        }
        this.lastChunkX = newCX;
        return true;
    };

    isOnGround() {
        return this.world.getCollidingBlock(this.downBB);
    };

    remove() {
        if (this.lastChunkX !== null) {
            const chunk = this.world.chunkEntities[this.lastChunkX];
            if (chunk) {
                const index = chunk.indexOf(this);
                if (index !== -1) chunk.splice(index, 1);
            }
        }
        delete this.world.entityMap[this.id];
    };

    applyGravity(dt) {
        this.vy -= dt * GRAVITY_FORCE;
    };

    distance(x, y) {
        return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
    };

    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y
        };
    };
}