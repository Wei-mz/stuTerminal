/**
 * Created by uforgetmenot on 17/1/22.
 */
const { dialog, app } = require('electron')

function quitByError(msg, quit=true)
{
    dialog.showErrorBox("错误", msg);
    if(quit)
        app.quit();
}


module.exports = {
    quitByError
}