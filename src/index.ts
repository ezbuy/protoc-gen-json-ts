/**
 * This is the ProtoC compiler plugin.
 *
 * It only accepts stdin/stdout output according to the protocol
 * specified in [plugin.proto](https://github.com/google/protobuf/blob/master/src/google/protobuf/compiler/plugin.proto).
 */
import { withAllStdIn } from "./util";
import {CodeGeneratorRequest, CodeGeneratorResponse} from "google-protobuf/google/protobuf/compiler/plugin_pb";
import {FileDescriptorProto} from "google-protobuf/google/protobuf/descriptor_pb";
import template from "./template";
import getImportedTypesContext from "./ImportedTypesContext";

withAllStdIn().then((inputBuff: Buffer)=>{
	const context = getImportedTypesContext();
	try {
		const typedInputBuff = new Uint8Array(inputBuff.length);
		typedInputBuff.set(inputBuff);

		const codeGenRequest = CodeGeneratorRequest.deserializeBinary(typedInputBuff);
		const codeGenResponse = new CodeGeneratorResponse();
		const fileNameToDescriptor: {[key: string]: FileDescriptorProto} = {};

		codeGenRequest.getProtoFileList().forEach(protoFileDescriptor => {
			fileNameToDescriptor[protoFileDescriptor.getName()] = protoFileDescriptor;
			context.addFile(protoFileDescriptor);
		});

		Object.keys(fileNameToDescriptor).forEach((fileName) => {
			const outputFileName = fileName.replace(/\.proto$/, "").replace(/\./g, "/");
			const thisFile = new CodeGeneratorResponse.File();
			thisFile.setName(`${outputFileName}.ts`);
			thisFile.setContent(template(fileNameToDescriptor[fileName], "./webapi.ts").replace(/^\s*/, ""));
			codeGenResponse.addFile(thisFile);
		})

		process.stdout.write(new Buffer(codeGenResponse.serializeBinary()));
	} catch (err) {
		console.error("ts-protoc-json-gen error: " + err.stack + "\n");
		process.exit(1);
	}
});