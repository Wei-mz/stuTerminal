/**
 * @Author: yinshi <root>
 * @Date:   2017-03-07T16:27:07+08:00
 * @Email:  569536805@qq.com
 * @Last modified by:   root
 * @Last modified time: 2017-04-18T15:24:46+08:00
 */



/**
 * Created by uforgetmenot on 16/12/30.
 */
import React, {
    Component
} from 'react';
import ReactDOM from 'react-dom';
import {
    VirtualMachine
} from './virtualmachine';
import {
    toastShow
} from '../../utils/dialog';
import PubSub from 'pubsub-js';
import {
    networkException,
    fetchJSON,
    getURL,
    packURL,
    getServerDetail,
    setclassromm,
    getclassromm,
    getPort,
    getActiveServer,
    generateURLs,
    calcKeyPair,
    storeToken,
    storeTokenDetail,
    getToken,
    getTokenDetail,
    getTeacherDetail,
    reloadServers,
    readFile,
    closeFile,
    fetchHeartBeat,
    switchToLogin,
    setIsSpiceConnected,
    getIsSpiceConnected,
    getLinkHaltID,
    setLinkHaltID,
    updateCpuFreq,
    fetchHeartImg,
    checkUpdate,
    getIPAdress,
    getSortNum,
    updateTerminalSort,
    cleanLog
} from '../../store/options';
import {
    DeviceType,
    DeviceID
} from '../../utils/config';
import {
    uuid
} from '../../../common/util';
import {
    sendCommand,
    node_call_async,
    node_call_sync
} from '../../core/native';
import {
    updateTimeView
} from '../headbar/headbar';
import {
    AppConfig
} from '../../utils/config';
import { addLogRecord, LogType } from '../../utils/log';
import { act } from 'react-test-renderer';
import { constants } from 'zlib';
import { debug } from 'console';

const { ipcRenderer } = require('electron')

const {
    ClientType
} = require('../../../app/core/wsserver-common');
const child_process = require('child_process');
const kill = require('tree-kill');
let LOAD_SERVERS = "load.servers";
let setServersLoadAction = servers => ({
    type: LOAD_SERVERS,
    servers
});

var wsc = null;
let setTime = null;
var fs = require('fs');
let Ffplaypid = 0
let timeCount = 0;
let maxTime = 120; //执行脚本时间（5*12*10<10分钟>）
let timeout = null;
var mousedKeyTime = null;
let setInter = false;

export let LoadServersReducer = (state = {
    servers: []
}, action) => {
    switch (action.type) {
        case LOAD_SERVERS:
            return Object.assign({}, state, {
                servers: action.servers
            });
        default:
            return state;
    }
}


export class VmSelectPanel extends Component {

    static MaxLostTimes = 12;
    static StartDeviceFlag = 0;
    static defaultProps = {
        servers: []
    }


    static PowerAction = {
        START: "start",
        STOP: "stop",
        REBOOT: "reboot",
        SUSPEND: "suspend",
        PAUSE: "pause"
    }

    static ServerState = {
        NOSTATE: 0x00,
        RUNNING: 0x01,
        PAUSED: 0x03,
        SHUTDOWN: 0x04,
        CRASHED: 0x06,
        SUSPENDED: 0x07,
        BUILDING: 0x09
    }

    constructor() {
        super();
    }

    initVaribles() {
        this.layer_opened = false;
        this.token = null;
        this.connected = true;
        this.registered = false;
        this.timesynced = false;
        this.tasks = new Set();
    }

    getHotServer() {
        let addr = getActiveServer();
        let that = this;

        (async (pt) => {
            let done = false;
            let port = getPort();
            try {
                let detail = await getServerDetail(addr, port);
                generateURLs(addr, port, detail.server.api_version);
                done = true;
            } catch (e) {
                switchToLogin();
                console.log("try get hot server ... failed", e);
                // layer.closeAll('loading');
                if (!that.layer_opened) {
                    that.layer_index = layer.open({
                        skin: 'layui-layer-rim',
                        title: false,
                        type: 2,
                        shade: 0,
                        closeBtn: true,
                        id: "DB104778-F41F-4A3B-BE73-02E48C74B4DF",
                        end: function (index) {
                            layer.close(index);
                            that.layer_opened = false;
                        },
                        content: `./html/message.html?content=${(e == networkException) ?
                            escape('网络无连接, 请检查网络!') : escape('连接服务器失败, 请联系管理员!')}`,
                        zIndex: layer.zIndex,
                        success: function (layero) {
                            layer.setTop(layero);
                        }
                    });
                    that.layer_opened = true;
                }
            }
            if (done) {
                if (that.interval)
                    clearInterval(that.interval)
                if (that.layer_index)
                    layer.close(that.layer_index);
                layer.closeAll('loading');
                that.onServerConnected();
            }
        })(that);
    }


