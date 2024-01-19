export function _T(thing, type) {
    if (type === "int") {
        _T(thing, "number");
        if (thing !== Math.floor(thing)) throw new Error("Invalid int.");
        return;
    }
    if (type === "uint") {
        _T(thing, "int");
        if (thing < 0) throw new Error("Invalid uint.");
        return;
    }
    if (typeof thing !== type) throw new Error("Invalid type.");
    if (type === "number") {
    }
}

export function _TA(...things) {
    for (let i = 0; i < things.length; i += 2) {
        _T(things[i], things[i + 1]);
    }
}

export function generateSeed(s) {
    let mask = 0xffffffff;
    let m_w = (123456789 + s) & mask;
    let m_z = (987654321 - s) & mask;

    return function () {
        m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
        m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;
        return (((m_z << 16) + (m_w & 65535)) >>> 0) / 4294967296;
    }
}

export function randInt(x, y) {
    return Math.floor(Math.random() * (y - x + 1)) + x;
}

export function randFloat(x, y) {
    return Math.random() * (y - x) + x;
}

export const Around = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
];

export const SelfAround = [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
];

export function resolvePath(path) {
    let p = [];
    path.split(/[\\/]/).forEach(i => {
        if (i === ".") return;
        if (i === ".." && p.length > 0 && p.at(-1) !== "..") return p.splice(-1, 1);
        return p.push(i);
    });
    return p.join("/");
}

const ColorsHex = {
    0: "#000", 1: "#00a", 2: "#0a0", 3: "#0aa", 4: "#a00", 5: "#a0a", 6: "#fa0", 7: "#aaa", 8: "#555", 9: "#55f",
    a: "#5f5", b: "#5ff", c: "#f55", d: "#f5f", e: "#ff5", f: "#fff"
};
const ColorsRGB = {
    0: [0x00, 0x00, 0x00], 1: [0x00, 0x00, 0xaa], 2: [0x00, 0xaa, 0x00], 3: [0x00, 0xaa, 0xaa], 4: [0xaa, 0x00, 0x00],
    5: [0xaa, 0x00, 0xaa], 6: [0xff, 0xaa, 0x00], 7: [0xaa, 0xaa, 0xaa], 8: [0x55, 0x55, 0x55], 9: [0x55, 0x55, 0xff],
    a: [0x55, 0xff, 0x55], b: [0x55, 0xff, 0xff], c: [0xff, 0x55, 0x55], d: [0xff, 0x55, 0xff], e: [0xff, 0xff, 0x55],
    f: [0xff, 0xff, 0xff]
};

export function splitColors(text) {
    return text.split(/(§[a-f\d])/);
}

export function clearColors(text) {
    return text.replaceAll(/§[a-f\d]/g, "");
}

export function colorizeTextHTML(text) {
    const spl = splitColors(text);
    let style = {color: ""};
    let result = "";
    for (let i = 0; i < spl.length; i++) {
        const sp = spl[i];
        if (sp[0] === "§" && sp[1] in ColorsHex) {
            style.color = ColorsHex[sp[1]];
            continue;
        }
        const data = document.createTextNode(sp).data;
        if (!style.color) {
            result += data;
            continue;
        }
        result += `<span style="color:${style.color}">${data}</span>`;
    }
    return result;
}

export function colorizeTextTerminal(text) {
    const spl = splitColors(text);
    let result = "";
    for (let i = 0; i < spl.length; i++) {
        const sp = spl[i];
        if (sp[0] === "§" && sp[1] in ColorsRGB) {
            const [r, g, b] = ColorsRGB[sp[1]];
            result += `\x1B[38;2;${r};${g};${b}m`;
            continue;
        }
        result += sp;
    }
    return result + "\x1B[39m";
}