'use strict'

const util = require('util')
const commonUtils = require('../CommonUtils')
const parseEntity = require('./ParseEntity')
var outputDir1
var packageStr1
/**
 * 开放  生成api
 */
module.exports.makeAPI = function (swaggerJSON, outputDir, packageStr) {
    outputDir1 = outputDir
    packageStr1 = packageStr
    makeApiFile(swaggerJSON)
}
/**
 * 生成api文件
 * @param {JSON} swaggerJSON swagger文档JSON对象
 */
function makeApiFile(swaggerJSON) {
    var pack = getApiPackAndImport() + getApiCode(swaggerJSON)
    commonUtils.writeFile(outputDir1, 'DefaultApi.kt', pack)
    writeEnvelopFile()
}

/**
 * 拼接 import/package 
 */
function getApiPackAndImport() {
    var pack = util.format('package %s\n\n', packageStr1)
    var impt = util.format('import %s.%s.*\n', packageStr1, commonUtils.entityDir)
    impt += 'import io.reactivex.Observable\n'
    impt += 'import okhttp3.MultipartBody\nimport okhttp3.RequestBody\n'
    impt += 'import retrofit2.http.*\n\n'

    return pack + impt
}

/**
 * 拼接 注释及代码
 * @param {JSON} swaggerJSON 
 */
function getApiCode(swaggerJSON) {
    //生成 version title 说明注释
    var anno = util.format('/**\n * apiVersion:%s\n * %s\n * %s\n * Created by codegen-auto on %s\n */\n',
        swaggerJSON.info.version, swaggerJSON.info.title, swaggerJSON.info.description ? swaggerJSON.info.description : "", commonUtils.getDateNow())
    //生成 类定义 api地址的static变量
    var code = util.format('interface DefaultApi{\n    companion object {\n        val base_path = "%s"\n   }',
        swaggerJSON.schemes[0] + "://" + swaggerJSON.host + (swaggerJSON.basePath.endsWith('/') ? swaggerJSON.basePath : swaggerJSON.basePath + "/"))
    code += getApiFunCode(swaggerJSON)
    return anno + code
}

/**
 * 生成api方法
 * @param {JSON} swaggerJSON 
 */
function getApiFunCode(swaggerJSON) {
    var totalCode = ''
    //遍历path集合
    for (var path in swaggerJSON.paths) {
        //每个path中http方法集合
        for (var method in swaggerJSON.paths[path]) {
            if (method === 'parameters') continue;
            //获取方法JSON对象
            var funJSON = swaggerJSON.paths[path][method]
            //拼接方法注释，生成 标题/说明
            var annotation = util.format('\n\n   /**\n    * %s\n    * %s\n', funJSON.summary, funJSON.description ? funJSON.description : "")
            //拼接retrofit http方法注解
            var code = util.format('   @%s("%s")\n', method.toUpperCase(), path.substring(1))
            //构建方法名
            var funName = commonUtils.buildFunName(path, method)
            //拼接方法名
            code += util.format('   fun %s(', funName)
            console.log(code);
            //如果有安全验证，则作为方法参数放入，目前只支持apikey方式  oauth2待研究
            if (funJSON.security) {
                for (var securityJSON of funJSON.security) {
                    for (var securityName in securityJSON) {
                        var securityDefinitionJSON = swaggerJSON.securityDefinitions[securityName]
                        annotation += util.format('    * @param %s %s\n', commonUtils.buildParamName(securityDefinitionJSON.name), securityDefinitionJSON.description ? securityDefinitionJSON.description : '')
                        code += code.endsWith('(') ? '' : '\n       '
                        code += getParamCode(securityDefinitionJSON, true, funName)
                        //只获取第1个
                        break
                    }
                }
            }
            //如果有方法参数 遍历 
            if (funJSON.parameters) {
                for (var parameterJSON of funJSON.parameters) {
                    //如果参数是ref到公共参数 则取公共参数JSON 如分页参数
                    if (parameterJSON.$ref) {
                        var refList = parameterJSON.$ref.split('/')
                        parameterJSON = swaggerJSON[refList[1]][refList[2]]

                    }
                    //添加参数注释说明
                    annotation += util.format('    * @param %s %s\n', commonUtils.buildParamName(parameterJSON.name), parameterJSON.description ? parameterJSON.description : '')
                    //添加参数代码 
                    code += code.endsWith('(') ? '' : '\n       '
                    code += getParamCode(parameterJSON, false, funName)
                }
                //方法参数代码结束
                code = code.substring(0, code.length - 1)
            }

            code += ')'
            //方法返回类型构建  基于Rxjava的Observable
            if (funJSON.responses['200']) {
                code += ': Observable'
                //只提取成功的，错误直接apiError
                if (funJSON.responses['200'].schema) {
                    var schema = funJSON.responses['200'].schema
                    var genStr = null
                    if (schema.$ref) {
                        genStr = schema.$ref.split('/')[2]
                    } else {
                        if (schema.type === 'array') {
                            genStr = 'List<'
                            var items = schema.items
                            if (items['$ref']) {
                                genStr += items['$ref'].split('/')[2] + '>'
                            } else {
                                var name = commonUtils.stringFirst2UpperCase(funName) + 'Response'
                                genStr += name + '>'
                                parseEntity.makeEntityFile(name, items, outputDir1, packageStr1)
                            }

                        } else if (schema.type === 'object') {
                            if (schema.properties.pagination) {
                                genStr = 'ListResponse'
                                if (schema.properties.data) {
                                    var name
                                    if (schema.properties.data.items.$ref) {
                                        name = schema.properties.data.items['$ref'].split('/')[2]
                                    } else {
                                        name = commonUtils.stringFirst2UpperCase(funName) + 'Response'
                                        parseEntity.makeEntityFile(name, schema.properties.data, outputDir1, packageStr1)
                                    }
                                    genStr += util.format('<%s>', name)
                                } else {
                                    genStr += '<Any>'
                                }
                            } else {
                                genStr = commonUtils.stringFirst2UpperCase(funName) + 'Response'
                                parseEntity.makeEntityFile(genStr, schema, outputDir1, packageStr1)
                            }
                        }
                    }
                    code += util.format('<%s>', genStr)
                    annotation += util.format('    * @return %s %s\n', 'success返回', genStr)
                } else {
                    code += '<Any>'
                    annotation += util.format('    * @return %s \n', 'success代表请求成功')
                }
            }
            annotation += '    */\n'

            totalCode += annotation + code
        }
        // break
    }
    return totalCode + '\n}'
}

