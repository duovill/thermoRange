'use strict';
(() => {
  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let sychronizer = {
    title: 'Szinkronizáló',
  };
  if (isModule) {
    module.exports = planner;
  } else if (isWindow) {
    ngivr.translate.hu.sychronizer = sychronizer;
  }
})();
