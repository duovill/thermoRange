'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let product = {
    placeholder: 'Válasszon terményt',
    title: 'Termény'
  };
  if (isModule) {
    module.exports = product;
  } else if (isWindow) {
    ngivr.translate.en.autocomplete.product = product;
  }

})();
