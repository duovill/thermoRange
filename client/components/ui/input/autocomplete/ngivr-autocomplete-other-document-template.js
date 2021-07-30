ngivr.angular.directive('ngivrAutocompleteOtherDocumentTemplate', function (ngivrService, ngivrAutocomplete) {

    return ngivrAutocomplete.generate({
        text: 'otherDocumentTemplate.label',
        placeholder: ngivr.strings.autocomplete.otherDocumentTemplate.placeholder,
        template: `{{ otherDocumentTemplate.label }}`,
        schema: 'otherDocumentTemplate',
        //queryText:'city',
        //label: ngivr.strings.autocomplete.otherDocumentTemplate.label,

        query: (searchText) => {
            let query = {sort: 'label'};
            query.search = {
                label: {
                    '$regex': searchText,
                    '$options': 'i'
                },
                $or: [
                    {
                        deleted: null
                    },
                    {
                        deleted: false,
                    }
                ]
            };
            return query
        }
    });

});
