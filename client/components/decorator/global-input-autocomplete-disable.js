ngivr.angular.decorator('formDirective', ['$delegate', function($delegate) {
    const directive = $delegate[0];
    const oldCompile = directive.compile;

    directive.compile = function (tElement, tAttrs, transclude) {
        // get original links
        const compile = oldCompile ? oldCompile.apply(this, arguments) : {};
        const oldPost = compile.post;

        compile.post = function (scope, element, attrs) {
//            console.warn('input', element, element.attr('autocomplete'))
//                const autocompleteValue = element.attr('autocomplete')
//            console.warn('autocompleteValue', autocompleteValue)
            if (element.attr('autocomplete') === undefined) {
                // aria-autocomplete="both" aria-haspopup="false" autocapitalize="off" autocomplete="off" autocorrect="off" autofocus="" role="combobox" spellcheck="false"
//                setTimeout(() => {
                element.attr('autocomplete', 'off')
//                })
            }
            if (oldPost) {
                oldPost.apply(this, arguments);
            }
        };

        return compile;
    };

    return $delegate;
}]);

ngivr.angular.decorator('inputDirective', ['$delegate', function($delegate) {
    const directive = $delegate[0];
    const oldCompile = directive.compile;

    directive.compile = function (tElement, tAttrs, transclude) {
        // get original links
        const compile = oldCompile ? oldCompile.apply(this, arguments) : {};
        const oldPost = compile.post;

        compile.post = function (scope, element, attrs) {
//            console.warn('input', element, element.attr('autocomplete'))
//                const autocompleteValue = element.attr('autocomplete')
//            console.warn('autocompleteValue', autocompleteValue)
            if (element.attr('autocomplete') === undefined) {
                // aria-autocomplete="both" aria-haspopup="false" autocapitalize="off" autocomplete="off" autocorrect="off" autofocus="" role="combobox" spellcheck="false"
//                setTimeout(() => {
                element.attr('autocomplete', 'off')
                element.attr('autocorrect', 'off')
                element.attr('spellcheck', 'off')
//                })
            }
            if (oldPost) {
                oldPost.apply(this, arguments);
            }
        };

        return compile;
    };

    return $delegate;
}]);

