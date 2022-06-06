/**
* @Author: yinshi <root>
* @Date:   2017-03-06T09:30:14+08:00
* @Email:  569536805@qq.com
* @Last modified by:   root
* @Last modified time: 2017-03-28T22:28:50+08:00
*/



const { onHalt, onReboot, sendCommand } = require('./tsdk');
const { ClientType } = require('./wsserver-common');

function onCommand(cb, command,...args)
{
    switch(command)
    {
        case "system.halt":
            onHalt();
            break;
        case "system.reboot":
            onReboot();
            break;
        case "time.sync":
            // sendCommand(
            //     ClientType.TerminalSDK,
            //     command,
            //     {time: args[0]}
            // );
            break;
        case "update.network.info":
            // sendCommand(
            //     ClientType.TerminalSDK,
            //     command
            // );
            break;
        case "config.network":
            // sendCommand(
            //     ClientType.TerminalSDK,
            //     command,
            //     args[0]
            // );
            break;
        case "update.display.resolution":
            // sendCommand(ClientType.TerminalSDK,
            //     command
            // );
            break;
        case "modify.display":
            // sendCommand(ClientType.TerminalSDK,
            //     command,
            //     args[0]
            // );
            break;
        case "cancel.reset.resolution":
            // sendCommand(ClientType.TerminalSDK,
            //     command
            // );
            break;
        case "ffmpeg.client.close":
            console.log("ffmpeg.client.close");
            sendCommand(ClientType.FFMpegClient,
                command
            );
            break;
        default:
            break;
    }
}

module.exports = {
    onCommand
}
