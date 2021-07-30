ngivr.angular.component('ngivrMasterHtmlTemplateComment', {
  templateUrl: 'app/master/html-templates-comment/ngivr-master-html-template-comment.html',
  controller: function($scope, $state, ngivrService, $rootScope) {

    $scope.ngivr = ngivrService;
    $scope.$parent.$parent.fullSizeRequired = 1;

    this.$onDestroy = () => {
      $scope.$parent.$parent.fullSizeRequired = 0;
    }

    $scope.list = true;

    this.go = (url) => {
      $state.go(url);
    }

  }
});
