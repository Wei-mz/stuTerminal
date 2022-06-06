/**
* @Author: yinshi <root>
* @Date:   2017-03-01T22:00:27+08:00
* @Email:  569536805@qq.com
* @Last modified by:   root
* @Last modified time: 2017-03-28T10:18:53+08:00
*/



import {ipcRenderer} from 'electron';
import * as handler from './handler';
import { uuid } from '../../common/util';
import { onCommand } from './command';

/**
 * @class native_backend
 * @static
 */
let native_backend={};


export function node_call_async(cb, ...args)
{
    let call_id = uuid();
    ipcRenderer.once("node.method.return.async." + call_id, (event, ...result)=>{
        if(cb)
            cb(...result);
    });
    ipcRenderer.send("node.method.call.async", call_id, ...args);
}

/**
 * 同步调用后端的函数
 *
 * @method node_call_sync
 * @param args      调用的函数名与参数名
 * @returns {*}     返回该函数调用的结果
 */
export function node_call_sync(...args)
{
    return ipcRenderer.sendSync('node.method.call.sync', ...args);
}


var MethodWrapper = {
    ObjectMap:  {
        "on_discovered_server_reported": handler.on_discovered_server_reported,
        "on_websocket_connected": handler.on_websocket_connected,
        "on_request_spice_parameter": handler.on_request_spice_parameter,
        "on_request_ffplay_parameter":handler.on_request_ffplay_parameter,
        onCommand
    },
    call: (method_name, ...args)=>{
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

export var EventWrapper = {
    onInited: ()=>{
        ipcRenderer.on("render.method.call", (event, call_id, ...args)=>{
            let result = MethodWrapper.call(...args);
            event.sender.send('render.method.return.' + call_id, result == undefined ? null : result);
        });
    }
}
EventWrapper.onInited();

export function sendCommand(cb, ...args)
{
    node_call_async(cb, "onCommand", ...args);
}

node_call_async(null, "onJsxNativeReady");
