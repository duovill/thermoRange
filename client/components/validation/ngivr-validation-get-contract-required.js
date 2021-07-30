'use strict';
/**
 * ez a sima validacio, de most async kell

 .directive('validatorContract', function() {
    return {
      require : 'ngModel',
      link : function(scope, element, attrs, ngModel) {
        ngModel.$parsers.push(function(value) {
          ngModel.$setValidity('validator-contract', false);
          return value;
        });
      }
    };
  })
 */


ngivr.angular.directive('ngivrValidationGetContractRequired', function($q, $parse, Common) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      let settings = $parse(attrs.ngivrValidationGetContractRequired)(scope);
      ctrl.$asyncValidators.ngivrValidationGetContractRequired = function(modelValue, viewValue) {
        let fieldDisabled = $parse(elm[0].attributes.getNamedItem('field-disabled').value)(scope);
        //fieldDisabled=false;
        try {
          settings.sellContractId = $parse(elm[0].attributes.getNamedItem('sell-contract-id').value)(scope);
        } catch (e) {
          settings.sellContractId = undefined
        }

        let defer = $q.defer();
        if (fieldDisabled) {
         // settings.callback({}, settings);
          defer.resolve();
        } else {
          if (ctrl.$isEmpty(modelValue))
          {
            settings.callback({}, settings);
            defer.reject();
          }
          else
          {
            Common.getContract(modelValue,  settings.isOwnContractNumber, settings.isBuy, function (response)
            {
              if (settings.callback)
                  if (!settings.isFromSplit) {
                      settings.callback(response, settings);
                  } else {
                      settings.callback({response: response, settings: settings});
                  }

              if (angular.equals({}, response)) {
                defer.reject();
              } else {
                defer.resolve();
              }
            });
          }
        }

        return defer.promise;
      };
    }
  };
});
