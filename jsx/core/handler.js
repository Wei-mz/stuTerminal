/**
* @Author: yinshi <root>
* @Date:   2017-03-01T14:53:48+08:00
* @Email:  569536805@qq.com
* @Last modified by:   root
* @Last modified time: 2017-03-28T19:17:09+08:00
*/



/**
 * Created by uforgetmenot on 17/1/22.
 */

import PubSub from '../../include/pubsub/pubsub';
import {getPanel, Panel} from '../app';
import { addDiscoveredServer } from '../store/options';


export function on_discovered_server_reported(server)
{
    if(!addDiscoveredServer(server.addr))
        return
    if(getPanel() == Panel.serverselect)
        PubSub.publish("server.discovered", server.addr);
}

export function on_websocket_connected()
{
    console.info("websocket is connected and the render contentbar ...")
    require('../app').renderContentBar();
}

export function on_request_spice_parameter(instance)
{
    let server = require('../app').getSpiceParam(instance);
    return　server;
}

export function on_request_ffplay_parameter()
{
    console.log("on_request_ffplay_parameter()");
    let result = sessionStorage.getItem("ffmpeg.current.parameters");
    return result ? JSON.parse(result) : sessionStorage.getItem("ffmpeg.current.parameters");
}
