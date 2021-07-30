const dataHttp = require('../../../module/data/data-http');
const User = require('../user.model');

module.exports = async (request, response) => {
    User.find({}, '-salt -hashedPassword', function (err, users) {
        if (err) return response.status(500).send(err);
        dataHttp.queryArray({
            response: response,
            data: users,
            query: request.body
        });
    });
    request.body.ignore = true
};