    getpictures() {
        let file = '/tmp/screen.jpg';
        // setInter = true;
        let ip = sessionStorage.getItem('pc_host_ip');
        // sessionStorage.setItem('imgRequest','true')
        let headers = {
            token: this.token,
            'Mac': AppConfig.app.feturemac,
            'Studentroom': getclassromm(),
            'ip': getIPAdress()
        }
        clearInterval(setTime);
        setTime = setInterval(() => {
            // if(sessionStorage.getItem('imgRequest') == 'false'){
            //     clearInterval(setTime);
            //     setInter = false;
            // }
            fs.readFile(file, function (err, data) {
                if (err) {
                    console.log('读取文件失败');
                } else {
                    getTeacherDetail(ip, 8081, headers, data);
                    // console.log('send')
                }
            });
        }, 3000);
    }
    connectToWS() {
        this.websocket = new WebSocket(getURL('ws').replace('(token)', getToken()));
        this.websocket.onopen = function (evt) {
            console.log("websocket has been openned ... ok");
            addLogRecord('info', 'websocket has been openned ... ok');
            // if(!setInter){
            //     if(msg.data.room == getclassromm() ){
            addLogRecord('info', 'start get pictures!!')
            this.getpictures();
            //     }
            // }
            // node_call_async(null, "startCheckUpdate", null);
            // checkUpdate(getActiveServer(),false)用于检查版本更新
        }.bind(this);
        this.websocket.onmessage = function (evt) {
            addLogRecord('info', '----------------------   receve ws msg  ----------------');
            addLogRecord('msg', evt.data)

            let msg = JSON.parse(evt.data);


            console.log(msg, "putong msg")
            console.log(msg.action, "zhesmes.action");
            console.log(msg.data, "msg data")
            switch (msg.action) {
                case "instance.changed":
                    this.tasks.add(msg.action);
                    setTimeout((() => {
                        if (this.tasks.has(msg.action)) {
                            this.tasks.delete(msg.action);
                            this.loadServers(false);
                            if (msg.data == 'establish_end') {
                                clearTimeout(mousedKeyTime);
                                node_call_async(null, "enableToSddev", "enable");
                                toastShow("课程创建完成，鼠键禁用已被解除!", 5000);
                            } else if (msg.data == 'establish_fail') {
                                clearTimeout(mousedKeyTime);
                                node_call_async(null, "enableToSddev", "enable");
                                toastShow("课程创建失败，鼠键禁用已被解除!", 5000);
                            }
                        }
                    }).bind(this), 3000);
                    break;
                case "readyswitching":
                    if (msg.data.setclassroom == 'setclassroom') {
                        toastShow("教室布置中，鼠标键盘将被禁用！", 5000);
                    } else if (msg.data.image) {
                        toastShow("模板切换中，鼠标键盘将被禁用！", 5000);
                    } else {
                        toastShow("教师操作中，鼠标键盘将被禁用！", 5000);
                    }
                    node_call_async(null, "disableToSddev", "disable");
                    clearTimeout(mousedKeyTime);
                    mousedKeyTime = setTimeout(() => {
                        node_call_async(null, "enableToSddev", "enable");
                        toastShow("执行超时，鼠键禁用自动解除!");
                    }, 300 * 1000);

                    break;
                case "instance.action":
                    console.log('开始操作虚拟机！');
                    this.listRefresh();
                    switch (msg.data.action) {
                        case "start":
                            if (msg.data.vm_state == 'active') {
                                this.startUpSpice(msg.data.instance);
                            } else {
                                toastShow('虚拟机启动异常，请联系管理员处理！', 5000);
                            }
                            break;
                        case "stop":
                            if (msg.data.vm_state == 'stopped') {
                                console.log('虚拟机已关闭！');
                            } else {
                                toastShow('虚拟机关机失败！', 5000);
                            }
                            break;
                        case "reboot":
                            if (msg.data.force) {
                                if (msg.data.vm_state == 'active') {
                                    setTimeout(() => {
                                        toastShow('强制重启虚拟机成功！', 5000);
                                    }, 10000);
                                } else {
                                    // 异常处理
                                    toastShow('强制重启虚拟机失败，请稍后重试！', 5000);
                                }
                            } else {
                                if (msg.data.vm_state == 'active') {
                                    setTimeout(() => {
                                        toastShow('虚拟重启成功！', 5000);
                                    }, 10000);
                                } else {
                                    // 异常处理
                                    toastShow('虚拟机重启虚拟机失败，请稍后重试！', 5000);

                                }
                            }
                            break;
                        default:
                            console.log('未匹配到instance.action的msg.data.action');
                    }
                    $('.LoadingShow').addClass('hidden');
                    break;
                // case "control.image.instances":
                case "imagechanged":
                    console.log("change image now");
                    let image = msg.data.image;
                    let store = require('../../app').store
                    let servers = store.getState().LoadServersReducer.servers;
                    setLinkHaltID("default");
                    if (msg.data.task_state == 'fail') {
                        clearTimeout(mousedKeyTime);
                        node_call_async(null, "enableToSddev", "enable");
                        toastShow("桌面切换失败,鼠键禁用已被解除!", 5000);
                    } else {
                        this.listRefresh();
                        for (let index in servers) {
                            let server = servers[index];
                            if (server.image.id == image) {
                                if (getIsSpiceConnected()) {
                                    console.log("close spice and start");
                                    $("#hide-menu").data("selected.server", server);
                                    let selectedServer = $("#hide-menu").data("selected.server");
                                    console.log(selectedServer);
                                    node_call_async(null, "enableToSddev", "enable");
                                    toastShow("鼠键禁用已被解除!", 5000);
                                    clearTimeout(mousedKeyTime);
                                    localStorage.setItem("instanceItem", true);
                                    sessionStorage.setItem('imagechanged_uid', msg.data.uid);
                                    if (!getIsSpiceConnected()) {
                                        this.startUpSpice(selectedServer.id);
                                    }
                                } else {
                                    console.log("start spice only");
                                    $("#hide-menu").data("selected.server", server);
                                    let selectedServer = $("#hide-menu").data("selected.server");
                                    console.log(selectedServer);
                                    node_call_async(null, "enableToSddev", "enable");
                                    toastShow("鼠标键盘禁用已被解除!", 5000);
                                    clearTimeout(mousedKeyTime);
                                    localStorage.setItem("instanceItem", true);
                                    sessionStorage.setItem('imagechanged_uid', msg.data.uid);
                                    this.startUpSpice(selectedServer.id);
                                }
                                break;
                            }
                        }
                    }

                    break;
                case "control.remoteteaching":
                    console.log("recv msg ");
                    let retkey1 = msg.result;
                    let remoteteachingaction = msg.data.action;
                    let multicastaddressing = msg.data.multicastaddressing;
                    this.listRefresh();
                    sessionStorage.setItem("remote_address", multicastaddressing)

                    if (remoteteachingaction == "start") {
                        addLogRecord("INFO", '开始启动广播');
                        // sessionStorage.setItem("ffmpeg.current.parameters", JSON.stringify(msg.data));
                        let udpstring = multicastaddressing.substring(6, 16);
                        console.log("udpstring" + udpstring)
                        child_process.exec(`bash /usr/bin/seadee-do.sh udp ${udpstring}`, (err, stderr, stdout) => {
                            if (err) {
                                console.info(err);
                                addLogRecord("ERRO", 'udp start fail');
                                return;
                            }
                            console.log(stderr, stdout);
                            addLogRecord("Info", '------ Udp success  -------');
                        });
                        // node_call_async(null, "connectToSddev", "disable");
                        node_call_async(null, "disableToSddev", "disable");
                        node_call_async(null, "connectToFFplay", multicastaddressing);
                        addLogRecord("Info", '------ start ffplay   -------');
                    } else {
                        let active_id = localStorage.getItem("active_uid");
                        addLogRecord("INFO", '开始关闭广播' + active_id);
                        child_process.exec(`bash  /usr/bin/seadee-do.sh kill_ffplay`, (err, stderr, stdout) => {
                            if (err) {
                                console.info(err);
                                addLogRecord("E", 'kill_ffplay fail');
                                // cb(err);
                                return;
                            }
                            // cb(null, true);
                            console.log(stderr, stdout);
                            addLogRecord("I", '-------------kill Udp success  -------');
                        });
                        // }
                        // node_call_async(null, "connectToSddev", "enable");
                        node_call_async(null, "enableToSddev", "enable");
                        if (active_id) {
                            addLogRecord("Info", '------ stop  ffplay   -------');
                            node_call_async(null, "connectToSpice", active_id);
                            this.reconnectionSpice(active_id);
                        }
                    }
                    break;
                case "shutdown":
                    console.log("shutdown mac is" + msg.data.mac);
                    if (msg.data.mac == AppConfig.app.feturemac || msg.data.mac == "all") {
                        console.log("shutdown now");
                        sendCommand(null, "system.halt");
                    }
                    break;
                case "disable_terminal":

                    if (msg.data.mac == AppConfig.app.feturemac) {
                        console.log("recive disable_terminal now");
                        // node_call_async(null, "disconnectSpice");
                        switchToLogin();
                    }
                    break;
                case "enable_terminal":

                    if (msg.data.mac == AppConfig.app.feturemac) {
                        console.log("recive enable_terminal now");
                        // reloadServers();
                    }
                    break;
                case "add_instance":
                    if (msg.data.mac == AppConfig.app.feturemac) {
                        console.log("recive add_instance now");
                        // reloadServers();
                        this.loadServers(false);
                    }
                    break;
                case "delete_instance":
                    if (msg.data.mac == AppConfig.app.feturemac) {
                        addLogRecord("recive delete_instance now" + msg.data);
                        // reloadServers();
                        this.loadServers()
                        let li = msg.data.instances.split(",");
                        console.log("recive delete_instance now" + li[0]);
                        let selecteduid = localStorage.getItem("active_uid");
                        if (AppConfig.os.islinux) {
                            for (var i = 0; i < li.length; i++) {
                                if (li[i] == selecteduid) {
                                    // node_call_async(null, "disconnectSpice");
                                    node_call_async(null, "disSpice");
                                }
                            }
                        }
                    }
                    break;
                case "delete_user":
                    if (msg.data.mac == AppConfig.app.feturemac) {
                        let li = msg.data.instances.split(",");
                        console.log("recive delete_user now" + li[0]);
                        let selecteduid = localStorage.getItem("active_uid");
                        if (AppConfig.os.islinux) {
                            for (var i = 0; i < li.length; i++) {
                                if (li[i] == selecteduid) {
                                    // node_call_async(null, "disconnectSpice");
                                    node_call_async(null, "disSpice");
                                }
                            }
                        }
                        switchToLogin();
                    }
                    break;
                case "dev_redirect":
                    if (msg.data.mac == AppConfig.app.feturemac) {
                        console.log("recive dev_redirec now");
                        // reloadServers();
                        this.loadServers(false);
                        let li = msg.data.instances.split(",");
                        // console.log("recive delete_instance now"+li[0]);
                        let selecteduid = localStorage.getItem("active_uid");
                        if (AppConfig.os.islinux) {
                            for (var i = 0; i < li.length; i++) {
                                if (li[i] == selecteduid) {
                                    // node_call_async(null, "disconnectSpice");
                                    node_call_async(null, "disSpice");
                                    node_call_async(null, "connectToSpice", selecteduid);
                                    this.reconnectionSpice(selecteduid);
                                }
                            }
                        }
                    }
                    break;
                case "set_resolution":
                    if (msg.data.mac == AppConfig.app.feturemac || msg.data.mac == "all") {
                        console.log("set resolution and the resolution is:" + msg.data.resolution);
                        let exec = require('child_process').exec;
                        let cmd = "/opt/tools/set_resolution.sh ";
                        cmd = cmd + msg.data.resolution;
                        exec(cmd, (error, stdout, stderr) => {
                            if (error) {
                                // console.error(`exec error: ${error}`);
                                addLogRecord(LogType.ERROR, `exec error: ${error}`);
                                return;
                            }
                            // console.log(stdout);
                        });
                    }
                    break;
                default:
                    // let body = JSON.parse(msg.data);
                    let body = msg.data;
                    // console.log(body);
                    switch (body.action) {
                        case "terminal.shutdown":
                            child_process.exec(`shutdown -h now`, (err, stderr, stdout) => {
                                if (err) {
                                    console.info(err);
                                    addLogRecord("E", err);
                                    // cb(err);
                                    return;
                                }
                                // cb(null, true);
                                console.log(stderr, stdout);
                            });
                            break;
                        case "shutdown.student.terminal":
                            if (body.mac == AppConfig.app.feturemac || body.mac == "all") {
                                // console.log("shutdown by mac")
                                child_process.exec(`shutdown -h now`, (err, stderr, stdout) => {
                                    if (err) {
                                        console.info(err);
                                        addLogRecord("E", err);
                                        // cb(err);
                                        return;
                                    }
                                    // cb(null, true);
                                    console.log(stderr, stdout);
                                });
                            }

                            break;
                        // 远程重启
                        case "reboot.student.terminal":
                            if (body.mac == AppConfig.app.feturemac || body.mac == "all") {
                                // console.log("shutdown by mac")
                                child_process.exec(`reboot`, (err, stderr, stdout) => {
                                    if (err) {
                                        console.info(err);
                                        addLogRecord("E", err);
                                        // cb(err);
                                        return;
                                    }
                                    // cb(null, true);
                                    console.log(stderr, stdout);
                                });
                            }

                            break;
                        // 远程lianjie
                        case "reconnection.spicy":
                            console.log("reconnection")
                                let selectedServer = $("#hide-menu").data("selected.server");
                                if(msg.data.mac===AppConfig.app.feturemac){
                                (async () => {
                                    let url = getURL("controlserver").replace('(server)', selectedServer.id).replace('(action)', VmSelectPanel.PowerAction.START);
                                    let result = null;
                                    try {S
                                        this.showProgress();
                                        result = await fetchJSON(url, 'POST', {
                                            token: this.token
                                        });
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        this.cancelProcess()
                                    }
                                    if (result) {
                                        console.log('requestConnectComputer   success');
                                    }
                                })();
                                }
       
          

                            break;
                        case "student.handle.start":
                            // let startdata = JSON.parse(body.data)
                            let startdata = body.data;
                            console.log("start show")
                            if (body.mac == AppConfig.app.feturemac) {
                                if (startdata.remotestatus == 'true') {
                                    // child_process.exec(`killall -9 ffplay`, (err, stderr, stdout) => {
                                    let active_id = localStorage.getItem("active_uid");
                                    child_process.exec(`bash  /usr/bin/seadee-do.sh kill_ffplay`, (err, stderr, stdout) => {
                                        if (err) {
                                            console.info(err);
                                            addLogRecord("E", err);
                                            // cb(err);
                                            return;
                                        }
                                        // cb(null, true);
                                        console.log(stderr, stdout);
                                    });
                                    // }
                                    // node_call_async(null, "connectToSddev", "enable");
                                    node_call_async(null, "enableToSddev", "enable");
                                    if (active_id) {
                                        node_call_async(null, "connectToSpice", active_id);
                                        this.reconnectionSpice(active_id);
                                    }
                                    console.log('start student handle show and remote status is true')
                                }
                                // console.log("student handle show")
                                // let remoteAdress = sessionStorage.getItem("remote_address")
                                console.log('start student handle show')
                                let currentdisplay = screen.width + "x" + screen.height;
                                // let cmdstr = 'ffmpeg -f x11grab -video_size cif -framerate 25 -loglevel quiet -s '+currentdisplay+' -i :0.0 -vcodec libx264 -crf 30 -preset ultrafast -tune zerolatency -f mpegts '+ remoteAdress
                                // let cmdstr = 'ffmpeg -re -f x11grab -r 30 -loglevel quiet -s '+currentdisplay+' -i :0.0 -c:v libx264 -crf 28 -force_key_frames "expr:gte(t,n_forced*1)" -preset:v ultrafast -tune:v zerolatency -f mpegts '+startdata.remoteaddr
                                let cmdstr = 'bash  /usr/bin/seadee-do.sh  ffmpeg  ' + '  ' + currentdisplay + '  ' + startdata.remoteaddr
                                console.log(cmdstr)
                                node_call_async(null, "startFfmpeg", cmdstr);
                            }
                            else if (startdata.remotestatus == 'false') {
                                console.log('start ffplay and remote status is false');
                                // node_call_async(null, "", "disable");
                                let udpstring = startdata.remoteaddr.substring(6, 16);
                                console.log("udpstring" + udpstring)
                                child_process.exec(`bash /usr/bin/seadee-do.sh udp  ${udpstring}`, (err, stderr, stdout) => {
                                    if (err) {
                                        console.info(err);
                                        addLogRecord("E", 'udp start fail');
                                        return;
                                    }
                                    console.log(stderr, stdout);
                                });
                                // node_call_async(null, "connectToSddev", "disable");
                                node_call_async(null, "disableToSddev", "disable");
                                node_call_async(null, "connectToFFplay", startdata.remoteaddr);
                            }

                            break;
                        case "student.handle.stop":
                            // let stopdata = JSON.parse(body.data)
                            let stopdata = body.data;
                            let active_id = localStorage.getItem("active_uid");
                            if (body.mac == AppConfig.app.feturemac) {
                                console.log("student handle show stop")
                                child_process.exec(`bash  /usr/bin/seadee-do.sh kill_ffmpeg`, (err, stderr, stdout) => {
                                    if (err) {
                                        console.info(err);
                                        addLogRecord("E", err);
                                        // cb(err);
                                        return;
                                    }
                                    // cb(null, true);
                                    console.log(stderr, stdout);
                                });
                                if (stopdata.remotestatus == 'true') {
                                    console.log('stop student handle show and remote status is true')
                                    let udpstring = stopdata.remoteaddr.substring(6, 16);
                                    console.log("udpstring" + udpstring)
                                    child_process.exec(`bash /usr/bin/seadee-do.sh udp  ${udpstring}`, (err, stderr, stdout) => {
                                        if (err) {
                                            console.info(err);
                                            addLogRecord("E", 'udp start fail');
                                            return;
                                        }
                                        console.log(stderr, stdout);
                                    });
                                    // node_call_async(null, "connectToSddev", "disable");
                                    node_call_async(null, "disableToSddev", "disable");
                                    node_call_async(null, "connectToFFplay", stopdata.remoteaddr);
                                }
                            }
                            else {
                                if (stopdata.remotestatus == 'false') {
                                    // child_process.exec(`killall -9 ffplay`, (err, stderr, stdout) => {
                                    let active_id = localStorage.getItem("active_uid");
                                    child_process.exec(`bash  /usr/bin/seadee-do.sh kill_ffplay`, (err, stderr, stdout) => {
                                        if (err) {
                                            console.info(err);
                                            addLogRecord("E", err);
                                            // cb(err);
                                            return;
                                        }
                                        // cb(null, true);
                                        console.log(stderr, stdout);
                                    });
                                    // node_call_async(null, "connectToSddev", "enable");
                                    node_call_async(null, "enableToSddev", "enable");
                                    if (active_id) {
                                        node_call_async(null, "connectToSpice", active_id);
                                        this.reconnectionSpice(active_id);
                                    }
                                }
                            }
                            break;
                        case "setresolution.student.terminal":
                            if (body.mac == AppConfig.app.feturemac || body.mac == "all") {
                                // console.log("set resolution and the resolution is:"+body.data);
                                let cur = screen.width + "x" + screen.height;
                                if (cur != body.data) {
                                    let exec = require('child_process').exec;
                                    let cmd = "";
                                    if (AppConfig.os.isarm) {
                                        cmd = "/opt/tools/set_resolution.sh ";
                                        cmd = cmd + body.data;
                                        console.log(cmd)
                                        exec(cmd, (error, stdout, stderr) => {
                                            if (error) {
                                                // console.error(`exec error: ${error}`);
                                                addLogRecord(LogType.ERROR, `exec error: ${error}`);
                                                return;
                                            }
                                            // console.log(stdout);
                                        });
                                    }
                                    else {
                                        cmd = "seadee-display-config -r ";
                                        cmd = cmd + body.data;
                                        console.log(cmd)
                                        exec(cmd, (error, stdout, stderr) => {
                                            if (error) {
                                                // console.error(`exec error: ${error}`);
                                                addLogRecord(LogType.ERROR, `exec error: ${error}`);
                                                return;
                                            }
                                            // console.log(stdout);
                                        });
                                    }
                                }
                            }
                            break;
                        case "blank.screen":
                            console.log(body)
                            let selecteduid = localStorage.getItem("active_uid");
                            console.log(selecteduid)
                            if (body.mac == AppConfig.app.feturemac || body.mac == 'all') {
                                if (body.data == 'white') {
                                    console.log("go to white")
                                    $('.blank-shade').addClass('hidden')
                                    node_call_async(null, "enableToSddev", "enable");
                                    if (selecteduid) {
                                        node_call_async(null, "connectToSpice", selecteduid);
                                        this.reconnectionSpice(selecteduid);
                                    }
                                } else if (body.data == 'blank') {
                                    console.log("go to blank")
                                    console.log('开始退出spice !!!');
                                    // node_call_async(null, "disconnectSpice");
                                    node_call_async(null, "disSpice");
                                    node_call_async(null, "disableToSddev", "disable");
                                    $('.blank-shade').removeClass('hidden')
                                } else {
                                    console.log("go to inverse")
                                    // 切换黑屏
                                    if ($('.blank-shade').attr('class').indexOf('hidden') == -1) {
                                        $('.blank-shade').addClass('hidden')
                                        node_call_async(null, "enableToSddev", "enable");
                                        if (selecteduid) {
                                            node_call_async(null, "connectToSpice", selecteduid);
                                            this.reconnectionSpice(selecteduid);
                                        }

                                    } else {
                                        // node_call_async(null, "disconnectSpice");
                                        node_call_async(null, "disSpice");
                                        node_call_async(null, "disableToSddev", "disable");
                                        $('.blank-shade').removeClass('hidden')
                                    }
                                }
                            }
                            break;
                        default:
                            break;
                    }
                    // console.log("websocket received incompatible message", msg);

                    break;
            }
        }.bind(this);
        this.websocket.onping = function (evt) {
            console.log("recevied ping", evt.data);
            addLogRecord('ERRO', '-----------------  recevied ping---------------');
        }.bind(this);
        this.websocket.onpong = function (evt) {
            console.log("recevied pong", evt.data);
            addLogRecord('ERRO', '----------------- recevied pong---------------');
        }.bind(this);
        this.websocket.onerror = function (err) {
            console.log("recevied error", err);
            addLogRecord('ERRO', '----------------- recevied error---------------');
        }.bind(this);
        this.websocket.onclose = function (evt) {
            addLogRecord('ERRO', '-----------------  websocket  close 1---------------');
            addLogRecord('ERRO', JSON.stringify(evt));
            // clearInterval(setTime);
            // setInter=false;
            console.log("ws close");
            console.log('websocket readyState ws: ' + this.websocket.readyState);
            addLogRecord(' INFO', `websocket readyState:  ${this.websocket.readyState}`)
            if (this.connected) {
                this.connected = false;
                PubSub.publish("connect.to.server", false);
            }
        }.bind(this);
    }

