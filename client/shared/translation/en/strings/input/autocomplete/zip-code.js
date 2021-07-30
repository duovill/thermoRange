'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let zipCode = {
    placeholder: 'Irja be az irányítószámot',
    title: 'Ország'
  };
  if (isModule) {
    module.exports = partner;
  } else if (isWindow) {
    ngivr.translate.en.autocomplete.zipCode = zipCode;
  }

})();
