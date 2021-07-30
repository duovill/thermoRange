'use strict';
ngivr.angular.directive('ngivrAutocompleteSite', function (ngivrService, ngivrAutocomplete, $timeout, ngivrApi) {

    return ngivrAutocomplete.generate({
        scope: {
            getDepots: '&?',
            getDepotsForMoving: '&?',
            buy: '<?',
            buyContract: '=?',
            disabled: '=ngDisabled',
            siteChanged: "&?",
            weighingHouse: '=?',
            notOwnScale: '<?',
            searchDepot: '<?',
            depot: '='
        },
        text: 'site.name',
        placeholder: ngivr.strings.autocomplete.site.placeholder,
        template: `{{ site.name }}, {{ site.city }}, {{ site.street }}`,
        schema: 'site',
        query: (searchText, scope) => {
            let query = {sort: name};
            query.search = {
                name: {
                    '$regex': searchText,
                    '$options': 'i'
                },
                visible: true
            };
            if (scope.notOwnScale) {
                query.search.ownScale = {$ne: true}
            }
            return query
        },
        selectedItemChange: async (site, scope) => {
            if (site) {
                // if (scope.getDepots !== undefined && !scope.buy) scope.getDepots({site: site})
                if (scope.getDepotsForMoving !== undefined) scope.getDepotsForMoving({options: {siteID: site._id}});
                if (scope.weighingHouse) scope.weighingHouse = undefined
                if (scope.searchDepot) {
                    let resp = await ngivrApi.query('depot', {search: {'site.0._id': site._id}})
                    if (resp.data.docs && resp.data.docs.length === 1) {
                        scope.depot = resp.data.docs[0]
                    }
                }
            } else {
                if (scope.buyContract !== undefined) {
                    scope.buyContract.ekaer = scope.buyContract.relatedContract[0].parity[0].transCostBuy;
                }
            }
            if (scope.siteChanged) {
                //when this event fires the model's value doesn't reflect the selected item
                $timeout(scope.siteChanged);
            }
        },
    });

});
