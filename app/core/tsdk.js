/**
 * @Author: yinshi <root>
 * @Date:   2017-03-01T22:00:27+08:00
 * @Email:  569536805@qq.com
 * @Last modified by:   yinshi
 * @Last modified time: 2017-04-12T10:43:56+08:00
 */



/**
 * Created by uforgetmenot on 17/2/10.
 */
const {
    ClientType
} = require('./wsserver-common');
const child_process = require('child_process');
const kill = require('tree-kill');
const { addLogRecord } = require('../utils/log');
const config = require('./config');
const {
    toastShow
} = require('../utils/dialog');

function onHalt() {
    let spiceprocess = child_process.exec(`poweroff`, (err, stderr, stdout) => {
        if (err) {
            console.info(err);
            addLogRecord("E",err);
            return;
        }
        // console.log(stderr, stdout);
        addLogRecord("I",stderr+","+stdout);
    });
}

function onReboot() {
    let spiceprocess = child_process.exec(`reboot`, (err, stderr, stdout) => {
        if (err) {
            console.info(err);
            addLogRecord("E",err);
            return;
        }
        console.log(stderr, stdout);
        addLogRecord("I",stderr+","+stdout);
    });
}

function sendCommand(client_type, action, data = {}) {
    require('./wsserver-handler').sendCommand2WS(client_type, action, data);
}

function disconnectSpice(cb, msg) {
    // sendCommand(ClientType.SpiceClient, "transport.close.spice");
}
function disSpice(cb, msg) {  
    // let spiceprocess = child_process.exec(`bash  /usr/bin/seadee-kill_spicy.sh`, (err, stderr, stdout) => {
    let spiceprocess = child_process.exec(`bash  /usr/bin/seadee-do.sh kill_spicy`, (err, stderr, stdout) => {
        if (err) {
            console.info(err);
            addLogRecord("E",err);
            return;
        }
        cb(null, true);
        console.log(stderr, stdout)
        addLogRecord("I",stderr+","+stdout);
    });
    process.on("exit", () => {
        if (spiceprocess && spiceprocess.connected)
            spiceprocess.disconnect();
    });
}

function connectToSpice(cb, instance) {
    // let spiceprocess = child_process.exec(`spicy ${instance}`, (err, stderr, stdout) => {
    let spiceprocess = child_process.exec(`bash  /usr/bin/seadee-do.sh spicy ${instance} &`, (err, stderr, stdout) => {
        if (err) {
            console.info(err);
            addLogRecord('spice fail------------------------------------');
            addLogRecord("E",err); 
            cb(err);
            return ;
        }
        cb(null, true);
        console.log(stderr, stdout);
        addLogRecord('spice success------------------------------------');
        addLogRecord("I",stderr+","+stdout);
        return ;
    });
    process.on("exit", () => {
        if (spiceprocess && spiceprocess.connected)
            spiceprocess.disconnect();
    });
}

function connectToSddev(cb, msg) {
    let ffplayprocess = null;
    // ffplayprocess = child_process.exec(`sddev ${msg}`, (err, stderr, stdout) => {
    //     if (err) {
    //         console.info(err);
    //         cb(err);
    //         return;
    //     }
    //     cb(null, true);
    //     console.log(stderr, stdout);
    // });

    // process.on("exit", () => {
    //     if (ffplayprocess && ffplayprocess.connected) {
    //         ffplayprocess.disconnected();
    //     }
    // });
}
function disableToSddev(cb, msg) {
    let ffplayprocess = null;  
        // ffplayprocess = child_process.exec(`bash  /usr/bin/seadee-xinput disable`, (err, stderr, stdout) => {
        ffplayprocess = child_process.exec(`bash /usr/bin/seadee-do.sh sddev  disable `, (err, stderr, stdout) => {

        if (err) {
            console.info(err);
            addLogRecord("E",err);
            cb(err);
            return;
        }
        cb(null, true);
        console.log(stderr, stdout);
        addLogRecord("I",stderr+","+stdout);
    });

    process.on("exit", () => {
        if (ffplayprocess && ffplayprocess.connected) {
            ffplayprocess.disconnected();
        }
    });
}
function enableToSddev(cb, msg) {
    let ffplayprocess = null;
        // ffplayprocess = child_process.exec(`bash  /usr/bin/seadee-xinput enable `, (err, stderr, stdout) => {
        ffplayprocess = child_process.exec(`bash  /usr/bin/seadee-do.sh sddev enable `, (err, stderr, stdout) => {

        if (err) {
            console.info(err);
            addLogRecord("E",err);
            cb(err);
            return;
        }
        cb(null, true);
        console.log(stderr, stdout);
        addLogRecord("I",stderr+","+stdout);
    });

    process.on("exit", () => {
        if (ffplayprocess && ffplayprocess.connected) {
            ffplayprocess.disconnected();
        }
    });
}

