ngivr.angular.directive('ngivrSelectLanguage', function (ngivrInput) {
  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      required: '<?ngRequired'
    },
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);
    },
    template: `    
      <md-select class="ngivr-select" ng-model="model" ng-required="required">
        <md-option ng-repeat="(lang, native) in ngivr.strings.language" ng-value="lang">
          {{ ngivr.settings.language[lang] }} <span ng-if="ngivr.settings.currentTranslation != lang">- {{ native }} </span>
          
        </md-option>
      </md-select>
`,
  }
});
