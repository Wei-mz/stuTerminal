/**
 * @Author: yinshi <root>
 * @Date:   2017-03-06T09:30:14+08:00
 * @Email:  569536805@qq.com
 * @Last modified by:   root
 * @Last modified time: 2017-03-08T11:10:34+08:00
 */



import {
    on_netowrk_info_updated,
    on_network_config_result,
    on_display_resolution_updated,
    on_modify_display_confirm,
    on_modify_display_result
} from '../component/toolbar/toolbar';

import {
    requestShutdown,
    requestForceReboot,
    requestConnectRDP,
    requestSpiceConnectSuccess,
    requestSpiceConnectExit
} from '../store/options';
import { request } from 'http';

export function onCommand(command, ...args) {
    switch (command) {
        case "update.network.info":
            on_netowrk_info_updated(args[0]);
            break;
        case "config.network":
            on_network_config_result(args[0]);
            break;
        case "update.display.resolution":
            on_display_resolution_updated(args[0]);
            break;
        case "modify.display.confirm":
            on_modify_display_confirm();
            break;
        case "modify.display":
            on_modify_display_result(args[0]);
            break;
        case "control.server.connectRDP":
            requestConnectRDP(args[0]);
            break;
        case "control.server.restart.force":
            requestForceReboot(args[0]);
            break;
        case "control.server.shutdown":
            requestShutdown(args[0]);
            break;
        case "client.connect.success":
            requestSpiceConnectSuccess(args[0]);
            break;
        case "client.connect.exit":
                console.log("spice  exit  command 目录")
            requestSpiceConnectExit(args[0]);
            break;
        default:
            console.log("receive unparseed command: ", command)
            break;
    }
}
