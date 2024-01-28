let __id = 0;
const _ = () => __id++;

export const GameRules = {
    TNT_EXPLODES: _(),
    FALL_DAMAGE: _(),
    NATURAL_REGENERATION: _(),
    STARVE_DAMAGE: _(),
    DROWNING_DAMAGE: _()
};