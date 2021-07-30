'use strict';
ngivr.angular.factory('ngivrConfirm', function($mdDialog) {
  return function(question, growl, cancelCB, answers, multiple, options = {}) {
      const { existingDialog } = options
      let parent
      if (existingDialog === undefined) {
          parent = angular.element(document.body)
      } else {
          parent = angular.element( document.querySelector( 'md-dialog'  ));
      }
    return $mdDialog.show({
      controller: function($scope, $mdDialog) {
        $scope.question = question;
        $scope.answers = answers;
        if (!$scope.answers) $scope.answers = {sure: ['Biztos?'], cancel: 'Mégse?'}

        $scope.sure = function(answer) {
          if (growl !== undefined) {
            ngivr.growl(growl);
          }
          $mdDialog.hide(answer);
        };

        $scope.cancel = function() {
          $mdDialog.cancel();
          if (cancelCB){
            return cancelCB()
          }
        };

        $scope.subscribe('forceCancel', () => {
            $scope.cancel()
        })
      },
      templateUrl: 'components/ui/ngivr-confirm.html',
      parent: parent,
  //   targetEvent: $event,
      multiple: multiple || true,
      clickOutsideToClose:true,
    });
  }
});
