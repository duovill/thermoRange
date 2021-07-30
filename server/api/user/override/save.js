const userCtrl = require('../user.controller');

module.exports = async (request, response) => {
    if (!request.body._id) {
        userCtrl.create(request, response)
    } else {
        request.params.id = request.body._id;
        userCtrl.update(request, response)
    }
};

