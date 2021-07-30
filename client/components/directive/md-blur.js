ngivr.angular.directive('mdBlur', ["$mdUtil", "$timeout", function ($mdUtil, $timeout) { //md-blur directive md-autocomplete-hez
    return {
        require: "^mdAutocomplete",
        link: function ($scope, $element, $attributes, $mdAutocompleteCtrl) {
            $timeout(function () {
                // let input = $element.find("input");
                // let element = $element[0];
                const nativeBlur = $mdAutocompleteCtrl.blur;
                $mdAutocompleteCtrl.blur = function () {
                    nativeBlur.call($mdAutocompleteCtrl);
                    $mdUtil.nextTick(function () {
                        $scope.$eval($attributes.mdBlur, {"$mdAutocomplete": $mdAutocompleteCtrl});
                    });
                };
            });
        }
    };
}]);
