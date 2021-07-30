ngivr.angular.directive('ngivrChipsOtherDocumentTemplate', function (ngivrService, ngivrChips) {

    return ngivrChips.generate({
        display: 'otherDocumentTemplate.label',
        placeholder: ngivr.strings.autocomplete.otherDocumentTemplate.placeholder,
        schema: 'otherDocumentTemplate',
        template: {
            autoComplete:  '{{ otherDocumentTemplate.label }}',
            chip: '{{ $chip.label }}',
        },
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
