/**
 * Created by seadee on 2016/12/13 0013.
 */
const { ipcRenderer } = require('electron')

$(()=>{
    $('#close').click(()=>{
        ipcRenderer.send("toast.close");
    });
    let msg = ipcRenderer.sendSync('toast.request.message');
    console.info("msg is", msg);
    $('#title').text(msg.title);
    $('#message').text(msg.message);
})

