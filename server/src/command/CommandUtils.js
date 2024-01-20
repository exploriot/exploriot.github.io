// @a[a=10, b="test", c={a:10}]

import {EntityIds} from "../../../client/common/metadata/Entities.js";
import {S_Player} from "../entity/Player.js";
import {CommandLabels} from "./CommandManager.js";

export const Selectors = ["a", "p", "r", "s", "e", "c"];

export function processSelector(tokens, sel) {
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type !== "word" && token.type !== "string") {
            return "Expected a field name for the selector at " + (token.index + 1) + ".";
        }
        const name = token.value;
        let equality = true;
        i++;
        const next = tokens[i];
        if (!next || next.type !== "symbol" || (next.value !== "=" && next.value !== "!")) {
            return "Expected an equality or inequality after a field at " + (next ? next.index + 1 : token.index + token.value.length) + ".";
        }
        if (next.value === "!") {
            equality = false;
            i++;
            const next2 = tokens[i];
            if (!next2 || next2.type !== "symbol" || next2.value !== "=") {
                return "Expected an != for the inequality field at " + (next2 ? next2.index + 1 : next.index + 2) + ".";
            }
        }
        i++;
        const value = tokens[i];
        if (!value) return "Expected a value for the field at " + (tokens[i - 1].index + 2) + ".";
        switch (value.type) {
            case "parent":
                if (value.value[0] === "{") {
                    sel[name] = parseObjectTokens(value.children);
                } else sel[name] = parseArrayTokens(value.children);
                break;
            case "string":
            case "word":
            case "number":
                sel[name] = value.value;
                break;
            default:
                return "Unexpected token at " + value.index + ".";
        }
        if (i !== tokens.length - 1) {
            i++;
            const comma = tokens[i];
            if (comma.type !== "symbol" || comma.value !== ",") return "Expected a comma at " + (comma.index + 1) + ".";
        }
    }
}

function parseObjectTokens(children) {
    const obj = {};
    for (let i = 0; i < children.length; i++) {
        const token = children[i];
        if (token.type !== "word" && token.type !== "string") {
            return "Expected a field name for the object at " + (token.index + 1) + ".";
        }
        const name = token.value;
        i++;
        const next = children[i];
        if (!next || next.type !== "symbol" || next.value !== ":") {
            return "Expected a colon after a field name at " + (next ? next.index + 1 : token.index + token.value.length) + ".";
        }
        i++;
        const value = children[i];
        if (!value) return "Expected a value for the field at " + (children[i - 1].index + 2);
        switch (value.type) {
            case "parent":
                if (value.value[0] === "{") {
                    obj[name] = parseObjectTokens(value.children);
                } else obj[name] = parseArrayTokens(value.children);
                break;
            case "string":
            case "word":
            case "number":
                obj[name] = value.value;
                break;
            default:
                return "Unexpected token at " + value.index + ".";
        }
        if (i !== children.length - 1) {
            i++;
            const comma = children[i];
            if (comma.type !== "symbol" || comma.value !== ",") return "Expected a comma at " + (comma.index + 1) + ".";
        }
    }
    return obj;
}

function parseArrayTokens(children) {
    const list = [];
    for (let i = 0; i < children.length; i += 2) {
        const value = children[i];
        const comma = children[i + 1];
        if (i !== children.length - 1 && (!comma || comma.type !== "symbol" || comma.value !== ",")) {
            return "Expected a comma at " + (comma ? comma.index + 1 : value.index + value.value.length + 1);
        }
        switch (value.type) {
            case "parent":
                let p;
                if (value.value[0] === "{") {
                    parseObjectTokens(value.children);
                } else p = parseArrayTokens(value.children);
                if (typeof p === "string") return p;
                list.push(p);
                break;
            case "string":
            case "word":
            case "number":
                list.push(value.value);
                break;
            default:
                return "Unexpected token at " + value.index + ".";
        }
    }
    return list;
}

const Digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const Symbols = ["!", "=", "~", "^", ",", ".", "{", "}", "[", "]", ":", "-"];
const StringStarts = ["\"", "'"];
const Brackets = {
    "{": "}",
    "[": "]"
};
const AllChars = [...Digits, ...Symbols, ...StringStarts, " "];

export function tokenize(text) {
    const program = {type: "program", parent: null, children: [], index: 0, value: text};
    let parent = program;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === " ") continue;
        const isNextDigit = Digits.includes(text[i + 1]);
        if (
            Digits.includes(c)
            || (c === "-" && (isNextDigit || (text[i + 1] === "." && Digits.includes(text[i + 2]))))
            || (c === "." && isNextDigit)
        ) {
            const token = {type: "number", index: i, raw: ""};
            parent.children.push(token);
            let hasDot = false;
            if (c === "-") {
                token.raw += "-";
                i++;
            }
            for (; i < text.length; i++) {
                const c2 = text[i];
                if (c2 === "." && !hasDot) {
                    hasDot = true;
                    token.raw += ".";
                    continue;
                }
                if (!Digits.includes(c2)) {
                    i--;
                    break;
                }
                token.raw += c2;
            }
            token.value = Number(token.raw);
            continue;
        }
        if (Brackets[c]) {
            const closer = Brackets[c];
            const p = {type: "parent", parent, children: [], index: i, closer, value: ""};
            parent.children.push(p);
            parent = p;
            continue;
        }
        if (parent.closer === c) {
            delete parent.closer;
            parent.value = text.substring(parent.index, i + 1);
            parent = parent.parent;
            continue;
        }
        if (Symbols.includes(c)) {
            parent.children.push({type: "symbol", index: i, value: c});
            continue;
        }
        if (StringStarts.includes(c)) {
            const token = {type: "string", index: i + 1, value: ""};
            parent.children.push(token);
            let backslash = false;
            i++;
            for (; i < text.length; i++) {
                const c2 = text[i];
                if (c2 === c && !backslash) break;
                if (i === text.length - 1) return "Expected a " + c + " at " + (i + 1) + ".";
                if (c2 === "\\") backslash = !backslash;
                else backslash = false;
                token.value += c2;
            }
            continue;
        }
        const token = {type: "word", index: i, value: ""};
        parent.children.push(token);
        for (; i < text.length; i++) {
            const c2 = text[i];
            if (AllChars.includes(c2)) {
                i--;
                break;
            }
            token.value += c2;
        }
    }
    if (parent !== program) return "Expected the bracket to end.";
    return program.children;
}

function applySelectorFilters(entities, sel) {
    if ("type" in sel) {
        const t = EntityIds[sel.type];
        entities = entities.filter(i => i.type === t);
    }
    return entities;
}

function computeSelectorType(self, selT) {
    let players;
    switch (selT) {
        case "a":
            return Array.from(Server.getPlayers());
        case "p":
            if (self instanceof S_Player) return [self];
            players = Array.from(Server.getPlayers());
            if (players.length === 0 || self === _ConsoleCommandSender) return [];
            let closest = [players[0], players[0].distance(self.x, self.y)];
            for (let i = 1; i < players.length; i++) {
                const p = players[i];
                const dist = p.distance(self.x, self.y);
                if (dist < closest[1]) closest = [p, dist];
            }
            return [closest[0]];
        case "r":
            players = Server.getPlayers();
            return [players[Math.floor(Math.random() * players.size)]];
        case "s":
            return [self];
        case "e":
            return Server.getWorlds().map(i => Object.values(i.entityMap)).flat(1);
        case "c":
            return [_ConsoleCommandSender];
    }
}

function computeSelector(self, sel, selT) {
    return applySelectorFilters(computeSelectorType(self, selT), sel);
}

function testSelector(self, entity, sel, selT) {
    return computeSelector(self, sel, selT).includes(entity);
}

const GamemodeMap = {
    survival: 0,
    creative: 1,
    adventure: 2,
    spectator: 3
};

