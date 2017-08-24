'use strict'

const annoTemplateHead = '/**\n * %s\n * %s\n * Created by codegen-auto on %s\n'
const annoTemplateParam = ' * @param %s %s %s\n'
const codeTemplateHead = 'data class %s('
const util = require('util')
const commomUtil = require('../CommonUtils')

var entitiesJSON1 = null
var outputDir1 = null
var packageStr1 = null
module.exports.makeEntityFiles = function (outputDir, entitiesJSON, list, packageStr) {
    entitiesJSON1 = entitiesJSON
    outputDir1 = outputDir + "/" + commomUtil.entityDir
    packageStr1 = packageStr
    if (list) {
        for (var entityName of list) {
            makeEntityFile(entityName, entitiesJSON[entityName])
        }
    } else {
        for (var entityName in entitiesJSON) {
            makeEntityFile(entityName, entitiesJSON[entityName])
        }
    }
}
module.exports.makeEntityFile = function (entityName, entityJSON, outputDir, packageStr) {
    outputDir1 = outputDir + "/" + commomUtil.entityDir
    packageStr1 = packageStr
    makeEntityFile(entityName, entityJSON)
}

function makeEntityFile(entityName, entityJSON) {
    if (entityJSON) {
        console.log('实体类[%s]存在，开始解析实体类', entityName)
        var code, filename
        filename = getFilename(entityName)
        code = getCode(entityName, entityJSON)
        console.log('实体类[%s]解析完成，开始写入文件[%s]', entityName, filename)
        commomUtil.writeFile(outputDir1, filename, code)
    } else {
        console.log('实体类[%s]未找到，未能生成文件', entityName)
    }
}

function getFilename(entityName) {
    return entityName + ".kt"
}

function getCode(entityName, entityJSON) {
    var code = util.format(codeTemplateHead, entityName)
    var annotation = util.format(annoTemplateHead,
        entityJSON.title ? entityJSON.title + " " + entityName : entityName,
        entityJSON.description ? entityJSON.description : "", commomUtil.getDateNow())
    var spaceStr = ''
    for (var i = 0; i < code.length; i++) {
        spaceStr += ' '
    }
    for (var property in entityJSON.properties) {
        code += code.endsWith('(') ? '' : ('\n' + spaceStr)
        var propertyJSON = entityJSON.properties[property]
        var paramCode = getParamCode(property, propertyJSON, entityName)
        var description = paramCode[2] ? entitiesJSON1[paramCode[1]].description : propertyJSON.description
        annotation += util.format(annoTemplateParam, property, paramCode[2] ? entitiesJSON1[paramCode[1]].title : propertyJSON.title, description ? description : '')
        code += paramCode[0]
    }
    code = code.substring(0, code.length - 1)
    code += ")"
    annotation += " */\n"
    return util.format('package %s.%s\n\n', packageStr1, commomUtil.entityDir) + annotation + code
}

function getParamCode(property, propertyJSON, entityName) {
    var template = 'var %s:%s%s,'
    var varType, varInit, isOject = false
    switch (propertyJSON.type) {
        case 'string':
            varType = "String"
            varInit = "? = null"
            break
        case 'integer':
            if (propertyJSON.format === 'int64')
                varType = "Long"
            else
                varType = "Int"
            varInit = " = 0"
            break
        case 'boolean':
            varType = "Boolean"
            varInit = " = false"
            break
        case 'number':
            varType = "Float"
            varInit = " = 0f"
            break
        case 'array':
            varType = "List<"
            var items = propertyJSON.items
            if (items['$ref']) {
                varType += items['$ref'].split('/')[2] + ">"
            } else {
                var name = entityName + commomUtil.stringFirst2UpperCase(property)
                varType += name + ">"
                makeEntityFile(name, items)
            }
            varInit = "? = null"
            break
        default:
            if (propertyJSON['$ref']) {
                varType = propertyJSON['$ref'].split('/')[2]
                isOject = true
            } else {
                varType = entityName + commomUtil.stringFirst2UpperCase(property)
                makeEntityFile(varType, propertyJSON)
            }
            varInit = "? = null"
            break
    }
    return [util.format(template, property, varType, varInit), varType, isOject]
}

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1
}