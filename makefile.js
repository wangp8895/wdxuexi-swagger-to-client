'use strict'

module.exports.makeEntities = function (entitiesJSON, list, language, outputDir, packageStr) {

    var parseEntity = null
    if (language === 'android') {
        parseEntity = require('./kotlin/ParseEntity')
    }

    if (parseEntity)
        parseEntity.makeEntityFiles(outputDir, entitiesJSON, list, packageStr)
    else {
        console.log('未找到相应处理类，生成实体类失败，退出！')
        process.exit(0)
    }
}

module.exports.makeAPI = function (swaggerJSON, language, outputDir, packageStr) {
    var parseApi = null
    if (language === 'android') {
        parseApi = require('./kotlin/ParseApi')
    }

    if (parseApi) {
        parseApi.makeAPI(swaggerJSON, outputDir, packageStr)
    } else {
        console.log('未找到相应处理类，生成实体类失败，退出！')
        process.exit(0)
    }

}
