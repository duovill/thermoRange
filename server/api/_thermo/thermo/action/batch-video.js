const mongoose = require('mongoose')
const tmp = require('tmp-promise')
const fs = require('fs').promises
const fsNative = require('fs')
const utils = require('corifeus-utils')
const fsExtra = require('fs-extra')

const request = async(req, res) => {
    const { path, cleanup} = await tmp.dir();
    try {
        //console.warn('batch-video', req.params.batchId)
        const ThermoRangeBatchFrames = mongoose.model('ThermoRangeBatchFrames');
        const frames = await ThermoRangeBatchFrames.find({
            type: 'jpeg',
            batchId: req.params.batchId
        })
            .populate(['batchId'])
            .sort({
                frameIndex: 1
            })
            .exec()
        console.log('frames', frames.length, path)
        for(let frame of frames) {
            await fs.writeFile(`${path}/${frame.frameIndex}.jpeg`, frame.data)
            console.log('frame', frame.frameIndex)
        }
        await utils.childProcess.exec(`ffmpeg -framerate 9 -i "%d.jpeg" -c:v libx264 -pix_fmt yuv420p -crf 23 output.mp4`, {
            display: true,
            cwd: path
        })

        const binary = await fs.readFile(`${path}/output.mp4`, {
            encoding: 'base64'
        })
        var stream = require('stream');
        var fileContents = Buffer.from(binary, "base64");

        var readStream = new stream.PassThrough();
        readStream.end(fileContents);

        res.set('Content-disposition', 'attachment; filename=thermo-range-batch.mp4');
        res.set('Content-Type', 'video/mp4');

        readStream.pipe(res);

        res.on('finish', async () => {
            try {
                await fsExtra.remove(path)
            } catch(e) {
                console.error(e)
            }
        });

    } catch(e) {
        global.ngivr.handleError(res, e)
    }
}

module.exports = request;
