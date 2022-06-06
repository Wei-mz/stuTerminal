/**
 * @Author: yinshi <root>
 * @Date:   2017-03-07T16:27:07+08:00
 * @Email:  569536805@qq.com
 * @Last modified by:   root
 * @Last modified time: 2017-03-30T10:32:09+08:00
 */



/**
 * Created by uforgetmenot on 17/1/23.
 */
import 'whatwg-fetch';
import {
    AppConfig
} from '../utils/config';
import {
    md5
} from '../utils/fileutil';
import PubSub from "pubsub-js";
import {
    node_call_async, node_call_sync, sendCommand
} from '../core/native';
import { loadPanel, Panel } from '../app';
import { on_netowrk_info_updated, on_netowrk_DNS_updated ,on_display_resolution_updated, onHalt } from '../../jsx/component/toolbar/toolbar'
import { addLogRecord, LogType } from '../utils/log';
import {
    DeviceID
} from '../utils/config';




$.urls = {
    generated: false,
    port: 8000
};

export class TCException extends Error {
    constructor(code, msg) {
        super(msg, code);
        this.code = code;
        this.msg = msg;
    }

}

export let connectException = new TCException(0, "无法连接到服务器");
export let authenticateException = new TCException(-1, "客户端认证错误");
export let invalidResponseException = new TCException(-2, "数据响应错误");
export let unkownException = new TCException(-3, "未知的错误");
export let networkException = new TCException(-4, "网络已经断开");
var spiceConnectStatus = false;
var linkHaltID = "default";

export function getURL(name) {
    // console.log("URL: ", $.urls[name])
    return $.urls[name];
}

export function packURL(...args) {
    let url = $.urls.base;
    if (!url)
        throw new Error("base url is null ... error");

    for (let i = 0; i < args.length; i++) {
        url = url.concat("/");
        url = url.concat(args[i]);
    }
    return url;
}



export function generateURLs(host, port = $.urls.port, version = 'v1', ssl = false) {
    $.urls.server = host;
    $.urls.port = port;
    $.urls.version = version;
    $.urls.ssl = ssl;

    $.urls.base = `${ssl?'https':"http"}://${host}:${port}/${version}`;
    $.urls.detect = `${ssl?'https':"http"}://${host}:${port}/server`;
    $.urls.ws = `${ssl?'wss':"ws"}://${host}:${port}/${version}/websocket?token=(token)`;
    $.urls.authkeypair = packURL('auth', "device", "pairedkey");
    $.urls.authdevice = packURL('auth', 'device', 'educloud');
    $.urls.regkeypair = packURL('devices', '(device)', 'pairedkey');
    $.urls.regdevice = packURL('devices', '(device)');
    $.urls.heartbeat = packURL('heartbeat');
    $.urls.deviceservers = packURL('devices', '(device)', "servers");
    $.urls.controlserver = packURL('servers', '(server)', "actions", '(action)')
    $.urls.sendmessage = `${$.urls.base}/routings/(routing)/types/(type)/message`;
    $.urls.devicesort = packURL('device','sort');

    $.urls.deviceaction = packURL('device', '(action)')

    $.urls.generated = true;
}

export function getIsSpiceConnected()
{
    console.log("connected status is:"+spiceConnectStatus);
    return spiceConnectStatus;
}

export function setIsSpiceConnected(status)
{
    spiceConnectStatus = status;
    console.log("connected status is:"+spiceConnectStatus);
}

export function getLinkHaltID()
{
    return linkHaltID;
}

export function setLinkHaltID(id)
{
    linkHaltID = id;
}

export function getPort() {
    return $.urls.port;
}


export function getBaseURL() {
    return $.urls.base;
}

export function getDetectURL(host, port = getPort(), ssl = false) {
    return `${ssl?'https':"http"}://${host}:${port}/server`;
}

export function getTeacherURL(host, port, ssl = false) {
    return `${ssl?'https':"http"}://${host}:${port}`;
}
export function addDiscoveredServer(serveraddr) {
    let discovered_servers = localStorage.getItem("discovered_servers");
    discovered_servers = discovered_servers ? JSON.parse(discovered_servers) : [];
    if (discovered_servers.constructor != Array)
        discovered_servers = [];
    if (discovered_servers.indexOf(serveraddr) != -1)
        return false;
    let item;
    discovered_servers.push(serveraddr);
    localStorage.setItem("discovered_servers", JSON.stringify(discovered_servers));
    return true;
}

