/**
* @Author: yinshi <root>
* @Date:   2017-03-07T18:55:35+08:00
* @Email:  569536805@qq.com
* @Last modified by:   root
* @Last modified time: 2017-03-08T09:46:21+08:00
*/



/**
 * Created by uforgetmenot on 17/1/22.
 */

import { ServerSelectPanel } from './component/centerbar/serverselectpanel';
import { VmSelectPanel, LoadServersReducer } from './component/centerbar/vmselectpanel';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import * as toolbar from './component/toolbar/toolbar';
import * as headbar from './component/headbar/headbar';
import { getActiveServer,cleanLog,updateCpuFreq } from './store/options';
import { AppConfig } from './utils/config';

import { combineReducers, createStore,applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise';
import * as setting from './component/toolbar/setting';


let SET_PANEL = 'set.panel';

export const Panel = {
    serverselect: "server.select",
    vmselect: "vm.select",
}

export function setPanel(panel){
    return {
        type: SET_PANEL,
        panel
    }
}


export function AppReducer(state = {
        panel:"server.select"
    // panel: (()=>{
        //     return getActiveServer() ? "vm.select" : "server.select"
        // })()
    // panel: "server.select"
    }, action){
    switch(action.type)
    {
        case SET_PANEL:
            return Object.assign({}, state, {
                panel: action.panel
            })
            break;
        default:
            return state;
    }
}

class _App extends Component
{
    constructor(props){
        super(props);
    }

    componentDidMount()
    {
        this.get_panel_pubsub = PubSub.subscribe("get.app.current.panel", (msg, data)=>{
            return this.props.panel;
        });
        cleanLog();
        updateCpuFreq();
    }

    componentWillUnmount()
    {
        PubSub.unsubscribe(this.get_panel_pubsub);
    }

    render()
    {
        switch(this.props.panel)
        {
            case Panel.serverselect:
                return <ServerSelectPanel dispatch={this.props.dispatch} />;
            case Panel.vmselect:
                return <VmSelectPanel  servers={this.props.servers} dispatch={this.props.dispatch} />;
            default:
                throw new Error("Invalid Core Panel Type");
                break;
        }
    }
}

const reducers = combineReducers({
    AppReducer,
    LoadServersReducer
});

let createStoreWithPromise = applyMiddleware(promiseMiddleware)(createStore);
export let store = createStoreWithPromise(reducers);

/**
 * 构造前端的主要界面部分
 *
 * @class App
 */

const App = connect(state=>{
    return {
        panel: state.AppReducer.panel,
        servers: state.LoadServersReducer.servers,
    }
})(_App);


export function getPanel(){
    return store.getState().AppReducer.panel;
}

export function getSpiceParam(instance)
{
    let servers = store.getState().LoadServersReducer.servers;
    let i;
    for(i in servers)
    {
        let server = servers[i];
        if(server.id == instance)
        {
            return server;
        }
    }
    return null;
}

export function loadPanel(panel)
{
    store.dispatch(setPanel(panel));
}

export function renderContentBar()
{
    ReactDOM.render(
        <Provider store={store}>
            <App />
        </Provider>, document.getElementById('contentbar'));
}

$(()=>{

    // if(!AppConfig.os.islinux)
    // {
        renderContentBar();
    // }

});
