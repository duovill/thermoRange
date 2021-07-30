ngivr.angular.component('ngivrOtherDocumentTemplateList', {
    templateUrl: 'app/master/other-document/ngivr-other-document-template-list.html',
    controller: function (ngivrOtherDocumentTemplateForm, ngivrService, $scope) {

        this.newOtherDocumentTemplate = () => {
            ngivrOtherDocumentTemplateForm.show({
                type: 'new',
            })
        }

        const querySearchNonTrashed = {
            $or: [
                {
                    deleted: false
                },
                {
                    deleted: null,
                }
            ]
        }
        this.query = {
            search: querySearchNonTrashed
        }


        ngivr.list.clear($scope, () => {
            this.inputSearch = '';

        })

        this.search = (query) => {
            const search = this.inputSearch;
            query.search = {
                $and: [
                    {
                        $or: [
                            {
                                'label': {
                                    '$regex': search,
                                    '$options': 'i'
                                },
                            },
                            {
                                'id': {
                                    '$regex': search,
                                    '$options': 'i'
                                },
                            }
                        ],
                    },
                    querySearchNonTrashed

                ]
            }
        }

        this.view = (options) => {
            ngivrOtherDocumentTemplateForm.show({
                type: 'edit',
                model: options.doc,
            })
        }

        this.delete = async (options) => {
            try {
                await ngivrService.confirm(ngivrService.strings.otherDocuments.confirm.deleteOtherDocumentTemplate)
                await ngivrService.api.trash('otherDocumentTemplate', options.doc._id);
            } catch (e) {
                ngivrService.exception.handler(e)
            }
        }

    }
})
