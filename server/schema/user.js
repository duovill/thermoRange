'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');


const mz = require('mz');



const settings = require('../../client/shared/ngivr-settings');

const UserSchema = new Schema({
    name: {
        type: String,
        //unique: true
    },
    fullName: String,
    nickName: String,
    emailAdress: String,
    approved: {
        type: Boolean,
        default: true
    },
    phone: String, // telefonszám
    role: {
        type: String,
        default: settings.user.role.adminGlobal,
        enum: Object.keys(settings.user.role),
    },
    hashedPassword: String,
    provider: String,
    salt: String,
    showGraph: {type: Boolean, default: false} //készlet grafikont láthatja?
});

UserSchema.set('toJSON', {
    transform: function (doc, ret, opt) {
        delete ret['hashedPassword'];
        delete ret['salt'];
        return ret
    }
});

/**
 * Virtuals
 */
UserSchema
    .virtual('password')
    .get(function () {
        return this._password;
    });

// Public profile information
UserSchema
    .virtual('profile')
    .get(function () {
        return {
            'name': this.name,
            'role': this.role
        };
    });

// Non-sensitive info we'll be putting in the token
UserSchema
    .virtual('token')
    .get(function () {
        return {
            '_id': this._id,
            'role': this.role
        };
    });

/**
 * Validations
 */

// Validate empty email
/*UserSchema
  .path('email')
  .validate(function(email) {
    return email.length;
  }, 'Email cannot be blank');*/

// Validate empty password
UserSchema
    .path('hashedPassword')
    .validate(function (hashedPassword) {
        return hashedPassword.length;
    }, 'Password cannot be blank');

// Validate email is not taken
/*UserSchema
  .path('email')
  .validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({email: value}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The specified email address is already in use.');*/

var validatePresenceOf = function (value) {
    return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
    .pre('save', function (next) {
        if (!this.isNew) return next();

        if (!validatePresenceOf(this.hashedPassword))
            next(new Error('Invalid password'));
        else
            next();
    });

/**
 * Methods
 */
UserSchema.methods = {

    async setPassword(password) {
        this._password = password;
        this.salt = this.makeSalt();
        const newPassword = await this.encryptPassword(password);
        this.hashedPassword = newPassword;
    },

    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: async function (plainText) {
        const check = (await this.encryptPassword(plainText));
        const checkOld = (await this.encryptPassword(plainText, true));
        return check === this.hashedPassword || checkOld === this.hashedPassword;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function () {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword: async function (password, old = false) {
        if (!password || !this.salt) return '';
        var salt = Buffer.from(this.salt, 'base64');
        const data = await mz.crypto.pbkdf2(password, salt, 10000, 64, old ? 'sha1' : 'sha512')
        return data.toString('base64');
    }
};

module.exports = UserSchema;
