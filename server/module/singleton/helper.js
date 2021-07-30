let incomingPdfDirInstance
const incomingPdfDir = () => {
    if (incomingPdfDirInstance === undefined) {
        const repoRoot = ngivr.config.repoRoot
        incomingPdfDirInstance = {
            pdfIncoming: ngivr.config.incoming.dir.pdfIncoming.startsWith('/') ? ngivr.config.incoming.dir.pdfIncoming : repoRoot + '/' + ngivr.config.incoming.dir.pdfIncoming,
            pdfArchived: ngivr.config.incoming.dir.pdfArchived.startsWith('/') ? ngivr.config.incoming.dir.pdfArchived : repoRoot + '/' + ngivr.config.incoming.dir.pdfArchived,
            pdfInvalid: ngivr.config.incoming.dir.pdfInvalid.startsWith('/') ? ngivr.config.incoming.dir.pdfInvalid : repoRoot + '/' + ngivr.config.incoming.dir.pdfInvalid,
        }
    }
   // console.warn('incomingDir', incomingDirInstance)
    return incomingPdfDirInstance
}

module.exports.incomingPdfDir = incomingPdfDir
