"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const descriptor_pb_1 = require("google-protobuf/google/protobuf/descriptor_pb");
const ImportedTypesContext_1 = require("./ImportedTypesContext");
const util_1 = require("./util");
const lineSplitter = "\n";
const typeCast = (field, mapEntriesMap, fileName) => {
    const type = field.getType();
    const label = field.getLabel();
    const typeName = field.getTypeName();
    const types = descriptor_pb_1.FieldDescriptorProto.Type;
    const labels = descriptor_pb_1.FieldDescriptorProto.Label;
    const context = ImportedTypesContext_1.default();
    let typeStr = "string";
    switch (type) {
        case types.TYPE_INT32:
        case types.TYPE_FIXED32:
        case types.TYPE_UINT32:
        case types.TYPE_FLOAT:
        case types.TYPE_DOUBLE:
            typeStr = "number";
            break;
        case types.TYPE_BOOL:
            typeStr = "boolean";
            break;
        case types.TYPE_ENUM:
            typeStr = context.getTypeName(typeName, fileName);
            break;
        case types.TYPE_MESSAGE: {
            if (mapEntriesMap[typeName]) {
                return `{[key: string]: ${typeCast(mapEntriesMap[typeName].getFieldList()[1], {}, fileName)}}`;
            }
            else {
                typeStr = context.getTypeName(typeName, fileName);
            }
            break;
        }
    }
    return `${typeStr}${label === labels.LABEL_REPEATED ? "[]" : ""}`;
};
function isInt64(type) {
    const types = descriptor_pb_1.FieldDescriptorProto.Type;
    return [types.TYPE_UINT64, types.TYPE_INT64, types.TYPE_FIXED64].includes(type);
}
function isFloatOrDouble(type) {
    const types = descriptor_pb_1.FieldDescriptorProto.Type;
    return [types.TYPE_FLOAT, types.TYPE_DOUBLE].includes(type);
}
const renderAllEnums = (enums = [], parentTypeName = "") => {
    enums = enums.filter(enumObj => Object.keys(enumObj).length > 0);
    if (enums.length > 0) {
        return enums
            .map(oneEnum => {
            return `
export enum ${parentTypeName}${oneEnum.getName()} {
${oneEnum
                .getValueList()
                .map(value => `	${value.getName()} = "${value.getName()}",`)
                .join(lineSplitter)}
}

`;
        })
            .join("");
    }
    return "";
};
const renderAllMessages = (messages = [], packageName, fileName, parentTypeName = "") => {
    return messages
        .map(message => {
        const name = message.getName();
        const fields = message.getFieldList();
        const nestedTypes = message
            .getNestedTypeList()
            .filter(type => type.getOptions() === undefined || !type.getOptions().getMapEntry());
        let retStr = "";
        retStr += renderAllMessages(nestedTypes, packageName, fileName, `${parentTypeName}${message.getName()}`);
        retStr += renderAllEnums(message.getEnumTypeList(), `${parentTypeName}${message.getName()}`);
        const mapEntriesMap = message
            .getNestedTypeList()
            .filter(type => type.getOptions() && type.getOptions().getMapEntry())
            .reduce((pValue, cValue) => {
            return Object.assign({}, pValue, { [`.${packageName}.${name}.${cValue.getName()}`]: cValue });
        }, {});
        return (retStr += `
export interface ${parentTypeName}${name} {
${fields
            .reduce((lines, field) => {
            const fieldType = typeCast(field, mapEntriesMap, fileName);
            const isFieldInt64 = isInt64(field.getType());
            if (fieldType === "number" || isFieldInt64) {
                lines.push(`	/**`);
                if (isFieldInt64) {
                    lines.push(`	 * @pattern ^\\d+$`);
                }
                else {
                    lines.push("	 * @minimum 0");
                    if (!isFloatOrDouble(field.getType())) {
                        lines.push("	 * @TJS-type integer");
                    }
                }
                lines.push(`	 */`);
            }
            lines.push(`	${field.getName()}: ${fieldType};`);
            return lines;
        }, [])
            .join(`${lineSplitter}`)}
}
`);
    })
        .join("");
};
const renderMethods = (methods, packageName, serviceName, fileName) => {
    const context = ImportedTypesContext_1.default();
    return methods
        .map(method => {
        const name = method.getName();
        const inputType = context.getTypeName(method.getInputType(), fileName);
        const outputType = context.getTypeName(method.getOutputType(), fileName);
        return `
export function ${name}(payload: ${inputType}) {
	return webapi<${outputType}>("${packageName === "" ? "" : `${packageName}.`}${serviceName}/${name}", payload);
}
`;
    })
        .join("");
};
const renderService = (service, packageName, fileName) => {
    return `
${renderMethods(service.getMethodList(), packageName, service.getName(), fileName)}

export default {
${service
        .getMethodList()
        .map(method => `	${method.getName()},`)
        .join(lineSplitter)}
};
`;
};
function renderImportSection(hasService, webapiPath, fileName) {
    const referenceMap = ImportedTypesContext_1.default().getReferenceMap(fileName);
    return `
${Object.keys(referenceMap === undefined ? {} : referenceMap)
        .map(refFileName => {
        const refsArr = referenceMap[refFileName];
        return `import { ${refsArr
            .map(({ alias, origin }) => `${origin} as ${alias}`)
            .join(", ")} } from "${refFileName}";`;
    })
        .join(lineSplitter)}
${hasService ? `import webapi from "${webapiPath}";` : ""}
	`.trim();
}
const template = (data, apiPath) => {
    const messages = data.getMessageTypeList();
    const enums = data.getEnumTypeList();
    const services = data.getServiceList();
    const hasService = Array.isArray(services) && services.length > 0;
    const packageName = data.getPackage();
    const fileName = data.getName();
    const webapiPath = path_1.join(util_1.strRepeat("../", packageName.split(/\./g).length), apiPath);
    let returnStr = `
${renderAllEnums(enums)}
${renderAllMessages(messages, packageName, fileName)}
${hasService ? renderService(services[0], packageName, fileName) : ""}

`.trim();
    returnStr =
        `
/**
 * This file is auto-generated by protobufgen
 * Don't change manually
 */

${renderImportSection(hasService, webapiPath, fileName)}

` + returnStr;
    return returnStr.trim();
};
exports.default = template;
//# sourceMappingURL=template.js.map