    registerDevice() {
        (async () => {
            this.registered = true;

            let done = false;
            try {
                let keyvalue = await fetchJSON(getURL('authkeypair'));
                console.log(keyvalue.key)
                let result = await fetchJSON(getURL('regdevice').replace('(device)', DeviceID), "POST", {
                    "device_id": DeviceID,
                    "device_type": DeviceType,
                    "keypair_key": keyvalue.key,
                    "keypair_value": calcKeyPair(keyvalue.key),
                });

                done = true;
            } catch (e) {
                console.log(e)
                toastShow(e.msg);
            }
            if (done)
                this.loginByDevice();
        })();
    }

    loginByDevice() {
        let that = this;
        (async (that) => {
            let done = false;
            let pc_host_ip = null;
            try {
                let keyvalue = await fetchJSON(getURL('authkeypair'));
                console.log("key pair right")
                let token_detail = await fetchJSON(getURL('authdevice'), "GET", {
                    device_id: DeviceID.trim(),
                    device_type: DeviceType,
                    keypair_key: keyvalue.key,
                    keypair_value: calcKeyPair(keyvalue.key)
                });
                done = true;
                storeTokenDetail(token_detail.token);
                storeToken(token_detail.token.token);
                that.token = token_detail.token.token;
                setclassromm(token_detail.token.classroom);
                if (token_detail.token.teacher_ip) {
                    pc_host_ip = JSON.parse(token_detail.token.teacher_ip)
                }
            } catch (e) {
                console.log(e)
                // toastShow(e.msg);
                // 此行代码注释 防止服务器地址丢失
                // localStorage.removeItem("active_server");
                switchToLogin();
                // }
            };

            let sort = getSortNum();
            updateTerminalSort(sort);//更新终端编号以及架构信息

            if (done) {
                // sessionStorage.setItem('autoConnect','true');
                that.connectToWS();
                that.startHeartBeat();
                that.loadServers();
                if (pc_host_ip) {
                    sessionStorage.setItem('pc_host_ip', pc_host_ip.hostIp)
                    // that.getpictures(AppConfig.app.feturemac ,pc_host_ip.hostIp,that);
                }
            }

        })(that);
    }

