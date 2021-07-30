'use strict';
ngivr.angular.directive('ngivrStockPopupButton', () => {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      buttonName: '<'
    },
    template: `
         <md-button aria-label="0"   ng-click="showStockPopup()"> <span >{{buttonName}}</span></md-button>
          <ng-if ng-if="isShowStockPopup">
          <ngivr-popup-stock></ngivr-popup-stock>
          </ng-if>
    `,
    controller: ($scope)=>{
         $scope.showStockPopup = ()=>{
           $scope.isShowStockPopup=true;
         };
         $scope.$on("closeStockPopup",()=>{
           $scope.isShowStockPopup=false;
         });
    }
  }
});
