const { ipcRenderer } = require('electron')

$(()=>{
    let msg = ipcRenderer.sendSync('toast.request.message');
    // let language = msg.la;
    let title = "提示";
    let remitem = "不再提示";
    let yes = "是";
    let no = "否";
    let type = msg.dialogType;

    // if(language == "en")
    // {
    //     title = "Infomation";
    //     remitem = "Don't ask again";
    //     yes = "Yes";
    //     no = "No";
    // }
    // else
    // {
    //     title = "提示"
    //     remitem = "不再提示"
    //     yes = "是";
    //     no = "否";
    // }
    if((type == 0)||(type == 1))
        $("#checkpan").css("display","none");
    else
        $("#checkpan").css("display","");
    $('#message').text(msg.message);
    $('#loadingtitle').text(title);
    $('#remitem').text(remitem);
    $('#yes').text(yes);
    $('#no').text(no);
    $('#yes').click(()=>{
        let noask = $('#checkbox2').prop('checked');
        ipcRenderer.send("toast.yes",noask);
    });
    $('#no').click(()=>{
        ipcRenderer.send("toast.close");
    });
    $('#closePic').click(()=>{
        ipcRenderer.send("toast.close");
    });

})