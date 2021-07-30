ngivr.angular.component('thermoMeasuringInstrumentList', {
    templateUrl: 'app/_thermo/measuring-instrument/thermo-measuring-instrument-list.html',
    controller: function (thermoMeasuringInstrumentForm, ngivrService, $scope, $state) {

        this.searchModel = {
            inputSearch: undefined,
        }

        ngivr.list.clear($scope, () => {
            this.searchModel = {
                inputSearch: undefined,
            }
        })

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
            sort: 'name'
        }

        this.sort = {
         position: 'before',
         items: [
           {
             key: 'name',
             display: 'Név',
             sort: 'name'
           },
           {
             key: 'macId',
             display: 'MAC ID',
             sort: 'macId'
           },
         ]
       }

        this.search = (query) => {
            //console.warn('search')
            const search = this.searchModel.inputSearch;
            query.search = {
                $and: [
                    querySearchNonTrashed,
                ]
            }
            if (search !== undefined && search.trim() !== '') {
                const $or = [];
                $or.push({
                    'name': {
                        '$regex': search,
                        '$options': 'i'
                    }
                })
                $or.push({
                    'macId': {
                        '$regex': search,
                        '$options': 'i'
                    }
                })
                query.search.$and.push(
                    { $or: $or }
                )
            }
            //console.warn('search', query)
            this.query = query
        }


        this.view = (options) => {
            thermoMeasuringInstrumentForm.show({
                type: 'edit',
                model: options.doc,
            })
        }

        this.delete = async (options) => {
            try {
                await ngivrService.confirm(`Letörli a(z) ${options.doc.name} mérőműszeret?`)
                await ngivrService.api.remove('measuringInstrument', options.doc._id);
            } catch (e) {
                ngivrService.exception.handler(e)
            }
        }

        this.display = (opts) => {
            const { doc } = opts;

            $state.go('thermo-measuring-instrument-display', {
                id: doc._id,
                macId: doc.macId,
                doc: doc,
            });
        }

    }
})
