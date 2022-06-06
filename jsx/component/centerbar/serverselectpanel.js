/**
 * Created by uforgetmenot on 16/12/30.
 */
import React, { Component } from 'react';
import { setTitle } from './centerbar';
import PubSub from '../../../include/pubsub/pubsub';
import { toastShow, showMessageBox } from '../../utils/dialog';
import { loadPanel, Panel } from '../../app';
import { AppConfig } from '../../utils/config';
import { getPort, getServerDetail, setActiveServer, registerDevice, generateURLs, packURL, getURL} from '../../store/options';
import { calcKeyPair, fetchJSON } from '../../store/options';
import { addLogRecord } from '../../utils/log';

let  num=0
export class ServerSelectPanel extends Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            serveraddr: ""
        }
        this.port = getPort();
    }
     
    componentDidMount()
    {
        num++
        setTitle("请输入服务器地址");
        localStorage.setItem("instanceItem",false);
        // this.servers = localStorage.getItem('discovered_servers');
        let addr = localStorage.getItem("active_server");
        if(addr)
        {

            this.setState({
                serveraddr: addr
            },()=>{
                this.onOkClicked();

            });
            // setTimeout(()=>{
            //     this.onOkClicked();
            // }, 500);

        }else{
            console.log('num= '+num)
            if(num>1){
                setTimeout(()=>{
                    toastShow('请查看服务器ip等是否输入正确！');
                },3000)
            }
        }
        PubSub.subscribe("server.discovered", (msg, server) => {
            this.setState({
                serveraddr: server
            });
            this.onOkClicked();
        });
        $('#centerbar').bind('keydown',function(event){
            if(event.keyCode == "13") {
                this.onOkClicked();
            }
        });
    }

    componentWillUnmount()
    {
        PubSub.unsubscribe("server.discovered");
    }


    onOkClicked()
    {
      

        if( this.state.serveraddr.trim().length==0)
        {
            toastShow("服务器地址不能为空!");
        }
        else{
            let addr = this.state.serveraddr.trim();
            console.log("else de",this.state.serveraddr.trim())
            let port = this.port;

            (async ()=>{

                let done = false;
                try{
                    let detail = await getServerDetail(addr, port);
                    console.log(detail)
                  generateURLs(addr, port, detail.server.api_version);
                    done = true;
                }
                catch(e)
                {
                    $('.LoadingShow').addClass('hidden');
                    layer.closeAll('loading');
                    console.log("error: ", e)
                    addLogRecord('erro',`服务器登陆失败：${JSON.stringify(e)}`);
                     toastShow('请查看服务器ip等是否输入正确！');
                };

                if(done)
                {
                    setActiveServer(addr);
                    setTitle("");
                    loadPanel(Panel.vmselect);
                    addLogRecord('info',`服务器登陆成功`);
                }
            })();
        }

    }

    onValueChanged(e)
    {
        this.setState({
            serveraddr: e.target.value
        });
        if(e.target.value=="")
        {
            $("#search").css("visibility","hidden")
        }
        else{
            $("#search").css("visibility","visible")
        }

    }
    render(){
        return (
            <div>
                <div id="centerbar">
                    <label>服务器</label>
                    <input value={this.state.serveraddr} onChange={this.onValueChanged.bind(this)}></input>
                    <button onClick={this.onOkClicked.bind(this)} >确定</button>
                </div>
                <div id="search">
                    正在搜索服务器
                    &nbsp;<i className="fa fa-spinner fa-spin" id="searching"></i>
                </div>
            </div>
        );
    }

}


