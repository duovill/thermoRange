'use strict';
ngivr.angular.directive('ngSpinnerBar', ['$rootScope', function($rootScope) {
  return {
    link: function(scope, element, attrs) {
      element.addClass('hide');

      $rootScope.$on('$stateChangeStart', function() {
        element.removeClass('hide');
      });

      $rootScope.$on('$stateChangeSuccess', function() {
        element.addClass('hide');
        $('body').removeClass('page-on-load');
      });

      $rootScope.$on('$stateNotFound', function() {
        element.addClass('hide');
      });

      $rootScope.$on('$stateChangeError', function() {
        element.addClass('hide');
      });
    }
  }
}]);


