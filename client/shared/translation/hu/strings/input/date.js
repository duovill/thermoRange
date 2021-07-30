'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let strings = {
    today: 'Ma',
  };
  if (isModule) {
    module.exports = strings;
  } else if (isWindow) {
    ngivr.translate.hu.input.date = strings;
  }

})();