export function removeDiscoveredServer(serveraddr) {
    let discovered_servers = localStorage.getItem("discovered_servers");
    discovered_servers = discovered_servers ? JSON.parse(discovered_servers) : [];
    if (discovered_servers.constructor != Array)
        return
    let index = discovered_servers.indexOf(serveraddr);
    if (index != -1)
        discovered_servers.splice(index, 1);
}


export function getActiveServer() {
    return localStorage.getItem("active_server");
}

export function setActiveServer(server) {
    return localStorage.setItem("active_server", server);
}

export function fetchJSON(url, method = "GET", headers = {}, data = {}, timeout = 15 * 1000) {
    addLogRecord("E", url);

    let promise = new Promise(function(resolve, reject) {
        $.ajax({
            dataType: "json",
            url,
            data,
            dataType: "json",
            contentType: "application/json",
            charset: 'UTF-8',
            method,
            headers,
            timeout,
            cache: false,
            statusCode: {
                // 403: () => {}
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            if (jqXHR.readState == 0 && jqXHR.status == 0) {
                reject(connectException);
            } else if (!navigator.onLine) {
                reject(networkException);
            } else {
                console.info(`fetch ${url} and get unkown exception : `, jqXHR);
                reject(unkownException);
            }
        }).done((data, textStatus, jqXHR) => {
            if (!data || data.success == undefined)
                reject(invalidResponseException);
            else if (!data.success) {
                reject(new TCException(data.result.errcode, data.result.errmsg));
            } else {
                resolve(data.result);
            }
        })
    });
    return promise;
}

export function fetchHeartImg(url,method,headers, data = []) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url,
            // method,
            type: 'POST',
            headers,
            contentType: 'text/plain; charset=utf-8',
            data,
            processData: false
        }).fail((jqXHR, textStatus, errorThrown) => {
            if(jqXHR.status !==200 || jqXHR.status !==101){
                // sessionStorage.setItem('imgRequest','false')
            }
            if (jqXHR.readState == 0 && jqXHR.status == 0) {
                reject(connectException);
            } else if (!navigator.onLine) {
                reject(networkException);
            } else {
                console.info("fetch heartbeat url and get unkown exception : ", jqXHR);
                reject(unkownException);
            }
        }).done((data, textStatus, jqXHR) => {
            data =JSON.parse(data);
            if (!data || data.success == undefined)
                reject(invalidResponseException);
            else if (!data.success) {
                reject(new TCException(data.result.errcode, data.result.errmsg));
            } else {
                resolve(data.result);
                if(data.result == 'false'){
                    // sessionStorage.setItem('imgRequest','false')
                }
            }
        });
    });
}

export function fetchHeartBeat(headers, data = []) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: getURL('heartbeat'),
            type: 'POST',
            headers,
            contentType: 'application/octet-stream',
            data,
            processData: false
        }).fail((jqXHR, textStatus, errorThrown) => {
            if (jqXHR.readState == 0 && jqXHR.status == 0) {
                reject(connectException);
            } else if (!navigator.onLine) {
                reject(networkException);
            } else {
                console.info("fetch heartbeat url and get unkown exception : ", jqXHR);
                reject(unkownException);
            }
        }).done((data, textStatus, jqXHR) => {
            if (!data || data.success == undefined)
                reject(invalidResponseException);
            else if (!data.success) {
                reject(new TCException(data.result.errcode, data.result.errmsg));
            } else {
                resolve(data.result);
            }
        });
    });
}


export async function getServerDetail(addr, port = getPort(), timeout = 100* 1000) {
    return await fetchJSON(getDetectURL(addr, port), "GET", {}, {}, timeout);
}

export async function getTeacherDetail(addr, port = getPort(), headers,data,timeout = 100* 1000) {
    return await fetchHeartImg(getTeacherURL(addr, port), "POST", headers, data, timeout);
}

export function checkServerValid(cb, addr, port = getPort(), timeout = 3 * 1000) {
    (async() => {
        try {
            await getServerDetail(addr, port, timeout);
            cb(null)
        } catch (e) {
            cb(e)
        }
    })();
}

//这里应该用C实现, 但现在没时间先用JS顶着.
export function calcKeyPair(key) {
    let mix = "100BEF22-D8D1-4495-B327-E3FB4E356DB5";
    let value = mix;
    for (let i = 0; i < 5; i++) {
        value += key;
        value = md5(value)
    }
    return value;
}

