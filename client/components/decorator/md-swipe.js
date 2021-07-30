ngivr.decorator.mdSwipe = ($delegate) => {
  $delegate.forEach((directive) => {

    const originalPostLink = directive.link;
    const link = function postLink(scope, element, attrs) {
      originalPostLink.apply(originalPostLink, arguments);
      element.css('touch-action', 'pan-x pan-y');
    }

    directive.compile = function() {
      return function(scope, element, attrs) {
        link.apply(this, arguments);
      };
    };

  });
  return $delegate;
};
ngivr.angular.decorator('mdSwipeLeftDirective', ($delegate) => ngivr.decorator.mdSwipe($delegate));
ngivr.angular.decorator('mdSwipeRightDirective', ($delegate) => ngivr.decorator.mdSwipe($delegate));
ngivr.angular.decorator('mdSwipeUpDirective', ($delegate) => ngivr.decorator.mdSwipe($delegate));
ngivr.angular.decorator('mdSwipeDownDirective', ($delegate) => ngivr.decorator.mdSwipe($delegate));
