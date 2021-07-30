'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let parityPlace = {
    placeholder: 'Válasszon paritás helyet',
    title: 'Paritás helye'
  };
  if (isModule) {
    module.exports = parityPlace;
  } else if (isWindow) {
    ngivr.translate.en.autocomplete.parityPlace = parityPlace;
  }

})();
