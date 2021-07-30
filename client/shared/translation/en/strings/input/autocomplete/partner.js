'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let partner = {
    placeholder: 'Válasszon partnert',
    title: 'Partner'
  };
  if (isModule) {
    module.exports = partner;
  } else if (isWindow) {
    ngivr.translate.en.autocomplete.partner = partner;
  }

})();
