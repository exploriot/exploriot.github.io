export function _T_base(thing, type) {
    if (type === "object" && thing === null) return false;
    if (type === "int") {
        return _T_base(thing, "number") && thing === Math.floor(thing);
    }
    if (type === "uint") {
        return _T_base(thing, "int") && thing >= 0;
    }
    return typeof thing === type;
}

export function _T(thing, type) {
    if (!_T_base(thing, type)) throw new Error("Invalid " + type + ".");
}

export function _TA(...things) {
    for (let i = 0; i < things.length; i += 2) {
        _T(things[i], things[i + 1]);
    }
}

export function _TR(thing, type, def) {
    return _T_base(thing, type) ? thing : def;
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

export function randArr(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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

export const ColorsHex = {
    0: "#000", 1: "#00a", 2: "#0a0", 3: "#0aa", 4: "#a00", 5: "#a0a", 6: "#fa0", 7: "#aaa", 8: "#555", 9: "#55f",
    a: "#5f5", b: "#5ff", c: "#f55", d: "#f5f", e: "#ff5", f: "#fff"
};
export const ColorsRGB = {
    0: [0x00, 0x00, 0x00], 1: [0x00, 0x00, 0xaa], 2: [0x00, 0xaa, 0x00], 3: [0x00, 0xaa, 0xaa], 4: [0xaa, 0x00, 0x00],
    5: [0xaa, 0x00, 0xaa], 6: [0xff, 0xaa, 0x00], 7: [0xaa, 0xaa, 0xaa], 8: [0x55, 0x55, 0x55], 9: [0x55, 0x55, 0xff],
    a: [0x55, 0xff, 0x55], b: [0x55, 0xff, 0xff], c: [0xff, 0x55, 0x55], d: [0xff, 0x55, 0xff], e: [0xff, 0xff, 0x55],
    f: [0xff, 0xff, 0xff]
};

export const EMOTE_REGEX = /(:[a-z_]+:)/;
export const EMOTE_LIST = ["skull", "eyes", "slight_smile", "nerd"];

export function splitColors(text) {
    return text.split(/(§[a-f\dsuil])/);
}

export function clearColors(text) {
    return text.replaceAll(/§[a-f\dsuil]/g, "");
}

export function colorizeTextTerminal(text) {
    const spl = splitColors(text);
    let result = "";
    for (let i = 0; i < spl.length; i++) {
        const sp = spl[i];
        if (sp[0] === "§") {
            if (sp[1] in ColorsRGB) {
                const [r, g, b] = ColorsRGB[sp[1]];
                result += `\x1B[38;2;${r};${g};${b}m`;
                continue;
            } else if (sp[1] === "s") {
                result += `\x1B[38;2;${r};${g};${b}m`;
                continue;
            } else if (sp[1] === "u") {
                result += `\x1B[38;2;${r};${g};${b}m`;
                continue;
            } else if (sp[1] === "i") {
                result += `\x1B[38;2;${r};${g};${b}m`;
                continue;
            } else if (sp[1] === "l") {
                result += `\x1B[38;2;${r};${g};${b}m`;
                continue;
            }
        }
        result += sp;
    }
    return result + "\x1B[39m";
}

export function roundToPrecision(number, precision) {
    return parseFloat(number.toFixed(precision));
}

export function getLevelFromXP(xp) {
    return Math.sqrt(xp + 9) - 3;
}

export function getXPFromLevel(level) {
    return level ** 2 + 6 * level;
}

function _pad(s) {
    return s.toString().padStart(2, "0");
}

export const Terminal = {
    send(text, prefix, fn = "log") {
        if (text instanceof Error) text = text.stack.replaceAll("", "");
        if (typeof text !== "string") text = text.toString();
        const d = new Date;
        for (const line of text.split("\n").map(
            i => `§b[${_pad(d.getHours())}:${_pad(d.getMinutes())}:${_pad(d.getSeconds())}]§f ${prefix}${i}`
        )) console[fn](colorizeTextTerminal(line));
    },
    debug(text) {
        this.send(text, "§9[DEBUG] §7", "debug");
    },
    info(text) {
        this.send(text, "§7[INFO] §f", "info");
    },
    error(text) {
        this.send(text, "§c[ERROR] §c", "error");
    },
    warn(text) {
        this.send(text, "§6[WARN] §e", "warn");
    }
};

export function getCurrentProtocol(process) {
    const env = process.env;
    return "REPL_ID" in env;
}

export function getCurrentIP(process) {
    return "127.0.0.1";
}

export function getCurrentPort(process, port) {
    const env = process.env;
    if ("REPL_ID" in env && "REPLIT_CLUSTER" in env) return 80;
    return port;
}

export function getCurrentURL(process, port) {
    return "http" + (getCurrentProtocol(process) ? "s" : "") + "://"
        + getCurrentIP(process)
        + (getCurrentPort(process, port) === 80 ? "" : ":" + port);
}