export function setclassromm(room) {
    return sessionStorage.setItem("classromms", room);
}

export function getclassromm() {
    return sessionStorage.getItem("classromms");
}

export function storeToken(token) {
    sessionStorage.setItem("token", token);
}

export function storeTokenDetail(tokendetail) {
    sessionStorage.setItem("token_detail", JSON.stringify(tokendetail));
}

export function reloadServers() {
    PubSub.publish("reload.servers");
}

export function getToken() {
    return sessionStorage.getItem('token');
}

export function getTokenDetail() {
    return JSON.parse(sessionStorage.getItem('tokendetail'));
}

export function setPassword(password) {
    localStorage.setItem("password", password);
}

export function getPassword() {
    let pass = localStorage.getItem("password");
    return (pass == null || pass.length == 0) ? "123qwe" : pass;  
    
}
export function setFFplayStatus(msg){
    localStorage.setItem("ffplayStatus",msg);
}

export function getFFplayStatus(){
    let ffplayStatus = localStorage.getItem("ffplayStatus");
    return(ffplayStatus == ' ' || ffplayStatus == 'undefined' || ffplayStatus ==  null) ? "false": ffplayStatus;
}
export async function readFile(file) {
    let promise = new Promise((resolve, reject) => {
        node_call_async((e, fdata) => {
            if (e) {
                reject(e);
                return;
            }
            resolve(fdata);
        }, "readFile", file);
    });
    return promise;
}

export async function closeFile() {
    console.log("options closeFile");
    node_call_async(null, "closeFile", null);
}

export function requestConnectRDP(instance){
    PubSub.publish("connectRDP.server", instance);
}

export function requestShutdown(instance) {
    PubSub.publish("shutdown.server", instance);
}

export function requestForceReboot(instance) {
    PubSub.publish("reboot.server.force", instance);
}

export function requestSpiceConnectSuccess(instance) {
    // setIsSpiceConnected(true);
    PubSub.publish("spice.connect.success", instance);
}

export function requestSpiceConnectExit(instance) {
        PubSub.publish("spice.connect.exit", instance);
}

export function _fetch(fetch_promise, timeout = 10 * 1000) {
    var abort_fn = null;

    var abort_promise = new Promise(function(resolve, reject) {
        abort_fn = function() {
            reject('abort promise');
        };
    });

    var abortable_promise = Promise.race([
        fetch_promise,
        abort_promise
    ]);

    setTimeout(function() {
        abort_fn();
    }, timeout);

    return abortable_promise;
}

/**
 * A fetch which is used by redux-promise.
 *
 * @param fetch_promise : eg : fetch(getURL("classes"), {headers: {token: getToken()}})
 * @param timeout
 * @param errorReturn
 * @returns {Promise}
 */
export function packedFetch(fetch_promise, errorReturn = null, toast = true, timeout = 10 * 1000) {
    return new Promise((resolve, reject) => {
        _fetch(fetch_promise, timeout).then(res => {
            return res.json();
        }).then(res => {
            if (res.success) {
                resolve(res.result);
            } else {
                if (toast)
                    toastShow(res.result.errmsg);
                resolve(errorReturn == true ? new TCException(res.result.errcode, res.result.errmsg) : errorReturn);
            }

        }).catch(err => {
            if (toast){
                toastShow('无法连接到服务器');
                $('.LoadingShow').addClass('hidden');
            }
               
            resolve(errorReturn == true ? connectException : errorReturn);
        });
    });
}

export function toastShow(message, timeout = 3000)
{
    layer.msg(message, {
        offset: `${document.body.clientHeight - 250}px`,
        time: timeout,
        anim: 1,
    });
}
/**
 *
 * @param routing_name
 * @param routing_type: class RouteType(Enum):
 _global = "global"
 _role = "role"
 _subgroup = "subgroup"
 _classroom = 'classroom'
 _gradeclass = 'gradeclass'
 _username = "username"
 _uid = "uid"
 _token = "token"
 * @param message_body
 * @param result_routing_name
 * @param result_routing_type
 * @param message_type
 * @param enable_ack
 * @param enable_result
 * @param waiting_time
 * @returns {Promise}
 */
