'use strict';
ngivr.angular.directive('ngivrMenuHtmlTemplateCommentInsert', function (ngivrService, $timeout) {
  return {
    controllerAs: '$ctrl',
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      disabled: '=ngDisabled'
    },
    template: `
  <md-menu ng-if=" comments.length > 0" >
        <md-button aria-label="Sablon megjegyzés" class="md-primary md-raised waves-effect waves-whitesmoke" ng-click="$mdMenu.open($event)" style="margin-top: 5px;">
  <md-tooltip md-direction="top">Megjegyzés sablon beszúrása</md-tooltip>
          <ng-md-icon icon="comment"></ng-md-icon>
          Megjegyzés
          <ng-md-icon icon="arrow_drop_down"></ng-md-icon>
        </md-button>
        <md-menu-content width="1">
          <md-menu-item ng-repeat="comment in comments">
            <md-button ng-click="$ctrl.selectTemplate(comment)">
              {{ comment.name }}
            </md-button>
          </md-menu-item>
        </md-menu-content>
      </md-menu>
`,
    controller: function($scope) {

      this.selectTemplate = (comment) => {
        $scope.model = $scope.model || '';
        if ($scope.model.trim() !== '') {
          $scope.model += "\n";
        }
        $scope.model += comment.text;
      }

      const dataQuery = ngivrService.data.query({
        $scope: $scope,
        schema: 'htmlTemplateComment',
        subscribe: async(promise) => {
          try {
            const response = await promise;
            const data = Object.assign({}, response.data);
            $scope.comments = _.sortBy(data.docs, [function(o) { return o.name; }]);;
            delete data['docs'];
          } catch(e) {
            ngivr.growl.error(e);
          }
        }
      });

      dataQuery.query({
        limit: 0,
      })

    }
  }
});
