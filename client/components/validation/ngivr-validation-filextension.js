ngivr.angular.directive('ngivrValidationFilextension', function() {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ngModel) {
            let fileExtensions = attrs.ngivrValidationFilextension.split(',');

            const valueAllowed = (fileList) => {
                if (fileList === undefined) {
                    return true
                }
                let validFiles = {}
                for(let file of fileList) {
                    validFiles[file.name] = false;
                    for(let fileExtension of fileExtensions) {
                        if (file.name.toLowerCase().endsWith(`.${fileExtension}`)) {
                            validFiles[file.name] = true;
                            break;
                        }
                    }
                }
                for(let validFilesKeys of Object.keys(validFiles)) {
                    if (validFiles[validFilesKeys] === false) {
                        return false
                    }
                }
                return true
            }

            //For DOM -> model validation
            ngModel.$parsers.unshift(function(value) {
                const valid = valueAllowed(value);
                ngModel.$setValidity('ngivrValidationFilextension', valid);
                //return valid ? value : value;
                return value;
            });

            //For model -> DOM validation
            ngModel.$formatters.unshift(function(value) {
                ngModel.$setValidity('ngivrValidationFilextension', valueAllowed(value));
                return value;
            });
        }
    };
})
