'use strict';
(() => {

  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let ngivrString;
  let ngivrStrings;
  if (isWindow) {
    ngivrString = ngivr.String;
    ngivrStrings = ngivr.strings;
  } else {
    ngivrString = require('./ngivr-string');
    ngivrStrings = require('./translation/hu/ngivr-strings');
  }

  const ngivrValidation = class {
    static get kebabCase() {
      return class {
        static get Message() {
          return ngivrStrings.form.validation.kebabCase
        }

        static Validation(value) {
          return value == ngivrString.kebabCase(value);
        }
      }
    }
  };

  if (isModule) {
    module.exports = ngivrValidation;
  } else {
    ngivr.validation = ngivrValidation;
  }
})();
