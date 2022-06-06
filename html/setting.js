function toastShow(message, timeout=3000)
{
    layer.msg(message, {
                offset: `${document.body.clientHeight - 100}px`,
                time: timeout,
                anim: 1,
            });
}

function setComponentEnabled(enabled)
{
    if(!enabled)
    {
        $("#cancel").attr("disabled", "disabled");
        $("#apply").attr("disabled", "disabled");
        $(".back").attr("disabled", "disabled");
    }
    else
    {
        $("#cancel").removeAttr("disabled");
        $("#apply").removeAttr("disabled");
        $(".back").removeAttr("disabled");
    }
}

function onSettingLoad()
{
    $("#network").click(function () {
        location.href="network.html";
    });
    $("#server").click(function () {
        location.href="server.html";
    });
    $("#display").click(function () {
        location.href="display.html";
    });
    $('#teacher').click(function () {
        location.href='teacher.html';
    });
    $('#ping').click(function () {
        location.href='ping.html';
    });
    $('#sort').click(function () {
        location.href='sort.html';
    });
}

function onServerLoad()
{
    window.load_page = "server";
    let originServer = parent.getActiveServer();
    $("#server_address").val(originServer);
    $("#apply").click(()=>{
        let server = $("#server_address").val().trim();
        if(server.length == 0)
            return
        if(server == originServer)
            return
        setComponentEnabled(false);
        parent.checkServerValid((e)=>{
            setComponentEnabled(true);
            if(e)
            {
                toastShow(`设置失败：${server} 不是有效的服务器！`);
                return;
            }
            parent.setActiveServer(server);
            parent.reloadServers(server);
            // parent.closeLayer();
            localStorage.setItem('active_server',server);
            sessionStorage.setItem('stopSpice',"true");
            toastShow(`设置成功：当前的服务器为 ${server}`);
        }, server);
    });
    $('#server_address').bind('keydown',function(event){
        if(event.keyCode == "13") {
            let server = $("#server_address").val().trim();
            if(server.length == 0)
                return
            if(server == originServer)
                return
            setComponentEnabled(false);
            parent.checkServerValid((e)=>{
                setComponentEnabled(true);
                if(e)
                {
                    toastShow(`设置失败：${server} 不是有效的服务器！`);
                    return;
                }
                parent.setActiveServer(server);
                parent.reloadServers(server);
                // parent.closeLayer();
                sessionStorage.setItem('stopSpice',"true");
                toastShow(`设置成功：当前的服务器为 ${server}`);
            }, server);
        }
    });
}

function onNetworkLoad()
{
    window.load_page = "network";
    // let la = parent.getLanguage("sdf");
    $("#network_method").change(()=>{
        let method = $("#network_method").val();

        if(method == "dhcp")
        {
            $("input").attr("disabled","disabled");
        }
        else
        {
            $("input").removeAttr("disabled");
        }
    });

    let originNetwork = {};
    let originDns = "";

    window.update_network = function(method, ip, mask, gateway, active){
        $("#network_method").val(method.trim());
        // console.log("method is:"+method);
        $("#network_method").change();
        $("#ip").val(ip.trim());
        $("#mask").val(mask.trim());
        $("#gateway").val(gateway.trim());
        // $("#dns").val(dns.trim());
        $("#network_status img").attr('src', active ? "../res/images/active.png": "../res/images/inactive.png");
        $("#network_status span").text(active ? "活跃" : "非活跃");

        originNetwork = {
            method, ip, mask, gateway
        }
    }

    window.update_network_dns = function(dns){
        $("#dns").val(dns.trim());

        originDns = dns;
    }


    $("#apply").click(()=>{
        let method = $("#network_method").val().trim();
        console.log(method);
        let ip = $("#ip").val().trim();
        let mask = $("#mask").val().trim();
        let gateway = $("#gateway").val().trim();
        let dns = $("#dns").val().trim();

        if(method=="static")
        {
            let itemList = {
                ip: [ip, `网络设置失败：${ip} 不是一个有效的IP地址！`],
                mask: [mask, `网络设置失败：${mask} 不是一个有效的子网掩码！`],
                gateway: [gateway, `网络设置失败：${gateway} 不是一个有效的网关地址！`],
                dns: [dns, `网络设置失败：${dns} 不是一个有效的DNS地址！`]
            };

            let item;
            for(item in itemList)
            {
                let value = itemList[item];
                if(item == "dns" && value[0] == "")
                {
                    continue;
                }
                if(!value[0].match(/^([0-9]{1,3}\.){3}[0-9]{1,3}$/))
                {
                    toastShow(value[1]);
                    return;
                }
                let index;
                let splitedValue = value[0].split('.');
                for(index in splitedValue)
                {
                    if( splitedValue[index] > 255)
                    {
                        toastShow(value[1]);
                        return;
                    }
                }
            }
        }

        if(originNetwork.method != method ||
            originNetwork.ip != ip ||
            originNetwork.mask != mask ||
            originNetwork.gateway != gateway ||
            originDns != dns)
        {
            parent.confignetwork(method,ip,mask,gateway,dns);
            // parent.closeLayer();
            history.go(-1);
        }
        else
            toastShow("没有配置被改变");

    });
    parent.updatenetwork('seadee-network-config -i');
}

