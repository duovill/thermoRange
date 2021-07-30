ngivr.angular.component('ngivrMasterHtmlTemplateCommentForm', {
  templateUrl: 'app/master/html-templates-comment/component/ngivr-master-html-template-comment-form.html',
  controller: function($scope, ngivrService) {
    $scope.ngivr = ngivrService;

    if ($scope.$parent.$parent.$parent.formModel !== undefined) {
      $scope.model = $scope.$parent.$parent.$parent.formModel;
    } else {
      $scope.model = new ngivr.model.htmlTemplateComment();
    }


    this.$onDestroy = () => {
      $scope.$parent.$parent.$parent.formModel = undefined;
    }

    this.ngivrClose = () => {
      $scope.$parent.$parent.$parent.list = true;
    }
  }
});
