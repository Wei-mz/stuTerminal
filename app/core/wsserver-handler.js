/**
 * @Author: yinshi <root>
 * @Date:   2017-03-06T19:02:44+08:00
 * @Email:  569536805@qq.com
 * @Last modified by:   root
 * @Last modified time: 2017-03-28T22:33:21+08:00
 */



/**
 * Created by uforgetmenot on 17/2/9.
 */
const cluster = require('cluster');
const {
    AppConfig,getConfig
} = require('./config');
const {
    quitByError
} = require('../utils/util');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const {
    render_call,
    sendCommand
} = require('./native');
const {
    ClientType
} = require('./wsserver-common');
const {
    toastShow,toastShow2
} = require('../utils/dialog');
const { addLogRecord } = require('../utils/log');

cluster.setupMaster({
    exec: './resources/app.asar/app/core/wsserver-worker.js',
    // exec: './app/core/wsserver-worker.js',
});


let wsstatus = {
    "tsdk": false
}
const worker = cluster.fork();


worker.on('message', (msg) => {
    switch (msg.client_type) {
        case "self":
            switch (msg.action) {
                case "report_wsstatus":
                    wsstatus[msg.data.target] = msg.data.status;
                    if (wsstatus[msg.data.target] == "disconnected") {
                        throw Error("websocket should not been disconnected ... error");
                    } else {
                        render_call(null, "on_websocket_connected");
                    }
                    console.log(`${msg.data.target}'s ws status has changed to ${msg.data.status? "connected": "disconnected"}`)
                    break;
                case "report_spice_connected":
                    {
                        render_call((server) => {
                            if (!server)
                                return
                            sendCommand2WS(ClientType.SpiceClient, "transport.connection.parameters", {
                                host: server.host_ip,
                                password: server.spice_password,
                                port: server.spice_port,
                                tlsport: server.spice_tls_port,
                                quality: server.quality,
                                redirect: server.rediect,
                                security: server.security,
                                usb_permission:server.usb_permission
                            });
                        }, "on_request_spice_parameter", msg.data.instance);
                    }
                    break;
                case "report_ffplay_connected":
                    {
                        render_call((server) => {
                            if (!server) {
                                return;
                            }
                            sendCommand2WS(ClientType.FFMpegClient, "transport.connection.parameters", {
                                ffmpeg_url: server.multicastaddressing
                            }); // ffmpeg_url: server.multicastaddressing
                        }, "on_request_ffplay_parameter");
                    }
                    break;
                case "report_ffplay_connected":
                {
                    render_call((server) => {
                        if (!server) {
                            return;
                        }
                        sendCommand2WS(ClientType.FFMpegClient, "transport.connection.parameters", {
                            ffmpeg_url: server.multicastaddressing
                        }); // ffmpeg_url: server.multicastaddressing
                    }, "on_request_ffplay_parameter");
                }
                    break;
                default:
                    break;
            }
            break;
        case ClientType.TerminalSDK:
            switch (msg.action) {
                case "report_discovered_server":
                    let server = msg.data;
                    if (server.server == "virtualink._http._tcp.local.")
                        render_call(null, "on_discovered_server_reported", server)
                    break;
                case "update.network.info":
                    // let conn = msg.data;
                    // sendCommand(null, "update.network.info", conn);
                    break;
                case "config.network":
                    // sendCommand(null, "config.network", msg.data);
                    break;
                case "update.display.resolution":
                    // sendCommand(null, "update.display.resolution", msg.data);
                    break;
                case "modify.display.confirm":
                    // sendCommand(null, "modify.display.confirm");
                    break;
                case "modify.display":
                    // sendCommand(null, "modify.display", msg.data);
                    break;
                default:
                    console.info("ws server recv message contains unkown action: ", msg)
                    break;
            }
            break;
        case ClientType.SpiceClient:
            console.log("recv spice client msg: ", msg);
            switch (msg.action) {
                // case "onForceRDP": 
                case "onForceVideoPlay": 
                        sendCommand(null, "control.server.connectRDP", msg.client_id);
                break;
                case "onForceRestart":
                    // if(getConfig("noask") == true)
                    //     sendCommand(null, "control.server.restart.force", msg.client_id);
                    // else
                    // if(AppConfig.os.islinux)
                    //     toastShow2(0, msg.client_id);
                    // else
                        sendCommand(null, "control.server.restart.force", msg.client_id);
                    break;
                case "onForceShutdown":
                    // if(getConfig("noask") == true)
                    //     sendCommand(null, "control.server.shutdown", msg.client_id);
                    // else
                    // if(AppConfig.os.islinux)
                    //     toastShow2(1, msg.client_id);
                    // else
                        sendCommand(null, "control.server.shutdown", msg.client_id);
                    break;
                case "return.connect.success":
                    addLogRecord('info','client.connect.success');
                    sendCommand(null, "client.connect.success", msg.client_id);
                    break;
                case "return.connect.exit":
                    // if(AppConfig.os.islinux)
                    // {
                    //     if(getConfig("noask") == true)
                    //         sendCommand(null, "client.connect.exit", msg.client_id);
                    //     else
                    //         toastShow2(2, msg.client_id);
                    // }
                    // else
                    console.log("spice  exit  wsserver-handler !!!!!!!!!!!!!!!")
                        sendCommand(null, "client.connect.exit", msg.client_id);
                        addLogRecord('info','client.connect.exit');
                    break;
                case "return.connect.error":
                    if(msg.info)
                    {
                        if(getConfig("language") == "en"){
                            toastShow("Error",msg.info,3000);
                        }
                        else{
                            // toastShow("错误",msg.info,3000);
                            console.info("!!!!!  VM connect error: ", msg.info);
                            addLogRecord("E","VM connect error: "+msg.info);
                        }
                    }

                    break;
                default:
                    console.info("ws server recv message contains unkown action: ", msg);
                    addLogRecord("I","ws server recv message contains unkown action: "+msg);
                    break;
            }
            break;
        case ClientType.FFMpegClient:
            console.info("The msg what ws server recv message from ffplay clinet is unkown: ", msg);
            break;
        default:
            console.info("ws server recv message from unkown client type: ", msg)
            break;
    }
})

