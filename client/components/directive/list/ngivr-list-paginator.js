'use strict';
ngivr.angular.directive('ngivrListPaginator', () => {
    return {
        restrict: 'E',
        controllerAs: '$ctrl',
        templateUrl: 'components/directive/list/ngivr-list-paginator.html',
        link: (scope, el) => {
            scope.ngivrListPaginatorEl = el;
        },
        controller: function ($scope) {
            $scope.query = $scope.$parent.query;

            const baseWidth = ngivr.config.mobile ? 25 : 18;
            const baseMultiplier = ngivr.config.mobile ? 35 : 30;
            $scope.showPages = () => {
                let length = 10000;
                if ($scope.query.page != null) {
                    length = $scope.query.page.toString().length;
                }
                const width = (length * baseWidth) + baseMultiplier;
                let result = Math.floor(
                    (($scope.ngivrListWidth - 140) / width)
                );

                return result > 0 ? result : 0;
            };
            $scope.minShowButtons = 1;
            this.$scope = $scope;

            if ($scope.hasOwnProperty('ngivrListGetWidth')) {
                $scope.ngivrListWidth = $scope.ngivrListGetWidth();
            }

            this.first = () => {
                this.page(1);
            }

            this.prev = () => {
                this.page(this.$scope.query.page - 1);
            }

            this.next = () => {
                this.page(this.$scope.query.page + 1);

            }

            this.last = () => {
                this.page(this.$scope.query.pages);
            }

            this.page = (n) => {
                const query = this.$scope.query;
                if (query.page === n) {
                    return;
                }
                query.page = n;
            }


            this.showPages = () => {
                const $scope = this.$scope;
                const query = $scope.query;
                const showPages = $scope.showPages();
                let half = Math.floor(showPages / 2);
                let start = query.page - half;
                let end = query.page + half;

                if (start < 1) {
                    end -= start - 1;
                    end = Math.min(end, query.pages);
                    start = 1;
                }
                if (end > query.pages) {
                    start -= end - query.pages;
                    start = Math.max(1, start);
                    end = query.pages;
                }

                let pages = [];
                for (let index = start; index <= end; index++) {
                    pages.push(index);
                }

                if (pages.length > showPages) {
                    if (end === query.page) {
                        pages.shift();
                    } else {
                        pages.pop();
                    }
                }

                return pages;
            }

        }
    }
});