    heartbeat() {
        (async () => {
            let done = false;
            let hbdata = null;
            timeCount++;
            // console.log(timeCount)
            if (AppConfig.os.islinux && (timeCount >= maxTime) && !AppConfig.os.isarm) {
                timeCount = 0;
                updateCpuFreq();//执行优化cpu的脚本
            }
            let file = `/tmp/screen.jpg`;

            let fdata = null;
            try {
                // fdata = await readFile(file);
            } catch (e) {
                // console.log("read screen capture file error", e);
            }

            let headers = {
                token: this.token,
            };
            let data = [];
            if (fdata) {
                headers.capture_time = fdata.time.toString();
                data = fdata.data;

            }


            try {
                hbdata = await fetchHeartBeat(headers, data);
                done = true;
            } catch (e) {
                console.error(e);
                // await closeFile();
                // console.log('connect stop === ',this.connected)
                console.log('websocket readyState hear1: ' + this.websocket.readyState);
                if (this.connected) {
                    this.connected = false;
                    PubSub.publish("connect.to.server", false);
                }
            }
            if (done) {
                // await closeFile();
                // console.log('connect start === ',this.connected)
                console.log('websocket readyState hear1: ' + this.websocket.readyState);
                if (!this.connected) {
                    this.connected = true;
                    console.log('heartbeat  true----')
                    PubSub.publish("connect.to.server", true);
                }

                if (!this.timesynced) {
                    this.timesynced = true;
                    sendCommand(null, "time.sync", hbdata.time);
                    setTimeout(3000, updateTimeView);
                }
                hbdata = null;
            }

        })();
    }

