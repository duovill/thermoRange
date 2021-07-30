'use strict';
ngivr.angular.directive('ngivrButtonMenuPopupStorageList', () => {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            buttonName: '<'
        },
        template: `
         <md-button aria-label="0"   ng-click="showPopup()"> <span >{{buttonName}}</span></md-button>
          <ng-if ng-if="isShowPopup">
          <ngivr-popup-storage-list-excel></ngivr-popup-storage-list-excel>
          </ng-if>
    `,
        controller: ($scope)=>{
            $scope.showPopup = ()=>{
                $scope.isShowPopup=true;
            };
            $scope.$on("closePopup",()=>{
                $scope.isShowPopup=false;
            });
        }
    }
});
