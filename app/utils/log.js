const { AppConfig } = require('../core/config');
const { packInt } = require('../../common/util');
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');


function addLogRecord(type, log){
    // if(log.substr(-2) != '\r\n')
    log += '\r\n';
    let date = new Date();
    let data = packInt(date.getHours(), 2) + ":" + packInt(date.getMinutes(), 2)+ ":" + packInt(date.getSeconds(), 2)+ "." + packInt(date.getMilliseconds(), 3) + "  " + type + "  " + log;
    fs.appendFile(AppConfig.app.logfile, data, (err) => {
        if (err) throw err;
    });
}

function readLogRecords()
{
    console.warn("readLogRecords: not implement yet");
}

function openLogFile()
{
    if(AppConfig.os.iswin)
    {
        exec("notepad " + `"${AppConfig.app.logfile}"`, (error, stdout, stderr) => {} );
    }
    else if(AppConfig.os.islinux)
    {
        exec("gedit " + `"${AppConfig.app.logfile}"`, (error, stdout, stderr) => {} );
    }
    else if(AppConfig.os.isosx)
    {
        exec("open " + `"${AppConfig.app.logfile}"`, (error, stdout, stderr) => {} );
    }
    else{
        console.error("open log file failed");
    }
}

function clearLogs(keepDay)
{
    fs.readdir(AppConfig.app.logdir, (e, files)=>{
        let nt = AppConfig.app.logfile.substr(-21).substr(0, 8);
        for(i in files){
            if(files[i].match(/^\d{17}\.log$/))
            {
                let ot = files[i].substr(0, 8);
                if((parseInt(nt) - parseInt(ot)) >= 30)
                {
                    fs.unlink(path.join(AppConfig.app.logdir, files[i]), e=>{
                        if(e){
                            console.error("remove file", files[i], "failed");
                        }
                    });
                }
            }
        }
    });
}

clearLogs();

module.exports = {
    addLogRecord,
    readLogRecords,
    openLogFile,
    clearLogs
}