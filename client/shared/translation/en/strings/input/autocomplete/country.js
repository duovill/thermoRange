'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let country = {
    placeholder: 'Please, type a country',
    title: 'County'
  };
  if (isModule) {
    module.exports = partner;
  } else if (isWindow) {
    ngivr.translate.en.autocomplete.country = country;
  }

})();
