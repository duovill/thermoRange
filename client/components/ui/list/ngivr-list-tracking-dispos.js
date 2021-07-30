'use strict';

ngivr.angular.directive('ngivrListTrackingDispos', () => {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            ngivrQuery: '=',
            loadDispo: '&',
            loadDispoFromTabList: '&',
            ngivrUrl: "@",
            query: "=?",
            prodType: "@",
            hideFields: '<?'
        },
        templateUrl: 'components/ui/list/ngivr-list-tracking-dispos.html',
        link: {
            pre: function (scope, elm, attrs) {
                if (!scope.prodType) {
                    scope.prodType = attrs.prodType || 'grain';
                }

                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                scope.$on(ngivr.settings.event.client.list.clear, () => {
                    console.log('clearing search...');
                    scope.resetQuery();
                    scope.$broadcast('clearFilter', ""); //a child szűrő elemmel is törölteti a szűrőmezőket
                    ngivr.list.requery(scope);
                });

            }
        },

        controller: ($scope) => {

            $scope.query = {};

            $scope.resetQuery = () => {
                $scope.query.search = {
                    $and: []
                };

                if (!$scope.prodType || $scope.prodType === "grain") {
                    $scope.query.search.$and.push({
                        "fertilizer": {
                            $eq: false
                        }
                    });
                } else {
                    $scope.query.search.$and.push({
                        "fertilizer": {
                            $eq: true
                        }
                    });
                }

            };
            $scope.resetQuery();

            $scope.refreshList = (query) => {
                $scope.query.search = query;
                ngivr.list.requery($scope);

            };

            $scope.loadDispoFromList = (dispo) => {
                $scope.loadDispo({
                    dispo
                });
                $scope.loadDispoFromTabList({
                    dispo
                });
            };
        }
    }
});
