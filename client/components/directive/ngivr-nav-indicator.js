'use strict';
ngivr.angular.directive('ngivrNavIndicator', () => {
    return {
        restrict: 'E',
        scope: {
            doc: '=',
            notSend: '<?'
        },

        link: (scope, elm, attrs, ctrl) => {

        },
        template: `
 <md-tooltip md-direction="top">{{getInfo(doc)}}</md-tooltip>
                                        <span class="label " ng-click="resendToNAV(doc)"
                                              ng-class="{'label-danger' : doc.NAVOnlineInvoicing.result === 'failed', 'label-success': doc.NAVOnlineInvoicing.result === 'success', 'label-warning': doc.NAVOnlineInvoicing.result === 'timeout' }">NAV</span>
                               
`,
        controller: function ($scope, ngivrConfirm, Auth, $http) {
            $scope.getInfo = (doc) => {
                if (doc) {
                    let result = doc.NAVOnlineInvoicing.result;
                    switch (result) {
                        case 'success':
                            return 'Sikeres beküldés';
                        case 'failed':
                            if (doc.NAVOnlineInvoicing.businessMessages.length) {
                                return doc.NAVOnlineInvoicing.businessMessages[0].message
                            }
                            if (doc.NAVOnlineInvoicing.technicalMessages.length) {
                                return doc.NAVOnlineInvoicing.technicalMessages[0].message
                            }
                        case 'timeout':
                            return 'A számlát még nem dolgozta fel a NAV'
                    }
                }

            };

            $scope.resendToNAV = (invoice) => {
                if ((invoice.NAVOnlineInvoicing && (invoice.NAVOnlineInvoicing.result === 'success' || invoice.NAVOnlineInvoicing.result === 'timeout')) || $scope.notSend) return;
                ngivrConfirm('Biztosan beküldi a számlát a NAV rendszerébe?').then(async () => {
                    $scope.currentUser = Auth.getCurrentUser();
                    invoice.history.push({
                        userId: $scope.currentUser._id,
                        userName: $scope.currentUser.fullName,
                        event: 'reSendToNav',
                        eventDate: new Date()
                    });
                    let response = await $http.post('/api/outgoing-invoices', invoice);
                    invoice = response.data;
                    if (invoice.NAVOnlineInvoicing.result !== 'success') {
                        //console.warn(invoice.NAVOnlineInvoicing)
                        if (invoice.NAVOnlineInvoicing.result === 'failed') {
                            for (let message of invoice.NAVOnlineInvoicing.businessMessages) {
                                ngivr.growl(message.message, 'error')
                            }
                            for (let message of invoice.NAVOnlineInvoicing.technicalMessages) {
                                if (message.message === '500: Internal Server Error') {
                                    ngivr.growl('Jogosultsági hiba miatt a számlát a NAV nem fogadta be', 'error')
                                } else {
                                    ngivr.growl(message.message, 'error')
                                }

                            }
                            //throw 'A tranzakciót a NAV nem fogadta be hiba miatt.'

                        } else if (invoice.NAVOnlineInvoicing.result === 'timeout') {
                            ngivr.growl('Időtúllépés', 'error')
                        }
                    } else {
                        ngivr.growl(`A ${invoice.number} sorszámú számlát a NAV befogadta!`)
                    }
                })
            };
        }
    }
});
