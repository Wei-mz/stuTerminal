/**
* @Author: yinshi <root>
* @Date:   2017-03-06T19:02:44+08:00
* @Email:  569536805@qq.com
 * @Last modified by:   yinshi
 * @Last modified time: 2017-04-12T10:38:21+08:00
*/



const { ipcMain } = require('electron');
const { getAppConfig, setConfig, getConfig } = require("./config");
const { addLogRecord, readLogRecords, openLogFile } = require("../utils/log");
const { showErrorBox, showMessageBox, toastShow, toastShow2 } = require('../utils/dialog');
const { onRenderInited, onRenderLoaded, onJsxNativeReady } = require('./render');
const { uuid } = require('../../common/util');
const { onCommand } = require('./command');
const { readFile } = require('../utils/file');
const { closeFile } = require('../utils/file');
const md5 = require('md5');
const { connectToSpice, connectToFFplay, connectToSddev,enableToSddev,startUpdateConnet,disableToSddev,startCheckUpdate, disconnectSpice,disSpice ,startFfmpeg } = require('./tsdk');

var MethodWrapper = {

    ObjectMap:  {
        getAppConfig,
        setConfig,
        getConfig,
        addLogRecord,
        readLogRecords,
        openLogFile,
        showErrorBox,
        showMessageBox,
        toastShow2,
        toastShow,
        onRenderInited,
        onRenderLoaded,
        onCommand,
        onJsxNativeReady,
        md5,
        readFile,
        closeFile,
        connectToSpice,
        connectToSddev,
        enableToSddev,
        startUpdateConnet,
        disableToSddev,
        connectToFFplay,
        startCheckUpdate,
        disconnectSpice,
        disSpice,
        startFfmpeg
    },

    call: (method_name, ...args) => {
        let instance = this;
        let m = method_name.split('.')
        switch(m.length)
        {
            case 1:
                break;
            case 2:
                instance = MethodWrapper.ObjectMap[m[0]];
                break;
            default:
                throw new Error(`invalid method name ${method_name}`);
        }
        let method = MethodWrapper.ObjectMap[method_name];

        if ( method  != undefined && method != null )
            return method.call(instance, ...args);
        else
            throw new Error(`invalid method ${method_name} called`);
    }
}

var EventWrapper = {
    onInited: ()=>{
        ipcMain.on("node.method.call.sync", (event, ...args)=>{
            let result = MethodWrapper.call(...args);
            event.returnValue = (result == undefined ? null : result);
        });
        ipcMain.on("node.method.call.async", (event, call_id, ...args)=>{
            // function must like func(cb, args)
            let params = args.slice(1);
            MethodWrapper.call(args[0], (...result)=>{
                event.sender.send('node.method.return.async.' + call_id, ...result);
            }, ...params);
        });
    }
}

var RenderWrapper = {
    render_call: (cb, ...args)=>{
        var call_id = uuid();
        ipcMain.once("render.method.return." + call_id, (event, result)=>{
            if(cb)
                cb(result);
        })
        require("../../app").win.webContents.send('render.method.call', call_id, ...args);
    }
}

function sendCommand(cb, ...args)
{
    RenderWrapper.render_call(cb, "onCommand", ...args);
}

module.exports = {
    MethodWrapper,
    EventWrapper,
    render_call: RenderWrapper.render_call,
    sendCommand
}

EventWrapper.onInited();
