import {node_call_sync} from '../core/native';

function getAppConfig()
{
    return node_call_sync("getAppConfig");
}

export const AppConfig = getAppConfig();
export const DeviceID = AppConfig.app.feturemac;
export const DeviceType = AppConfig.app.apptype;
