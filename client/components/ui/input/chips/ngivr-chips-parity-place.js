'use strict';
ngivr.angular.directive('ngivrChipsParityPlace', function (ngivrService, ngivrChips) {

    return ngivrChips.generate({
        display: 'parityPlace.name',
        placeholder: ngivr.strings.autocomplete.parityPlace.placeholder,
        schema: 'parityPlace',
        query: (searchText) => {
            const query = {
                'sort': 'name',
                'search': {}
            };
            query.search['name'] = {
                '$regex': searchText,
                '$options': 'i'
            };
            query.settings = {
                searchModeStartsWith: true,
            }

            return query;
        },
        /**
         command: {
      add: ()=> {
        alert('1');
      },
      remove: ()=> {
        alert('2');
      },
      chipTransform: ($chip) => {
        alert('3');
        return $chip;
      }
    }
         */
        /**
         template: {
      autoComplete: `{{ partner.name }}`,
      chip: `{{ $chip.name }}`
    },
         **/
    });

});