const Pos = {
    selector(ind, tokens, self) {
        const t = tokens[ind];
        if (t.type === "string" || (t.type === "word" && t.value[0] !== "@")) {
            const p = Server.getPlayerByName(t.value);
            if (!p) return "Player '" + t.value + "' was not found.";
            return [ind + 1, [p]];
        }
        if (t.type !== "word" || t.value.length !== 2 || t.value[0] !== "@" || !Selectors.includes(t.value[1])) {
            return "Invalid selector.";
        }
        const p = tokens[ind + 1];
        const sel = {};
        const selT = t.value[1];
        if (p && p.type === "parent" && p.value[0] === "[") {
            const res = processSelector(p.children, sel);
            if (typeof res === "string") return res;
            ind++;
        }
        const entities = computeSelector(self, sel, selT);
        return [ind + 1, entities];
    },
    selector_p(ind, tokens, self) {
        const res = this.selector(ind, tokens, self);
        if (Array.isArray(res) && res[1].some(i => !(i instanceof S_Player))) {
            return "Expected player entities, instead got non-players.";
        }
        return res;
    },
    gamemode(ind, tokens) {
        const t = tokens[ind];
        if (t.type === "number") {
            if (![0, 1, 2, 3].includes(t.value)) return "Invalid gamemode: " + t.value + ".";
            return [ind + 1, t.value];
        }
        if (t.type !== "word" && t.type !== "string") return "Invalid gamemode.";
        if (!(t.value in GamemodeMap)) return "Invalid gamemode: " + t.value + ".";
        return [ind + 1, GamemodeMap[t.value]];
    },
    position(ind, tokens, self) {
        const pos = [];
        for (let i = 0; i < 2; i++) {
            const t = tokens[ind];
            if (!t) return "Invalid position.";
            ind++;
            if (t.type === "number") {
                pos.push(t.value);
                continue;
            }
            if (t.type === "symbol" && t.value === "~") {
                const n = tokens[ind];
                const m = i === 0 ? self.x : self.y;
                if (!n || n.type !== "number") {
                    ind--;
                    pos.push(m);
                } else {
                    ind++;
                    pos.push(m + n.value);
                }
                continue;
            }
            return "Invalid position.";
        }
        return [ind, {x: pos[0], y: pos[1]}];
    },
    command(ind, tokens) {
        const t = tokens[ind];
        if (t.type !== "word" && t.type !== "string") return "Invalid command.";
        const cmd = CommandLabels[t.value];
        return cmd ? [ind + 1, cmd] : "Command not found: " + t.value + ".";
    }
};

export function testArguments(self, sender, text, all) {
    const tokens = tokenize(text);
    if (typeof tokens === "string") return tokens;
    const fails = [];
    for (let i = 0; i < all.length; i++) {
        const p = all[i];
        if (p.sel && !testSelector(self, sender, p.sel, p.selT)) continue;
        let fail = false;
        const got = [];
        let tokInd = 0;
        for (let j = 0; j < p.pos.length; j++) {
            if (fail) break;
            if (tokInd >= tokens.length) {
                fail = true;
                break;
            }
            const posWhole = p.pos[j];
            const pos = posWhole[1];
            let minorSuccess = false;
            let failReason = null;
            for (const p of pos) {
                if (fail) break;
                if (tokInd >= tokens.length) {
                    fail = true;
                    break;
                }
                const r = Pos[p](tokInd, tokens, self, sender);
                if (Array.isArray(r)) {
                    tokInd = r[0];
                    got.push(r[1]);
                    minorSuccess = true;
                    break;
                } else if (typeof r === "string") {
                    failReason = r;
                    break;
                }
            }
            if (!minorSuccess) fail = true;
            if (failReason) fails.push([tokInd, failReason]);
        }
        if (tokInd < tokens.length) continue;
        if (!fail) return [i, got];
    }
    const longestFail = fails.sort((a, b) => b[1] - b[0])[0];
    if (longestFail) {
        return longestFail[1];
    }
    return null;
}