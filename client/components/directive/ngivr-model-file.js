ngivr.angular.directive('ngivrModelFile', function() {
    return {
        require: "ngModel",
        link: function postLink(scope,elem,attrs,ngModel) {
            elem.on("change", function(e) {
                const files = elem[0].files;
                if (files.length === 0 ) {
                    ngModel.$setViewValue(undefined);
                } else {
                    ngModel.$setViewValue(files);
                }
            })
        }
    }
});