function onDisplayLoad()
{
    window.load_page = "display";
    $("#display_device").data({});
    let currentresolution = parent.getdisplay("sdf");
    let test = "";
    let rsl = "";
    window.on_display_resolution_updated = (resolutions)=>{
        if(parent.isarm())
        {
            test = "800x600,1024x768,1280x720,1280x1024,1366x768,1440x900,1600x900,1600x1200,1920x1080";
            rsl = test.split(",");
            // console.log(rsl);
        }
        else
            rsl = resolutions.split(" ");
        let key;
        $("#display_device").empty();
        $("#resolution").empty();
        $("#display_device").data({})

        for(key in rsl)
        {
            // console.log(rsl[key]+","+currentresolution);
            if(rsl[key].trim() == currentresolution.trim())
            {
                $("#resolution").append(`<option value="${rsl[key]}" id="${key}" selected = "selected">${rsl[key]}</option>`);
                console.log("select")
            }
            else
                $("#resolution").append(`<option value="${rsl[key]}" id="${key}">${rsl[key]}</option>`);

        }
        // console.log(resolutions);
    }

    $("#apply").click(()=>{
        let display_resolution = $("#resolution").val();
        let cmsg = '\n确定想要修改分辨率么？\n';
        let yes = "确定";
        let no = "取消";
        let conf = "配置";
        // if(la == "en")
        // {
        //     cmsg = '\nAre you sure you want to change the resolution?？\n';
        //     yes = "Yes";
        //     no = "No";
        //     conf = "Config";
        // }
        if(display_resolution.trim() == "自动")
            display_resolution = "auto";
        layer.confirm(cmsg, {
            btn: [yes,no] ,
            skin:'demo-class1',
            shade:0.1,
            time: 15 * 1000,
            anim: 1,
            title:conf
        }, function(index){
            layer.close(index);
            parent.setdisplay(display_resolution.trim());
            parent.closeLayer();
        }, function(index){
            layer.close(index);
        });
    });

    window.on_modify_display_result = (result)=>{
        setComponentEnabled(true);
        if(result.result)
        {
            toastShow("分辨率设置成功");
        }
        else
        {
            if(result.reason == "unconfirm")
            {
                toastShow("分辨率设置取消");
            }
            else
            {
                toastShow("分辨率设置失败");
            }
        }
    }

    parent.updatedisplay("sdf");
}

function onToolsLoad()
{
    window.load_page = "tools";
}

function onTeacherLoad()
{
    window.load_page = "teacher";
    let teacherip = parent.getRemotTeachingAddress();
    if(teacherip)
    {
        $("#teacher_address").val(teacherip.trim());
    }
    else
        console.log("sort number is null");

    $("#apply").click(()=>{
        teacherip = $("#teacher_address").val();
        if(teacherip)
        {
            let cmsg = '确定为开始接收组播？';
            let yes = "确定";
            let no = "取消";
            let conf = "提示";
            layer.confirm(cmsg, {
                btn: [yes,no] ,
                skin:'demo-class1',
                shade:0.1,
                time: 15 * 1000,
                anim: 1,
                title:conf
            }, function(index){
                layer.close(index);
                parent.setRemotTeachingAddress(teacherip);
                parent.startTeacherSocket(teacherip);
                parent.closeLayer();
            }, function(index){
                layer.close(index);
            });
        }
        else
            toastShow("编号不能为空，请重新输入！",3000);

    });

}

function onSortsLoad()
{
    window.load_page = "sort";
    let sortnum = parent.getsortnum()
    if(sortnum)
    {
        $("#sortinput").val(sortnum);
    }
    else
        console.log("sort number is null");

    $("#apply").click(()=>{
        sortnum = $("#sortinput").val();
        console.log('sortnum: '+sortnum);
        if(sortnum)
        {
            let cmsg = '确定为本机设置编号：'+sortnum+'?';
            let yes = "确定";
            let no = "取消";
            let conf = "配置";
            layer.confirm(cmsg, {
                btn: [yes,no] ,
                skin:'demo-class1',
                shade:0.1,
                time: 15 * 1000,
                anim: 1,
                title:conf
            }, function(index){
                layer.close(index);
                // if(!sortnum.match(/^([0-9]{1,3})-([0-9]{1,3})$/))
                // {
                //     console.log("not rules")
                //     toastShow("请输入正确的格式，例：1-3（1排第三个位置）。",3000);
                //
                // }
                // else
                // {
                //     parent.setsortnum(sortnum);
                //     parent.updateterminalsort(sortnum);
                // }
                // parent.setsortnum(sortnum);
                parent.updateterminalsort(sortnum);
                parent.closeLayer();
            }, function(index){
                layer.close(index);
            });
        }
        else
        {
            toastShow("编号不能为空，请重新输入！",3000);
        }

    });
}

$(function () {
    $("#back").click(function(){
        history.go(-1);
    });

    $("#cancel").click(function(){
        parent.closeLayer();
    });
});

(()=>{
    if(document.URL.match(/.*\/setting\.html/))
    {
        onSettingLoad();
    }
    else if(document.URL.match(/.*\/server\.html/))
    {
        onServerLoad();
    }
    else if(document.URL.match(/.*\/network\.html/))
    {
        onNetworkLoad();
    }
    else if(document.URL.match(/.*\/display\.html/))
    {
        onDisplayLoad();
    }
    else if(document.URL.match(/.*\/sort\.html/))
    {
        onSortsLoad();
    }
    else if(document.URL.match(/.*\/tools\.html/))
    {
        onToolsLoad();
    }
    else if(document.URL.match(/.*\/teacher\.html/))
    {
        onTeacherLoad();
    }
    else
    {
        alert("Not Implement Yet!!")
    }

})();