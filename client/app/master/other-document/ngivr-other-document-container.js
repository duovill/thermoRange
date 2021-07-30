ngivr.angular.directive('ngivrOtherDocumentContainer', function() {

    return {
        templateUrl: 'app/master/other-document/ngivr-other-document-container.html',

        controller: function ($scope, $state) {
            $scope.$parent.fullSizeRequired = 1;


            $scope.tab = new function() {
                this.current = 0;

                this.selectState = (chooseState) => {
                    switch($state.current.name) {

                        case 'master.otherDocument.template':
                            return this.select(1);

                        default:
                            return this.select(0);
                    }
                }

                this.select = (index) => {
                    this.current = index
                    switch(index) {
                        case 1:
                            $state.go('master.otherDocument.template')
                            break;

                        default:
                            $state.go('master.otherDocument.document')
                            break;
                    }
                }

            }


            this.$onInit = () => {
                $scope.tab.selectState();

            }
            this.$onInit()

            $scope.$on('$stateChangeSuccess', () => {
                $scope.tab.selectState();
            });

            $scope.$on('$destroy', () => {
                $scope.$parent.fullSizeRequired = 0;
            })
        }
    }

} )
