'use strict';
ngivr.angular.directive('ngivrTabBadge', () => {
  return {
    restrict: 'E',
    scope: {
      ngivrCount: '='
    },
    template: '<div ng-if="show" class="badge badge-default ngivr-tab-badge ngivr-tab-badge-content">{{ngivrCount}}</div>',
    controller: class {
      constructor($scope) {
        this.$scope = $scope;
      }

      setShow(value) {
        const $scope = this.$scope;
        const string = String(value).trim();
        const hide = string === 'undefined' || string === 'null' || string === '' || string === '0' || value === undefined || value === null || value === 0;
        //console.log(`value: ${value}, string: ${string}, hide: ${!hide}`);
        $scope.show = !hide;
      }

      $onInit() {
        const $scope = this.$scope;
        $scope.$watch('ngivrCount', (newValue, oldValue) => {
          this.setShow(newValue);
        })
      }
    }
  };
});

