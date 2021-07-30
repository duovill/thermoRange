const build = require('./server/build');
const settings = Object.assign(build, {
  "injector": [
    "client/shared/ngivr-settings.js",
    "client/app/ngivr.js",
    "client/shared/translation/hu/ngivr-strings.js",
    "client/shared/translation/hu/strings/**/*.js",
    "client/shared/translation/en/ngivr-strings.js",
    "client/shared/translation/en/strings/**/*.js",
    "client/shared/ngivr-string.js",
    "client/shared/**/*.js",
    "client/app/app.js",
    'client/components/**/*.js',
  ]
});


module.exports = settings;
