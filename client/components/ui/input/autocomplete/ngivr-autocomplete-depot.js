'use strict';
ngivr.angular.directive('ngivrAutocompleteDepot', function (ngivrService, ngivrAutocomplete, $timeout) {

    return ngivrAutocomplete.generate({
        text: "depot.name + '(' + depot.site[0].name + ')'",
        placeholder: ngivr.strings.autocomplete.chooseDepot,
        template: `{{ depot.name + '(' + depot.site[0].name + ')'}}`,
        schema: 'depot',
        scope: {
            buy: '=',
            product: '=',
            site: '<?',
            partnerId: '<?',
            depotChanged: '&?'
        },
        query: (searchText, scope) => {
            let query = {sort: name};
            if (scope.buy) {
                query.search = {
                    $and: [
                        {
                            $or: [
                                {
                                    name: {
                                        '$regex': searchText,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'site.0.name': {
                                        '$regex': searchText,
                                        '$options': 'i'
                                    }
                                }
                            ],

                        },
                        {visible: true},
                    ]
                };
                if (!scope.site) {
                    query.search.$and[2] = {'site.0.own': {$ne: true}}
                } else {
                    query.search.$and[2] = {'site.0._id': scope.site._id};
                    if (scope.site.privat) {
                        query.search.$and[3] = {
                            storage: {
                                $elemMatch: {productId: scope.product[0]._id, partnerId: scope.partnerId}
                            }
                        }
                    }
                }

            } else if (scope.buy === false) {
                query.search = {
                    $and: [
                        {
                            $or: [
                                {
                                    name: {
                                        '$regex': searchText,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'site.0.name': {
                                        '$regex': searchText,
                                        '$options': 'i'
                                    }
                                }
                            ]
                        },

                        {
                            storage:
                                {
                                    $elemMatch: {productId: scope.product[0]._id, partnerId: ngivr.settings.ownFirm._id}
                                }
                        },
                        {visible: true}
                    ]
                }
            } else {
                query.search = {
                    $and: [
                        {
                            $or: [
                                {
                                    name: {
                                        '$regex': searchText,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'site.0.name': {
                                        '$regex': searchText,
                                        '$options': 'i'
                                    }
                                }
                            ]
                        },
                        {visible: true}
                    ]
                };
                if (scope.site) {
                    query.search.$and.push({'site.0._id': scope.site._id})
                }
            }
            return query
        },
        selectedItemChange: (ekaer, scope) => {
            if (scope.depotChanged) {
                //when this event fires the model's value doesn't reflect the selected item
                $timeout(scope.depotChanged);
            }
        },
    });
});
