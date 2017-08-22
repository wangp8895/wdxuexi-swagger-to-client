'use strict'

const annoTemplateHead = '/**\n * %s\n * %s\n * Created by codegen-auto on %s\n'
const annoTemplateParam = ' * @param %s %s\n'
const codeTemplateHead = 'data class %s (var _id:Long = 0'
const util = require('util')
const sd = require('silly-datetime')
module.exports.getFilename = function (entityName) {
    return entityName + ".kt"
}

module.exports.getCode = function (entityName, entitiesJSON) {
    var entityJSON = entitiesJSON[entityName]
    var code = util.format(codeTemplateHead, entityName)
    var annotation = util.format(annoTemplateHead,
        entityJSON.title ? entityJSON.title + " " + entityName : entityName,
        entityJSON.description ? entityJSON.description : "", sd.format(new Date(), 'YYYY/MM/DD'))
    for (var property in entityJSON.properties) {
        var propertyJSON = entityJSON.properties[property]
        var paramCode = getParamCode(property, propertyJSON)
        annotation += util.format(annoTemplateParam, property, paramCode[2] ? entitiesJSON[paramCode[1]].title : propertyJSON.title)
        code += paramCode[0]
    }
    code += ")"
    annotation += " */\n"
    return annotation + code
}

function getParamCode(property, propertyJSON) {
    var template = ',\n     var %s:%s%s'
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
                varType += "Any>"
            }
            varInit = "? = null"
            break
        default:
            if (propertyJSON['$ref']) {
                varType = propertyJSON['$ref'].split('/')[2]
            } else {
                varType = Any
            }
            varInit = "? = null"
            isOject = true
            break
    }
    return [util.format(template, property, varType, varInit), varType, isOject]
}

