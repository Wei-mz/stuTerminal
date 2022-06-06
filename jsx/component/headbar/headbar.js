/**
 * Created by Seadee on 2016/12/26.
 */

import { toastShow} from '../../utils/dialog';
import { packInt } from '../../../common/util'

export function onInputMethod()
{

}
export function onUsb()
{
   
}
export function onConnect()
{

}
export function onEthernet()
{

}
export function onWifi()
{

}

export function updateTimeView(){
    let weekday=[
        "星期日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六"
    ];
    let date = new Date();
    $("#timeview").text(`${packInt(date.getHours(), 2)}:${packInt(date.getMinutes(), 2)} ${weekday[date.getDay()]}`);
}

function initTimeView()
{
    updateTimeView();
    setInterval(30 * 1000, updateTimeView);
    $("#timeview").click(()=>{
        console.log("should popup calendar")
    });
}

$(()=> {
    $(window).on("online", () => {
        $("#ethernet").attr({"src": "res/images/ethernet.png"});
        $("#ethernet").attr("title", "网络已连接");

    });

    $(window).on("offline", () => {
        $("#ethernet").attr("src", "res/images/ethernet_disconnect.png");
        $("#ethernet").attr("title", "网络未连接");
        toastShow("网络已经断开!");
    });
    $("#ethernet").attr("src", navigator.onLine ? "res/images/ethernet.png" : "res/images/ethernet_disconnect.png");
    $("#ethernet").attr("title", navigator.onLine ? "网络已连接" : "网络未连接");
    let serverConnected = $("#link").data("server.connect");
    $("#link").attr("title", serverConnected ? "服务器已连接": "服务器未连接");

});

$(document).ready(()=>{
    $("#input-method").click(()=>{
        onInputMethod();
    });
    $("#usb").click(()=>{
        onUsb();
    });
    $("#ethernet").click(()=>{
        onEthernet();
    });
    $("#wifi").click(()=>{
        onWifi();
    });
    $("#link").click(()=>{
        onConnect();
    });
    initTimeView();
    
});

