ngivr.angular.decorator('mdAutocompleteDirective', ($delegate) => {
  $delegate.forEach((directive) => {
    const compile = directive.compile;
    directive.compile = function (element, attr) {
      const template = compile.apply(this, arguments);
      const li = element.find('md-virtual-repeat-container li');
      li.attr('ngivr-ellipsis', 'ngivr-ellipsis');
      return function (scope, element, attrs, ctrl) {
        template.apply(this, arguments);
      };
    };
  });
  return $delegate;
});
