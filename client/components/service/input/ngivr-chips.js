'use strict';
ngivr.angular.service('ngivrChips', function (ngivrService) {

    const self = this;
    const service = ngivrService;

    this.generate = (options) => {

        // init
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

        options.template = options.template || {};
        options.template.autoComplete = options.template.autoComplete || `{{ ${options.schema}.name }}`;
        options.template.chip = options.template.chip || `{{ $chip.name }}`;

        options.command = options.command || {};
        options.command.chipTransform = options.command.chipTransform || (($chip) => $chip);

        return {
            restrict: 'E',
            scope: Object.assign({
                value: '=ngModel',
                isRequired: '=',
                chipsName: '<?',
                ngivrChipsAdd: '&',
                ngivrChipsRemove: '&',
            }, options.scope),

            require: 'ngModel',
            template: `
 <md-chips ng-model="value" md-autocomplete-snap md-require-match="true" ng-required="isRequired"
                    md-transform-chip="command.chipTransform($chip)"     name="{{chipsName}}"
                    md-autocomplete-snap md-on-add="ngivrChipsAdd()" md-on-remove="ngivrChipsRemove()">
<md-autocomplete
    placeholder="${options.placeholder}"
    md-selected-item="searchValue"
    md-search-text="searchText"
    md-items="${options.schema} in querySearch(searchText)"
    md-item-text="${options.display}"
    md-delay="${ngivrService.settings.debounce}"
    md-dropdown-position="bottom"
    >
  <md-item-template>
      <span>
        ${options.template.autoComplete}
      </span>
  </md-item-template>
  <md-not-found>
    {{ ngivr.strings.message.noResult}}
  </md-not-found>
</md-autocomplete>
 <md-chip-template>
    <span>
      ${options.template.chip}
    </span>
  </md-chip-template>
</md-chips>
`,

            link: function (scope, elm, attrs, ngModel) {
                options.scope = scope;
                self.wire(options);
            },
        }

    }

    // wire
    this.wire = (options) => {

        setTimeout(() => {
            if (!Array.isArray(options.scope.value)) {
                ngivr.console.error('A chips model nem tomb!');
            }

        })


        const scope = options.scope;
        const schema = options.schema;

        scope.ngivr = ngivrService;

        scope.command = options.command;

        const dataQuery = ngivrService.data.query({
            schema: schema,
            query: options.query(''),
            $scope: scope
        })

        scope.querySearch = (searchText) => {
            const query = options.query(searchText);
            if (!query.hasOwnProperty('settings') || !query.settings.hasOwnProperty('searchModeStartsWith')) {
                query.settings = query.settings || {}
                query.settings.searchModeStartsWith = false
            }


            return dataQuery.query(query).then((response) => {
                return response.data.docs
            });

        };

    }

});