export async function sendMessage(routing_name,
    routing_type,
    message_body,
    result_routing_name = null,
    result_routing_type = null,
    message_type = "message",
    enable_ack = true,
    enable_result = false,
    waiting_time = 0,
) {
    if (typeof message_body == "object") {
        message_body = JSON.stringify(message_body);
    }
    let result = await packedFetch(
        fetch(getURL("sendmessage").replace("(routing)", routing_name).replace("(type)", routing_type), {
            method: "POST",
            headers: {
                token: getToken(),
                result_routing_name,
                result_routing_type,
                message_body,
                message_type,
                enable_ack,
                enable_result,
                waiting_time
            }
        }),
    )
    return result;
}

export function switchToLogin() {
    // PubSub.publish("stop.heartbeat");
    loadPanel(Panel.serverselect);
    $("#link").attr("src","res/images/unlink.png");
    $("#link").data("server.connect", false);
    $("#link").attr("title","服务器未连接");
}

export function updatenetwork(fds){
    var exec = require('child_process').exec;
    exec('seadee-network-config -g',(error, stdout, stderr) => {
        if (error) {
            // console.log(`exec error: ${error}`);
            addLogRecord(LogType.ERROR,`exec error: ${error}`);
            return;
        }
        // addLogRecord(LogType.INFO,stdout);
        var str=stdout;
        var n=str.split("\n");
        let dd = {

            "address": n[0],
            "mask": n[1],
            "gateway": n[2],
            // "dns": n[2],
            "method": n[3],
            "active": "true"
        }

        on_netowrk_info_updated(dd);

    });
    exec('seadee-network-config -d',(error, stdout, stderr) => {
        if (error) {
            // console.log(`exec error: ${error}`);
            addLogRecord(LogType.ERROR,`exec error: ${error}`);
            return;
        }
        // console.log(stdout);
        var str=stdout;

        // console.log(str);

        on_netowrk_DNS_updated(str);

    });
    process.on("exit", () => {
        if (exec)
            exec.disconnect();
    });
}

export function confignetwork(method,address,mask,gateway,dns){
    var exec = require('child_process').exec;
    // let str;
    if (method == "static") {
        var cmd = "seadee-network-config -t static -s --address=" +
            address + " --netmask=" + mask + " --gateway=" + gateway + " --dns=" + dns;
        // console.log(cmd);
    }

    else {
        cmd = "seadee-network-config -t dhcp -s";
        // console.log(cmd);
    }
    // console.log(cmd);
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            // console.error(`exec error: ${error}`);
            addLogRecord(LogType.ERROR, `exec error: ${error}`);
            return;
        }
    });
    process.on("exit", () => {
        if (exec)
            exec.disconnect();
    });

}

export function updatedisplay(resolution){
    let cur = screen.width+"x"+screen.height;
    // let lang = node_call_sync("getConfig","language");
    // console.log("current resolution is:"+cur);
    if(AppConfig.os.isarm)
        on_display_resolution_updated(cur);
    else
    {
        var exec = require('child_process').exec;
        exec('seadee-display-config -a',(error, stdout, stderr) => {
            if (error) {
                // console.log(`exec error: ${error}`);
                addLogRecord(LogType.ERROR,`exec error: ${error}`);
                return;
            }
            // let displayliststr = "";
            // if(lang == "en")
            //     displayliststr = "Auto "+stdout;
            // else
            let displayliststr = "自动 "+stdout;
            // console.log("dis "+lang+" is:"+displayliststr);
            on_display_resolution_updated(displayliststr);
        });
    }
}

export function setdisplay(resolution){
    let cur = screen.width+"x"+screen.height;

    if(AppConfig.os.isarm)
    {
        if(cur == resolution)
        // console.log("no change diaplay");
            addLogRecord(LogType.INFO,"display is not change please check it");
        else
        {
            let exec = require('child_process').exec;
            let cmd = "/opt/tools/set_resolution.sh ";
            cmd = cmd+resolution;

            // console.log(cmd)
            layer.confirm('\n重启生效，是否重启终端？\n', {
                btn: ['确定','取消'] ,
                skin:'demo-class1',
                shade:0.1,
                time: 15 * 1000,
                anim: 1,
                title:'配置'
            }, function(index){
                layer.close(index);
                exec(cmd,(error, stdout, stderr) => {
                    if (error) {
                        // console.error(`exec error: ${error}`);
                        addLogRecord(LogType.ERROR,`exec error: ${error}`);
                        return;
                    }
                    // console.log(stdout);
                });
            }, function(index){
                layer.close(index);
            });
        }
    }
    else
    {
        if(cur == resolution)
            console.log("no change diaplay");
        else
        {
            let exec = require('child_process').exec;
            let cmd = "seadee-display-config -r ";
            if(resolution == "auto")
                cmd = "seadee-display-config -r auto";
            else
                cmd = cmd+resolution;
            // console.log(cmd)
            exec(cmd,(error, stdout, stderr) => {
                if (error) {
                    // console.error(`exec error: ${error}`);
                    addLogRecord(LogType.ERROR,`exec error: ${error}`);
                    return;
                }
                // console.log(stdout);
            });
        }
    }
}

