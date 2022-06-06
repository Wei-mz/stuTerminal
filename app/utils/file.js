/**
 * @Author: yinshi <root>
 * @Date:   2017-03-06T19:02:44+08:00
 * @Email:  569536805@qq.com
* @Last modified by:   root
* @Last modified time: 2017-03-30T10:41:37+08:00
 */



const fs = require('fs');
const util = require('util');

let fd = -1;

function readFile(cb, file) {
    fs.stat(file, (e, stats) => {
        if (e) {
            cb(e);
            return;
        }
        let time = stats.mtime.getTime();
        fd = fs.readFile(file, (err, data) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, {
                time,
                data
            })
        });
        console.log('ss!!!!!!!!!!!!!!!')
        console.log(fd)
    })
}

function closeFile(cb) {
    if (parseInt(fd) > 0) {
        console.log("file closeFile");
        fs.close(fd, null);
    }
}

module.exports = {
    readFile,
    closeFile
}
