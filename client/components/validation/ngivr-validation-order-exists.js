'use strict';

ngivr.angular.directive('ngivrValidationOrderExists', function ($q, $parse, Common, ngivrApi, ngivrGrowl) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$asyncValidators.ngivrValidationOrderExists = (modelValue, viewValue) => {
                let settings = $parse(attrs.ngivrValidationOrderExists)(scope);

                if (scope.$first && scope.$parent.$parent.mainDispo) delete scope.$parent.$parent.mainDispo;
                let defer = $q.defer();
                if (settings.halfTicketDate === undefined) {
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
                            scope.ledger.orderError = {};
                            if (angular.equals([], response.data.docs)) {
                                scope.ledger.orderError.notExists = true;
                                defer.reject();
                            } else {
                                const order = response.data.docs[0]; //az aktuálisan hozzáadandó order
                                let mainOrder; // a fő order (az első ledger elem ordere)
                                if (scope.$parent.$parent.mainDispo) {
                                    mainOrder = scope.$parent.$parent.mainDispo
                                }

                                let areMoreOrders = mainOrder !== undefined && scope.$parent.$parent.Ticket.ledger.length > 1


                                // if (areMoreOrders && (order.sygnus !== mainOrder.sygnus || !order.sygnus && order.partner[0]._id !== mainOrder.partner[0]._id)) {
                                //     scope.ledger.orderError.differentPartners = true;
                                //     defer.reject();
                                //     ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott, de nem egyezik a partner! Külön kell mérni!');
                                // } else
                                    if (areMoreOrders && mainOrder.cargoPlanId && order.cargoPlanId !== mainOrder.cargoPlanId) {
                                    scope.ledger.orderError.differentCargoPlans = true;
                                    defer.reject();
                                    ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott, de nem egyezik a nominálás! Külön kell mérni!');
                                } else if (areMoreOrders && !order.cargoPlanId && mainOrder.unloadDepot.length && (!order.unloadDepot.length || order.unloadDepot[0]._id !== mainOrder.unloadDepot[0]._id)) {
                                    scope.ledger.orderError.differentUnloadDepots = true;
                                    defer.reject();
                                    ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott, de nem azonos a lerakó raktár! Külön kell mérni!');
                                } else if (areMoreOrders && order.orderProduct[0]._id !== mainOrder.orderProduct[0]._id) {
                                    scope.ledger.orderError.differentProducts = true;
                                    defer.reject();
                                    ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott, de nem egyezik a termény! Külön kell mérni!');
                                } else if (!order.finalized) {
                                    scope.ledger.orderError = {
                                        notExists: false,
                                        notFinalized: true,
                                        notSameTransportType: false,
                                        isClosed: false
                                    };
                                    defer.reject();
                                    ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott, de nincs véglegesítve!');
                                } else if (order.orderClosed) {
                                    scope.ledger.orderError = {
                                        notExists: false,
                                        notFinalized: false,
                                        notSameTransportType: false,
                                        isClosed: true
                                    };
                                    defer.reject();
                                    ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció le van zárva!');
                                }else if (order.deleted) {
                                        scope.ledger.orderError = {
                                            notExists: false,
                                            notFinalized: false,
                                            notSameTransportType: false,
                                            isDeleted: true
                                        };
                                        defer.reject();
                                        ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció törölt!');
                                } else if (!order.sygnus && order.direction === 'out' && order.performed > order.volume) {
                                    scope.ledger.orderError = {
                                        notExists: false,
                                        notFinalized: false,
                                        notSameTransportType: false,
                                        isClosed: false,
                                        isOverTransported: true
                                    };

                                    defer.reject();
                                    ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott, de már nem lehet rá mérni, túlszállítás miatt!');
                                } else if ((order.loadLocation[0] && order.loadLocation[0]._id !== settings.siteId) && (order.unloadLocation[0] && order.unloadLocation[0]._id !== settings.siteId)) {
                                    scope.ledger.orderError = {
                                        notExists: false,
                                        notFinalized: false,
                                        notSameTransportType: false,
                                        isClosed: false,
                                        wrongSite: true
                                    };
                                    defer.reject();
                                    ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott, de sem a felrakó, sem a lerakó telephely nem egyezik meg a mérés telephelyével');
                                } else if (!order.loadLocation[0] && (order.unloadLocation[0] && order.unloadLocation[0]._id !== settings.siteId)) {
                                    scope.ledger.orderError = {
                                        notExists: false,
                                        notFinalized: false,
                                        notSameTransportType: false,
                                        isClosed: false,
                                        wrongSite: true
                                    };
                                    defer.reject();
                                    ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott, de a lerakó telephely nem egyezik meg a mérés telephelyével');
                                } else if (order.loadLocation[0] && order.loadLocation[0]._id !== settings.siteId && !order.unloadLocation[0]) {
                                    scope.ledger.orderError = {
                                        notExists: false,
                                        notFinalized: false,
                                        notSameTransportType: false,
                                        isClosed: false,
                                        wrongSite: true
                                    };
                                    defer.reject();
                                    ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott, de a felrakó telephely nem egyezik meg a mérés telephelyével');
                                } else {
                                    defer.resolve();
                                    //ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció nyitott!');
                                }
                            }
                        })
                    }
                } else {
                    defer.resolve();
                }

                return defer.promise;
            };
        }
    };
});
