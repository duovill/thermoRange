ngivr.angular.directive('ngivrListUsers', () => {
    return {
        restrict: 'E',
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-users.html',
        controller: ($scope, $mdMedia) => {
            this.$scope = $scope;
            $scope.$mdMedia = $mdMedia;
            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
            });

            $scope.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    $or: [
                        {
                            'name': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'nickName': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'fullName': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        }
                    ]
                };
            }
        }
    }
});