export function getdisplay(resolution){
    let value = screen.width+"x"+screen.height;
    // console.log("get resolution is:"+value);
    if(value.trim() == "Auto")
        value = "自动";
    return value;

}

export function getosType()
{
    return AppConfig.os.iswin
}

export function getIsarm()
{
    return AppConfig.os.isarm;
}

export function restore_factory_setting()
{
    switchToLogin();
    var exec = require('child_process').exec;
    localStorage.clear();
    if(AppConfig.os.islinux)
    {
        exec('seadee-network-config -t dhcp -s;rm -rf ~/.config/terminalclient/',(error, stdout, stderr) => {

            sendCommand(null, "system.reboot");
        });
        process.on("exit", () => {
            if (exec)
                exec.disconnect();
        });
    }
}

export function getIPAdress(){
    var interfaces = require('os').networkInterfaces();
    for(var devName in interfaces){
        var iface = interfaces[devName];
        for(var i=0;i<iface.length;i++){
            var alias = iface[i];
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                $("#infobox_ipaddress").text(alias.address);
                return alias.address;
            }
        }
    }
}

export function checkUpdate(host,showinfo)
{
    var exec = require('child_process').exec;
    exec(`bash /usr/bin/seadee-client-update ${host}`, (err, stderr, stdout) => {
        if (err) {
            // console.info(err.code);
            if(showinfo)
            {
                toastShow("已经是最新版本")
            }
            return;
        }
    });
    process.on("exit", () => {
        if (exec)
            exec.disconnect();
    });
}

export function getversion(host,showinfo)
{
    var exec = require('child_process').exec;
    exec(`bash /usr/bin/seadee-getversion.sh`, (err, stderr, stdout) => {
        localStorage.setItem('verstion',stderr);
    });
    process.on("exit", () => {
        if (exec)
            exec.disconnect();
    });
}

export function cleanLog()
{
    var exec = require('child_process').exec;
    let dir = AppConfig.app.logdir;
    if(AppConfig.os.islinux)
    {
        let linuxcmd = "cd "+dir+";ls -lt | awk '{if(NR>8){print $9}}' | xargs rm -f";
        // console.log(linuxcmd);
        exec(linuxcmd,(error, stdout, stderr) => {
        });
    }
    else{
        let wincmd = "forfiles.exe /p \""+dir+"\" /m *.log /d -7 /c \"cmd /c del @path\"";
        // console.log(wincmd);
        exec(wincmd,(error, stdout, stderr) => {
        });
    }
    process.on("exit", () => {
        if (exec)
            exec.disconnect();
    });

}

export function updateCpuFreq(){
    var exec = require('child_process').exec;
    exec('bash /etc/seadee/init.d/1-cpufreq-set.sh',(error, stdout, stderr) => {
        if (error) {
            // console.log(`exec error: ${error}`);
            addLogRecord(LogType.ERROR,`exec error: ${error}`);
            return;
        }
    });
    process.on("exit", () => {
        if (exec)
            exec.disconnect();
    });
}

export function setSortNum(value)
{
    localStorage.setItem("sort_number",value)
}

export function getSortNum()
{
    let value = localStorage.getItem("sort_number");
    if(value)
        return localStorage.getItem("sort_number").trim();
    else
        return 0;
}

export function updateTerminalSort(sort)
{
    // let sort = getSortNum();
    console.log(getArch()+","+getIPAdress());
    let deviceip = getIPAdress();
    let devicearch = getArch();
    let token = getToken();
    (async() => {
        try {
            // let url = getURL("devicesort"); // 修改终端编号
            // console.log(url)
            let result = await fetchJSON(getURL("devicesort"), 'POST', {
                device_id: DeviceID,
                device_ip: deviceip,
                device_arch: devicearch,
                device_sort: sort,
                token: token
            });
            setSortNum(sort);
        } catch (e) {
            // console.log(e);
            addLogRecord(LogType.ERROR,e);
        }
    })();
}

