/**
 * 中转，方便支持多种语言代码生成
 */
'use strict'

/**
 * 生成实体类方法
 * @param entitiesJSON 各实体类的JSON对象
 * @param list 需要生成的实体类的名称数组
 * @param language 生成语言
 * @param outputDir 输出路径
 * @param packageStr 代码包名字符串
 */
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

/**
 * 生成API方法
 * @param swaggerJSON swagger文档JSON对象
 * @param language 生成语言
 * @param outputDir 输出目录
 * @param packageStr 包名
 */
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
