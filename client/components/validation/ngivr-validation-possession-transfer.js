'use strict';

ngivr.angular.directive('ngivrValidationPossessionTransfer', function ($q, $parse, Common, ngivrApi) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {

            ctrl.$asyncValidators.ngivrValidationPossessionTransfer = (modelValue, viewValue) => {
                let defer = $q.defer();
                let settings = $parse(attrs.ngivrValidationPossessionTransfer)(scope);
                if (settings.splitted) {
                    defer.resolve();
                }
                ngivrApi.query('ticket', {
                    search: {
                        ticketName: viewValue,
                        technicalRemain: {$gt: 0}
                    }
                }).then((response) => {
                    if (angular.equals([], response.data.docs)) {
                        defer.reject();
                    } else {
                        scope.pt.ticketId = response.data.docs[0]._id;
                        scope.pt.technicalRemain = response.data.docs[0].technicalRemain;
                        defer.resolve();
                    }
                });
                return defer.promise;
            };
        }
    };
});