export function getArch()
{
    let os = require('os');
    return os.arch()
}

export function setRemotTeachingAddress(address)
{
    if(!address)
    {
        toastShow("Please input teacher's ip")
    } else{

       localStorage.setItem("teacher_ip",address)
    }
}


export function getRemotTeachingAddress()
{
    return localStorage.getItem("teacher_ip")
}

var ws = null;

export function startTeacherSocket(techerip)
{
    //与教师通讯的WebsSocket
    ws = new WebSocket("ws://"+techerip+":9998/broad");

    ws.onopen = function()
    {
        console.log("open socket");
        // ws.send("stop-remote")
    };
    ws.onmessage = function(evt){
        var exec = require('child_process').exec;
        let msg = JSON.parse(evt.data);
        let udpstring = msg.addr.substring(6,16) ;
        // console.log("udpstring" +udpstring)
        console.log(msg)
        // console.log(msg.action);
        if((msg.action.trim() == "connectting")&&(msg.status == "true"))
        {
            exec(`bash /usr/bin/seadee-do.sh udp  ${udpstring}`, (err, stderr, stdout) => {
                if (err) {
                    console.info(err);
                    return;
                }
                // console.log(stderr, stdout);
            });
            console.log("start remote now addr is"+msg.addr)   
            // node_call_async(null, "connectToSddev", "disable"); 
            let multicastStatus = getFFplayStatus();
            if(!(multicastStatus == 'true')){
                node_call_async(null, "disableToSddev", "disable");
                node_call_async(null, "connectToFFplay", msg.addr);
                setFFplayStatus('true')
            }
            
        }
        if(msg.action.trim() == "start-remote")
        {
            console.log("start remote now addr is"+msg.addr)
            exec(`bash /usr/bin/seadee-do.sh udp ${udpstring}`, (err, stderr, stdout) => {
                if (err) {
                    console.info(err);
                    addLogRecord("E",'udp start fail');
                    return;
                }
                // console.log(stderr, stdout);
            });
            // node_call_async(null, "connectToSddev", "disable");
            let multicastStatus = getFFplayStatus();
            if(!(multicastStatus == 'true')){
                node_call_async(null, "disableToSddev", "disable");
                node_call_async(null, "connectToFFplay", msg.addr);
                setFFplayStatus('true')
            }
        }
        if(msg.action.trim() == "stop-remote")
        {
            var exec = require('child_process').exec;
            // exec(`killall -9 ffplay`, (err, stderr, stdout) => {
            exec(`bash  /usr/bin/seadee-do.sh kill_ffplay`, (err, stderr, stdout) => {

                if (err) {
                    console.info(err);
                    addLogRecord("E",err);
                    return;
                }
                // console.log(stderr, stdout);
            });
            // node_call_async(null, "connectToSddev", "enable");
            node_call_async(null, "enableToSddev", "enable");
            setFFplayStatus('false');
        }
    };

    ws.onclose = function()
    {
        // 关闭 websocket
        console.log("连接已关闭...");
        var exec = require('child_process').exec; 
        // console.log("stop remote now")
        // exec(`killall -9 ffplay`, (err, stderr, stdout) => {
        exec(`bash  /usr/bin/seadee-do.sh kill_ffplay`, (err, stderr, stdout) => {

            if (err) {
                console.info(err);
                addLogRecord("E",err);
                // cb(err);
                return;
            }
            // cb(null, true);
            // console.log(stderr, stdout);
        });
        // }
        // node_call_async(null, "connectToSddev", "enable");
        node_call_async(null, "enableToSddev", "enable");
        setFFplayStatus("false")
    };
    // let sort = getSortNum();
    // console.log(getArch()+","+getIPAdress());
    // let deviceip = getIPAdress();
    // let devicearch = getArch();
    // let token = getToken();
    // (async() => {
    //     try {
    //         // let url = getURL("devicesort"); // 修改终端编号
    //         // console.log(url)
    //         let result = await fetchJSON(getURL("devicesort"), 'POST', {
    //             device_id: DeviceID,
    //             device_ip: deviceip,
    //             device_arch: devicearch,
    //             device_sort: sort,
    //             token: token
    //         });
    //     } catch (e) {
    //         // console.log(e);
    //         addLogRecord(LogType.ERROR,e);
    //     }
    // })();
}