    startHeartBeat() {
        console.log('startHearBeat')
        let that = this
        PubSub.subscribe("connect.to.server", (message, connected) => {
            this.connected = connected;
            toastShow(`已经${connected ? '建立' : '断开'}与服务器的连接`);
            $("#link").attr("src", connected ? "res/images/linked.png" : "res/images/unlink.png");
            $("#link").data("server.connect", connected);
            $("#link").attr("title", connected ? "服务器已连接" : "服务器未连接");

            if (connected) {
                layer.closeAll();
                console.log('layer open')
                if (that.websocket.readyState == 3) {
                    console.log('heartbeat ws:' + that.websocket.readyState)
                    that.connectToWS();
                }
                that.loadServers();
                // PubSub.publish("server.reconnect");
            } else {
                // that.websocket.close();
                layer.open({
                    // success: function(layero, index) {
                    // PubSub.subscribe("server.reconnect", (msg, data) => {
                    //     layer.close(index);
                    //     $('.LoadingShow').addClass('hidden');
                    // });
                    // },
                    // end: () => {
                    //     reloadServers()
                    //     PubSub.unsubscribe("server.reconnect");
                    // },
                    skin: "demo-class1",
                    type: 1,
                    title: "提示",
                    area: ["226px", "120px"],
                    content: "错误: 与服务器的连接已断开",
                });
            }
        });
        this.heartbeat();
        this.hbinterval = setInterval(this.heartbeat.bind(this), 5 * 1000);
    }

    stopHeartBeat() {
        console.log("stop heart beat");
        if (this.interval)
            clearInterval(this.interval);
        if (this.hbinterval)
            clearInterval(this.hbinterval);
        if (this.layer_index)
            layer.close(this.layer_index);
        if (this.websocket && this.websocket.OPEN)
            this.websocket.close();
        PubSub.unsubscribe("connect.to.server");
        PubSub.unsubscribe('stop.heartbeat');
    }

    listRefresh(id) {
        (async () => {
            let servers = null;
            try {
                servers = await fetchJSON(getURL("deviceservers").replace('(device)', DeviceID), "GET", {
                    token: this.token
                });
            } catch (e) {
                console.log(e)
                addLogRecord('ERRO', '获取虚拟机列表响应失败。  --------  ' + JSON.stringify(e));
                this.props.dispatch(setServersLoadAction(this.servers));
            }
            if (servers) {
                addLogRecord('Info  ', '获取虚拟机列表：' + servers);
                console.log(servers)
                if (id) {
                    servers.servers.forEach((item) => {
                        if (item.id === id) {
                            console.log('启动spice失败虚拟机状态为 vm_start: ' + item['OS-EXT-STS:vm_state']);
                            addLogRecord('ERRO  ', '启动spice失败虚拟机状态为 vm_start: ' + item['OS-EXT-STS:vm_state']);
                        }
                    })
                }
                this.props.dispatch(setServersLoadAction(servers.servers));
            }
        })();
    }

