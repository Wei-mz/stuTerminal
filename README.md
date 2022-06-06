## 安装环境搭建
```
1. 安装electron,这里安装的是1.4.2,可以从https://npm.taobao.org/mirrors/electron/下载

2. 安装NodeJS(https://npm.taobao.org/mirrors/node/)，这里安装的是12.4.0，然后安装CNPM
    npm install -g cnpm --registry=https://registry.npm.taobao.org


3. 安装依赖
cnpm install -g webpack babel-cli node-gyp yuidocjs
cnpm install --save-dev style-loader css-loader url-loader sass-loader file-loader \
    react react-dom webpack babel-cli node-gyp \
    babel-preset-react babel-preset-es2015 babel-core babel-loader \
    jest babel-jest babel-preset-es2015 babel-preset-react react-test-renderer \
    babel-preset-stage-0 babel-polyfill\
    eslint eslint-plugin-react babel-eslint \
    node-sass react-redux redux redux-thunk redux-promise redux-actions 
cnpm install --save ws whatwg-fetch pubsub-js md5 tree-kill


For armhf:
	cnpm install -g webpack-dev-server 
	or
	npm i -D webpack 	//将 webpack 作为本地依赖安装

```

## 运行命令
```
npm run app     只运行
npm run debug   编译Debug版并运行
npm run release     编译Release版并运行
npm run clean       删除中间文件
npm run doc         生成doc帮助文档
npm run help        查看ReadME
```
## 打包
```
ubuntu系统：
	npm run release
	npm run pack
	打包之后在dist文件夹中，需要修改文件夹名称为terminalclient，然后将terminalclient文件夹拷贝到终端的/opt/目录下，在终端上的运行程序为/opt/terminalclient/terminalclient
windows系统：
	npm run release
	cd exerc
	make pack
	注意要使用msys2来打包，并且在msys2中先装好innosetup打包软件
	打包完成之后，安装包在exerc/package/中

```
## 日志
```
日志文件存放位置：
1、linux：
    /root/.config/terminalclient/log/
2、windows
    C:\users\sprocomm(用户名)\AppData\Roaming\terminalclient\log\
```
## 启动脚本
```
/etc/seadee/init.d/90-terminalclient-start.sh
```