/**
 * 
 * 生成参数代码
 * @param {JSON} parameterJSON 参数JSON对象
 * @param {*} isSecurity 是否是安全验证调用的
 * @param {*} funName 方法名称，方便对应非$ref object类名定义及生成 
 */
function getParamCode(parameterJSON, isSecurity, funName) {
    var template = '@%s%s %s,'
    var paramIn, paramInName, paramNameAndType

    paramIn = commonUtils.stringFirst2UpperCase(parameterJSON.in)

    //对应不同传入类型方式，生成各注解
    switch (parameterJSON.in) {
        case 'header':
        case 'query':
            paramInName = util.format('("%s")', parameterJSON.name)
            break
        case 'path':
            paramInName = util.format('("%s", encoded = true)', parameterJSON.name)
            break
        case 'body':
            paramInName = ""
            break
        case 'formData':
            paramInName = util.format('("%s")', parameterJSON.name)
            paramIn = 'Part'
            break
    }
    //生成参数对应kotlin类型
    paramNameAndType = commonUtils.buildParamName(parameterJSON.name) + ": "
    if (parameterJSON.type) {
        //formdata对应okhttp3 string及file
        if (parameterJSON.in === 'formData') {
            if (parameterJSON.type === 'file') {
                paramNameAndType += 'MultipartBody.Part'
            } else {
                paramNameAndType += 'RequestBody'
            }
        } else {
            //参数类型映射
            switch (parameterJSON.type) {
                case 'string':
                    paramNameAndType += "String"
                    break
                case 'integer':
                    if (parameterJSON.format === 'int64')
                        paramNameAndType += "Long"
                    else
                        paramNameAndType += "Int"
                    break
                case 'boolean':
                    paramNameAndType += "Boolean"
                    break
                case 'number':
                    paramNameAndType += "Float"
                    break
                default:
                    paramNameAndType += "String"
                    break
            }
        }
        //如果参数对应的是个object
    } else if (parameterJSON.schema) {
        //如果是引用definitions 则获取object名 否则继续解析
        if (parameterJSON.schema.$ref) {
            paramNameAndType += parameterJSON.schema.$ref.split('/')[2]
        } else {
            //如果是个集合
            if (parameterJSON.schema.type === 'array') {
                //对应kotlin List
                paramNameAndType += 'List<'
                var items = parameterJSON.schema.items
                if (items['$ref']) {
                    //如果是引用definitions 则直接获取对象名
                    paramNameAndType += items['$ref'].split('/')[2] + '>'
                } else {
                    //如果不是 则组合一个唯一的对象名，并创建类文件 
                    var name = commonUtils.stringFirst2UpperCase(funName) + commonUtils.stringFirst2UpperCase(parameterJSON.name)
                    paramNameAndType += name + '>'
                    parseEntity.makeEntityFile(name, items, outputDir1, packageStr1)
                }
            } else {
                //如果是一个对象 同上
                var name = commonUtils.stringFirst2UpperCase(funName) + commonUtils.stringFirst2UpperCase(parameterJSON.name)
                paramNameAndType += name
                parseEntity.makeEntityFile(name, parameterJSON.schema, outputDir1, packageStr1)
            }
        }

    }
    //确定参数可不可以为空
    if (isSecurity || parameterJSON.required || parameterJSON.required === true) {
    } else {
        paramNameAndType += '?'
    }
    return util.format(template, paramIn, paramInName, paramNameAndType)
}

function writeEnvelopFile() {
    var code = util.format('package %s.%s\n', packageStr1, commonUtils.entityDir)
    code += util.format('import %s.%s.*\n', packageStr1, commonUtils.entityDir)
    code += util.format('/**\n * 分页响应数据实体类，包含分页信息及业务列表\n * Created by codegen-auto on %s\n * @param pagination 分页信息\n * @param data 数据列表\n */\n',
        commonUtils.getDateNow())
    code += 'data class ListResponse<E>(var pagination: Pagination?, var data: List<E>?)'
    commonUtils.writeFile(outputDir1 + "/" + commonUtils.entityDir, "ListResponse.kt", code)
}

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1
}

