import { FileDescriptorProto, DescriptorProto, EnumDescriptorProto } from "google-protobuf/google/protobuf/descriptor_pb";
import { getRoot } from "./util";

type DescriptorType = DescriptorProto | EnumDescriptorProto;

interface TypeValue {
    fileName: string;
    packageName: string;
    descriptor: DescriptorType;
    parentTypeName?: string;
}

function buildTypeName(packageName: string, name: string) {
	return `${packageName
		.split(/\./g)
		.map(s => `${s.slice(0, 1).toUpperCase()}${s.slice(1)}`)}${name}`;
};

class ImportedTypesContext {
    types: {[key: string]: TypeValue} = {};
    typesReferenceMap: {[key: string]: {[key: string]: {origin: string, alias: string}[]}} = {};

    addFile(file: FileDescriptorProto){
        const baseName = `.${file.getPackage()}`;
        [...file.getMessageTypeList(), ...file.getEnumTypeList()].forEach((msg)=>{
            this.addType(msg, baseName, file.getName(), file.getPackage());
        })
    }

    addType(msg: DescriptorType, baseName: string, fileName: string, packageName: string, parentTypeName = ""){
        const typeName = msg.getName();
        const typeKey = `${baseName}.${typeName}`;
        this.types[typeKey] = {
            fileName,
            packageName,
            descriptor: msg,
            parentTypeName
        };
        if (msg instanceof DescriptorProto) {
            [...msg.getNestedTypeList(), ...msg.getEnumTypeList()].forEach((msg)=>{
                this.addType(msg, typeKey, fileName, packageName, typeName);
            })
        }
    }

    private addTypeReference(fileName: string, refFileName: string, origin: string, alias: string){
        if (this.typesReferenceMap[fileName] === undefined) {
            this.typesReferenceMap[fileName] = {
            }
        }
        if (this.typesReferenceMap[fileName][refFileName] === undefined) {
            this.typesReferenceMap[fileName][refFileName] = [];
        }
        if (this.typesReferenceMap[fileName][refFileName].findIndex((item) => (item.origin === origin && item.alias === alias)) === -1) {
            this.typesReferenceMap[fileName][refFileName].push({origin, alias});
        }
    }

    getTypeName(typeKey: string, fileName: string) {
        if (this.types[typeKey]) {
            const typeObj = this.types[typeKey]
            const origin = `${typeObj.parentTypeName}${typeObj.descriptor.getName()}`;
            if (typeObj.fileName !== fileName) {
                const aliasName = buildTypeName(typeObj.packageName, origin);
                const refPathName = `${getRoot(fileName)}${typeObj.fileName.replace(/\.proto$/, "").replace(/\./g, "/")}`;
                this.addTypeReference(fileName, refPathName, origin, aliasName);
                return aliasName;
            }
            return origin;
        }
        throw new Error(`Can't find [${typeKey}] in imported types.`);
    }

    getReferenceMap(fileName: string) {
        return this.typesReferenceMap[fileName];
    }
}

let context: ImportedTypesContext = null;

export default function getContext(){
    if (context === null) {
        context = new ImportedTypesContext();
    }
    return context;
}