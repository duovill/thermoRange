ngivr.angular.component('ngivrMasterHtmlTemplateCommentList', {
  templateUrl: 'app/master/html-templates-comment/component/ngivr-master-html-template-comment-list.html',
  controller: function($scope, ngivrService) {
    $scope.ngivr = ngivrService;

    $scope.form = async (id) => {
      if (id !== undefined) {
        const response = await ngivrService.api.id('htmlTemplateComment', id);
        $scope.$parent.$parent.$parent.formModel = response.data.doc;
      }
      $scope.$parent.$parent.$parent.list = false
    }

  }
});
