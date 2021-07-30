'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let tow = {
    placeholder: 'Vontató rendszám',
    title: 'Vontató'
  };
  if (isModule) {
    module.exports = tow;
  } else if (isWindow) {
    ngivr.translate.hu.autocomplete.tow = tow;
  }

})();
