const os = require('os')
const path = require('path')
const utils = require('corifeus-utils')
const settings = ngivr.config.settings
const fs = require('fs').promises
const pdf2qrProcessorPrefix = 'pdf-2-qr-processor'

const convertProcess = `convert`
const zbarimgProcess  = `zbarimg`

const pdf2qrProcessor = async(options) => {

    const { input } = options
    const outputBasename = path.basename(input).replace(/\./g, '-') + '-' + utils.random.complexUuid() + '.png'
    const outputDir = path.dirname(input)
    const output = path.resolve(outputDir, outputBasename)

    console.info(pdf2qrProcessorPrefix, output)

    let deleteOutput = false
    try {
        const imagemagickOutput = await utils.childProcess.exec(`${convertProcess} -strip -density 300 ${input}[0] ${output}`)

        console.info(pdf2qrProcessorPrefix, 'imagemagickOutput', imagemagickOutput)

        deleteOutput = true
        const zbarimgOutput = await utils.childProcess.exec(`${zbarimgProcess} ${output}`)

        console.info(pdf2qrProcessorPrefix, 'zbarimgOutput', zbarimgOutput)

        const zbarPerfix = settings.qr.recognize.zbarPerfix
        const ngivrQrDivider = settings.qr.recognize.ngivrQrDivider
        const ngivrQrDividerName = settings.qr.recognize.ngivrQrDividerName
        const ngivrPrefix = settings.qr.recognize.ngivrPrefix
        const results = zbarimgOutput.stdout.split(os.EOL).filter(line => line.startsWith(zbarPerfix)).map(line => line.substring(zbarPerfix.length)).filter(line => line.startsWith(ngivrPrefix)).map(line => {
            const lines = line.split(ngivrQrDivider)
            lines.shift()
            const newLines = []
            for (let newLine of lines) {
                if (newLine.includes(ngivrQrDividerName)) {
                    newLine = newLine.split(ngivrQrDividerName)
                    newLine = newLine.map(newLineBuferred => {
                        const newLinesItemBuffer = Buffer.from(newLineBuferred, 'base64')
                        return newLinesItemBuffer.toString('utf8')
                    })
                } else {
                    newLine =  Buffer.from(newLine, 'base64').toString('utf8')
                }
                newLines.push(newLine)
            }

            return newLines
        })

        console.info(pdf2qrProcessorPrefix, zbarimgOutput.stderr.trim())
        console.info(pdf2qrProcessorPrefix, results)

        const resultObjectArray = []
        for(let resultArray of results) {
            let first = true
            const resultObject = {}
            for(let result of resultArray)
                if (first) {
                    first = false
                    resultObject.schema = result
                } else {
                    if (result[0].startsWith(resultObject.schema + '.')) {
                        resultObject[result[0].substring(resultObject.schema.length + 1)] = result[1]
                    }
                }
            resultObjectArray.push(resultObject)
        }

        console.info(pdf2qrProcessorPrefix, 'resultObjectArray', resultObjectArray)

        return resultObjectArray;
    } catch (e) {
        console.error(pdf2qrProcessorPrefix, e)
        throw e
    } finally {
        if (deleteOutput) {
            await fs.unlink(output)
        }
    }
}

module.exports.pdf2qrProcessor = pdf2qrProcessor
