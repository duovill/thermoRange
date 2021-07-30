const utils = require('corifeus-utils');

const lib = async (type, template, id) => {
  try {
    const templateInstanceModel = require('../../../model-socket-raw/template-instance.model')

    if (type === 'get' && id === 'undefined') {
      return {
        template: template,
        id: undefined,
        instanceCount: 0,
      }
    }

    const query = {
      template: template,
      id: id
    }

    let docWasNull = false;
    let doc = await templateInstanceModel.findOne(query)

    if (doc === null) {
      docWasNull = true;
      doc = await templateInstanceModel.create({
        template: template,
        id: id,
        instanceCount: 0,
      });
    }

    switch(type) {
      case 'increment':
        doc.instanceCount++;
        break;

      case 'decrease':
        doc.instanceCount--;
        if (doc.instanceCount < 0) {
          doc.instanceCount = 0;
        }
        break;

      case 'get':
        break;
    }

    if (type !== 'get' || docWasNull) {
      await doc.save();
    }
    return doc;
  } catch (e) {
    console.error(e);
    throw e
  }
}

module.exports.lib = lib;
