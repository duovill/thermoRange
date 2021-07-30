'use strict';

ngivr.angular.directive('ngivrValidationOrderForSplit', function ($q, $parse, Common, ngivrApi, ngivrGrowl) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$asyncValidators.ngivrValidationOrderForSplit = (modelValue, viewValue) => {
                //let settings = $parse(attrs.ngivrValidationOrderForSplit)(scope);
                let defer = $q.defer();
                scope.$parent.order = null;
                //  if (settings.halfTicketDate === undefined) {
                if (ctrl.$isEmpty(modelValue)) {
                    defer.reject();
                    ctrl.$setViewValue(undefined);
                    ctrl.$render();
                    scope.$apply();
                }
                else {
                    ngivrApi.query('order', {
                        search: {
                            orderNumber: modelValue
                        }
                    }).then((response) => {
                        scope.$parent.orderError = {};
                        if (angular.equals([], response.data.docs)) {
                            scope.$parent.orderError.notExists = true;
                            defer.reject();
                        } else {
                            const order = response.data.docs[0]; //az aktuálisan hozzáadandó order

                            let fromOrder; // amiről pakolunk
                            if (scope.$parent.fromOrder) {
                                fromOrder = scope.$parent.fromOrder
                            }

                            if (order.deleted) {
                                scope.$parent.orderError.deleted = true;
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció törölt');
                            } else if (order.orderClosed) {
                                scope.$parent.orderError.closed = true;
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció le van zárva');
                            } else if (scope.fromOrder.sygnus && order.sygnus && scope.fromOrder.parityId !== order.parityId && scope.fromOrder.direction !== 'internal') {
                                // if (scope.fromOrder.parityId !== order.parityId) { //paritásnak egyezni kell
                                scope.$parent.orderError.parityNotSame = true;
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció paritása nem egyezik a forrás diszpozíció paritásával');
                            } else if (fromOrder.direction !== 'internal' && fromOrder.direction !== order.direction) {
                                scope.$parent.orderError.directionNotSame = true;
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció iránya nem egyezik a forrás diszpozíció irányával');
                            } else if (fromOrder.loadLocation[0]._id !== order.loadLocation[0]._id) {
                                scope.$parent.orderError.loadLocationNotSame = true;
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció felrakóhelye nem egyezik a forrás diszpozíció felrakóhelyével');
                            } else if (fromOrder.direction === 'internal' && order.direction !== 'in') {
                                scope.$parent.orderError.dstNotIn = true;
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nem beszállítás, ilyen diszpozíció esetén a megosztás nem támogatott');
                            } else if (fromOrder.direction === 'internal' && !order.sygnus) {
                                scope.$parent.orderError.notSygnus = true;
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció partneres, ilyen diszpozíció esetén a megosztás nem támogatott');
                            } else {
                                scope.$parent.order = order;
                                defer.resolve();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozícióra lehet megosztani!');
                            }
                        }
                    })
                }
                return defer.promise;
            };
        }
    };
});
