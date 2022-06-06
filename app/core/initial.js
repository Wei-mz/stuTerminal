require('./wsserver-handler')
const path = require('path')
const { AppConfig } = require('./config')
const { quitByError } = require('../utils/util')

function checkFeture()
{
    if(!AppConfig.app.feturemac)
    {
        quitByError("没有有效的网卡设备!!!")
    }
}

checkFeture();
