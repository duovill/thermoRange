'use strict';
ngivr.angular.directive('ngivrInvoiceDetails', () => {
    return {
        restrict: 'E',
        require: 'ngModel',
        transclude: true,
        templateUrl: 'components/ui/invoice/ngivr-invoice-details.html',
        controller: function ($scope, ngivrStrings, $mdMedia) {

            $scope.$mdMedia = $mdMedia;
            $scope.registryStatusList = ngivrStrings.registryStatusList;
            $scope.typeList = ngivrStrings.invoiceType;
            $scope.origType = ngivrStrings.origType;
            $scope.outgoingInvoiceType = ngivrStrings.outgoingInvoiceType;
            $scope.incomingTypesList = ngivrStrings.incomingTypesList;
            $scope.getSum = (doc, type) => {
                if (doc.number) {
                    if (doc.compensation) {
                        if (type === 'brutto') {
                            return doc.compensation + doc.netto
                        } else if (type === 'netto') {
                            return doc.netto
                        } else if (type === 'vatValue') {
                            return doc.compensation
                        }

                    } else {
                        if (type === 'brutto') {
                            return doc.endSum
                        } else if (type === 'netto') {
                            return doc.vatBase
                        } else if (type === 'vatValue') {
                            return doc.vatValue
                        }
                    }
                } else {
                    if (type === 'brutto') {
                        return doc.incomingBrutto
                    } else if (type === 'netto') {
                        return doc.incomingNetto
                    } else if (type === 'vatValue') {
                        return doc.incomingVAT
                    }
                }
            };

            $scope.setType = (doc) => {
                switch (doc.type) {
                    case 'correction':
                        return $scope.origType[doc.relatedInvoice.type] + '/' + $scope.outgoingInvoiceType[doc.type];
                    case 'storno':
                        return $scope.origType[doc.relatedInvoice.type] + '/' + $scope.outgoingInvoiceType[doc.type];
                    default:
                        return $scope.outgoingInvoiceType[doc.type] + '/Normál';

                }
            };


        }
    }
});
