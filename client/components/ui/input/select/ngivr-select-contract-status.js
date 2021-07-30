'use strict';
ngivr.angular.directive('ngivrSelectContractStatus', function (ngivrService, ngivrInput, Auth) {
  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      changeStatus: '&'
    },
    template: `
<md-select class="ngivr-select" ng-model="model"  md-on-close="changeStatus()">
  <md-option ng-repeat="status in statuses" ng-value="status.value"  >
    {{ status.name }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);

      scope.statuses = [
          {value: 1, name: 'Összes'},
          {value: 2, name: 'Új esemény'},
          {value: 3, name: 'Folyamatban'},
          {value: 4, name: 'Nem kiküldött, nem aláírt'},
          {value: 5, name: 'Kiküldött, nem aláírt'},
          {value: 6, name: 'Aláírt példány'},
          {value: 7, name: 'Sygnus által aláírt példány'},
          {value: 8, name: 'Ügyfélpéldány visszaküldve'},
          {value: 9, name: 'Nem kiküldött, Sygnus aláírta'},
          {value: 10, name: 'Kiküldött, Sygnus aláírta'},
          {value: 11, name: 'Aláírt példány visszaérkezett'},
          {value: 12, name: 'Szerződés lezárva'},
        ];

    },
  }
});
