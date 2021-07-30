'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let site = {
    placeholder: 'Válasszon telephelyet',
    title: 'Lerakóhely'
  };
  if (isModule) {
    module.exports = site;
  } else if (isWindow) {
    ngivr.translate.en.autocomplete.site = site;
  }

})();