function startUpdateConnet(cb,msg) {
    console.log(" startUpdateConnet for ", msg);
    if(msg == " "){
        // toastShow("用户名或密码未输入！",5000);
        child_process.exec(`bash  /usr/bin/seadee-prompt   NOUP  `, (err, stderr, stdout) => {
            if (err) {
                console.log(`NOUP failed to fail ----: ${err.code}   `);
                addLogRecord("E",err);
                cb(err);
                return;
            }
            cb(null, true);
            console.log(`NOUP started successfully---- : ${stdout}  `);
    })
    }else{

        // checkresult = child_process.exec(`bash /root/rdp.sh ${msg}`, (err, stderr, stdout) => {
        let checkresult =  child_process.exec(`bash  /usr/bin/seadee-rdp  ${msg}`, (err, stderr, stdout) => {
            if (err) {
                console.log(`RDP failed to fail : ${err.code}   `);
                // toastShow("RDP启动失败！",5000);
                addLogRecord("E",err);
                cb(err);
                return;
            }
            cb(null, true);
            console.log(`RDP started successfully : ${stdout}  `);
        })
    process.on("exit", () => {
        if (checkresult && checkresult.connected) {
            checkresult.disconnected();
        }
    })
    }
    
}

function startCheckUpdate(cb, msg) {
    // let checkresult = null;
    // checkresult = child_process.exec(`/opt/clientupdate/clientupdate`, (err, stderr, stdout) => {
    //     if (err) {
    //         console.info(err);
    //         cb(err);
    //         return;
    //     }
    //     cb(null, true);
    //     console.log(stderr, stdout);
    // });
    // process.on("exit", () => {
    //     if (checkresult && checkresult.connected) {
    //         checkresult.disconnected();
    //     }
    // })
}

function connectToFFplay(cb, msg) {
    console.log("ffplay: msg: ", msg);  
    // let ffplayprocess = child_process.exec(`ffplay -fs -fflags nobuffer ${msg}`, (err, stderr, stdout) => {
    let ffplayprocess = child_process.exec(`bash  /usr/bin/seadee-do.sh ffplay ${msg}`, (err, stderr, stdout) => {
        if (err) {
            console.info(err);
            addLogRecord("Err",'connectToFFplay fail');
            cb(err);
            return;
        }
        cb(null, true);
        console.log(stderr, stdout);
        addLogRecord("Info",'connectToFFplay  successs');
    });
    Ffplaypid = ffplayprocess.pid;
    process.on("exit", () => {
        kill(Ffplaypid);
    });
}

function startFfmpeg(cb, cmdstr) {
    console.log("ffplay: msg: ", cmdstr);
    let ffplayprocess = child_process.exec(cmdstr, (err, stderr, stdout) => {
        if (err) {
            console.info(err);
            addLogRecord("E",err);
            cb(err);
            return;
        }
        cb(null, true);
        console.log(stderr, stdout);
        addLogRecord("I",stderr+","+stdout);
    });
    Ffplaypid = ffplayprocess.pid;
    process.on("exit", () => {
        kill(Ffplaypid);
    });
}

module.exports = {
    onHalt,
    onReboot,
    sendCommand,
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
}
