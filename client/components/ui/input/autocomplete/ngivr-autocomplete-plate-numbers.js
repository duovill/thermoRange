'use strict';
ngivr.angular.directive('ngivrAutocompletePlateNumbers', function (ngivrService, ngivrAutocomplete) {

    return ngivrAutocomplete.generate({
        text: "orderVehicle.plateNumber1",
        placeholder: ngivr.strings.autocomplete.plateNumber,
        template: `{{ orderVehicle.plateNumber1 + ' / ' + orderVehicle.plateNumber2 }}`,
        schema: 'orderVehicle',
        scope: {
            disabled: '=ngDisabled',
            plateNumber2: "=",
            internal: '<?',
            orderId: '<?',
            setSelectedVehiclesToNull: '&?',
            ledger: '=?',
            itk: '<?',
            ekaer: '<?'
        },
        query: (searchText, scope) => {
            let query = {sort: {'plateNumber1': 1}};
            if (!scope.internal) { // ha nem belső áttárolás

                query.search = {
                    plateNumber1: {
                        '$regex': searchText,
                        '$options': 'i'
                    },
                    tcn: {$exists: true}, //van tcn szám
                    tcnUsed: false, //nincs felhasználva
                    tcnStatus: 'S', // tcn aktív
                    //ticketDeleted: {$ne: true}
                };
            } else { // ha belső áttárolás
                query.search = {
                    orderId: scope.orderId,
                    plateNumber1: {
                        '$regex': searchText,
                        '$options': 'i'
                    },
                    ticketDeleted: {$ne: true}
                    //outTicket: {$exists: true}
                    // tcn: {$exists: true}, //van tcn szám
                    // tcnUsed: false, //nincs felhasználva
                    // tcnStatus: 'S' // tcn aktív
                };
                if (scope.ekaer) {
                    query.search.tcn = {$exists: true};
                    query.search.tcnStatus = 'S'
                }

            }
            if (scope.internal && !scope.itk) {
                query.search.outTicket = {$exists: true}
            }

            return query
        },
        selectedItemChange: (orderVehicle, scope) => {
            if (typeof orderVehicle === 'object') {
                scope.value = orderVehicle.plateNumber1;
                scope.plateNumber2 = orderVehicle.plateNumber2
            }
            if (orderVehicle === undefined) {
                scope.plateNumber2 = undefined;
                if (scope.setSelectedVehiclesToNull) {
                    scope.setSelectedVehiclesToNull()
                }

            }

        },
        makeList: (docs) => {
            let plateNumbers = [];
            for (let i in docs) {
                let o = {plateNumber1: docs[i].plateNumber1, plateNumber2: docs[i].plateNumber2};
                let push = true;
                for (let j in plateNumbers) {
                    if (plateNumbers[j].plateNumber1 === o.plateNumber1 && plateNumbers[j].plateNumber2 === o.plateNumber2) {
                        push = false;
                        break
                    }
                }
                if (push) {
                    plateNumbers.push(o)
                }
            }
            return plateNumbers
        }
    });

});
