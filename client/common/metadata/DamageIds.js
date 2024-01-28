let __id = 0;
const _ = () => __id++;

export const DamageIds = {
    FALL_DAMAGE: _(),
    VOID: _()
};