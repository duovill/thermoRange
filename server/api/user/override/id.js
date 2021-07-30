
const User = require('../user.model');

module.exports = async (request, response)=> {

    request.body.ignore = true;
    let userId = request.params.id;
    User.findById(userId, '-salt -hashedPassword', function (err, user) {
        if (err) return next(err);
        if (!user) return response.status(401).send('Unauthorized');
        response.status(200).json({
            doc: user
        });
    });
};
