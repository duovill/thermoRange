'use strict';

ngivr.angular.directive('ngivrValidationUnique', function ($q, $parse, Common, ngivrApi) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {

            ctrl.$asyncValidators.ngivrValidationUnique = (modelValue, viewValue) => {
                let defer = $q.defer();
                if (scope.$parent.enabled !== undefined && !scope.$parent.enabled) {
                    defer.resolve();
                } else {
                    let settings = $parse(attrs.ngivrValidationUnique)(scope);
                    let actualField = settings.schemaField || elm[0].name;

                    let searchObject = settings.fields === undefined ? {} : settings.fields.search;
                    if (settings.isDate) {
                        searchObject[actualField] = new Date(viewValue)
                    } else {
                        searchObject[actualField] = viewValue
                    }
                    let emptyFields = [];
                    for (let key in searchObject) {

                        if (searchObject[key] === undefined && settings.fields) {
                            emptyFields.push(settings.fields.name)
                        }
                    }
                    if (ctrl.$isEmpty(modelValue) && emptyFields.length) {
                        defer.reject();
                        ngivr.growl('A következő mező(ke)t ki kell tölteni: ' + emptyFields);
                        ctrl.$setViewValue(undefined);
                        ctrl.$render();
                        scope.$apply();
                    } else if(modelValue === undefined) {
                        defer.resolve();
                    }
                    else {
                        ngivrApi.query(settings.schema, {
                            search: searchObject
                        }).then((response) => {
                            if (angular.equals([], response.data.docs)) {
                                defer.resolve();
                                //ngivrGrowl('OK');
                            } else {
                                if (response.data.docs[0]._id === settings.id) {
                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }

                                //ngivrGrowl('NEM OK');
                            }
                        })
                    }
                }

                return defer.promise;
            };
        }
    };
});
