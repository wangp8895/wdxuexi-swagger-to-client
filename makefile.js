'use strict'

var fs = require('fs')
var parseEntity = null

module.exports.makeAll = function (swaggerJSON, language, outputDir) {

    if (language === 'android') {
        parseEntity = require('./kotlin/parse-entity.js')
    }

    initOutputDir(outputDir)
    var entitiesJSON = swaggerJSON.definitions
    for (var entityName in entitiesJSON) {
        makeEntityFile(entityName, language, outputDir, entitiesJSON)
    }
}

function makeEntityFile(entityName, language, outputDir, entitiesJSON) {
    var entityJSON = entitiesJSON[entityName]
    if (entityJSON) {
        console.log('实体类[%s]存在，开始解析实体类', entityName)
        var code, filename
        if (language === 'android') {
            filename = parseEntity.getFilename(entityName)
            code = parseEntity.getCode(entityName, entitiesJSON)
        }
        console.log('实体类[%s]解析完成，开始写入文件[%s]', entityName, filename)
        fs.open(outputDir + '/' + filename, 'w', function (e, fd) {
            if (e) {
                console.log('文件[%s]创建失败', filename)
                return
            }
            fs.write(fd, code, 0, 'utf-8', function (e) {
                if (e) {
                    console.log('文件[%s]写入失败', filename)
                    return
                }
                fs.close(fd)
                console.log('文件[%s]写入成功', filename)
            })
        })
    } else {
        console.log('实体类[%s]未找到，未能生成文件', entityName)
    }
}

function initOutputDir(outputDir) {
    deleteFolderRecursive(outputDir)
    fs.mkdirSync(outputDir)
}
/**
 * 删除目录
 * @param {*循环} path 
 */
var deleteFolderRecursive = function (path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};