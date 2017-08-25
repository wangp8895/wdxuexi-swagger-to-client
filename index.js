'use strict'

var fs = require('fs')
var path = require('path')
var jsyaml = require('js-yaml')
var program = require('commander')
var makefile = require('./makefile.js')
const commonUtils = require('./CommonUtils')
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
    .option('-p --package [value]', '包名')
    .on('--help', function () {
        console.log('')
        console.log('   示例：')
        console.log('   npm start -- all -i [yaml/json file] -o [outputdir] -l android')
        console.log('   生成android-kotlin所有实体类及接口')
        console.log('   npm start -- -e [entityName1],[entityName2],... -i [yaml/json file] -o [outputdir] -l android')
        console.log('   生成android-kotlin相应实体类')
    })
    .parse(process.argv)

//没有指定参数则提示    
if (process.argv.length <= 2) {
    console.error('未指定任何参数，`-h` 获取更多帮助！')
    process.exit(0)
}

//没有指定swagger文档路径，则提示
if (!program.inputfile) {
    console.error('未指定输入文档路径！，`-i [yaml/json file]` 指定输入文档路径')
    process.exit(0)
}


var inputFile = program.inputfile
var outputDir = program.outputdir
//如果没有指定输出路径，定义一个默认的输出路径
if (!outputDir) {
    outputDir = path.join(__dirname, "output")
}

//没有指定包名，定义一个默认
var packageStr = program.package
if (!packageStr) {
    packageStr = "com.wunding.wdxuexi.api"
}

if (outputDir.endsWith('/')) {
    outputDir += packageStr.split('.').join('/')
} else {
    outputDir += "/" + packageStr.split('.').join('/')
}

var language = program.language
if (!language) {
    language = 'android'
}

var swaggerJSON = null

if (inputFile.endsWith('.json')) {
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

if (language === 'android') {
} else {
    console.error('不支持的语言，退出')
    process.exit(0)
}

commonUtils.mkdirsSync(outputDir)
commonUtils.mkdirsSync(outputDir + "/" + commonUtils.entityDir)


if (program.all) {
    console.log('生成所有实体类')
    makefile.makeEntities(swaggerJSON.definitions, null, language, outputDir, packageStr)
    makefile.makeAPI(swaggerJSON, language, outputDir, packageStr)
} else {
    if (program.entitylist) {
        console.log('开始生成相应实体类%s', program.entitylist)
        makefile.makeEntities(swaggerJSON.definitions, program.entitylist, language, outputDir, packageStr)
    }
    if (program.api) {
        console.log('开始生成api。。。')
        makefile.makeAPI(swaggerJSON, language, outputDir, packageStr)
    }
}


String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1
}
// String.prototype.replaceAll = function (search, replacement) {
//     var target = this
//     return target.split(search).join(replacement)
// }