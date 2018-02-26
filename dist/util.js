"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function withAllStdIn() {
    return new Promise((resolve, reject) => {
        const ret = [];
        let len = 0;
        const stdin = process.stdin;
        stdin.on("readable", function () {
            let chunk;
            while ((chunk = stdin.read())) {
                if (!(chunk instanceof Buffer))
                    throw new Error("Did not receive buffer");
                ret.push(chunk);
                len += chunk.length;
            }
        });
        stdin.on("end", function () {
            resolve(Buffer.concat(ret, len));
        });
        stdin.on("error", function (err) {
            reject(err);
        });
    });
}
exports.withAllStdIn = withAllStdIn;
function strRepeat(str, times) {
    const arr = new Array(times);
    for (let i = 0; i < times; i++) {
        arr[i] = str;
    }
    return arr.join("");
}
exports.strRepeat = strRepeat;
function getRoot(str) {
    const depth = str.split("/").length;
    return depth === 1 ? "./" : strRepeat("../", depth - 1);
}
exports.getRoot = getRoot;
function getParameter(parameter, key) {
    const parts = parameter.split("&");
    const map = {};
    parts.forEach(function (part) {
        const [key, value] = part.split("=");
        if (key !== undefined && value !== undefined) {
            map[key] = value;
        }
    });
    return map[key];
}
exports.getParameter = getParameter;
//# sourceMappingURL=util.js.map