import { node_call_async, node_call_sync } from '../core/native';
import { AppConfig } from './config';


export function showErrorBox(title, message)
{
    return node_call_sync("showErrorBox", title, message);
}

export function showMessageBox(options)
{
    return node_call_sync("showMessageBox", options);
}


function showNotification(title, message, timeout = 3000, icon = null)
{

    let options = {
        body: message
    };
    if(icon)
        options.icon = icon;
    let notify = new Notification(title, options);
    notify.onshow = function() {
        notify.tid = setTimeout(()=>{
            if(notify)
                notify.close();
        }, timeout);
    };
}

export function toastShow(message, timeout = 3000)
{
    layer.msg(message, {
        offset: `${document.body.clientHeight - 250}px`,
        time: timeout,
        anim: 1,
    });
}

export function toastShow2(title, messsage, timeout = 3000)
{
    if(AppConfig.os.iswin7orupper && !AppConfig.os.iswin8orupper)
    {
        node_call_sync("toastShow", title, messsage, timeout);
    }
    else
    {
        showNotification(title, messsage, timeout);
    }
}