import { sendCommand } from '../../core/native';
import * as options from '../../store/options';

function closeSettingLayer()
{
    if(window.settingLayerIndex)
        layer.close(window.settingLayerIndex);
}

$(()=>{
    window.options = options;
    window.sendCommand = sendCommand;
    window.getActiveServer = options.getActiveServer;
    window.setActiveServer = options.setActiveServer;
    window.getDetectURL = options.getDetectURL;
    window.checkServerValid = options.checkServerValid;
    window.reloadServers = options.reloadServers;


    window.updatenetwork = options.updatenetwork;
    window.confignetwork = options.confignetwork;
    window.updatedisplay = options.updatedisplay;
    window.setdisplay = options.setdisplay;
    window.getdisplay = options.getdisplay;
    window.getosType = options.getosType;
    window.isarm = options.getIsarm;
    window.switchToLogin = options.switchToLogin;
    window.restore_factory_setting = options.restore_factory_setting;

    window.closeLayer = closeSettingLayer;
    window.setsortnum = options.setSortNum;
    window.getsortnum = options.getSortNum;
    window.updateterminalsort = options.updateTerminalSort;
    window.getRemotTeachingAddress = options.getRemotTeachingAddress;
    window.setRemotTeachingAddress = options.setRemotTeachingAddress;
    window.startTeacherSocket = options.startTeacherSocket;
});