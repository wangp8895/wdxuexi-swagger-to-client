'use strict'

const fs = require('fs')
const path = require('path')
const sd = require('silly-datetime')
const entityDir = "entity"

module.exports.entityDir = entityDir

module.exports.writeFile = function (outputDir, filename, code) {
    fs.open(outputDir + '/' + filename, 'w', function (e, fd) {
        if (e) {
            console.log('文件[%s]创建失败，原因[%s]', filename, e)
            return
        }
        fs.write(fd, code, 0, 'utf-8', function (e) {
            if (e) {
                console.log('文件[%s]写入失败，原因[%s]', filename, e)
                return
            }
            fs.close(fd)
            console.log('文件[%s]写入成功', filename)
        })
    })
}



module.exports.mkdirsSync = mkdirsSync

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname)
            return true
        }
    }
}

module.exports.getDateNow = function () {
    return sd.format(new Date(), 'YYYY/MM/DD')
}

module.exports.stringFirst2UpperCase = stringFirst2UpperCase

function stringFirst2UpperCase(str) {
    return str.replace(/\b\w+\b/g, function (word) {
        return word.substring(0, 1).toUpperCase() + word.substring(1)
    })
}

module.exports.buildFunName = function (path, method) {
    var list = path.split('/')
    var funName = ''
    var reg = new RegExp("^{.*}$")

    for (var i in list) {
        var item = list[i]
        item = item.replace(/-/g, '')
        if (reg.exec(item)) {
            funName += ''
        } else {
            i == 1 ? (funName += item) : (funName += stringFirst2UpperCase(item))
        }
    }
    funName += method.toUpperCase()
    return funName
}
module.exports.buildParamName = function (paramName) {
    var list = paramName.replace(/-/g, '_').split('_')
    var funName = ""
    for (var i in list) {
        var item = list[i]
        funName += i == 0 ? item : stringFirst2UpperCase(item)
    }
    return funName
}