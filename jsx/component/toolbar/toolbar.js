/**
 * Created by uforgetmenot on 16/12/30.
 */
import { sendCommand } from '../../core/native';
import { AppConfig } from '../../utils/config';
import {getActiveServer, getIPAdress, checkUpdate,getversion, getPassword, getSortNum} from '../../store/options';
import { toastShow } from '../../utils/dialog';


export function onHalt()
{
    layer.confirm('\n想要关机或者重启么？\n', {
        btn: ['关机','重启', '取消'] ,
        skin:'demo-class1',
        shade:0.1,
        title:'提示'
    }, function(index){
        layer.close(index);
        sendCommand(null, "system.halt");
    }, function(index){
        layer.close(index);
        sendCommand(null, "system.reboot");
    }, function(index){
        layer.close(index);
    });
}

function openGlobalConfigDialog(needPassowrd = true)
{
    let openConfigDialog = ()=>{
        window.settingLayerIndex = layer.open({
                skin:'layui-layer-rim demo-class2 ',
                type: 2,
                title: '设置',
                // shadeClose: true,
                shade:0.1,
                // maxmin: true, 
                area: ['700px', '400px'],
                content: 'html/setting.html'
            });
    };

    if(needPassowrd)
    {
        layer.prompt({
            title: '请输入管理密码',
            skin:'demo-class1  demo-input',
            formType: 1,
        }, function(pass, index){
            layer.close(index);
            let password= localStorage.getItem("password");
            if(password == null || pass.length == 0){
                localStorage.setItem('password','123qwe');
            }
            if(pass != getPassword())
            {
                layer.msg("错误的管理员密码！");
            }
            else
            {
                openConfigDialog();
            }
        });
    }
    else
        openConfigDialog();
}

 function openToolbarDialog()
{
    layer.open({
        skin:'layui-layer-rim demo-class2',
        type: 2,
        title:'工具',
        area: ['650px', '450px'],
        shade: 0.1,
        maxmin: true,
        // shadeClose: true,
        content: 'html/tools.html'
});
}

export function openInformationDialog() {
    let infostr = "信息";
    let sortnum = getSortNum();
    let verstion=localStorage.getItem('verstion');
    layer.open({
        title:infostr,
        type: 1,
        shade: 0.1,
        shadeClose: true,
        skin: 'layui-layer-rim demo-class1', //加上边框
        area: ['420px', '260px'], //宽,高
        content:$("#info-box")
    });
    getIPAdress();
    // $("#infobox_version").text(AppConfig.app.appversion);
    $("#infobox_version").text(verstion)
    $("#infobox_mac").text(AppConfig.app.feturemac);
    if (sortnum!=-1)
        $("#infobox_sort").text(getSortNum());
    $('#infobox_update').off('click');
    $('#infobox_update').on('click', (() => {
        // console.info("update button clicked");
        let activserver = getActiveServer();
        if(!activserver)
        {
            toastShow("请先输入服务器地址！",3000);
        }
        else
        // node_call_async(null, "startCheckUpdate", getActiveServer());
            checkUpdate(activserver,true);
    }))
}

export function on_netowrk_info_updated(net){
    // console.info('on netowork info updated', net)
    if(net != null)
    {
        // $("#infobox_ipaddress").text(net.address);
        if(window.frames[0])
        {
            let frameWindow = window.frames[0].frameElement.contentWindow;
            // console.log("load page = "+frameWindow.load_page)
            if(frameWindow.load_page == 'network')
            {
                frameWindow.update_network(
                    net.method,
                    net.address,
                    net.mask,
                    net.gateway,
                    net.active
                );
            }
        }
    }
}

export function on_netowrk_DNS_updated(net){
    // console.info('on netowork DNS updated', net)
    if(net != null)
    {
        // $("#infobox_ipaddress").text(net.address);

        if(window.frames[0])
        {
            let frameWindow = window.frames[0].frameElement.contentWindow;
            if(frameWindow.load_page == 'network')
            {
                frameWindow.update_network_dns(net);
            }
        }
    }
}


export function on_network_config_result(result)
{
    if(window.frames[0])
    {
        let frameWindow = window.frames[0].frameElement.contentWindow;
        if(frameWindow.load_page == 'network')
        {
            frameWindow.on_network_config_result(result.result);
        }
    }
}

export function on_display_resolution_updated(resolutions)
{
    if(window.frames[0])
    {
        let frameWindow = window.frames[0].frameElement.contentWindow;
        if(frameWindow.load_page == 'display')
        {
            frameWindow.on_display_resolution_updated(resolutions);
        }
    }
}

export function on_modify_display_confirm()
{

    if(window.frames[0])
    {
        let frameWindow = window.frames[0].frameElement.contentWindow;
        if(frameWindow.load_page == 'display')
        {
            frameWindow.on_modify_display_confirm();
        }
    }
}

export function on_modify_display_result(result)
{
    if(window.frames[0])
    {
        let frameWindow = window.frames[0].frameElement.contentWindow;
        if(frameWindow.load_page == 'display')
        {
            frameWindow.on_modify_display_result(result);
        }
    }
}

$(()=>{
    $("#haltTool").click(()=>{
        onHalt();
    });
    $("#settingsTool").click(()=>{
        openGlobalConfigDialog();
    });
    $("#toolboxTool").click(()=>{
        openToolbarDialog();
    });
    $("#informationTool").click(()=>{
        getversion();
        openInformationDialog();
    });
})

