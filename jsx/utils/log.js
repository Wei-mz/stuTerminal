import { AppConfig } from './config';
import { node_call_async,node_call_sync } from '../core/native'

export class LogType{
    static ERROR = "E";
    static INFO = "I";
    static WARN = "W";
}

export function addLogRecord(type, log)
{
    // if(log.substr(-2) != '\r\n')
    //     log += '\r\n';
    node_call_sync("addLogRecord", type, log);
    switch(type)
    {
        case LogType.ERROR:
            console.error(log);
            break;
        case LogType.INFO:
            console.info(log);
            break;
        case LogType.WARN:
            console.warn(log);
            break;
    }
}

export function readLogRecords()
{
    node_call_async(()=>{}, "readLogRecords");
}

export function openLogFile()
{
    node_call_async(()=>{}, "openLogFile");
}