'use strict';
/*
a szovegben meg kell adni a max-wdith: 100px -et, hogy a max szelessege mi legyen
 */
ngivr.angular.directive('ngivrEllipsis', function($interpolate,  $compile) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.addClass('ngivr-ellipsis');
      const parseText = element.text();
      const text = $interpolate(parseText)(scope).trim();
      element.attr('title', text);
    }
  };
});
