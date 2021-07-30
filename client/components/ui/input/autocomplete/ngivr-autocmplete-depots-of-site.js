'use strict';
ngivr.angular.directive('ngivrAutocompleteDepotsOfSite', function (ngivrService, ngivrAutocomplete) {

    return ngivrAutocomplete.generate({
        text: "depot.name",
        placeholder: ngivr.strings.autocomplete.chooseDepot,
        //label: 'Raktár',
        template: `{{ depot.name + '(' + depot.site[0].name + ')'}}`,
        schema: 'depot',
        scope: {
            siteId: '<',
            disabled: '=ngDisabled',
            ownScale: '<',
            getDepots: '&',
            own: '<',
        },
        ngivrMdMenuCustomContainer: 'ngivr-autocomplete-depot-custom-container',
        selectedItemChange: (depot, scope) => {

            if (depot) scope.getDepots({options: {depotId: depot._id}})
        },
        query: (searchText, scope) => {
            let query = {
                sort: name,
                search: {
                    //'site.0._id': scope.siteId,
                    name: {
                        '$regex': searchText,
                        '$options': 'i'
                    }
                }
            };
            // if (!scope.own) {
            //     query.search['site.0.own'] = {$ne:true}
            // } else {
            if (scope.siteId) {
                query.search['site.0._id'] = scope.siteId
            } else {
                query.search['site.0.own'] = {$ne: true}
            }
            //console.warn('query', query)
            // }

            // if (scope.ownScale) {
            //     query.search['site.0._id'] = scope.siteId
            // } else {
            //     query.search['site.0.ownScale'] = {$ne: true}
            // }

            return query
        }
    });

});
