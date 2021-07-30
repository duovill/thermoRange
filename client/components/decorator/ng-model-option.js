/*
 'use strict';
ngivr.angular.decorator('ngModelOptionsDirective', ($delegate) => {

  ngivr.console.log('ngModelOptionsDirective: ANGULAR MATERIAL NEM MUKOIDK ANGULAR 1.6-AL! HA UJ VERZIO, TESZT, KISZEDNI');

  $delegate.forEach((d) => {
    let ctrl = d.controller;

    ctrl.prototype._$onInit = ctrl.prototype.$onInit;

    ctrl.prototype.$onInit = function() {
      this._$onInit();
      Object.keys(this.$options.$$options).forEach((key) => {
        this.$options[key] = this.$options.$$options[key];
      })
    };
  });

  return( $delegate );
});
*/
