const { camelCase } = require('lodash')
const register = (socketio) => {

    socketio.on('connect', function (socket) {

        console.log(`socket ngivr-pdf-upload is initialized}`)

        socket.on('ngivr-pdf-upload', async (data) => {

            //let finalize
            try {
                const mongoose = require('mongoose')
                const PdfFileModel = mongoose.model('PdfFile')

                const pdfResult = Buffer.from(data.upload, 'base64');

                const pdfData = {
                    docId: data.doc._id,
                    docType: camelCase(data.docType),
                    buffer: pdfResult,
                    pdfTemplate: undefined,
                    pdfTemplateLabel: data.pdfTemplateLabel,
                    instanceCount: undefined,
                }
                const pdfFile = new PdfFileModel(pdfData)
                await pdfFile.save()
                socket.emit(data.uploadId, {
                    action: 'ok',
                })
            } catch (e) {
                socket.emit(data.uploadId, {
                    action: 'error',
                    error: e,
                })
            } finally {
            }
        })
    })
}

module.exports.register = register;
