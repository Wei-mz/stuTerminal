/**
 * Created by Seadee on 2016/12/27.
 */
import React, { Component } from 'react';
import { sendCommand } from '../../core/native';
import ReactDOM from 'react-dom';
import PubSub from 'pubsub-js';
import {cleanLog, getLinkHaltID} from "../../store/options";

export class VirtualMachine extends Component
{
    static defaultProps = {
        server: {}
    }

    constructor(props){
        super(props);
        this.ServerState = require('./vmselectpanel').VmSelectPanel.ServerState;
    }

    click(e){

    }

    dbclick(e){
        $("#hide-menu").data("selected.server", this.props.server);
        console.log( this.props.server,"chuandide1   props")
        $("#context_connect").click();
    }

    contextMenuClick(event){
        $("#hide-menu").data("selected.server", this.props.server);

        let pageX = event.pageX;
        let pageY = event.pageY;
            $("#hide-menu").css({
                left: pageX+ "px",
                top: pageY + "px"
            }).stop().fadeIn(0); 
            event.preventDefault();
    }

    render()
    {
        this.props.server.imgid = "os-img";
        this.props.server.imgalt = "Operating System";

        switch (this.props.server['OS-EXT-STS:power_state'])
        {
            case this.ServerState.NOSTATE:
                this.props.server.osimg = "res/images/server_none.png";
                this.props.server.power_state="无状态";
                break;
            case this.ServerState.RUNNING:
                this.props.server.osimg = "res/images/server_running.png";
                this.props.server.power_state="运行中";
                break;
            case this.ServerState.PAUSED:
                this.props.server.osimg = "res/images/server_suspend.png";
                this.props.server.power_state="暂停";
                break;
            case this.ServerState.SHUTDOWN:
                this.props.server.osimg = "res/images/server_closed.png";
                this.props.server.power_state="关机";
                let id = getLinkHaltID();

                let store = require('../../app').store
                let servers = store.getState().LoadServersReducer.servers;
                if(localStorage.getItem("instanceItem") == "true")
                {
                    if((this.props.server.id == id) && (servers.length == 1))
                    {
                        console.log("change shutdown");
                        // sendCommand(null, "system.halt");
                    }

                }

                break;
            case this.ServerState.CRASHED:
                this.props.server.osimg = "res/images/server_crashed.png";
                this.props.server.power_state="崩溃";
                break;
            case this.ServerState.SUSPENDED:
                this.props.server.osimg = "res/images/server_suspend.png";
                this.props.server.power_state="挂起";
                break;
            case this.ServerState.BUILDING:
                this.props.server.osimg = "res/images/server_building.png";
                this.props.server.power_state="构建";
                break;
            default:
                this.props.server.power_state="未知";
                this.props.server.osimg = "res/images/server_none.png";
                console.info("detect server with unkown state", this.props.server.power_state);
                break;

        }

        return (
            <ul className="list-group contentitem" onContextMenu={this.contextMenuClick.bind(this)} onDoubleClick={this.dbclick.bind(this)} onClick={this.click.bind(this)}>
                <li className="list-group-item">
                    <img draggable="false" id={this.props.server.imgid} className="os" src={this.props.server.osimg} width="128px" height="95px" alt={this.props.server.imgalt}/>
                </li>
                <li className="list-group-item">{this.props.server.name}</li>
            </ul>
        )
    }
}