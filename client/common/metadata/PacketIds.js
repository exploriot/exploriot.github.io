let __s = 100;
let __c = 200;

const s = () => __s++;
const c = () => __c++;

export const PacketIds = {
    SERVER_WELCOME: s(),
    SERVER_PING: s(),
    SERVER_SUB_CHUNK: s(),
    SERVER_ENTITY_UPDATE: s(),
    SERVER_ENTITY_REMOVE: s(),
    SERVER_ENTITY_MOVEMENT: s(),
    SERVER_BLOCK_UPDATE: s(),
    SERVER_BLOCK_BREAKING_UPDATE: s(),
    SERVER_DISCONNECT: s(),
    SERVER_INVENTORY_UPDATE: s(),
    SERVER_INVENTORY_SET_INDEX: s(),
    SERVER_HAND_ITEM: s(),
    SERVER_SET_POSITION: s(),
    SERVER_SEND_MESSAGE: s(),
    SERVER_OPEN_CONTAINER: s(),
    SERVER_CLOSE_CONTAINER: s(),
    SERVER_SET_ATTRIBUTES: s(),
    SERVER_HAND_ITEM_INDEX: s(),
    SERVER_PLAY_SOUND: s(),
    SERVER_PLAY_AMBIENT: s(),
    SERVER_STOP_AMBIENT: s(),
    SERVER_CONTAINER_STATE: s(),
    SERVER_UPDATE_PLAYER_LIST: s(),
    SERVER_ENTITY_ROTATE: s(),
    SERVER_ENTITY_ANIMATION: s(),
    SERVER_ADD_PARTICLE: s(),
    SERVER_APPLY_VELOCITY: s(),
    SERVER_ENTITY_VELOCITY: s(),
    SERVER_UPDATE_TIME: s(),

    CLIENT_AUTH: c(),
    CLIENT_PING: c(),
    CLIENT_MOVEMENT: c(),
    CLIENT_BLOCK_BREAKING_UPDATE: c(),
    CLIENT_STOP_BREAK_BLOCK: c(),
    CLIENT_BREAK_BLOCK: c(),
    CLIENT_PLACE_BLOCK: c(),
    CLIENT_INVENTORY_TRANSACTION: c(),
    CLIENT_ITEM_TRANSFER: c(),
    CLIENT_HAND_ITEM: c(),
    CLIENT_ITEM_DROP: c(),
    CLIENT_SEND_MESSAGE: c(),
    CLIENT_CLOSE_CONTAINER: c(),
    CLIENT_INTERACT_BLOCK: c(),
    CLIENT_TOGGLE_FLIGHT: c(),
    CLIENT_OBTAIN_ITEM: c(),
    CLIENT_CONSUME_ITEM: c(),
    CLIENT_UPDATE_ROTATION: c(),
    CLIENT_TOUCH_ENTITY: c(),

    BATCH: 300,
};