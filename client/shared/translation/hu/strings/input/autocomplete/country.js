'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let country = {
    placeholder: 'Irja be az országot',
    title: 'Ország'
  };
  if (isModule) {
    module.exports = partner;
  } else if (isWindow) {
    ngivr.translate.hu.autocomplete.country = country;
  }

})();
