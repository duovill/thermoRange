/**
 * A generatorban hasznalhato kereso mod:
 * enableSearchMode - be/ki kapcsola a switchet
 * enableSearchModeDefault - a default kapcsolo
 *
 * SCOPE-ban mindig van benne:
 * ngivr-search-mode - bekapcsolja a switchet a scope-ban eg.
 * ngivr-search-mode-default - default ertek true/false
 * ez meg igy nez ki:
 * <ngivr-autocomplete-product ngivr-search-mode="false" ngivr-search-mode-default="true" ></ngivr-autocomplete-product>
 *
 */
ngivr.angular.service('ngivrAutocomplete', function (ngivrService, $timeout) {

    const self = this;
    const service = ngivrService;

    this.generate = (options) => {

        if (options.position === undefined) {
            options.position = 'bottom'
        }
        if (options.query === undefined) {
            const queryText = options.queryText || 'name';
            options.query = (searchText) => {
                const query = {
                    'sort': queryText,
                    'search': {}
                };
                query.search[queryText] = {
                    '$regex': searchText,
                    '$options': 'i'
                };

                return query;
            };
        }
        if (options.enableSearchMode === undefined) {
            options.enableSearchMode = false;
        }
        if (options.enableSearchModeDefault === undefined) {
            options.enableSearchModeDefault = false;
        }

        if (typeof options.scope !== 'object' ) {
            options.scope = {};
        }



        return {
            restrict: 'E',
            scope: Object.assign({
                value: '=ngModel',
                isRequired: '=',
                disabled: '=',
                ngivrSearchMode: '<',
                ngivrSearchModeDefault: '<',
            }, options.scope),

            require: 'ngModel',
            template: `
<div layout="row">
    <div flex>

        <md-autocomplete
            md-no-cache="noCache"
            ng-required="isRequired"
            class="md-block ngivr-autocomplete"
            md-selected-item="value"
            md-menu-class="ngivr-autocomplete-popup"
            md-menu-container-class="${options.ngivrMdMenuCustomContainer}"
            md-search-text="searchText"
            md-items="${options.schema} in querySearch(searchText)"
            md-item-text="${options.text}"
            md-selected-item-change="selectedItemChange(${options.schema})"
            placeholder="${options.placeholder}"
            md-floating-label="${options.label || ''}"
            md-delay="${ngivrService.settings.debounce}"
            ng-disabled="disabled"
            md-dropdown-position="${options.position}"
            >
          <md-item-template>
            <span md-highlight-text="searchText">
                ${options.template}
              </span>
          </md-item-template>
          <md-not-found>
            {{ ngivr.strings.message.noResult}}
          </md-not-found>
        
        </md-autocomplete>
    </div>
    <div ng-if="ngivrEnableSearchMode || ngivrSearchModeGenerated" >
          <md-tooltip md-direction="left">
            {{ ngivrEnableSearchModeModel === false ? 'Keresés bárhol' : 'Keresés csak kezdőbetűvel' }}
          </md-tooltip>         
        <md-switch ng-model="ngivrEnableSearchModeModel" style="margin-left: 5px; margin-top: 0px" ng-change="switchChange(this)" aria-label="unused">
        </md-switch>
    
    </div>
</div>
`,

            link: function (scope, elm, attrs, ngModel) {
                options.scope = scope;

                let ngivrSearchModeGenerated;
                ngivrSearchModeGenerated = scope.ngivrSearchMode;

                Object.defineProperty(scope, 'noCache',  {
                    get: () => {
                        return true;
                        //return options.enableSearchMode || scope.ngivrSearchModeGenerated
                    },
                    set: () => {

                    }
                })
                scope.switchChange = (thatScope) => {
                    //console.warn('options.ngivrEnableSearchModeModel', options.ngivrEnableSearchModeModel)
                    options.ngivrEnableSearchModeModel = thatScope.ngivrEnableSearchModeModel
                }
                $timeout(() => {
                    if (options.enableSearchMode === true) {

                        scope.ngivrEnableSearchMode = true;
                        scope.ngivrEnableSearchModeModel = options.enableSearchModeDefault;
                    }
                    if (ngivrSearchModeGenerated === false) {
                        scope.ngivrEnableSearchMode = false
                    }
                    scope.ngivrSearchModeGenerated = ngivrSearchModeGenerated
                    if (scope.ngivrSearchModeDefault !== undefined) {
                        scope.ngivrEnableSearchModeModel = scope.ngivrSearchModeDefault
                        options.ngivrEnableSearchModeModel = scope.ngivrSearchModeDefault
                    }

                })

                self.wire(options);
            },
        }

    };

    this.wire = (options) => {
        const scope = options.scope;
        const schema = options.schema;
        const url = options.url;

        scope.ngivr = ngivrService;

        if (angular.equals(scope.value, {})) {
            scope.value = null;
        }

        const dataQuery = ngivrService.data.query({
            schema: schema,
            $scope: scope,
            url: url
        });

        scope.querySearch = (searchText) => {

            const query = options.query(searchText, scope);
            if (!query.hasOwnProperty('settings') || !query.settings.hasOwnProperty('searchModeStartsWith')) {
                query.settings = query.settings || {}
                query.settings.searchModeStartsWith = options.enableSearchModeDefault

                if (scope.ngivrEnableSearchModeModel !== undefined) {
                    query.settings.searchModeStartsWith = scope.ngivrEnableSearchModeModel
                }
            }
            //console.warn('scope.noCache', scope.noCache, 'options.ngivrEnableSearchModeModel', options.ngivrEnableSearchModeModel)
            if (scope.noCache === true) {
                //console.log(scope.ngivrEnableSearchMode, options.ngivrEnableSearchModeModel)
                query.settings.searchModeStartsWith = options.ngivrEnableSearchModeModel

            }

            //console.warn(query)

            return dataQuery.query(query).then((response) => {
                if (options.makeList) {
                    return options.makeList(response.data.docs)
                }
                return response.data.docs;
            });
        };

        scope.selectedItemChange = (value) => {
            if (options.selectedItemChange !== undefined) {
                options.selectedItemChange(value, scope);
            } else {
                scope.value = value;
            }
        }
    }

});
