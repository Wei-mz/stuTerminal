const {BrowserWindow, dialog} = require('electron')
const {ipcMain} = require('electron')
const path = require('path')
const url = require('url')
const { getConfig, setConfig } = require('../core/config')
const { uuid } = require('../../common/util');

var RenderWrapper = {
    render_call: (cb, ...args)=>{
        var call_id = uuid();
        ipcMain.once("render.method.return." + call_id, (event, result)=>{
            if(cb)
                cb(result);
        })
        require("../../app").win.webContents.send('render.method.call', call_id, ...args);
    }
}

function spiceControleDialog(cb, ...args)
{
    RenderWrapper.render_call(cb, "onCommand", ...args);
}

function showErrorBox(title, message)
{
    dialog.showErrorBox(title, message);
}

function showMessageBox(options)
{
    return dialog.showMessageBox(options);
}

function toastShow(title, message, timeout)
{
    let { win } = require('../../app')
    let toast = new BrowserWindow({
        parent: win,
        width: 480,
        height: 53,
        useContentSize: true,
        modal: false,
        resizable: false,
        title: "提示",
        skipTaskBar: true,
        frame: false,
    })
    toast.setSkipTaskbar(true);
    toast.setMenu(null);
    toast.setAlwaysOnTop(true);
    let appWindowSize = win.getSize();
    let toastWindowSize = toast.getSize();
    toast.setPosition(parseInt((appWindowSize[0] - toastWindowSize[0]) / 2), parseInt((appWindowSize[1] - toastWindowSize[1]) / 8 * 7));
    toast.on('closed', ()=>{
        toast = null;
    });
    ipcMain.once('toast.close', (event)=>{
        if(toast)
            toast.close();
    })
    ipcMain.once('toast.request.message', (event)=>{
        event.returnValue = {
            title,
            message
        }
    });

    toast.loadURL(url.format({
        pathname: path.join(__dirname, '../../html/toast.html'),
        protocol: 'file:',
        slashes: true
    }))
    toast.show();

    setTimeout(()=>{
        if(toast)
            toast.close();
    }, timeout ? timeout: 3000);
}

function toastShow2(dialogType, clientid)
{
    console.log("dialog show")
    let modalPath = path.join('file://', __dirname, '../../html/spiceDialog.html');
    let titlestr = "";
    let message = " ";
    // let la = getConfig("language");
    let remItem = getConfig("noask");
    if(!remItem)
    {
        setConfig("noask",false);
        remItem = getConfig("noask");
    }


    // if(la == "en")
    // {
    //     titlestr = "Infomation";
    //     if(dialogType == 0)
    //         message = "Confirm to force reboot?";
    //     if(dialogType == 1)
    //         message = "Confirm to force shutdown?";
    //     if(dialogType == 2)
    //         message = "Confirm to exit connect?";
    // }
    // else
    // {
        titlestr = "提示";
        if(dialogType == 0)
            message = "确定重启虚拟机？";
        if(dialogType == 1)
            message = "确定关闭虚拟机？";
        if(dialogType == 2)
            message = "确定断开连接？";
    // }

    let { win } = require('../../app')
    let toast = new BrowserWindow({
        parent: win.top,
        width: 300,
        height: 180,
        useContentSize: true,
        modal: false,
        resizable: false,
        title: titlestr,
        skipTaskBar: true,
        frame: false,
        transparent:true,
        show: false
    })
    // toast.setSkipTaskbar(true);
    // toast.setMenu(null);
    toast.setAlwaysOnTop(true);
    toast.on('closed', ()=>{
        toast = null;
    });
    ipcMain.once('toast.close', (event)=>{
        if(toast)
            toast.close();
    })
    ipcMain.once('toast.yes', (event,arg)=>{
        // console.log(arg);
        if(arg)
            setConfig("noask",arg);
        if(toast)
        {
            //
            if(dialogType == 0)
            {
                spiceControleDialog(null, "control.server.restart.force", clientid)
            }
            if(dialogType == 1)
            {
                // console.log(dialogType);
                spiceControleDialog(null, "control.server.shutdown", clientid);
            }
            if(dialogType == 2)
            {
                console.log(dialogType);
                spiceControleDialog(null, "client.connect.exit", clientid);
            }
            if(dialogType == 3){
                spiceControleDialog(null, "control.server.connectRDP", clientid);
            }
            toast.close();

        }
    })
    ipcMain.once('toast.request.message', (event)=>{
        event.returnValue = {
            message,
            // la,
            dialogType
        }

    });

    toast.loadURL(modalPath);

    toast.once('ready-to-show', () => {
        toast.show();
    })
// console.log(remItem+" ");
    // setTimeout(()=>{
    //     toast.once('ready-to-show', () => {
    //         toast.show();
    //     })
    // }, 2000);
}



module.exports = {
    showErrorBox,
    showMessageBox,
    toastShow2,
    toastShow
}