export let Keyboard = {};

export function initKeyboard() {
    addEventListener("keydown", e => {
        Keyboard[e.key.toLowerCase()] = true;
    });

    addEventListener("keyup", e => {
        Keyboard[e.key.toLowerCase()] = false;
    });

    addEventListener("blur", () => Keyboard = {});
}