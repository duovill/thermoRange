const PdfFileSchema = require('../schema/pdf-file');

module.exports.register = function(socket) {
    PdfFileSchema.post('save', async function (doc) {
        try {

            doc.buffer = undefined;
            socket.emit('pdfFile:save', doc);

            const mongoose = require('mongoose')
            const _ = require('lodash')
            const model = mongoose.model(_.pascalCase(doc.docType));
            const emitName = _.camelCase(doc.docType) + ':save'
            const pdfModelDoc = await model.findById(doc.docId).exec()
            //console.warn('save pdf', emitName,  doc.docType, doc.docId, pdfModelDoc )
            socket.emit(emitName, pdfModelDoc);

        } catch(e) {
            console.error('pdf file schema lekeres hiba', e)
        }

    });
    PdfFileSchema.post('remove', function (doc) {
        doc.buffer = undefined;
        socket.emit('pdfFile:remove', doc);
    });
};
