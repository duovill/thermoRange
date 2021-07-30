'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let _;
  if (isWindow) {
    _ = window._;
  } else {
    _ = require('lodash');
  }
  let ngivrString = class {
    static kebabCase(string) {
      var result = string.toLowerCase();
      result = _.deburr(result);
      result = result.replace(/\./g, '');
      result = result.replace(/[^A-Za-z0-9]/g, '-');
      result = result.replace(/-+/g, '-');
      return result;
    }
    static pascalCase(string) {
      if (!string) {
        return string;
      }
      let result = _.camelCase(string);
      return result .charAt(0).toUpperCase() + result.slice(1);
    }

    static basename(string, sep) {
      sep = sep || '\\/';
      return string.split(new RegExp("["+sep+"]")).pop();
    }
  };

  if (isModule) {
    module.exports = ngivrString;
  } else {
    ngivr.string = ngivrString;
  }
})();
