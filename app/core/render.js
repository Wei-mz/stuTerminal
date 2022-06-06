/**
 * Created by uforgetmenot on 17/2/9.
 */

function onJsxNativeReady()
{
    require('./initial');
}

function onRenderInited() {
    console.info("render init");
}

function onRenderLoaded() {
    console.info("render load");
}


module.exports = {
    onRenderInited,
    onRenderLoaded,
    onJsxNativeReady
}