'use strict'

const util = require('util')
const commonUtils = require('../CommonUtils')
const parseEntity = require('./ParseEntity')
var outputDir1
var packageStr1
module.exports.makeAPI = function (swaggerJSON, outputDir, packageStr) {
    outputDir1 = outputDir
    packageStr1 = packageStr
    makeApiFile(swaggerJSON)
}

function makeApiFile(swaggerJSON) {
    var pack = getApiPackAndImport() + getApiCode(swaggerJSON)
    commonUtils.writeFile(outputDir1, 'DefaultApi.kt', pack)
    writeEnvelopFile()
}

function getApiPackAndImport() {
    var pack = util.format('package %s\n\n', packageStr1)
    var impt = util.format('import %s.%s.*\n', packageStr1, commonUtils.entityDir)
    impt += 'import io.reactivex.Observable\n'
    impt += 'import okhttp3.MultipartBody\nimport okhttp3.RequestBody\n'
    impt += 'import retrofit2.http.*\n\n'

    return pack + impt
}

function getApiCode(swaggerJSON) {
    var anno = util.format('/**\n * apiVersion:%s\n * %s\n * %s\n * Created by codegen-auto on %s\n */\n',
        swaggerJSON.info.version, swaggerJSON.info.title, swaggerJSON.info.description ? swaggerJSON.info.description : "", commonUtils.getDateNow())
    var code = util.format('interface DefaultApi{\n    companion object {\n        val base_path = "%s"\n   }',
        swaggerJSON.schemes[0] + "://" + swaggerJSON.host + (swaggerJSON.basePath.endsWith('/') ? swaggerJSON.basePath : swaggerJSON.basePath + "/"))
    code += getApiFunCode(swaggerJSON)
    return anno + code
}

function getApiFunCode(swaggerJSON) {
    var totalCode = ''
    for (var path in swaggerJSON.paths) {
        // path = '/exams/{exam-id}/test-questions'
        for (var method in swaggerJSON.paths[path]) {
            var funJSON = swaggerJSON.paths[path][method]
            var annotation = util.format('\n\n   /**\n    * %s\n    * %s\n', funJSON.summary, funJSON.description ? funJSON.description : "")
            var code = util.format('   @%s("%s")\n', method.toUpperCase(), path.substring(1))
            var funName = commonUtils.buildFunName(path, method)
            code += util.format('   fun %s(', funName)
            if (funJSON.security) {
                for (var securityJSON of funJSON.security) {
                    for (var securityName in securityJSON) {
                        var securityDefinitionJSON = swaggerJSON.securityDefinitions[securityName]
                        annotation += util.format('    * @param %s %s\n', commonUtils.buildParamName(securityDefinitionJSON.name), securityDefinitionJSON.description)
                        code += code.endsWith('(') ? '' : '\n       '
                        code += getParamCode(securityDefinitionJSON, true, funName)
                        //只获取第1个
                        break
                    }
                }
            }
            if (funJSON.parameters) {
                for (var parameterJSON of funJSON.parameters) {
                    if (parameterJSON.$ref) {
                        var refList = parameterJSON.$ref.split('/')
                        parameterJSON = swaggerJSON[refList[1]][refList[2]]

                    }
                    annotation += util.format('    * @param %s %s\n', parameterJSON.name, parameterJSON.description)
                    code += code.endsWith('(') ? '' : '\n       '
                    code += getParamCode(parameterJSON, false, funName)

                }
            }
            code = code.substring(0, code.length - 1)
            code += ')'

            if (funJSON.responses['200']) {
                code += ': Observable'
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


function getParamCode(parameterJSON, isSecurity, funName) {
    var template = '@%s%s %s,'
    var paramIn, paramInName, paramNameAndType

    paramIn = commonUtils.stringFirst2UpperCase(parameterJSON.in)

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
    paramNameAndType = commonUtils.buildParamName(parameterJSON.name) + ": "
    if (parameterJSON.type) {
        if (parameterJSON.in === 'formData') {
            if (parameterJSON.type === 'file') {
                paramNameAndType += 'MultipartBody.Part'
            } else {
                paramNameAndType += 'RequestBody'
            }
        } else {
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
    } else if (parameterJSON.schema) {
        if (parameterJSON.schema.$ref) {
            paramNameAndType += parameterJSON.schema.$ref.split('/')[2]
        } else {
            if (parameterJSON.schema.type === 'array') {
                paramNameAndType += 'List<'
                var items = parameterJSON.schema.items
                if (items['$ref']) {
                    paramNameAndType += items['$ref'].split('/')[2] + '>'
                } else {
                    var name = commonUtils.stringFirst2UpperCase(funName) + commonUtils.stringFirst2UpperCase(parameterJSON.name)
                    paramNameAndType += name + '>'
                    parseEntity.makeEntityFile(name, items, outputDir1, packageStr1)
                }
            } else {
                var name = commonUtils.stringFirst2UpperCase(funName) + commonUtils.stringFirst2UpperCase(parameterJSON.name)
                paramNameAndType += name
                parseEntity.makeEntityFile(name, parameterJSON.schema, outputDir1, packageStr1)
            }
        }

    }
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

