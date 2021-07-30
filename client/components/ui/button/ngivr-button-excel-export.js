/* jshint undef: true, unused: true, esversion: 6*/
/* global ngivr Blob */

/**
 Creates Excel export from an ngivrList or a Query or any arbitrary data
 Query params:
 -ngModel: optional, array of documents if present this will be the data used to create the xls
 -ngivrschema: optional, string if present this component will query the db and use the result as an input for the xls
 -ngivrQuey: optional, used if ngivrSchema present: standard ngivrQuery Object
 -In the case when this button is used as a child in ngivrList and none of the above attrs presented the component will use the parent list's query:
 *without additional params the current page of the list will be exported without any further db query
 *if ngivrLimit and/or ngivrPage present the query will be submitted with these values and use the result as an input for the xls.
 Column seletion and headers:
 -ngivrColumns: optional, an array containing property names to include in xls. If not present or empty property names of the firt doc willl be used
 -ngivrHeaders: optional, an array containing strings to use them as column header in xls. If not present or empty the column names used by the above contition.
 File naming:
 ngivrFilename: optional, this will be the filename of the donloaded file. Don't forget to add extension too (.xls)
 ngivrAddDate: optional, if trueish add a YYYYMMDD_HHmm suffix to the filename

 */


'use strict';
ngivr.angular.directive('ngivrButtonExcelExport', ($http, $timeout, ngivrService, ngivrApi, ngivrGrowl) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // transclude:true,
        // scope:true,
        scope: {
            ngivrMenu: '<?',
            ngivrQuery: '<?',
            ngivrColumns: '<',
            ngivrHeaders: '<',
            ngivrSchema: '@',
            ngivrTooltipDirection: '@',
            ngDisabled: '@',
            ngModel: "<?",
            ngivrFilename: "<?",
            ngivrAddDate: '@',
            transformerFunction: '=',
            ngivrUrl: '@',
            ngivrOutput: '@',
            ngivrServerQuery: "<?",
            big: "<?",
            buttonName: '<?',
            style: '@?',
            hideToolTip: '<?'
        },
        link: function (scope, elm, attrs, ctrl) {
            // scope.ngivrSchema = attrs.ngivrSchema;
            // scope.ngivrQuery = attrs.ngivrQuery;
            // scope.ngivrLimit = parseInt(attrs.ngivrLimit);
            // scope.ngivrPage = parseInt(attrs.ngivrPage);
            scope.ngivrTooltipDirection = attrs.ngivrTooltipDirection || 'top';
            scope.ngivrTooltip = attrs.ngivrTooltip || 'Excel export';
            scope.ngivrUrl = scope.ngivrUrl || '/api/xlsdocument';
            scope.ngivrOutput = scope.ngivrOutput || 'xls';

            attrs.$observe('ngivrTooltip', function () {
                scope.ngivrTooltip = attrs.ngivrTooltip || 'Excel export';
            });

        },
        controller: function ($scope) {

            //console.warn('$scope.ngivrPure', $scope.ngivrPure)

            $scope.removeLimitFromQuery = (query) => {
                if (!query) {
                    return query;
                }
                let cloned = JSON.parse(JSON.stringify(query));
                cloned.limit = undefined;
                cloned.page = undefined;
                return cloned;
            };
            $scope.click = async ($event) => {

                if ($scope.transformerFunction) {
                    await $scope.transformerFunction($scope);
                }

                let data, query;
                //ha van ngModel, akkor abból lesz Excel

                if ($scope.ngModel) {
                    data = $scope.ngModel;

                } else if ($scope.ngivrServerQuery) {
                    query = $scope.ngivrServerQuery;

                } else if ($scope.ngivrSchema) { //minden paraméter a gombtól jön
                    data = await ngivrApi.query($scope.ngivrSchema, $scope.ngivrQuery, $scope.ngivrUrl, $scope.ngivrUnion);
                    data = data.data.docs;

                } else if ($scope.$parent.$parent.query) { //van ilyen--> egy listához kapcsolódunk

                    let query, limit, page;

                    $scope.query = $scope.$parent.$parent.query;

                    //ha a gomb felülírja a limiteket
                    if (($scope.ngivrLimit && ($scope.ngivrLimit !== $scope.query.limit)) || ($scope.ngivrPage && ($scope.ngivrPage !== $scope.query.page))) {
                        limit = $scope.ngivrLimit || $scope.query.limit;
                        page = $scope.ngivrPage || $scope.query.page;
                        query = $scope.removeLimitFromQuery($scope.query);
                        query.limit = limit;
                        query.pages = $scope.page;
                        data = await ngivrApi.query($scope.schema, query, $scope.url, $scope.union);
                        data = data.data.docs;

                    } else {
                        data = $scope.query.docs;
                    }
                }

                const req = {
                    method: 'POST',
                    url: $scope.ngivrUrl,
                    headers: {
                        "Content-Type": "application/json;charset=UTF-8"
                    },
                    data: {
                        query,
                        outputType: $scope.ngivrOutput,
                        data: data,
                        columns: $scope.ngivrColumns,
                        headers: $scope.ngivrHeaders,
                    }
                };

                if ($scope.ngivrOutput === 'xls') {
                    req.responseType = 'arraybuffer';
                }

                try {
                    let response = await $http(req);


                    //ez azért kell, hogy a POST-ra kapott választ le tudjuk tölteni
                    let filename = "";

                    if ($scope.ngivrFilename) {
                        filename = $scope.ngivrFilename;

                    } else {
                        let disposition = response.headers('Content-Disposition');

                        if (disposition && disposition.indexOf('attachment') !== -1) {
                            let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                            let matches = filenameRegex.exec(disposition);
                            if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
                        }

                    }

                    if ($scope.ngivrAddDate) {
                        let splitted = filename.split('.');
                        filename = splitted[0] + '_' + moment().format('YYYYMMDD_HHmm') + '.' + (splitted[1] || 'xlsx')
                    }
                    let type = response.headers('Content-Type');

                    let blob = new Blob([response.data], {
                        type: type
                    });

                    let URL = window.URL || window.webkitURL;
                    let downloadUrl = URL.createObjectURL(blob);

                    if (filename) {
                        // use HTML5 a[download] attribute to specify filename
                        let a = document.createElement("a");
                        // safari doesn't support this yet
                        if (typeof a.download === 'undefined') {
                            window.location = downloadUrl;

                        } else {
                            a.href = downloadUrl;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                        }

                    } else {

                        window.location = downloadUrl;
                    }

                    $timeout(() => {
                        URL.revokeObjectURL(downloadUrl);
                    }, 100); // cleanup
                } catch (error) {
                    let errorString = String.fromCharCode.apply(null, new Uint8Array(error.data));
                    let err = JSON.parse(errorString);
                    if (err.message.message === 'Cannot read property \'totalCount\' of undefined') {
                        ngivrGrowl('Nincs a feltételeknek megfelelő szállítás!')
                    } else {
                        if (err.message === 'noData') {
                            ngivrGrowl(ngivr.strings.exception.noData)
                        } else {
                            ngivrGrowl(err.message.message)
                        }

                    }
                }
            }
        },

        template: `

<md-menu-item ng-if="ngivrMenu">
    <md-button ng-click="ngDisabled || click($event)" ng-disabled="ngDisabled">
        <md-tooltip ng-hide="hideToolTip">{{ ngivrTooltip }}</md-tooltip>
        <ng-md-icon icon="file_download"></ng-md-icon>
        {{buttonName}}
    </md-button>
</md-menu-item>
<span ng-if="!ngivrMenu">
    <ngivr-icon-fa ng-if="!big" ng-click="click($event)" ngivr-tooltip="{{ ngivrTooltip }}" ngivr-tooltip-direction="{{ ngivrTooltipDirection }}" ngivr-icon-fa="fa-file-excel-o"></ngivr-icon-fa>

    <ngivr-button ng-if="big" ng-click="ngDisabled || click($event)" ng-disabled="ngDisabled"
                         style="{{style}}" >
                          <md-tooltip md-direction="{{ ngivrTooltipDirection }}">{{ ngivrTooltip }}</md-tooltip>
                <ng-md-icon icon="file_download"></ng-md-icon>
                {{buttonName}}
            </ngivr-button>
</span>
`
    }
});
