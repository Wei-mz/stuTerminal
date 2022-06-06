/**
* @Author: yinshi <root>
* @Date:   2017-03-29T00:56:24+08:00
* @Email:  569536805@qq.com
* @Last modified by:   root
* @Last modified time: 2017-03-29T01:13:45+08:00
*/



const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');
const { packInt, uuid } = require('../../common/util');

const os_release = os.release().split(".");
const os_version = parseInt(os_release[0].toString() + os_release[1].toString());

let app_data_dir = path.join(app.getPath('appData'), app.getName());

(()=>{

    [".","config", "log", "database"].map((item)=>{
        try {
            fs.mkdirSync(path.join(app_data_dir, item))
        }catch (e){}
    })

    let file = path.join(app_data_dir, "config", app.getName() + ".conf");
    try {
        fs.accessSync(file, fs.constants.F_OK);
    }
    catch (e)
    {
        fs.writeFileSync(file, JSON.stringify({
            debug: false,
        }));
    }
})()

function filterValidInterfaces()
{
    let interfaces = os.networkInterfaces();
    for (let key in interfaces )
    {
        if(key.match("^lo[0-9]$"))
        {
            delete interfaces[key];
        }
        else if(key.match("^vmnet[0-9]$"))
        {
            delete interfaces[key];
        }
    }
    return interfaces;
}

function getFetureMacAddress()
{
    let interfaces = filterValidInterfaces();
    for (let key in interfaces)
    {
        let details = interfaces[key];
        if(details.length < 1)
            continue;
        let item = details[0];
        let mac = item['mac'];
        if(mac != "00:00:00:00:00:00" && mac.match('^[a-z0-9:]{17}$'))
        {
            return mac
        }
    }
    return null;
}

function getFetureMacAddress2() {
    let root = "/sys/class/net/";
    let interfaces = fs.readdirSync(root);
    if(!interfaces)
        return null;
    for(let i in interfaces)
    {
        let item = path.join(root,interfaces[i])
        if(interfaces[i].match('/^lo[0-9]$/'))
            continue
        else
        {
            result = fs.readFileSync(path.join(item, "address"), 'utf-8').trim();
            return result;
        }
    }
}

var AppConfig = {
    os: {
        homedir: os.homedir(),
        hostname: os.hostname(),
        appdata: app.getPath('appData'),
        tmpdir: os.tmpdir(),
        iswin: os.type() == "Windows_NT",
        islinux: os.type() == "Linux",
        isosx: os.type() == "Darwin",
        pathsep: path.sep,
        iswinxporupper: os.type == "Windows_NT" && os_version > 51,
        iswinvistaorupper: os.type == "Windows_NT" && os_version > 60,
        iswin7orupper: os.type == "Windows_NT" && os_version > 61,
        iswin8orupper: os.type == "Windows_NT" && os_version > 62,
        iswin10orupper: os.type == "Windows_NT" && os_version > 100,
        isarm: os.arch() == "arm"
    },
    app: {
        appinstid: uuid(),
        appname: app.getName(),
        appversion: "0.0.1",
        apptype: "terminal",    //"application"
        feturemac: os.type() == "Linux" ? getFetureMacAddress2() : getFetureMacAddress(),
        // feturemac: '00-11-22-33-44-55',
        config: (()=>{
            let file = path.join(app_data_dir, "config", app.getName() + ".conf");

            try{
                let data = fs.readFileSync(file);

                if(!data)
                {
                    return {
                        debug: false
                    }
                }
                else
                    return JSON.parse(data);
            }
            catch(e)
            {
                console.error("should not run into ... here", e);
                return {
                    debug: false
                }
            }
        })(),
        configdir: path.join(app_data_dir, "config"),
        configfile: path.join(app_data_dir, "config", app.getName() + ".conf"),
        databasefile: path.join(app_data_dir, "database", "sqlite.db"),
        logdir: path.join(app_data_dir, "log"),
        logfile: (()=>{
            let date = new Date();
            let logfile = path.join(app_data_dir, "log", date.getFullYear().toString() +
                packInt((date.getMonth() + 1).toString(),2) +
                packInt(date.getDate().toString(),2) +
                // packInt(date.getHours().toString(),2) +
                // packInt(date.getMinutes().toString(),2) +
                // packInt(date.getSeconds().toString(),2) +
                // packInt(date.getMilliseconds().toString(),3) +
                ".log")
            return logfile;
        })(),
    },
    opt: {
        get_network_interface: filterValidInterfaces,
    }
}

AppConfig.app.isteminal = AppConfig.app.apptype == "terminal";


function print_help()
{
    console.info(`usage : ${process.argv0} ${process.argv[1]} [options]
    options is one of :
        -d, --debug         run in debug mode (This option will override the debug option comes from config file);
        -r, --release       run in release mode;
        -h, --help          show help information only;
    `)
}

function parse_debug()
{
    for(let i=2;i<process.argv.length;i++){
        switch(process.argv[i])
        {
            case "-d":
            case "--debug":
                AppConfig.app.config.debug = true
                break;
            case "-r":
            case "--release":
                AppConfig.app.config.debug = false
                break;
            case "-h":
            case "--help":
                print_help()
                process.exit(0)
                break;
        }
    }
}

parse_debug()

function print_figlet()
{
    console.info(`
**********************************************************************
**********************************************************************
        ..######..##.......####.########.##....##.########
        .##....##.##........##..##.......###...##....##...
        .##.......##........##..##.......####..##....##...
        .##.......##........##..######...##.##.##....##...
        .##.......##........##..##.......##..####....##...
        .##....##.##........##..##.......##...###....##...
        ..######..########.####.########.##....##....##...
**********************************************************************
**********************************************************************
`)
}

print_figlet()

function getAppConfig()
{
    return AppConfig;
}

function setConfig(key, value)
{
    AppConfig.app.config[key] = value;
    fs.writeFile(AppConfig.app.configfile, JSON.stringify(AppConfig.app.config));
}

function getConfig(key)
{
    return AppConfig.app.config[key];
}

module.exports = {
    AppConfig: AppConfig,
    getAppConfig: getAppConfig,
    setConfig: setConfig,
    getConfig: getConfig
};