    loadServers(notice = true) {
        (async () => {
            let servers = null;
            try {
                servers = await fetchJSON(getURL("deviceservers").replace('(device)', DeviceID), "GET", {
                    token: this.token
                });
            } catch (e) {
                console.log(e)
                if (notice)
                    toastShow(e.msg);
                this.props.dispatch(setServersLoadAction(this.servers));
            }
            if (servers) {
                if (servers.status && VmSelectPanel.StartDeviceFlag == 0) {
                    console.log('server is alive')
                    if (1 == servers.status.ffmpeg_status && servers.status.ffmpeg_multicastaddressing) {
                        let udpstring = servers.status.ffmpeg_multicastaddressing.substring(6, 16);
                        child_process.exec(`bash /usr/bin/seadee-do.sh udp  ${udpstring}`, (err, stderr, stdout) => {
                            if (err) {
                                console.info(err);
                                addLogRecord("E", 'udp start fail');
                                return;
                            }
                            console.log(stderr, stdout);
                        });
                        // node_call_async(null, "connectToSddev", "disable");
                        node_call_async(null, "disableToSddev", "disable");

                        node_call_async(null, "connectToFFplay", servers.status.ffmpeg_multicastaddressing);
                        sessionStorage.setItem("remote_address", servers.status.ffmpeg_multicastaddressing);
                    }
                    console.log(servers)
                    if (servers.status.image_id) {
                        for (let index in servers.servers) {
                            let server = servers.servers[index];
                            if (server.image.id == servers.status.image_id) {
                                $("#hide-menu").data("selected.server", server);

                                // $("#context_connect").click();
                                // this. autoConnect() ;
                                break;
                            }
                        }
                        addLogRecord('INFO', '非自启动，打开vm-----:  ' + servers.status.image_id);
                        node_call_async(null, "connectToSpice", servers.status.image_id);
                        this.reconnectionSpice(servers.status.image_id);
                    }
                    else {
                        let vmcount = servers.servers.length;
                        if (vmcount == 1) {
                            let server = servers.servers[0];
                            if (server.image.id) {
                                console.log(server.image);
                                $("#hide-menu").data("selected.server", server);
                                // $("#context_connect").click(); 
                                this.autoConnect();
                                addLogRecord('INFO', `单个虚拟机时，进入该虚拟机`);
                            }
                        } else if (vmcount == 0) {
                            localStorage.removeItem("active_uid");
                        }
                        else {
                            let historyVmid = localStorage.getItem('active_uid');
                            let item = servers.servers;
                            let that = this;
                            try {
                                item.forEach(item => {
                                    if (item.id == historyVmid) {
                                        setLinkHaltID(historyVmid);
                                        that.requestConnectComputer(historyVmid);
                                        addLogRecord('INFO', `多个虚拟机时，进入历史虚拟机--vmid:${historyVmid}`);
                                        throw Error();
                                    }
                                })
                            } catch (e) {
                                // console.log(e)
                            }
                        }
                        setTimeout(() => {
                            let loadStart = $('.LoadingShow').is('hidden');
                            if (loadStart) {
                                addLogRecord('ERRO', '自启动虚拟机超时!!');
                                $('.LoadingShow').addClass('hidden');
                            }
                        }, 8 * 1000);
                    }
                }
                sessionStorage.setItem("virtualMachineLength", "empty");
                VmSelectPanel.StartDeviceFlag = 1;
                this.props.dispatch(setServersLoadAction(servers.servers));

                // ---------------------
                let vmcount = servers.servers.length;
                sessionStorage.setItem("vmcountnumber", vmcount);
                if (vmcount == 1) {
                    // let logoinserver = servers.servers[0];
                    // setTimeout(() => {
                    // localStorage.setItem("instanceItem",true);
                    // this.requestConnectComputer(logoinserver.id);
                    // }, 2000); 
                } else {
                    sessionStorage.setItem("virtualMachineLength", "multiple");
                }
            }
        })();
    }

    reconnectionSpice(id) {
        let that = this;
        let timeLength = 0;
        let timeStatus = null;
        clearInterval(timeout);
        timeout = setInterval(() => {
            console.log('getIsSpiceConnected:  ' + getIsSpiceConnected())
            if (!getIsSpiceConnected()) {
                node_call_async(null, "connectToSpice", id);
                timeStatus = timeLength++;
                console.log(`SPIE重启第${timeStatus}次`);
            } else {
                addLogRecord('关闭检测');
                clearInterval(timeout);
            }
            console.log('timeStatus:   ' + timeStatus);
            if (timeStatus >= 1) {
                clearInterval(timeout);
                setTimeout(() => {
                    if (!getIsSpiceConnected()) {
                        toastShow('虚拟机异常，桌面启动失败！！！', 5000);
                        addLogRecord('ERRO  spice id:', id);
                        that.listRefresh(id);
                    }
                }, 8000);
            }
        }, 8000);

    }

    onServerConnected() {
        this.loginByDevice();
    }

    showProgress(style = 1) {
        self.process_layer = layer.load(style)
        console.log(style,"tankuang1")
    }

    cancelProcess() {
        if (self.process_layer)
            layer.close(self.process_layer)
    }

    onReloadServers(message, data) {
        if (this.interval)
            clearInterval(this.interval);
        if (this.hbinterval)
            clearInterval(this.hbinterval);
        if (this.websocket && this.websocket.OPEN)
            this.websocket.close();
        if (this.layer_index)
            layer.close(this.layer_index);
            // Disable button

        this.initVaribles();
// disable loading Animation
        // this.showProgress();
        console.log('onReloadServers')
        this.immediate = setImmediate(this.getHotServer.bind(this));
        this.interval = setInterval(this.getHotServer.bind(this), 10 * 1000);
    }

    showAttrDialog() {
        let selectedServer = $("#hide-menu").data("selected.server");
        layer.open({
            title: "属性",
            type: 1,
            skin: 'layui-layer-rim demo-class1', //加上边框
            area: ['420px', '240px'], //宽,高
            content: $("#attribute-box")
        });
        $("#vm-name").text(selectedServer.name);

        $('#vm-state').text(selectedServer.power_state);
        try {
            let i;
            for (i in selectedServer.addresses) {
                let addrs = selectedServer.addresses[i];
                if (i.match(/^vlan[0-9]*$/)) {
                    $("#host-ip").text(addrs[0].addr);
                    $("#host-mac").text(addrs[0]['OS-EXT-IPS-MAC:mac_addr'])
                    break;
                };
            }

        } catch (e) {

        }
    }

    connectServer() {
        (async () => {
            let active_uid = localStorage.getItem('active_uid');
            let selectedServer = $("#hide-menu").data("selected.server");
            let vmcountnumber = sessionStorage.getItem('vmcountnumber');
            console.log(active_uid, selectedServer);

            if (active_uid == selectedServer.id) {
                console.log("11111")
                setLinkHaltID(selectedServer.id);
                this.requestConnectComputer(selectedServer.id);
            } else if (vmcountnumber < 2 && active_uid != selectedServer.id) {
                console.log("22222")
                setLinkHaltID(selectedServer.id);
                this.requestConnectComputer(selectedServer.id);
            } else {
                let concentThis = this;
                layer.confirm('\n桌面切换需要关闭原来的虚拟机，确定关闭吗？\n', {
                    btn: ['确定', '取消'],
                    skin: 'demo-class1',
                    shade: 0.1,
                    title: '提示'
                }, function (index) {
                    concentThis.desktopSwitch();
                    layer.close(index);
                }, function (index) {
                    layer.close(index);
                });
            }
        })();

    }

