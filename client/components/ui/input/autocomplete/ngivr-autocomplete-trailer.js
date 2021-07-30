'use strict';
ngivr.angular.directive('ngivrAutocompleteTrailer', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    text: 'financialCostBearer.name',
    placeholder: ngivr.strings.autocomplete.trailer.placeholder,
    template: `{{ financialCostBearer.name }}`,
    schema: 'financialCostBearer',
    label: ngivr.strings.field.plateNumber2,
    query: (searchText) => {
      return {
        sort: name,
        search: {
          name: {
            '$regex': searchText,
            '$options': 'i'
          },
          costBearerType: 'Pótkocsi',
          visible: true
        }
      }
    },
    selectedItemChange: (trailer, scope) => {
      if (scope.value == ""){
        scope.value = null;
        scope.searchText = "";
      }
    }
  });
});
