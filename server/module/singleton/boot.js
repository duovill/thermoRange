if (process.env.NGIVR_SERVER_COMMAND === 'singleton') {
    const fsExtra = require('fs-extra')
    const incomingPdfDir = require('./helper').incomingPdfDir()
    //console.warn('incoming invoice directories', incomingPdfDir.incoming, incomingPdfDir.archived)
    for(let incomingPdfDirItem of [incomingPdfDir.pdfIncoming, incomingPdfDir.pdfArchived, incomingPdfDir.pdfInvalid]) {
        /*
        try {
            fsExtra.emptydirSync(incomingPdfDirItem)
        } catch(e) {
            if (e.code !== 'EISDIR') {
                throw e;
            }
        }*/
        fsExtra.ensureDirSync(incomingPdfDirItem)
    }

}
