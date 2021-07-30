'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let trailer = {
    placeholder: 'Vontatmány rendszám',
    title: 'Vontatmány'
  };
  if (isModule) {
    module.exports = trailer;
  } else if (isWindow) {
    ngivr.translate.en.autocomplete.trailer = trailer;
  }

})();