    desktopSwitch() {
        let selectedServer = $("#hide-menu").data("selected.server");
        let servers = null;
        (async () => {
            try {
                servers = await fetchJSON(getURL("deviceservers").replace('(device)', DeviceID), "GET", {
                    token: this.token
                });
            } catch (e) {
                console.log(e)
                toastShow(e.msg);
                this.props.dispatch(setServersLoadAction(this.servers));
            }
            if (servers) {
                let stopStatus = false;
                for (let i = 0; i < servers.servers.length; i++) {
                    if (servers.servers[i].id !== selectedServer.id) {
                        let url = getURL("controlserver").replace('(server)', servers.servers[i].id).replace('(action)', VmSelectPanel.PowerAction.STOP);
                        let result = null;
                        try {
                            this.showProgress();
                            result = await fetchJSON(url, 'POST', {
                                token: this.token
                            });
                        } catch (e) {
                            toastShow('虚拟机关机失败！', 3000)
                            console.error(e);
                        } finally {
                            this.cancelProcess();
                        }
                        if (result) {
                            console.log(servers.servers[i].id)
                            console.log("close server and get result ", result);
                        }
                    }
                    if (i == servers.servers.length - 1) {
                        stopStatus = true;
                    }
                }
                if (stopStatus) {
                    console.log("connect to server  2")
                    setLinkHaltID(selectedServer.id);
                    this.requestConnectComputer(selectedServer.id);
                }

            }
        })();
    }
    requestConnectComputer(id) {
        (async () => {
            let url = getURL("controlserver").replace('(server)', id).replace('(action)', VmSelectPanel.PowerAction.START);
            console.log(url, "zhesurl")
            let result = null;
            try {
                this.showProgress();
                console.log("1347, qqiu  xuniji")
                result = await fetchJSON(url, 'POST', {
                    token: this.token
                });
                setTimeout(()=>{
                    this.cancelProcess()
                },8000)

                $('.LoadingShow').removeClass('hidden');
            } catch (e) {
                console.error(e);
                addLogRecord("info", "请求启动虚拟机失败");
                toastShow("请求启动虚拟机失败", 5000);
                $('.LoadingShow').addClass('hidden');
            } finally {
                this.cancelProcess()
                $('.LoadingShow').addClass('hidden');
            }
            if (result) {
                console.log('requestConnectComputer   success');
            }
        })();
    }
    // connectServer() {
    //     console.log("connect to server")
    //     let selectedServer = $("#hide-menu").data("selected.server");
    //     setLinkHaltID(selectedServer.id);
    //     (async() => {

    //         let url = getURL("controlserver").replace('(server)', selectedServer.id).replace('(action)', VmSelectPanel.PowerAction.START);
    //         let result = null;
    //         try {
    //             // this.showProgress();关闭弹框
    //             this.showProgress();
    //             result = await fetchJSON(url, 'POST', {
    //                 token: this.token
    //             });
    //         } catch (e) {
    //             console.error(e);
    //             toastShow("启动虚拟机失败: " + e.msg)
    //         } finally {
    //             // 关闭弹框
    //             this.cancelProcess()
    //         }
    //         if (result) {
    //             console.log("start server and get result ", result);
    //             localStorage.setItem("active_uid", selectedServer.id);
    //             localStorage.setItem("instanceItem",true);
    //             node_call_async(null, "connectToSpice", selectedServer.id);
    //         }

    //     })();

    // }    
    autoConnect() {
        console.log("connect to server")
        let selectedServer = $("#hide-menu").data("selected.server");
        console.log(selectedServer)
        setLinkHaltID(selectedServer.id);
        (async () => {
            let result = null;
            let url = getURL("controlserver").replace('(server)', selectedServer.id).replace('(action)', VmSelectPanel.PowerAction.START);
            try {
                // this.showProgress();关闭弹框
                this.showProgress();

                console.log("1407 qidong xuniji")
                result = await fetchJSON(url, 'POST', {
                    token: this.token
                });
                // $('.LoadingShow').removeClass('hidden');
            } catch (e) {
                setTimeout(() => {
                    localStorage.setItem("active_uid", selectedServer.id);
                    node_call_async(null, "connectToSpice", selectedServer.id);
                }, 10000);
                console.error(e);
                toastShow("启动虚拟机失败: " + e.msg)
                // $('.LoadingShow').addClass('hidden');
            } finally {
                // 关闭弹框
                this.cancelProcess()
            }
        })();
    }
    startUpSpice(id, spice_port, spice_password, name) {
        if (AppConfig.os.iswin) {
            node_call_async(null, "", "--uri=spice://" + getActiveServer() + ":" + spice_port + " -w " + spice_password + " --title " + name);
        }

        if (AppConfig.os.islinux) {
            localStorage.setItem("active_uid", id);
            setLinkHaltID(id);
            node_call_async(null, "connectToSpice", id);
            this.reconnectionSpice(id);
        }
    }

    modifySecret() {
        let hide_menu = $("#hide-menu").data("selected.server");
        var chcke = sessionStorage.getItem(hide_menu.id + "-chcke");
        var t = localStorage.getItem(hide_menu.id + "-user");
        var n = localStorage.getItem(hide_menu.id + "-passwd");
        layer.open({
            title: '用户设置',
            content: $("#userinfo-box"),
            type: 1,
            skin: "layui-alyer-rim demo-class1  btn0 ",
            area: ["420px", "240px"],
            btn: ["保存"],
            success: function () {
                $("#username_info").attr("placeholder", "请输入用户名"),
                    $("#passwd_info").attr("placeholder", "请输入密码");
                $("#username_info").val(t);
                $("#passwd_info").val(n);
                // var chcketrue = JSON.parse(chcke);
                // if(chcke == null ){
                //     chcketrue = true;
                // }
                //    $("#input_info").prop('checked',chcketrue);
            },
            yes: function (t) {
                var us = $("#username_info").val().trim(),
                    pa = $("#passwd_info").val().trim(),
                    ch = $("#input_info").prop('checked');
                localStorage.setItem(hide_menu.id + "-user", us);
                localStorage.setItem(hide_menu.id + "-passwd", pa);
                sessionStorage.setItem(hide_menu.id + "-chcke", ch);
                layer.close(t);
            },
        })
    }

    showServerConfig() {
        console.info("not implement yet");
    }

    showSnapshotManager() {

    }


    suspendServer() {

    }

    rebootServer(force = false) {
        let selectedServer = $("#hide-menu").data("selected.server");
        // console.log('wj selectedServer :  '+selectedServer);
        (async () => {
            await this.reboot(selectedServer.id, force);
        })();
    }

    async reboot(instance, force = false) {
        let url = getURL("controlserver").replace('(server)', instance).replace('(action)', VmSelectPanel.PowerAction.REBOOT);
        let result = null;
        let headers = {
            token: this.token
        };
        // if (force){
        //     headers.force = force.toString();
        //     toastShow("强制重启执行中 . . .",5000);
        // }else{
        //     toastShow("重启执行中 . . . ",5000);
        // }
        try {
            this.showProgress();
            result = await fetchJSON(url, 'POST', headers);
            $('.LoadingShow').removeClass('hidden');
        } catch (e) {
            console.error(e);
            toastShow("重启虚拟机失败: " + e.msg);
            $('.LoadingShow').addClass('hidden');
        } finally {
            this.cancelProcess();
            $('.LoadingShow').addClass('hidden');
        }
        if (result) {
            console.log("reboot server and get result ", result);
        }
    }

    async shutdown(instance) {
        let url = getURL("controlserver").replace('(server)', instance).replace('(action)', VmSelectPanel.PowerAction.STOP);
        console.log("shutdown url : ", url);
        let result = null;
        try {
            this.showProgress();
            result = await fetchJSON(url, 'POST', {
                token: this.token
            });
            $('.LoadingShow').removeClass('hidden');
        } catch (e) {
            console.error(e);
            toastShow("关闭虚拟机失败: " + e.msg)
            $('.LoadingShow').addClass('hidden');
        } finally {
            this.cancelProcess();
            $('.LoadingShow').addClass('hidden');
        }
        if (result) {
            let act = sessionStorage.getItem("virtualMachineLength")
            if (!(act == "multiple")) {
                sendCommand(null, "system.halt");
            }
            console.log("close server and get result ", result);
        }
    }

