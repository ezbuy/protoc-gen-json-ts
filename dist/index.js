"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const plugin_pb_1 = require("google-protobuf/google/protobuf/compiler/plugin_pb");
const template_1 = require("./template");
const ImportedTypesContext_1 = require("./ImportedTypesContext");
const util_2 = require("./util");
util_1.withAllStdIn().then((inputBuff) => {
    const context = ImportedTypesContext_1.default();
    try {
        const typedInputBuff = new Uint8Array(inputBuff.length);
        typedInputBuff.set(inputBuff);
        const codeGenRequest = plugin_pb_1.CodeGeneratorRequest.deserializeBinary(typedInputBuff);
        const codeGenResponse = new plugin_pb_1.CodeGeneratorResponse();
        const fileNameToDescriptor = {};
        const webapi = util_2.getParameter(codeGenRequest.getParameter(), "apiPath");
        codeGenRequest.getProtoFileList().forEach(protoFileDescriptor => {
            fileNameToDescriptor[protoFileDescriptor.getName()] = protoFileDescriptor;
            context.addFile(protoFileDescriptor);
        });
        Object.keys(fileNameToDescriptor).forEach(fileName => {
            const outputFileName = fileName
                .replace(/\.proto$/, "")
                .replace(/\./g, "/");
            const thisFile = new plugin_pb_1.CodeGeneratorResponse.File();
            thisFile.setName(`${outputFileName}.ts`);
            thisFile.setContent(template_1.default(fileNameToDescriptor[fileName], webapi === undefined ? "./webapi" : webapi).replace(/^\s*/, ""));
            codeGenResponse.addFile(thisFile);
        });
        process.stdout.write(new Buffer(codeGenResponse.serializeBinary()));
    }
    catch (err) {
        console.error("protoc-gen-json-ts error: " + err.stack + "\n");
        process.exit(1);
    }
});
//# sourceMappingURL=index.js.map