let __id = 0;
const _ = () => __id++;

export const ParticleIds = {
    EXPLOSION: _(),
    BLOCK_BREAK: _()
};