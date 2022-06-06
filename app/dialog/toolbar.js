/**
 * Created by uforgetmenot on 16/12/30.
 */
const {BrowserWindow, dialog} = require('electron')
const {ipcMain} = require('electron')
const path = require('path')
const url = require('url')

function openDialog(title, html, width=600, height=480, background="#616161")
{
    let { win } = require('../../app')
    let globalConfigDialog = new BrowserWindow({
        parent: win,
        width,
        height,
        useContentSize: true,
        modal: false,
        resizable: false,
        title,
        show: false,
        skipTaskBar: true,
        center: true,
        backgroundColor: background
    })
    globalConfigDialog.setSkipTaskbar(true);
    globalConfigDialog.setMenu(null);
    globalConfigDialog.setAlwaysOnTop(true);
    globalConfigDialog.on('closed', ()=>{
        globalConfigDialog = null;
    });
    globalConfigDialog.loadURL(url.format({
        pathname: html,
        protocol: 'file:',
        slashes: true
    }));
    globalConfigDialog.show();
    return globalConfigDialog
}



module.exports = {
    openDialog
}

