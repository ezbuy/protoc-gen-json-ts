import { FileDescriptorProto } from "google-protobuf/google/protobuf/descriptor_pb";
import template, {ImportedType} from "./template";

function getPathToRoot(fileName: string) {
	const depth = fileName.split("/").length;
	return depth === 1 ? "./" : new Array(depth).join("../");
}

export default function getFileContent(currentFileName: string, fileMaps: {[key: string]: FileDescriptorProto}) {
	const allImportedTypeMap = fileMaps[currentFileName].getDependencyList().reduce<{ [key: string]: ImportedType }>((pValue, path)=>{
		const importedFileDesc = fileMaps[path];
		const allImportedMessagesAndEnums = [
			...importedFileDesc.getMessageTypeList().map((item)=>(item.getName())),
			...importedFileDesc.getEnumTypeList().map((item)=>(item.getName())),
		]
		const packageName = importedFileDesc.getPackage();
		
		return {
			...pValue,
			...allImportedMessagesAndEnums.reduce<{[key: string]: ImportedType}>((pValue, typeName) => ({
				...pValue,
				...{
					[`${packageName}.${typeName}`]: {
						path: `${getPathToRoot(path)}${path}`,
						name: typeName,
						packageName
					}
				}
			}), {})
		};
	},{});

	return template(fileMaps[currentFileName], allImportedTypeMap, "./webapi.ts").replace(/^\s*/, "");
}