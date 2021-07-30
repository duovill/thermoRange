'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let settlement = {
    placeholder: 'Írja be az várost',
    title: 'Város'
  };
  if (isModule) {
    module.exports = settlement;
  } else if (isWindow) {
    ngivr.translate.hu.autocomplete.settlement = settlement;
  }

})();
