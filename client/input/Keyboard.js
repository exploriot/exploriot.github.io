export let Keyboard = {};

addEventListener("keydown", e => {
    Keyboard[e.key.toLowerCase()] = true;
});

addEventListener("keyup", e => {
    Keyboard[e.key.toLowerCase()] = false;
});

addEventListener("blur", () => Keyboard = {});