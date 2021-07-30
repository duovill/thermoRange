const templateInstance = require('../lib/template-instance');

global.ngivr.queue('template-instance', async (job) => {

    const type = job.data.type;
    const template = job.data.params.template;
    const id = job.data.params.id;
    const requestId = job.data.requestId

    try {
        const doc = await templateInstance.lib(type, template, id);

        global.ngivr.socketio.emit('bull-queue-template-instance', {
            status: 'ok',
            doc: doc,
            instanceCount: doc.instanceCount,
            requestId: requestId
        });

    } catch (e) {

        global.ngivr.socketio.emit('bull-queue-template-instance', {
            status: 'error',
            error: e,
            requestId: requestId
        });


    }

})
