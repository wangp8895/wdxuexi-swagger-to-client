/**
 * 公共工具类
 */
'use strict'

const fs = require('fs')
const path = require('path')
const sd = require('silly-datetime')
const entityDir = 'entity'

//entity实体类对应的dir
module.exports.entityDir = entityDir

/**
 * 创建并写入文件
 * @param outputDir 输出路径
 * @param filename 文件名
 * @param code 代码字符串
 */
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

/**
 * 递归创建多层级目录
 * @param {string} dirname 
 */
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

/**
 * 获取当前时间  并按'YYYY/MM/DD'输出
 */
module.exports.getDateNow = function () {
    return sd.format(new Date(), 'YYYY/MM/DD')
}

module.exports.stringFirst2UpperCase = stringFirst2UpperCase

/**
 * 第1个首字母大写
 * @param {string} str 
 */
function stringFirst2UpperCase(str) {
    return str.replace(/\b\w+\b/g, function (word) {
        return word.substring(0, 1).toUpperCase() + word.substring(1)
    })
}

/**
 * 拼接API 方法名 
 * 如 courses/{id}/coursewares GET
 * 则为 coursesIdCoursewaresGET
 */
module.exports.buildFunName = function (path, method) {
    var list = path.split('/')
    var funName = ''
    var reg = new RegExp("^{.*}$")

    for (var i in list) {
        var item = list[i]
        item = item.replace(/-/g, '')
        if (reg.exec(item)) {
            funName += stringFirst2UpperCase(item.substring(1, item.length - 1))
        } else {
            i == 1 ? (funName += item) : (funName += stringFirst2UpperCase(item))
        }
    }
    funName += method.toUpperCase()
    return funName
}
/**
 * api方法参数命名方式
 * @param paramName swagger文档中参数名称
 * 将'-'替换为'_'
 * 将'_'去掉 并首字母大写
 */
module.exports.buildParamName = function (paramName) {
    var list = paramName.replace(/-/g, '_').split('_')
    var funName = ""
    for (var i in list) {
        var item = list[i]
        funName += i == 0 ? item : stringFirst2UpperCase(item)
    }
    return funName
}