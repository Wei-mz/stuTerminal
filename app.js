const path = require('path')
const url = require('url')
const {app, BrowserWindow, Menu} = require('electron')
const { AppConfig } = require("./app/core/config")
const { MethodWrapper, EventWrapper, RenderWrapper } = require('./app/core/native')
const { addLogRecord, clearLogs } = require('./app/utils/log')
const { toastShow } = require('./app/utils/dialog')


/**
 * @class app
 * @static
 */


let win

function createWindow () {



  win = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    width: 960,
    height: 640,
    fullscreen: (()=>{
      if(AppConfig.app.config.debug)
        return false
      else if(AppConfig.os.iswin)
        return false
      else
        return true
    })(),
    backgroundColor: "#87CEEB",
    kiosk: AppConfig.app.config.debug?false:(AppConfig.os.islinux ? true: false)
  })

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
// 调出控制台
// win.webContents.openDevTools({mode:'right'}); 
  win.on('closed', () => {
    app.quit()
    win = null
  })

  onInited()
}

function createMenu(){
  const template = [
    {
      label: '文件(&F)',
      submenu: [
        {
          label: '退出',
          click (item, focusedWindow) {
            app.quit()
          }
        },

      ]
    },
    {
      label: '帮助(&H)',
      submenu: [
        {
          label: '帮助',
          click () { require('electron').shell.openExternal('http://bing.com') }
        },
        {
            label: '关于(&H)',
            click () {

            }
        },
        {
          type: 'separator'
        },
        {
          label: '调试',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools()
          }
        }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}

function makeSureSingleInstance()
{
    let shouldQuit = app.makeSingleInstance((commandLine, workingDirectory)=>{
        if (win) {
            if (win.isMinimized())
                win.restore();
            win.focus();
        }
    })
    if(shouldQuit) {
        app.quit();
        return;
    }
}

function onInited()
{
  Menu.setApplicationMenu((()=>{
      if(AppConfig.app.config.debug || AppConfig.os.iswin)
        return createMenu();
      else
        return null;
  })());

  exports.win = win;

  if(AppConfig.app.config.debug)
  {
    win.toggleDevTools();
  }

  makeSureSingleInstance();
}

app.on('ready', createWindow)


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

