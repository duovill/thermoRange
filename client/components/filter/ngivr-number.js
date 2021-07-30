'use strict';
ngivr.angular.filter('ngivrNumber',function() {
  return function(number, fraction, language) {
    return !isNaN(number) ? new Intl.NumberFormat(language, {
      maximumFractionDigits: fraction,
      minimumFractionDigits: fraction,
    }).format(number) : number
  };
})
