const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

exports.setup = function (User, config) {
    passport.use(new LocalStrategy({
            usernameField: 'name',
            passwordField: 'password' // this is the virtual field on the model
        },
        function(name, password, done) {

            User.findOne({
                name: name
            }, async function(err, user) {
                if (err) return done(err);
                if (!user) {
                    return done(null, false, { message: 'This name is not registered.' });
                }

                if (process.env.hasOwnProperty('NGIVR_AUTH_OPEN')) {
                    return done(null, user)
                }

                if (!user.approved) {
                    return done(null, false, { message: 'This user is not approved.' });
                }
                if (!(await user.authenticate(password))) {
                    return done(null, false, { message: 'This password is not correct.' });
                }
                return done(null, user);
            });
        }
    ));
};