    async reportSpiceConnectSuccess(instance) {
        console.log("call set true")
        setIsSpiceConnected(true);
        clearInterval(timeout);
        console.log('自动关闭检测');
        let url = getURL("deviceaction").replace('(action)', 'bind');
        let result = null;
        let data = {
            "mac": DeviceID,
            "instanceid": instance
        }
        try {
            this.showProgress();
            console.log("1564","guabi1")

            result = await fetchJSON(url, 'POST', {
                token: this.token
            }, JSON.stringify(data));
        } catch (e) {
            console.error(e);
        } finally {
            this.cancelProcess();
        }

        if (result) {
            console.log("spice connect status return: ", result);
        }
    }

    async reportSpiceConnectExit(instance) {
        console.log("exit spice")
        setIsSpiceConnected(false);
        let url = getURL("deviceaction").replace('(action)', 'unbind');
        let result = null;
        let data = {
            "mac": DeviceID,
        }
        try {
            this.showProgress();
            console.log("1590,guabi xiaman")
            result = await fetchJSON(url, 'POST', {
                token: this.token
            }, JSON.stringify(data));
        } catch (e) {
            console.error(e);
        } finally {
            this.cancelProcess();
        }

        if (result) {
            console.log("spice connect status return: ", result);
            console.log("spice exit: ", instance);
            // node_call_async(null, "disconnectSpice");
            // localStorage.removeItem("active_uid")
        }
    }

    async startUpRdp(instance) {
        console.log("registerCon()");
        let selectedServer = $("#hide-menu").data("selected.server");
        console.log("selectedServer:" + selectedServer)
        let i;
        for (i in selectedServer.addresses) {
            var addrs = selectedServer.addresses[i];
            console.log(addrs[0].addr);
        }
        console.log("addrs[0].addr:", addrs[0].addr);
        let user = localStorage.getItem(selectedServer.id + "-user");
        console.log("user:", user)
        let passw = localStorage.getItem(selectedServer.id + "-passwd");
        console.log("passwd", passw);
        let ip = addrs[0].addr;
        if (user == null || passw == null) {
            node_call_async(null, "startUpdateConnet", " ");
        }
        else {
            node_call_async(null, "startUpdateConnet", " " + ip + " " + user + " " + passw);
        }
    }

    registerShutdownListener() {
        PubSub.subscribe("shutdown.server", (msg, instance) => {
            (async () => {
                await this.shutdown(instance);
            })();
        });
    }

    unregisterShutdownListener() {
        PubSub.unsubscribe("shutdown.server");
    }

    registerRdpListener() {
        PubSub.subscribe("connectRDP.server", (msg, instance) => {
            (async () => {
                await this.startUpRdp(instance);
            })();
        });
    }

    unregisterRdpListener() {
        PubSub.unsubscribe("connectRDP.server");
    }


    registerForceRebootListener() {
        PubSub.subscribe("reboot.server.force", (msg, instance) => {
            (async () => {
                await this.reboot(instance, true);
            })();
        });
    }

    unregisterForceRebootListener() {
        PubSub.unsubscribe("reboot.server.force");
    }

    shutdownServer() {
        let selectedServer = $("#hide-menu").data("selected.server");
        (async () => {
            await this.shutdown(selectedServer.id);
        })();
    }

    registerSpiceConnectSuccess() {
        PubSub.subscribe("spice.connect.success", (msg, instance) => {
            (async () => {
                await this.reportSpiceConnectSuccess(instance, true);
            })();
        });
    }

    unregisterSpiceConnectSuccess() {
        PubSub.unsubscribe("spice.connect.success");
    }

    registerSpiceConnectExit() {
        PubSub.subscribe("spice.connect.exit", (msg, instance) => {
            (async () => {
                await this.reportSpiceConnectExit(instance, true);
            })();
        });
    }

    unregisterSpiceConnectExit() {
        PubSub.unsubscribe("spice.connect.exit");
    }

    initContextMenu() {
        // $("#context_connect").click((() => {
        //     this.connectServer();
        // }).bind(this));
        // $("#context_setting").click((() => {
        //     this.showServerConfig();
        // }).bind(this));
        // $("#context_snapshot").click((() => {
        //     this.showSnapshotManager();
        // }).bind(this));
        // $("#context_attribute").click((() => {
        //     this.showAttrDialog();
        // }).bind(this));
        // $("#context_suspend").click((() => {
        //     this.suspendServer();
        // }).bind(this));
        // $("#context_reboot").click((() => {
        //     this.rebootServer();
        // }).bind(this));
        // $("#context_force_reboot").click((() => {
        //     this.rebootServer(true);
        // }).bind(this));
        // $("#context_shutdown").click((() => {
        //     this.shutdownServer(VmSelectPanel.PowerAction.HALT);
        // }).bind(this));

        $('#context_connect').off('click');
        $('#context_connect').on('click', (() => {
            this.connectServer();
        }).bind(this))
        $('#context_modify_secret').off('click');
        $('#context_modify_secret').on('click', (() => {
            this.modifySecret();
        }).bind(this))
        $('#context_snapshot').off('click');
        $('#context_snapshot').on('click', (() => {
            this.showSnapshotManager();
        }).bind(this))
        $('#context_setting').off('click');
        $('#context_setting').on('click', (() => {
            this.showServerConfig();
        }).bind(this))
        $('#context_suspend').off('click');
        $('#context_suspend').on('click', (() => {
            this.suspendServer();
        }).bind(this))
        $('#context_attribute').off('click');
        $('#context_attribute').on('click', (() => {
            this.showAttrDialog();
        }).bind(this))
        $('#context_shutdown').off('click');
        $('#context_shutdown').on('click', (() => {
            this.shutdownServer(VmSelectPanel.PowerAction.HALT);
        }).bind(this))
        $('#context_force_reboot').off('click');
        $('#context_force_reboot').on('click', (() => {
            this.rebootServer(true);
        }).bind(this))
        $('#context_reboot').off('click');
        $('#context_reboot').on('click', (() => {
            this.rebootServer();
        }).bind(this))

        this.registerShutdownListener();
        this.registerForceRebootListener();
        this.registerSpiceConnectSuccess();
        this.registerSpiceConnectExit();
        this.registerRdpListener();

        $(window).on("click", (event) => {
            if (event.button == 0 || event.button == 1 || event.button == 2) {
                $("#hide-menu").hide();
            }
        });
    }

    clearContextMenu() {
        this.unregisterShutdownListener();
        this.unregisterForceRebootListener();
        this.unregisterSpiceConnectSuccess();
        this.unregisterSpiceConnectExit();
        this.unregisterRdpListener();
    }

    onInited() {
        this.initContextMenu();
        PubSub.subscribe("reload.servers", this.onReloadServers.bind(this));
        PubSub.subscribe('stop.heartbeat', this.stopHeartBeat.bind(this));
        setLinkHaltID("default");
        reloadServers();
    }

    componentDidMount() {
        this.onInited();
    }

    componentWillUnmount() {
        this.stopHeartBeat();
        console.log('stop reload servers ---')
        PubSub.unsubscribe("reload.servers");
        this.clearContextMenu();
    }

    render() {
        let vms = this.props.servers.map((item) => {
            return <VirtualMachine key={
                uuid()
            }
                dispath={
                    this.props.dispatch
                }
                server={
                    item
                }
            />
        });
        return (<div ><div id="centerbar" > {vms} </div> </div >
        )
    }
}
