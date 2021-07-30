/*
ngivr.angular.directive('ngClick',  ['$parse', '$rootScope', function($parse, $rootScope) {

    //TODO https://github.com/angular/angular.js/blob/master/src/ng/directive/ngEventDirs.js#L62
    const debounceTime = ngivr.settings.debounceWait;

    /!*
    const forceAsyncEvents = {
        'blur': true,
        'focus': true
    };
    *!/
    const eventName = 'click';
    return {
        restrict: 'A',
        replace: true,
        compile: function($element, attr) {
            // NOTE:
            // We expose the powerful `$event` object on the scope that provides access to the Window,
            // etc. This is OK, because expressions are not sandboxed any more (and the expression
            // sandbox was never meant to be a security feature anyway).
            const fn = $parse(attr['ngClick']);
            return function ngEventHandler(scope, element) {
                const isDebouncedElement = element[0].hasAttribute("ngivr-click-debounce") || element.find('[ngivr-click-debounce]').length > 0;
                let debounceTimeout;

                element.on(eventName, function(event) {
                    if (debounceTimeout === undefined) {
                        const callback = function() {
                            fn(scope, {$event: event});
                        };

//                        if (forceAsyncEvents[eventName] && $rootScope.$$phase) {
//                            scope.$evalAsync(callback);
//                        } else {
                            scope.$apply(callback);
//                        }
                        if (isDebouncedElement) {
                            debounceTimeout = $timeout(() => {
                                $timeout(debounceTimeout)
                                debounceTimeout = undefined;
                            }, debounceTime)
                        }
                    } else {
                        ngivr.growl(ngivr.strings.disableMultipleClicks({
                            ms: debounceTime
                        }))
                    }
                });
            };
        }
    };
}]);

*/
