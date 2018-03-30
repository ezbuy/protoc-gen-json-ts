## Usage

```shell
protoc --plugin=protoc-gen-json-ts=./node_modules/protoc-gen-json-ts/bin/protoc-gen-json-ts --json-ts_out=:src/services -I ./apidoc/proto ./apidoc/proto/oktights/oktights.proto
```

## Parameter

### --json-ts_out

- 指定生成路径

指定生成文件的路径及给插件的参数--json-ts_out=:src/services，指将服务文件生成到src/services文件夹中。

- apiPath
指定生成文件生成文件对应的api调用文件路径，--json-ts_out=apiPath=./api:src/services

### -I

protobuf文件的根路径，一般为./apidoc/proto。

## 安装

```shell
$ yarn add protoc-gen-json-ts -D
```

这个包还依赖 protobuf 官方的二进制文件，可以通过下面两种方式安装

手动安装

进入https://github.com/google/protobuf/releases ，下载对应的protoc二进制文件。

通过 HomeBrew 安装

```shell
$ brew install protobuf
```

确保你安装完的 protoc 的版本是 3.0 以上

```shell
$ protoc --version
libprotoc 3.5.1
```
