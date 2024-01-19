export function extendClass(a, b) {
    for (const n of Object.getOwnPropertyNames(b.prototype)) {
        if (!(n in a.prototype)) a.prototype[n] = b.prototype[n];
    }
}