let __id = 0;
const _ = () => __id++;

export const ParticleIds = {
    TNT: _(),
    BLOCK_BREAK: _()
};