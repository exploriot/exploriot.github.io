let __id = 0;
const _ = () => __id++;

export const AnimationIds = {
    HAND_SWING: _(),
    PICKUP: _()
};