'use strict';
ngivr.angular.directive('needFields', function ($parse) {
  return {
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {

      ctrl.$validators.needFields = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          return true
        }
        let fields = $parse(attrs.needFields)(scope);
        let empty = [];
        for (let i in fields) {
          if (fields[i].field === undefined)
            empty.push(fields[i].name)
        }
        if (empty.length) {
          ngivr.growl('A következő mező(ke)t ki kell tölteni: ' + empty);
          return false
        }
        return true
      };
    }
  };
});
