/**
 * @Author: yinshi <root>
 * @Date:   2017-03-06T09:30:14+08:00
 * @Email:  569536805@qq.com
 * @Last modified by:   root
 * @Last modified time: 2017-03-31T16:13:02+08:00
 */



/**
 * Created by uforgetmenot on 17/2/8.
 */
const WebSocket = require('ws');
const {
    ClientType
} = require('./wsserver-common')

const secure_key = "e6700a43-d4ab-4db8-8818-d3b089389d4d";

const server = new WebSocket.Server({
    port: 31962
});

msgCache = new Array();

let tsdkws = null;
let spicews = null;
let ffmpegws = null;

process.on("message", (msg, handle) => {
    console.log("wsserver worker is going to handle message: ", msg)
    // console.log('ssssssssssss');
    console.log("msg.client_type: "+msg.client_type)
    switch (msg.client_type) {
        case ClientType.TerminalSDK:
            if (tsdkws) {
                tsdkws.send(JSON.stringify(msg));
            } else {
                msgCache.push(msg);
                console.info("terminalsdk websocket has not connected, save message to cache");
            }
            break;
        case ClientType.SpiceClient:
            if (spicews) {
                console.info("spice  connection success       !!!!!!!!!!!!!!!!!!!!!!!!!");
                spicews.send(JSON.stringify(msg));
                console.info("send message ...", msg)
            } else {
                console.info("spice  connection failed       !!!!!!!!!!!!!!!!!!!!!!!!!");
                console.error("websocket connection for spice is invalid and drop message", msg);
            }
            break;
        case ClientType.FFMpegClient:
            if(ffmpegws) {
                console.info("send ffplay message ...", msg);
                ffmpegws.send(JSON.stringify(msg));
            } else {
                console.console.error("Websocket connect for ffmpeg is invalid and drop mesage", msg);
            }
            break;
        default:
            console.error("invalid message received, drop it ...", msg)
            break;
    }
});

process.on("exit", () => {
    
    console.info("wsserver worker is ... exiting");
});

server.on('connection', function connection(ws) {

    ws.on('open', () => {
        console.info("websocket has been opened")
    })

    ws.on('message', (msg) => {
        // console.log("recv message: ", msg);
        try {
            msg = JSON.parse(msg);
            if (msg.secure != secure_key)
                throw new Error("authenticate failed");
        } catch (e) {
            console.error("ws server received a invalid message, drop it ...");
            ws.close();
            return;
        }
        if (msg.action == "initialize") {
            ws.client_id = msg.client_id;
            ws.client_type = msg.client_type;
            switch (ws.client_type) {
                case ClientType.TerminalSDK:
                    if (tsdkws)
                        tsdkws.close();
                    tsdkws = ws;
                    process.send({
                        "client_type": "self",
                        "action": "report_wsstatus",
                        "data": {
                            "target": ClientType.TerminalSDK,
                            "status": true
                        }
                    });

                    for (let i = msgCache.length - 1; i >= 0; i = i - 1) {
                        let m = msgCache[i];
                        if (m.client_type == ClientType.TerminalSDK) {
                            msgCache.splice(i, 1);
                            tsdkws.send(JSON.stringify(m));
                            console.info("send cached message to terminalsdk", m);
                        }
                    }
                    break;
                case ClientType.SpiceClient:
                    if (spicews)
                        spicews.close()
                    spicews = ws;
                    process.send({
                        "client_type": "self",
                        "action": "report_spice_connected",
                        "data": {
                            "status": true,
                            "instance": msg.client_id
                        }
                    });
                    break;
                case ClientType.FFMpegClient:
                    if (ffmpegws)
                        ffmpegws.close();
                    ffmpegws = ws;
                    process.send({
                        "client_type": "self",
                        "action": "report_ffplay_connected",
                        "data": {
                            "status": true
                        }
                    });
                    break;
                default:
                    throw new Error("unknown websocket client type");
                    break;
            }
        } else {
            process.send(msg);
        }

    });
    ws.on("ping", (data, flag) => {
        console.info("on ping and recv data: ", data);
    });
    ws.on("pong", (data, flag) => {
        console.info("on pong and recv data: ", data)
    });
    ws.on("error", (e) => {
        console.error("wsserver.worker", e);
    });
    ws.on("close", (code, reason) => {
        console.info(`websocket client ${ws.client_type} is ... closing`)
        if (ws.client_type == ClientType.TerminalSDK) {
            tsdkws = null;
            process.send({
                "client_type": "self",
                "action": "report_status",
                "data": {
                    "target": ClientType.TerminalSDK,
                    "status": false
                }
            })
        } else if (ws.client_type == ClientType.SpiceClient) {
            spicews = null;
        }
    });
});
