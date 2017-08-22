'use strict'

var fs = require('fs')
var path = require('path')
var jsyaml = require('js-yaml')
var program = require('commander')
var makefile = require('./makefile.js')
/**
 * 分离 -o 命令参数成实体类名称列表
 * @param {*} val 
 */
function objectList(val) {
    return val.split(',')
}

//设置命令行参数 依赖commander
program.version('1.0.0')
    .usage('[options] [value ...]')
    .option('-e --entitylist <items>', '需要生成实体类列表', objectList)
    .option('-l --language [value]', '生成语言，默认android')
    .option('-i --inputfile [value]', '输入文档路径，支持.json .yaml')
    .option('-o --outputdir [value]', '输出目录')
    .option('all --all', '生成所有实体类+接口')
    .option('-a --api', '生成接口 接口名称DefaultApi')
    .on('--help', function () {
        console.log('')
        console.log('   示例：')
        console.log('   npm start -- all -i [yaml/json file] -o [outputdir] -l android')
        console.log('   生成android-kotlin所有实体类及接口')
        console.log('   npm start -- -e [entityName1],[entityName2],... -i [yaml/json file] -o [outputdir] -l android')
        console.log('   生成android-kotlin相应实体类')
    })
    .parse(process.argv)

if (process.argv.length <= 2) {
    console.error('未指定任何参数，`-h` 获取更多帮助！')
    process.exit(0)
}

if (!program.inputfile) {
    console.error('未指定输入文档路径！，`-i [yaml/json file]` 指定输入文档路径')
    process.exit(0)
}

var inputFile = program.inputfile
var outputDir = program.outputdir
if (!outputDir) {
    outputDir = path.join(__dirname, "output")
}
var language = program.language
if (!language) {
    language = 'android'
}

var swaggerJSON = null

if (inputFile.indexOf('.json') >= 0) {
    swaggerJSON = require(inputFile)
} else {
    var spec = fs.readFileSync(inputFile, 'utf-8')
    try {
        swaggerJSON = JSON.parse(JSON.stringify(jsyaml.safeLoad(spec), null, 4))
    } catch (e) {
        console.error('读取yaml文档失败，请检查文件路径')
        process.exit(0)
    }
}



if (program.all) {
    console.log('生成所有')
    makefile.makeAll(swaggerJSON, language, outputDir)
}

