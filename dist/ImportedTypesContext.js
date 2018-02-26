"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const descriptor_pb_1 = require("google-protobuf/google/protobuf/descriptor_pb");
const util_1 = require("./util");
function buildTypeName(packageName, name) {
    return `${packageName
        .split(/\./g)
        .map(s => `${s.slice(0, 1).toUpperCase()}${s.slice(1)}`)}${name}`;
}
class ImportedTypesContext {
    constructor() {
        this.types = {};
        this.typesReferenceMap = {};
    }
    addFile(file) {
        const baseName = `.${file.getPackage()}`;
        [...file.getMessageTypeList(), ...file.getEnumTypeList()].forEach(msg => {
            this.addType(msg, baseName, file.getName(), file.getPackage());
        });
    }
    addType(msg, baseName, fileName, packageName, parentTypeName = "") {
        const typeName = msg.getName();
        const typeKey = `${baseName}.${typeName}`;
        this.types[typeKey] = {
            fileName,
            packageName,
            descriptor: msg,
            parentTypeName
        };
        if (msg instanceof descriptor_pb_1.DescriptorProto) {
            [...msg.getNestedTypeList(), ...msg.getEnumTypeList()].forEach(msg => {
                this.addType(msg, typeKey, fileName, packageName, typeName);
            });
        }
    }
    addTypeReference(fileName, refFileName, origin, alias) {
        if (this.typesReferenceMap[fileName] === undefined) {
            this.typesReferenceMap[fileName] = {};
        }
        if (this.typesReferenceMap[fileName][refFileName] === undefined) {
            this.typesReferenceMap[fileName][refFileName] = [];
        }
        if (this.typesReferenceMap[fileName][refFileName].findIndex(item => item.origin === origin && item.alias === alias) === -1) {
            this.typesReferenceMap[fileName][refFileName].push({ origin, alias });
        }
    }
    getTypeName(typeKey, fileName) {
        if (typeKey === ".common.Any") {
            return `{"@type": string; [key: string]: any}`;
        }
        if (this.types[typeKey]) {
            const typeObj = this.types[typeKey];
            const origin = `${typeObj.parentTypeName}${typeObj.descriptor.getName()}`;
            if (typeObj.fileName !== fileName) {
                const aliasName = buildTypeName(typeObj.packageName, origin);
                const refPathName = `${util_1.getRoot(fileName)}${typeObj.fileName
                    .replace(/\.proto$/, "")
                    .replace(/\./g, "/")}`;
                this.addTypeReference(fileName, refPathName, origin, aliasName);
                return aliasName;
            }
            return origin;
        }
        throw new Error(`Can't find [${typeKey}] in imported types.`);
    }
    getReferenceMap(fileName) {
        return this.typesReferenceMap[fileName];
    }
}
let context = null;
function getContext() {
    if (context === null) {
        context = new ImportedTypesContext();
    }
    return context;
}
exports.default = getContext;
//# sourceMappingURL=ImportedTypesContext.js.map