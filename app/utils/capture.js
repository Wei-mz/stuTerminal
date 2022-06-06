const fs = require('fs');

function capture(win, quality, file, cb)
{
    win.capturePage((image)=>{
        let jpg = image.toJPEG(quality);
        fs.writeFile(file, jpg, {
            encoding: null
        }, (err)=>{
            if(cb)
                cb(err)
        })
    });
}

module.exports = {
    capture,
}