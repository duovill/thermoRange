'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let parity = {
    placeholder: 'Válasszon paritást',
    title: 'Paritás'
  };
  if (isModule) {
    module.exports = parity;
  } else if (isWindow) {
    ngivr.translate.en.autocomplete.parity = parity;
  }

})();
