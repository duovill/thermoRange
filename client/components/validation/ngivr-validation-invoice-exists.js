'use strict';

ngivr.angular.directive('ngivrValidationInvoiceExists', function ($q, $parse, Common, ngivrApi, ngivrGrowl) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      ctrl.$asyncValidators.ngivrValidationInvoiceExists = (modelValue, viewValue) => {
        let required = $parse(elm[0].attributes.getNamedItem('ng-required').value)(scope);
        let sellerId = $parse(elm[0].attributes.getNamedItem('seller-id').value)(scope);
        let defer = $q.defer();
        if (!required) {
          defer.resolve();
        }
        else if (ctrl.$isEmpty(modelValue) || sellerId === undefined) {
          defer.reject();
          ngivrGrowl('Kérem, válasszon eladót, majd utána adja meg a bizonylatszámot!');
          ctrl.$setViewValue(undefined);
          ctrl.$render();
          scope.$apply();
        }
        else {
          ngivrApi.query('incomingInvoice', {
            search: {
              'incomingSeller.0._id': sellerId,
              incomingInvoiceNumber: modelValue
            }
          }).then((response) => {
            if (angular.equals([], response.data.docs)) {
              defer.reject();
            } else {
              defer.resolve();
              ngivrGrowl('A(z) ' + modelValue + ' sz. bizonylat létezik!');
            }
          })
        }
        return defer.promise;
      };
    }
  };
});
