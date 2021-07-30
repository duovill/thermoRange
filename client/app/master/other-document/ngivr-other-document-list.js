ngivr.angular.component('ngivrOtherDocumentList', {
    templateUrl: 'app/master/other-document/ngivr-other-document-list.html',
    controller: function (ngivrOtherDocumentForm, ngivrService, $scope) {

        this.searchModel = {
            inputSearch: undefined,
            otherDocumentTemplate: []
        }

        ngivr.list.clear($scope, () => {
            this.searchModel = {
                inputSearch: undefined,
                otherDocumentTemplate: []
            }

        })

        this.newOtherDocument = () => {
            ngivrOtherDocumentForm.show({
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
            search: querySearchNonTrashed,
            populate: [
                'templateType'
            ]
        }

        this.search = (query) => {
            const search = this.searchModel.inputSearch;
            query.search = {
                $and: [
                    querySearchNonTrashed,
                ]
            }
            if (search !== undefined && search.trim() !== '') {
                query.search.$and.push({
                    'searchValues': {
                        '$regex': search,
                        '$options': 'i'
                    }
                })
            }

            const otherDocumentTemplateFilter = this.searchModel.otherDocumentTemplate.map(e => e._id)
          //  console.log(otherDocumentTemplateFilter)
            if (otherDocumentTemplateFilter.length > 0) {
                query.search.$and.push({
                    templateType: {
                        $in: otherDocumentTemplateFilter
                    }
                })
            }
        }


        this.view = (options) => {
            ngivrOtherDocumentForm.show({
                type: 'edit',
                model: options.doc,
            })
        }

        this.delete = async (options) => {
            try {
                await ngivrService.confirm(ngivrService.strings.otherDocuments.confirm.deleteOtherDocument)
                await ngivrService.api.trash('otherDocument', options.doc._id);
            } catch (e) {
                ngivrService.exception.handler(e)
            }
        }

    }
})