process.on("exit", () => {
    worker.process.disconnect();
});

function sendCommand2WS(client_type, action, data = {}) {
    worker.send({
        client_type,
        action,
        data
    });
}

function findTSDKExe() {
    let tsdkexe = "terminalsdk-server";
    paths = process.env.PATH.split(':');
    for (let i = 0; i < paths.length; i++) {
        let item = paths[i];
        try {
            fs.accessSync(path.join(item, tsdkexe), fs.constants.X_OK);
            return true;
        } catch (e) {}
    }
    return false;
}


function findTSDKProcess() {
    let tsdkexe = "terminalsdk-server";
    let result = cp.spawnSync("ps", ['-h', '-o', 'command']);
    if (result.status != 0) {
        return false;
    } else if (result.stdout.toString().match(tsdkexe)) {
        return true;
    } else {
        return false
    }
}

function needConnectTSDK() {
    if (!AppConfig.app.isteminal)
        return false;
    if (AppConfig.os.islinux) {
        return true;
    } else // windows or mac_osx
    {
        return false;
    }
}

function spawnTSDK() {
    let tsdkexe = "terminalsdk-server";

    if (!needConnectTSDK())
        return

    function send_regclient() {
        proxy.regclient((err, result) => {
            if (err) {
                quitByError("错误: 无法连接到设置程序!")
                return
            }
        }, AppConfig.app.apptype, AppConfig.app.appinstid);
    }

    if (!findTSDKProcess()) {

        if (!findTSDKExe()) {
            console.error("can not find terminal sdk exe file ... error")
            quitByError("错误: 不能找到设置程序!")
            return
        }

        const child = cp.spawn(tsdkexe);
        child.on('error', err => {
            quitByError("错误: 不能打开设置程序!")
        });
        child.unref();

    }
}


// spawnTSDK();

module.exports = {
    sendCommand2WS,
}
