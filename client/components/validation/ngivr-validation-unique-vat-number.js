'use strict';

ngivr.angular.directive('ngivrValidationUniqueVatNumber', function ($q, $parse, Common, ngivrApi) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {

      ctrl.$asyncValidators.ngivrValidationUniqueVatNumber = (modelValue, viewValue) => {
        let defer = $q.defer();
        let settings = $parse(attrs.ngivrValidationUniqueVatNumber)(scope);
        if ((scope.$parent.$parent.$parent.enabled !== undefined && !scope.$parent.$parent.$parent.enabled)
          || viewValue === undefined
          || (viewValue.length !== 13 && settings.hu)
          ||  (viewValue.length !== 10 && settings.vatId )) {
          defer.resolve();

        } else {

          if (ctrl.$isEmpty(modelValue)) {
            defer.reject();
            ngivr.growl('A következő mező(ke)t ki kell tölteni: '  );
            ctrl.$setViewValue(undefined);
            ctrl.$render();
            scope.$apply();

          }
          else {
            let searchObject = {};
            if (settings.vatId) {
              searchObject = {vatId: viewValue}
            } else {
              searchObject = {
                vatNumbers: {$elemMatch: {number:viewValue}}
              }
            }
            ngivrApi.query('partner', {
              search: searchObject
            }).then((response) => {
              if (angular.equals([], response.data.docs)) {
                defer.resolve();
              } else {
                if (response.data.docs[0]._id === settings.modelId) {
                  defer.resolve();
                } else {
                  defer.reject();
                }
              }
            })
          }
        }
        return defer.promise;
      };
    }
  };
});
